const express = require("express");
const { pool } = require("../config/db");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "", classification = "" } = req.query;
    if ([search, category, classification].some(value => typeof value !== "string" || value.length > 250)) {
      return res.status(400).json({ success: false, message: "Bộ lọc không hợp lệ" });
    }
    const result = await pool.query(`
      SELECT d.*, l.ma AS loai_hinh_ma, l.ten AS loai_hinh_ten,
             ST_X(p.geom) AS longitude, ST_Y(p.geom) AS latitude
      FROM tourism.di_san_van_hoa d
      JOIN tourism.loai_hinh_du_lich l ON l.id = d.loai_hinh_id
      LEFT JOIN tourism.diem_du_lich p ON p.id = d.diem_du_lich_id
      WHERE ($1 = '' OR d.ten ILIKE '%' || $1 || '%' OR d.dia_ban ILIKE '%' || $1 || '%')
        AND ($2 = '' OR l.ma = $2)
        AND ($3 = '' OR d.phan_loai = $3)
      ORDER BY l.ten, d.ten
    `, [search.trim(), category, classification]);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
