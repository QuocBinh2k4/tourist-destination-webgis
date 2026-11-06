
const { pool } = require("../config/db");

function positiveInteger(value, name) {
  const n = Number(value);

  if (!Number.isSafeInteger(n) || n <= 0) {
    const error = new Error(`${name} không hợp lệ`);
    error.status = 400;
    throw error;
  }

  return n;
}

async function getMissingPoints(req, res, next) {
  try {
    const categoryId = req.query.categoryId
      ? positiveInteger(req.query.categoryId, "categoryId")
      : null;

    const result = await pool.query(`
      SELECT
        v.diem_id,
        v.ten_diem,
        v.loai_dich_vu_id,
        v.ten_loai_dich_vu,
        v.ban_kinh_m,
        v.so_co_so,
        v.so_luong_toi_thieu,
        ST_AsGeoJSON(d.geom)::jsonb AS geometry
      FROM tourism.vw_diem_thieu_dich_vu v
      JOIN tourism.diem_du_lich d
        ON d.id = v.diem_id
      WHERE (
        $1::bigint IS NULL
        OR v.loai_dich_vu_id = $1
      )
      ORDER BY v.diem_id, v.loai_dich_vu_id
    `, [categoryId]);

    const features = result.rows.map(row => ({
      type: "Feature",
      geometry: row.geometry,
      properties: {
        diem_id: row.diem_id,
        ten: row.ten_diem,
        loai_dich_vu: row.ten_loai_dich_vu,
        ban_kinh_m: row.ban_kinh_m,
        so_co_so: row.so_co_so,
        so_luong_toi_thieu: row.so_luong_toi_thieu
      }
    }));

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows.map(({ geometry, ...rest }) => rest),
      geojson: {
        type: "FeatureCollection",
        features
      }
    });
  } catch (error) {
    next(error);
  }
}



async function getGapGrid(req, res, next) {
  try {
    const regionId = positiveInteger(
      req.query.regionId, "regionId"
    );
    const categoryId = positiveInteger(
      req.query.categoryId, "categoryId"
    );
    const cellSize = positiveInteger(
      req.query.cellSize || 1000, "cellSize"
    );

    if (cellSize < 100 || cellSize > 5000) {
      return res.status(400).json({
        message: "Kích thước lưới phải từ 100 đến 5000 mét"
      });
    }

    // Kiểm tra ranh giới và tiêu chí dịch vụ
    const config = await pool.query(`
      SELECT
        tc.ban_kinh_m,
        tc.so_luong_toi_thieu,
        l.ten AS loai_dich_vu,
        r.ten AS khu_vuc,
        ST_XMin(ST_Transform(r.geom, 3857)) AS xmin,
        ST_XMax(ST_Transform(r.geom, 3857)) AS xmax,
        ST_YMin(ST_Transform(r.geom, 3857)) AS ymin,
        ST_YMax(ST_Transform(r.geom, 3857)) AS ymax
      FROM tourism.don_vi_hanh_chinh r
      CROSS JOIN tourism.tieu_chi_tiep_can tc
      JOIN tourism.loai_dich_vu l
        ON l.id = tc.loai_dich_vu_id
      WHERE r.id = $1
        AND tc.loai_dich_vu_id = $2
        AND tc.is_active
        AND l.is_active
    `, [regionId, categoryId]);

    if (!config.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy ranh giới hoặc tiêu chí đang hoạt động"
      });
    }

    const cfg = config.rows[0];

    // Chia phạm vi bao thành lưới vuông
    const xmin = Math.floor(cfg.xmin / cellSize) * cellSize;
    const xmax = Math.ceil(cfg.xmax / cellSize) * cellSize;
    const ymin = Math.floor(cfg.ymin / cellSize) * cellSize;
    const ymax = Math.ceil(cfg.ymax / cellSize) * cellSize;

    const nx = Math.round((xmax - xmin) / cellSize);
    const ny = Math.round((ymax - ymin) / cellSize);

    if (nx * ny > 1600) {
      return res.status(400).json({
        message:
          "Khu vực quá lớn. Hãy tăng kích thước ô lưới " +
          "hoặc chọn ranh giới nghiên cứu nhỏ hơn."
      });
    }

    const result = await pool.query(`
      WITH region AS (
        SELECT ST_Transform(geom, 3857) AS geom
        FROM tourism.don_vi_hanh_chinh
        WHERE id = $1
      ),
      grid AS (
        SELECT ST_MakeEnvelope(
          x::double precision,
          y::double precision,
          (x + $6)::double precision,
          (y + $6)::double precision,
          3857
        ) AS geom
        FROM generate_series(
          $2::integer,
          ($3 - $6)::integer,
          $6::integer
        ) AS x
        CROSS JOIN generate_series(
          $4::integer,
          ($5 - $6)::integer,
          $6::integer
        ) AS y
      ),
      clipped AS (
        SELECT
          ST_CollectionExtract(
            ST_Intersection(g.geom, r.geom), 3
          ) AS geom
        FROM grid g
        CROSS JOIN region r
        WHERE ST_Intersects(g.geom, r.geom)
      ),
      cells AS (
        SELECT
          row_number() OVER () AS cell_id,
          geom,
          ST_Transform(
            ST_PointOnSurface(geom), 4326
          )::geography AS center_geog
        FROM clipped
        WHERE NOT ST_IsEmpty(geom)
      ),
      assessed AS (
        SELECT
          c.cell_id,
          c.geom,
          (
            SELECT COUNT(*)::integer
            FROM tourism.co_so_dich_vu s
            WHERE s.trang_thai = 'dang_hoat_dong'
              AND EXISTS (
                SELECT 1
                FROM tourism.co_so_dich_vu_loai lk
                WHERE lk.co_so_dich_vu_id = s.id
                  AND lk.loai_dich_vu_id = $7
              )
              AND ST_DWithin(
                s.geom::geography,
                c.center_geog,
                $8
              )
          ) AS so_co_so
        FROM cells c
      )
      SELECT
        cell_id,
        so_co_so,
        ST_AsGeoJSON(
          ST_Transform(geom, 4326)
        )::jsonb AS geometry
      FROM assessed
      WHERE so_co_so < $9
      ORDER BY cell_id
    `, [
      regionId,
      xmin, xmax, ymin, ymax,
      cellSize,
      categoryId,
      cfg.ban_kinh_m,
      cfg.so_luong_toi_thieu
    ]);

    res.json({
      success: true,
      region: cfg.khu_vuc,
      serviceType: cfg.loai_dich_vu,
      cellSize,
      radiusM: cfg.ban_kinh_m,
      minimum: cfg.so_luong_toi_thieu,
      inspectedGridCells: nx * ny,
      missingCells: result.rowCount,
      geojson: {
        type: "FeatureCollection",
        features: result.rows.map(row => ({
          type: "Feature",
          geometry: row.geometry,
          properties: {
            cell_id: row.cell_id,
            so_co_so: row.so_co_so,
            so_luong_toi_thieu: cfg.so_luong_toi_thieu,
            status: "thieu_dich_vu"
          }
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

// Danh mục ranh giới nghiên cứu
async function getRegions(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id, ma_dvhc, ten, cap_hanh_chinh
      FROM tourism.don_vi_hanh_chinh
      ORDER BY ten
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMissingPoints,
  getGapGrid,
  getRegions
};
