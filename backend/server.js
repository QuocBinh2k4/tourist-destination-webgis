
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

// Kiểm tra kết nối PostgreSQL
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        PostGIS_Version() AS postgis
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi kết nối cơ sở dữ liệu"
    });
  }
});

// Danh sách điểm du lịch
app.get("/api/diem-du-lich", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id, ma, ten, dia_chi, mo_ta,
        gia_ve_vnd, trang_thai,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude
      FROM tourism.diem_du_lich
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không tải được điểm du lịch"
    });
  }
});

// API dữ liệu GeoJSON cho bản đồ
app.get("/api/map/diem-du-lich.geojson", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'id', id,
              'geometry', ST_AsGeoJSON(geom)::jsonb,
              'properties', jsonb_build_object(
                'ma', ma,
                'ten', ten,
                'trang_thai', trang_thai
              )
            )
          ), '[]'::jsonb
        )
      ) AS geojson
      FROM tourism.diem_du_lich
    `);

    res.json(result.rows[0].geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Không tải được GeoJSON"
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API đang chạy ở cổng ${PORT}`);
});
