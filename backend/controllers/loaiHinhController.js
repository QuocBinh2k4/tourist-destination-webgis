
const { pool } = require("../config/db");

// Lấy danh sách loại hình đang hoạt động
async function getAll(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        ma,
        ten,
        mo_ta
      FROM tourism.loai_hinh_du_lich
      WHERE is_active = TRUE
      ORDER BY ten ASC
    `);

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll };

