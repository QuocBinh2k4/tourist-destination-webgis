
const { pool } = require("../config/db");

// Trả về danh sách điểm du lịch dạng GeoJSON
async function getDiemDuLichGeoJSON(req, res, next) {
  try {
    const sql = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'id', d.id,
              'geometry', ST_AsGeoJSON(d.geom)::jsonb,
              'properties', jsonb_build_object(
                'id', d.id,
                'ma', d.ma,
                'ten', d.ten,
                'dia_chi', d.dia_chi,
                'mo_ta', d.mo_ta,
                'gia_ve_vnd', d.gia_ve_vnd,
                'trang_thai', d.trang_thai
              )
            )
            ORDER BY d.id
          ),
          '[]'::jsonb
        )
      ) AS geojson
      FROM tourism.diem_du_lich d
    `;

    const result = await pool.query(sql);

    res.json(result.rows[0].geojson);
  } catch (error) {
    next(error);
  }
}

// Trả về danh sách cơ sở dịch vụ dạng GeoJSON
async function getCoSoDichVuGeoJSON(req, res, next) {
  try {
    const sql = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'id', c.id,
              'geometry', ST_AsGeoJSON(c.geom)::jsonb,
              'properties', jsonb_build_object(
                'id', c.id,
                'ma', c.ma,
                'ten', c.ten,
                'dia_chi', c.dia_chi,
                'so_dien_thoai', c.so_dien_thoai,
                'trang_thai', c.trang_thai
              )
            )
            ORDER BY c.id
          ),
          '[]'::jsonb
        )
      ) AS geojson
      FROM tourism.co_so_dich_vu c
    `;

    const result = await pool.query(sql);

    res.json(result.rows[0].geojson);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDiemDuLichGeoJSON,
  getCoSoDichVuGeoJSON
};
