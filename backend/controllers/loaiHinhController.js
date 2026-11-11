
const { pool } = require("../config/db");

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validate(data) {
  const errors = [];

  if (
    typeof data.ma !== "string" ||
    !data.ma.trim() ||
    data.ma.length > 30
  ) {
    errors.push("Mã loại hình không hợp lệ");
  }

  if (
    typeof data.ten !== "string" ||
    !data.ten.trim() ||
    data.ten.length > 150
  ) {
    errors.push("Tên loại hình không hợp lệ");
  }

  if (
    data.mo_ta != null &&
    typeof data.mo_ta !== "string"
  ) {
    errors.push("Mô tả phải là chuỗi");
  }

  if (
    data.is_active !== undefined &&
    typeof data.is_active !== "boolean"
  ) {
    errors.push("Trạng thái không hợp lệ");
  }

  return errors;
}

// Danh sách loại hình đang hoạt động
async function getAll(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT l.id, l.ma, l.ten, l.mo_ta, l.is_active,
        (SELECT count(*)::int FROM tourism.diem_du_lich_loai_hinh p WHERE p.loai_hinh_id=l.id) AS so_diem,
        (SELECT count(*)::int FROM tourism.di_san_van_hoa d WHERE d.loai_hinh_id=l.id) AS so_di_san
      FROM tourism.loai_hinh_du_lich l
      WHERE l.is_active = TRUE
      ORDER BY l.ten
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

// Danh sách toàn bộ, dành cho quản trị
async function getAllAdmin(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        l.id, l.ma, l.ten, l.mo_ta, l.is_active,
        (SELECT count(*)::int FROM tourism.di_san_van_hoa d WHERE d.loai_hinh_id=l.id) AS so_di_san,
        COUNT(lk.diem_du_lich_id)::integer AS so_diem
      FROM tourism.loai_hinh_du_lich l
      LEFT JOIN tourism.diem_du_lich_loai_hinh lk
        ON lk.loai_hinh_id = l.id
      GROUP BY l.id
      ORDER BY l.id
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const errors = validate(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false, errors
      });
    }

    const result = await pool.query(`
      INSERT INTO tourism.loai_hinh_du_lich
        (ma, ten, mo_ta, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      req.body.ma.trim(),
      req.body.ten.trim(),
      req.body.mo_ta || null,
      req.body.is_active ?? true
    ]);

    res.status(201).json({
      success: true,
      message: "Thêm loại hình thành công",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const errors = validate(req.body);

    if (!id || errors.length) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors
      });
    }

    const result = await pool.query(`
      UPDATE tourism.loai_hinh_du_lich
      SET ma = $1,
          ten = $2,
          mo_ta = $3,
          is_active = $4
      WHERE id = $5
      RETURNING *
    `, [
      req.body.ma.trim(),
      req.body.ten.trim(),
      req.body.mo_ta || null,
      req.body.is_active,
      id
    ]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy loại hình"
      });
    }

    res.json({
      success: true,
      message: "Cập nhật loại hình thành công",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

// Ngừng sử dụng thay vì xóa dữ liệu
async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const result = await pool.query(`
      UPDATE tourism.loai_hinh_du_lich
      SET is_active = FALSE
      WHERE id = $1
      RETURNING id, ma, ten, is_active
    `, [id]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy loại hình"
      });
    }

    res.json({
      success: true,
      message: "Đã ngừng sử dụng loại hình",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getAllAdmin,
  create,
  update,
  remove
};
