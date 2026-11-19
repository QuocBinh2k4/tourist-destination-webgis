
const { pool } = require("../config/db");

const NGUON_TINH = "RGHC_2025_USER_SUPPLIED";
const NGUON_XA = "RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL";

function docId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function feature(row, properties) {
  return {
    type: "Feature",
    id: row.id,
    geometry: row.geometry,
    properties
  };
}

function collection(rows, mapRow) {
  return {
    type: "FeatureCollection",
    features: rows.map(mapRow)
  };
}

// API 1: Lấy ranh giới 34 tỉnh
async function getTinh(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        t.id, t.ma_dvhc, t.ten,

        (
          SELECT COUNT(*)::integer
          FROM tourism.diem_du_lich d
          WHERE ST_Covers(t.geom, d.geom)
        ) AS so_diem,

        (
          SELECT COUNT(*)::integer
          FROM tourism.co_so_dich_vu s
          WHERE ST_Covers(t.geom, s.geom)
        ) AS so_dich_vu,

        ST_AsGeoJSON(
          ST_Transform(
            ST_SimplifyPreserveTopology(
              ST_Transform(t.geom, 3857), 150
            ),
            4326
          ), 5
        )::jsonb AS geometry

      FROM tourism.don_vi_hanh_chinh t
      WHERE t.cap_hanh_chinh = 'tinh_thanh'
        AND t.nguon_du_lieu = $1
      ORDER BY t.ten
    `, [NGUON_TINH]);

    res.json({
      success: true,
      total: result.rowCount,
      geojson: collection(
        result.rows,
        row => feature(row, {
          id: row.id,
          ma: row.ma_dvhc,
          ten: row.ten,
          so_diem: row.so_diem,
          so_dich_vu: row.so_dich_vu
        })
      )
    });
  } catch (error) {
    next(error);
  }
}

// API 2: Lấy xã/phường theo tỉnh
async function getXaTheoTinh(req, res, next) {
  try {
    const provinceId = docId(req.params.id);

    if (!provinceId) {
      return res.status(400).json({
        success: false,
        message: "ID tỉnh không hợp lệ"
      });
    }

    const province = await pool.query(`
      SELECT id, ten
      FROM tourism.don_vi_hanh_chinh
      WHERE id = $1
        AND cap_hanh_chinh = 'tinh_thanh'
        AND nguon_du_lieu = $2
    `, [provinceId, NGUON_TINH]);

    if (!province.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tỉnh"
      });
    }

    const result = await pool.query(`
      SELECT
        x.id, x.ma_dvhc, x.ten,

        (
          SELECT COUNT(*)::integer
          FROM tourism.diem_du_lich d
          WHERE ST_Covers(x.geom, d.geom)
        ) AS so_diem,

        (
          SELECT COUNT(*)::integer
          FROM tourism.co_so_dich_vu s
          WHERE ST_Covers(x.geom, s.geom)
        ) AS so_dich_vu,

        ST_AsGeoJSON(
          ST_Transform(
            ST_SimplifyPreserveTopology(
              ST_Transform(x.geom, 3857), 70
            ),
            4326
          ), 5
        )::jsonb AS geometry

      FROM tourism.don_vi_hanh_chinh x
      WHERE x.parent_id = $1
        AND x.cap_hanh_chinh = 'xa_phuong'
        AND x.nguon_du_lieu = $2
      ORDER BY x.ten
    `, [provinceId, NGUON_XA]);

    res.json({
      success: true,
      province: province.rows[0],
      total: result.rowCount,

      list: result.rows.map(row => ({
        id: row.id,
        ma: row.ma_dvhc,
        ten: row.ten,
        so_diem: row.so_diem,
        so_dich_vu: row.so_dich_vu
      })),

      geojson: collection(
        result.rows,
        row => feature(row, {
          id: row.id,
          ma: row.ma_dvhc,
          ten: row.ten,
          so_diem: row.so_diem,
          so_dich_vu: row.so_dich_vu
        })
      )
    });
  } catch (error) {
    next(error);
  }
}

// API 3: Điểm du lịch và dịch vụ trong khu vực
async function getDuLieuKhuVuc(req, res, next) {
  try {
    const areaId = docId(req.params.id);

    if (!areaId) {
      return res.status(400).json({
        success: false,
        message: "ID khu vực không hợp lệ"
      });
    }

    const area = await pool.query(`
      SELECT id, ten, cap_hanh_chinh, ma_dvhc
      FROM tourism.don_vi_hanh_chinh
      WHERE id = $1
        AND (
          (
            cap_hanh_chinh = 'tinh_thanh'
            AND nguon_du_lieu = $2
          )
          OR
          (
            cap_hanh_chinh = 'xa_phuong'
            AND nguon_du_lieu = $3
          )
        )
    `, [areaId, NGUON_TINH, NGUON_XA]);

    if (!area.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khu vực"
      });
    }

    const [destinations, services] = await Promise.all([
      pool.query(`
        SELECT
          d.id, d.ma, d.ten, d.dia_chi,
          d.trang_thai,
          ST_AsGeoJSON(d.geom)::jsonb AS geometry
        FROM tourism.diem_du_lich d
        JOIN tourism.don_vi_hanh_chinh a
          ON a.id = $1
         AND ST_Covers(a.geom, d.geom)
        ORDER BY d.ten
      `, [areaId]),

      pool.query(`
        SELECT
          s.id, s.ma, s.ten, s.dia_chi,
          s.trang_thai,
          ST_AsGeoJSON(s.geom)::jsonb AS geometry
        FROM tourism.co_so_dich_vu s
        JOIN tourism.don_vi_hanh_chinh a
          ON a.id = $1
         AND ST_Covers(a.geom, s.geom)
        ORDER BY s.ten
      `, [areaId])
    ]);

    const mapPoint = row => feature(row, {
      id: row.id,
      ma: row.ma,
      ten: row.ten,
      dia_chi: row.dia_chi,
      trang_thai: row.trang_thai
    });

    res.json({
      success: true,
      area: area.rows[0],
      totalDestinations: destinations.rowCount,
      totalServices: services.rowCount,
      destinations: collection(destinations.rows, mapPoint),
      services: collection(services.rows, mapPoint)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTinh,
  getXaTheoTinh,
  getDuLieuKhuVuc
};
