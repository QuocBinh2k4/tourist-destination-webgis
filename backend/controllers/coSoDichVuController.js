
const { pool } = require("../config/db");

const STATUSES = [
  "dang_hoat_dong",
  "tam_dong",
  "ngung_hoat_dong"
];

function validId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function validate(data) {
  const errors = [];

  if (
    typeof data.ma !== "string" ||
    !data.ma.trim() ||
    data.ma.length > 30
  ) errors.push("Mã cơ sở không hợp lệ");

  if (
    typeof data.ten !== "string" ||
    !data.ten.trim() ||
    data.ten.length > 250
  ) errors.push("Tên cơ sở không hợp lệ");

  if (
    typeof data.nguon_du_lieu !== "string" ||
    !data.nguon_du_lieu.trim()
  ) errors.push("Thiếu nguồn dữ liệu");

  const lon = Number(data.longitude);
  const lat = Number(data.latitude);

  if (
    data.longitude === "" || data.longitude == null ||
    data.latitude === "" || data.latitude == null ||
    !Number.isFinite(lon) || !Number.isFinite(lat) ||
    lon < -180 || lon > 180 ||
    lat < -90 || lat > 90
  ) errors.push("Tọa độ WGS84 không hợp lệ");

  if (
    data.trang_thai !== undefined &&
    !STATUSES.includes(data.trang_thai)
  ) errors.push("Trạng thái không hợp lệ");

  if (
    data.gio_mo_cua !== undefined &&
    (
      data.gio_mo_cua === null ||
      typeof data.gio_mo_cua !== "object" ||
      Array.isArray(data.gio_mo_cua)
    )
  ) errors.push("Giờ mở cửa phải là JSON object");

  const ids = data.loai_dich_vu_ids ?? [];

  if (
    !Array.isArray(ids) ||
    ids.some(id => !validId(id))
  ) errors.push("Danh sách loại dịch vụ không hợp lệ");

  if (
    data.so_dien_thoai != null &&
    (
      typeof data.so_dien_thoai !== "string" ||
      data.so_dien_thoai.length > 25
    )
  ) errors.push("Số điện thoại không hợp lệ");

  return errors;
}

function valuesFrom(data) {
  return [
    data.ma.trim(),
    data.ten.trim(),
    data.dia_chi || null,
    data.so_dien_thoai || null,
    JSON.stringify(data.gio_mo_cua ?? {}),
    data.trang_thai || "dang_hoat_dong",
    data.nguon_du_lieu.trim(),
    data.ngay_kiem_chung || null,
    Number(data.longitude),
    Number(data.latitude)
  ];
}



async function getAll(req, res, next) {
  try {
    const search = String(req.query.search || "");
    const status = String(req.query.trang_thai || "");
    const categoryId = req.query.loai_dich_vu_id
      ? validId(req.query.loai_dich_vu_id)
      : null;

    if (
      (status && !STATUSES.includes(status)) ||
      (req.query.loai_dich_vu_id && !categoryId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Bộ lọc không hợp lệ"
      });
    }

    const result = await pool.query(`
      SELECT
        c.id, c.ma, c.ten, c.dia_chi,
        c.so_dien_thoai, c.trang_thai,
        c.nguon_du_lieu, c.updated_at,
        ST_X(c.geom) AS longitude,
        ST_Y(c.geom) AS latitude,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', l.id, 'ten', l.ten
              ) ORDER BY l.ten
            )
            FROM tourism.co_so_dich_vu_loai lk
            JOIN tourism.loai_dich_vu l
              ON l.id = lk.loai_dich_vu_id
            WHERE lk.co_so_dich_vu_id = c.id
          ),
          '[]'::jsonb
        ) AS loai_dich_vu
      FROM tourism.co_so_dich_vu c
      WHERE (
        $1 = ''
        OR c.ma ILIKE '%' || $1 || '%'
        OR c.ten ILIKE '%' || $1 || '%'
        OR COALESCE(c.dia_chi, '')
           ILIKE '%' || $1 || '%'
      )
      AND ($2 = '' OR c.trang_thai = $2)
      AND (
        $3::bigint IS NULL
        OR EXISTS (
          SELECT 1
          FROM tourism.co_so_dich_vu_loai lk
          WHERE lk.co_so_dich_vu_id = c.id
            AND lk.loai_dich_vu_id = $3
        )
      )
      ORDER BY c.id DESC
    `, [search.trim(), status, categoryId]);

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

function valuesFrom(data) {
  return [
    data.ma.trim(),
    data.ten.trim(),
    data.dia_chi || null,
    data.so_dien_thoai || null,
    JSON.stringify(data.gio_mo_cua ?? {}),
    data.trang_thai || "dang_hoat_dong",
    data.nguon_du_lieu.trim(),
    data.ngay_kiem_chung || null,
    Number(data.longitude),
    Number(data.latitude)
  ];
}


async function getById(req, res, next) {
  try {
    const id = validId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const result = await pool.query(`
      SELECT
        c.id, c.ma, c.ten, c.dia_chi,
        c.so_dien_thoai, c.gio_mo_cua,
        c.trang_thai, c.nguon_du_lieu,
        c.ngay_kiem_chung,
        ST_X(c.geom) AS longitude,
        ST_Y(c.geom) AS latitude,
        COALESCE(
          (
            SELECT jsonb_agg(lk.loai_dich_vu_id)
            FROM tourism.co_so_dich_vu_loai lk
            WHERE lk.co_so_dich_vu_id = c.id
          ),
          '[]'::jsonb
        ) AS loai_dich_vu_ids
      FROM tourism.co_so_dich_vu c
      WHERE c.id = $1
    `, [id]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy cơ sở dịch vụ"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}


async function create(req, res, next) {
  const errors = validate(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(`
      INSERT INTO tourism.co_so_dich_vu (
        ma, ten, dia_chi, so_dien_thoai,
        gio_mo_cua, trang_thai,
        nguon_du_lieu, ngay_kiem_chung, geom
      )
      VALUES (
        $1, $2, $3, $4, $5::jsonb,
        $6, $7, $8,
        ST_SetSRID(ST_MakePoint($9, $10), 4326)
      )
      RETURNING id, ma, ten
    `, valuesFrom(req.body));

    const id = result.rows[0].id;

    for (const categoryId of new Set(
      req.body.loai_dich_vu_ids || []
    )) {
      await client.query(`
        INSERT INTO tourism.co_so_dich_vu_loai
          (co_so_dich_vu_id, loai_dich_vu_id)
        VALUES ($1, $2)
      `, [id, categoryId]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Thêm cơ sở dịch vụ thành công",
      data: result.rows[0]
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    if (client) client.release();
  }
}


async function update(req, res, next) {
  const id = validId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "ID không hợp lệ"
    });
  }

  const errors = validate(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE tourism.co_so_dich_vu SET
        ma = $1,
        ten = $2,
        dia_chi = $3,
        so_dien_thoai = $4,
        gio_mo_cua = $5::jsonb,
        trang_thai = $6,
        nguon_du_lieu = $7,
        ngay_kiem_chung = $8,
        geom = ST_SetSRID(
          ST_MakePoint($9, $10), 4326
        )
      WHERE id = $11
      RETURNING id, ma, ten
    `, [...valuesFrom(req.body), id]);

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Không tìm thấy cơ sở dịch vụ"
      });
    }

    if (req.body.loai_dich_vu_ids !== undefined) {
      await client.query(`
        DELETE FROM tourism.co_so_dich_vu_loai
        WHERE co_so_dich_vu_id = $1
      `, [id]);

      for (const categoryId of new Set(
        req.body.loai_dich_vu_ids
      )) {
        await client.query(`
          INSERT INTO tourism.co_so_dich_vu_loai
            (co_so_dich_vu_id, loai_dich_vu_id)
          VALUES ($1, $2)
        `, [id, categoryId]);
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: result.rows[0]
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    if (client) client.release();
  }
}


async function remove(req, res, next) {
  try {
    const id = validId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const result = await pool.query(`
      UPDATE tourism.co_so_dich_vu
      SET trang_thai = 'ngung_hoat_dong'
      WHERE id = $1
      RETURNING id, ma, ten, trang_thai
    `, [id]);

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Không tìm thấy cơ sở dịch vụ"
      });
    }

    res.json({
      success: true,
      message: "Đã ngừng hoạt động cơ sở dịch vụ",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};

