
const { pool } = require("../config/db");

// Chuyển tham số thành số hợp lệ
function numberParam(value, name, min, max, integer = false) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw Object.assign(
      new Error(`Thiếu tham số ${name}`),
      { status: 400 }
    );
  }

  const num = Number(value);

  if (
    !Number.isFinite(num) ||
    (integer && !Number.isSafeInteger(num)) ||
    num < min ||
    num > max
  ) {
    throw Object.assign(
      new Error(`${name} phải trong khoảng ${min} đến ${max}`),
      { status: 400 }
    );
  }

  return num;
}

// Tạo GeoJSON FeatureCollection
function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features
  };
}

// Chuyển bản ghi PostGIS thành GeoJSON Feature
function toFeature(row, properties = {}) {
  return {
    type: "Feature",
    id: row.id,
    geometry: row.geometry,
    properties: {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      ...properties
    }
  };
}


async function tinhKhoangCach(req, res, next) {
  try {
    const fromId = numberParam(
      req.query.fromId, "fromId", 1, Number.MAX_SAFE_INTEGER, true
    );
    const toId = numberParam(
      req.query.toId, "toId", 1, Number.MAX_SAFE_INTEGER, true
    );

    if (fromId === toId) {
      return res.status(400).json({
        success: false,
        message: "Hãy chọn hai điểm khác nhau"
      });
    }

    const result = await pool.query(`
      SELECT
        a.id AS from_id,
        a.ten AS from_name,
        b.id AS to_id,
        b.ten AS to_name,
        ROUND(
          ST_Distance(
            a.geom::geography,
            b.geom::geography
          )::numeric, 2
        ) AS distance_m,
        ST_AsGeoJSON(a.geom)::jsonb AS from_geometry,
        ST_AsGeoJSON(b.geom)::jsonb AS to_geometry
      FROM tourism.diem_du_lich a
      CROSS JOIN tourism.diem_du_lich b
      WHERE a.id = $1 AND b.id = $2
    `, [fromId, toId]);

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy một hoặc cả hai điểm"
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        fromId: row.from_id,
        fromName: row.from_name,
        toId: row.to_id,
        toName: row.to_name,
        distanceM: Number(row.distance_m),
        fromGeometry: row.from_geometry,
        toGeometry: row.to_geometry
      }
    });
  } catch (error) {
    next(error);
  }
}


async function timGanNhat(req, res, next) {
  try {
    const pointId = numberParam(
      req.query.pointId, "pointId", 1, Number.MAX_SAFE_INTEGER, true
    );

    const limit = numberParam(
      req.query.limit ?? 5, "limit", 1, 100, true
    );

    const origin = await pool.query(`
      SELECT
        id, ma, ten,
        ST_AsGeoJSON(geom)::jsonb AS geometry
      FROM tourism.diem_du_lich
      WHERE id = $1
    `, [pointId]);

    if (!origin.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm gốc"
      });
    }

    const result = await pool.query(`
      SELECT
        d.id,
        d.ma,
        d.ten,
        ROUND(
          ST_Distance(
            d.geom::geography,
            g.geom::geography
          )::numeric, 2
        ) AS distance_m,
        ST_AsGeoJSON(d.geom)::jsonb AS geometry
      FROM tourism.diem_du_lich d
      JOIN tourism.diem_du_lich g ON g.id = $1
      WHERE d.id <> g.id
        AND d.trang_thai = 'dang_hoat_dong'
      ORDER BY
        ST_Distance(d.geom::geography, g.geom::geography),
        d.id
      LIMIT $2
    `, [pointId, limit]);

    res.json({
      success: true,
      origin: toFeature(origin.rows[0]),
      total: result.rowCount,
      data: result.rows.map(row => ({
        id: row.id,
        ma: row.ma,
        ten: row.ten,
        distanceM: Number(row.distance_m)
      })),
      geojson: featureCollection(
        result.rows.map(row =>
          toFeature(row, {
            distanceM: Number(row.distance_m)
          })
        )
      )
    });
  } catch (error) {
    next(error);
  }
}


async function timTrongBanKinh(req, res, next) {
  try {
    const lon = numberParam(
      req.query.lon, "lon", -180, 180
    );
    const lat = numberParam(
      req.query.lat, "lat", -90, 90
    );
    const radius = numberParam(
      req.query.radius, "radius", 1, 100000
    );
    const limit = numberParam(
      req.query.limit ?? 100, "limit", 1, 500, true
    );

    const result = await pool.query(`
      SELECT
        diem_id AS id,
        ma_diem AS ma,
        ten_diem AS ten,
        khoang_cach_m AS distance_m,
        ST_AsGeoJSON(geom)::jsonb AS geometry
      FROM tourism.fn_tim_diem_trong_ban_kinh(
        $1::double precision,
        $2::double precision,
        $3::double precision,
        $4::integer
      )
    `, [lon, lat, radius, limit]);

    const buffer = await pool.query(`
      SELECT ST_AsGeoJSON(
        ST_Buffer(
          ST_SetSRID(
            ST_MakePoint($1, $2), 4326
          )::geography,
          $3
        )::geometry
      )::jsonb AS geometry
    `, [lon, lat, radius]);

    res.json({
      success: true,
      center: { longitude: lon, latitude: lat },
      radiusM: radius,
      total: result.rowCount,
      data: result.rows.map(row => ({
        id: row.id,
        ma: row.ma,
        ten: row.ten,
        distanceM: Number(row.distance_m)
      })),
      geojson: featureCollection(
        result.rows.map(row =>
          toFeature(row, {
            distanceM: Number(row.distance_m)
          })
        )
      ),
      buffer: {
        type: "Feature",
        geometry: buffer.rows[0].geometry,
        properties: { radiusM: radius }
      }
    });
  } catch (error) {
    next(error);
  }
}




async function taoBuffer(req, res, next) {
  try {
    const pointId = numberParam(
      req.query.pointId, "pointId", 1, Number.MAX_SAFE_INTEGER, true
    );
    const radius = numberParam(
      req.query.radius, "radius", 1, 100000, true
    );

    const result = await pool.query(`
      SELECT
        d.id,
        d.ma,
        d.ten,
        ST_AsGeoJSON(d.geom)::jsonb AS point_geometry,
        ST_AsGeoJSON(
          tourism.fn_buffer_diem(
            d.id,
            $2::integer
          )
        )::jsonb AS buffer_geometry
      FROM tourism.diem_du_lich d
      WHERE d.id = $1
    `, [pointId, radius]);

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm du lịch"
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      point: {
        type: "Feature",
        id: row.id,
        geometry: row.point_geometry,
        properties: {
          ma: row.ma,
          ten: row.ten
        }
      },
      radiusM: radius,
      buffer: {
        type: "Feature",
        geometry: row.buffer_geometry,
        properties: {
          pointId: row.id,
          radiusM: radius
        }
      }
    });
  } catch (error) {
    next(error);
  }
}


async function danhGiaTiepCan(req, res, next) {
  try {
    const pointId = req.query.pointId
      ? numberParam(
          req.query.pointId, "pointId",
          1, Number.MAX_SAFE_INTEGER, true
        )
      : null;

    const summary = await pool.query(`
      SELECT
        v.diem_id,
        v.ten_diem,
        v.diem_tiep_can_100,
        v.dat_tat_ca_tieu_chi,
        ST_AsGeoJSON(d.geom)::jsonb AS geometry
      FROM tourism.vw_chi_so_tiep_can v
      JOIN tourism.diem_du_lich d
        ON d.id = v.diem_id
      WHERE $1::bigint IS NULL OR v.diem_id = $1
      ORDER BY v.diem_tiep_can_100 DESC, v.diem_id
    `, [pointId]);

    const details = await pool.query(`
      SELECT
        diem_id,
        ten_diem,
        loai_dich_vu_id,
        ten_loai_dich_vu,
        ban_kinh_m,
        so_co_so,
        so_luong_toi_thieu,
        dat
      FROM tourism.fn_danh_gia_tiep_can()
      WHERE $1::bigint IS NULL OR diem_id = $1
      ORDER BY diem_id, loai_dich_vu_id
    `, [pointId]);

    res.json({
      success: true,
      total: summary.rowCount,
      data: summary.rows.map(row => ({
        pointId: row.diem_id,
        name: row.ten_diem,
        score: Number(row.diem_tiep_can_100),
        meetsAll: row.dat_tat_ca_tieu_chi,
        details: details.rows.filter(
          detail => String(detail.diem_id) === String(row.diem_id)
        )
      })),
      geojson: featureCollection(
        summary.rows.map(row => ({
          type: "Feature",
          id: row.diem_id,
          geometry: row.geometry,
          properties: {
            name: row.ten_diem,
            score: Number(row.diem_tiep_can_100),
            meetsAll: row.dat_tat_ca_tieu_chi
          }
        }))
      )
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  tinhKhoangCach,
  timGanNhat,
  timTrongBanKinh,
  taoBuffer,
  danhGiaTiepCan
};