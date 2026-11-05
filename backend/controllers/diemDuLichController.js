
const { pool } = require("../config/db");

// Các trạng thái được cho phép trong CSDL
const TRANG_THAI = [
  "dang_hoat_dong",
  "tam_dong",
  "ngung_hoat_dong"
];

// Kiểm tra dữ liệu gửi từ form
function validateDiemDuLich(data) {
  const errors = [];

  if (
    typeof data.ma !== "string" ||
    !data.ma.trim() ||
    data.ma.length > 30
  ) {
    errors.push("Mã điểm không hợp lệ (tối đa 30 ký tự)");
  }

  if (
    typeof data.ten !== "string" ||
    !data.ten.trim() ||
    data.ten.length > 250
  ) {
    errors.push("Tên điểm không hợp lệ (tối đa 250 ký tự)");
  }

  if (
    typeof data.nguon_du_lieu !== "string" ||
    !data.nguon_du_lieu.trim()
  ) {
    errors.push("Phải nhập nguồn dữ liệu");
  }

  const longitude = Number(data.longitude);
  const latitude = Number(data.latitude);

  if (
    data.longitude === null ||
    data.longitude === "" ||
    data.latitude === null ||
    data.latitude === "" ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    errors.push("Kinh độ hoặc vĩ độ không hợp lệ");
  }

  if (
    data.trang_thai !== undefined &&
    !TRANG_THAI.includes(data.trang_thai)
  ) {
    errors.push("Trạng thái không hợp lệ");
  }

  if (
    data.gia_ve_vnd !== undefined &&
    data.gia_ve_vnd !== null &&
    data.gia_ve_vnd !== "" &&
    (
      !Number.isSafeInteger(Number(data.gia_ve_vnd)) ||
      Number(data.gia_ve_vnd) < 0
    )
  ) {
    errors.push("Giá vé phải là số nguyên không âm");
  }

  if (
    data.gio_mo_cua !== undefined &&
    (
      data.gio_mo_cua === null ||
      typeof data.gio_mo_cua !== "object" ||
      Array.isArray(data.gio_mo_cua)
    )
  ) {
    errors.push("Giờ mở cửa phải là đối tượng JSON");
  }

  return errors;
}

// Kiểm tra ID lấy từ URL
function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Chuẩn hóa dữ liệu để lưu vào PostgreSQL
function normalizeData(data) {
  return [
    data.ma.trim(),
    data.ten.trim(),
    data.dia_chi || null,
    data.mo_ta || null,
    data.gia_ve_vnd === "" ? null
      : (data.gia_ve_vnd ?? null),
    JSON.stringify(data.gio_mo_cua ?? {}),
    data.so_dien_thoai || null,
    data.website || null,
    data.trang_thai || "dang_hoat_dong",
    data.nguon_du_lieu.trim(),
    data.ngay_kiem_chung || null,
    Number(data.longitude),
    Number(data.latitude)
  ];
}

//Lấy danh sách và tìm kiếm điểm du lịch
async function getAll(req, res, next) {
  try {
    const {
      search = "",
      trang_thai = "",
      loai_hinh_id = ""
    } = req.query;

    if (
      trang_thai &&
      !TRANG_THAI.includes(trang_thai)
    ) {
      return res.status(400).json({
        message: "Trạng thái lọc không hợp lệ"
      });
    }

    const loaiId = loai_hinh_id
      ? parseId(loai_hinh_id)
      : null;

    if (loai_hinh_id && !loaiId) {
      return res.status(400).json({
        message: "ID loại hình không hợp lệ"
      });
    }

    const sql = `
      SELECT
        d.id,
        d.ma,
        d.ten,
        d.dia_chi,
        d.mo_ta,
        d.gia_ve_vnd,
        d.trang_thai,
        d.nguon_du_lieu,
        d.created_at,
        d.updated_at,
        ST_X(d.geom) AS longitude,
        ST_Y(d.geom) AS latitude,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', lh.id,
                'ten', lh.ten
              )
              ORDER BY lh.ten
            )
            FROM tourism.diem_du_lich_loai_hinh lk
            JOIN tourism.loai_hinh_du_lich lh
              ON lh.id = lk.loai_hinh_id
            WHERE lk.diem_du_lich_id = d.id
          ),
          '[]'::jsonb
        ) AS loai_hinh
      FROM tourism.diem_du_lich d
      WHERE (
        $1 = ''
        OR d.ten ILIKE '%' || $1 || '%'
        OR d.ma ILIKE '%' || $1 || '%'
        OR COALESCE(d.dia_chi, '')
           ILIKE '%' || $1 || '%'
      )
      AND (
        $2 = ''
        OR d.trang_thai = $2
      )
      AND (
        $3::BIGINT IS NULL
        OR EXISTS (
          SELECT 1
          FROM tourism.diem_du_lich_loai_hinh lk
          WHERE lk.diem_du_lich_id = d.id
            AND lk.loai_hinh_id = $3
        )
      )
      ORDER BY d.id DESC
    `;

    const result = await pool.query(sql, [
      String(search).trim(),
      trang_thai,
      loaiId
    ]);

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}


//Xem chi tiết điểm du lịch
async function getById(req, res, next) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const sql = `
      SELECT
        d.*,
        ST_X(d.geom) AS longitude,
        ST_Y(d.geom) AS latitude,
        ST_AsGeoJSON(d.geom)::jsonb AS geometry,
        COALESCE(
          (
            SELECT jsonb_agg(lk.loai_hinh_id)
            FROM tourism.diem_du_lich_loai_hinh lk
            WHERE lk.diem_du_lich_id = d.id
          ),
          '[]'::jsonb
        ) AS loai_hinh_ids
      FROM tourism.diem_du_lich d
      WHERE d.id = $1
    `;

    const result = await pool.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Không tìm thấy điểm du lịch"
      });
    }

    // Không gửi trực tiếp trường geometry kiểu PostgreSQL
    const { geom, ...data } = result.rows[0];

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

//Xem chi tiết điểm du lịch
async function create(req, res, next) {
  const errors = validateDiemDuLich(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sql = `
      INSERT INTO tourism.diem_du_lich (
        ma, ten, dia_chi, mo_ta,
        gia_ve_vnd, gio_mo_cua,
        so_dien_thoai, website,
        trang_thai, nguon_du_lieu,
        ngay_kiem_chung, geom
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6::jsonb, $7, $8,
        $9, $10, $11,
        ST_SetSRID(ST_MakePoint($12, $13), 4326)
      )
      RETURNING id, ma, ten
    `;

    const result = await client.query(
      sql,
      normalizeData(req.body)
    );

    const newId = result.rows[0].id;
    const loaiHinhIds = req.body.loai_hinh_ids || [];

    if (
      !Array.isArray(loaiHinhIds) ||
      loaiHinhIds.some(x => !parseId(x))
    ) {
      const err = new Error("Danh sách loại hình không hợp lệ");
      err.status = 400;
      throw err;
    }

    for (const loaiId of new Set(loaiHinhIds)) {
      await client.query(`
        INSERT INTO tourism.diem_du_lich_loai_hinh
          (diem_du_lich_id, loai_hinh_id)
        VALUES ($1, $2)
      `, [newId, loaiId]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Thêm điểm du lịch thành công",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}


//Cập nhật điểm du lịch

async function update(req, res, next) {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: "ID không hợp lệ"
    });
  }

  const errors = validateDiemDuLich(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sql = `
      UPDATE tourism.diem_du_lich
      SET
        ma = $1,
        ten = $2,
        dia_chi = $3,
        mo_ta = $4,
        gia_ve_vnd = $5,
        gio_mo_cua = $6::jsonb,
        so_dien_thoai = $7,
        website = $8,
        trang_thai = $9,
        nguon_du_lieu = $10,
        ngay_kiem_chung = $11,
        geom = ST_SetSRID(
          ST_MakePoint($12, $13), 4326
        )
      WHERE id = $14
      RETURNING id, ma, ten, updated_at
    `;

    const values = [
      ...normalizeData(req.body),
      id
    ];

    const result = await client.query(sql, values);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Không tìm thấy điểm du lịch"
      });
    }

    // Chỉ thay đổi loại hình nếu form gửi trường này
    if (req.body.loai_hinh_ids !== undefined) {
      const ids = req.body.loai_hinh_ids;

      if (
        !Array.isArray(ids) ||
        ids.some(x => !parseId(x))
      ) {
        const err = new Error(
          "Danh sách loại hình không hợp lệ"
        );
        err.status = 400;
        throw err;
      }

      await client.query(`
        DELETE FROM tourism.diem_du_lich_loai_hinh
        WHERE diem_du_lich_id = $1
      `, [id]);

      for (const loaiId of new Set(ids)) {
        await client.query(`
          INSERT INTO tourism.diem_du_lich_loai_hinh
            (diem_du_lich_id, loai_hinh_id)
          VALUES ($1, $2)
        `, [id, loaiId]);
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

//Xóa điểm du lịch


async function remove(req, res, next) {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "ID không hợp lệ"
      });
    }

    const result = await pool.query(`
      DELETE FROM tourism.diem_du_lich
      WHERE id = $1
      RETURNING id, ma, ten
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Không tìm thấy điểm du lịch"
      });
    }

    res.json({
      success: true,
      message: "Xóa điểm du lịch thành công",
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
}


//Xuất các hàm controller
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
