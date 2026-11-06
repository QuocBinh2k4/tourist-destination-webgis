
const { pool } = require("../config/db");

async function dashboard(req, res, next) {
  try {
    const summary = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tourism.diem_du_lich)::integer
          AS so_diem,
        (SELECT COUNT(*) FROM tourism.co_so_dich_vu)::integer
          AS so_co_so,
        (SELECT COUNT(*) FROM tourism.loai_hinh_du_lich
         WHERE is_active)::integer AS so_loai_hinh,
        (SELECT COUNT(*) FROM tourism.loai_dich_vu
         WHERE is_active)::integer AS so_loai_dich_vu,
        (SELECT COUNT(*) FROM tourism.diem_du_lich
         WHERE trang_thai = 'dang_hoat_dong')::integer
          AS diem_dang_hoat_dong,
        (SELECT COUNT(*) FROM tourism.co_so_dich_vu
         WHERE trang_thai = 'dang_hoat_dong')::integer
          AS co_so_dang_hoat_dong
    `);

    const categories = await pool.query(`
      SELECT
        l.id, l.ten,
        COUNT(DISTINCT lk.diem_du_lich_id)::integer AS so_diem
      FROM tourism.loai_hinh_du_lich l
      LEFT JOIN tourism.diem_du_lich_loai_hinh lk
        ON lk.loai_hinh_id = l.id
      WHERE l.is_active
      GROUP BY l.id, l.ten
      ORDER BY so_diem DESC, l.ten
    `);

    const services = await pool.query(`
      SELECT
        l.id, l.ten,
        COUNT(DISTINCT lk.co_so_dich_vu_id)::integer AS so_co_so
      FROM tourism.loai_dich_vu l
      LEFT JOIN tourism.co_so_dich_vu_loai lk
        ON lk.loai_dich_vu_id = l.id
      WHERE l.is_active
      GROUP BY l.id, l.ten
      ORDER BY so_co_so DESC, l.ten
    `);

    const access = await pool.query(`
      SELECT
        COUNT(*)::integer AS so_diem_da_danh_gia,
        COUNT(*) FILTER (
          WHERE dat_tat_ca_tieu_chi
        )::integer AS so_diem_dat,
        ROUND(AVG(diem_tiep_can_100), 2)
          AS diem_trung_binh
      FROM tourism.vw_chi_so_tiep_can
    `);

    res.json({
      success: true,
      summary: summary.rows[0],
      tourismCategories: categories.rows,
      serviceCategories: services.rows,
      accessibility: access.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboard };
