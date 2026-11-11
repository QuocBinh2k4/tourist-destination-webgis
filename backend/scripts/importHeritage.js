const fs = require("node:fs/promises");
const path = require("node:path");
const { pool } = require("../config/db");
const { categories, records, checkedAt } = require("../../database/data/diSanVietNam");

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(7112026)");
    const backup = {};
    for (const table of ["loai_hinh_du_lich", "diem_du_lich", "diem_du_lich_loai_hinh"]) {
      backup[table] = (await client.query(`SELECT * FROM tourism.${table}`)).rows;
    }
    const backupDir = path.join(__dirname, "../../database/backups");
    await fs.mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-heritage-${Date.now()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");

    await client.query(await fs.readFile(path.join(__dirname, "../../database/06_di_san_van_hoa.sql"), "utf8"));
    const categoryIds = new Map();
    for (const category of categories) {
      await client.query(`INSERT INTO tourism.loai_hinh_du_lich (ma, ten, mo_ta)
        VALUES ($1, $2, $3) ON CONFLICT (ma) DO NOTHING`, [category.ma, category.ten, category.mo_ta]);
      const result = await client.query("SELECT id FROM tourism.loai_hinh_du_lich WHERE ma = $1", [category.ma]);
      categoryIds.set(category.ma, result.rows[0].id);
    }
    // Chỉ chỉnh dấu cho các tên mẫu cũ, giữ nguyên ID và liên kết.
    for (const [ma, oldName, name] of [["VH", "Van hoa", "Văn hóa"], ["LS", "Lich su", "Lịch sử"], ["ST", "Sinh thai", "Sinh thái"]]) {
      await client.query("UPDATE tourism.loai_hinh_du_lich SET ten = $1 WHERE ma = $2 AND ten = $3", [name, ma, oldName]);
    }

    let addedRecords = 0;
    let addedPoints = 0;
    for (const record of records) {
      let pointId = null;
      const categoryId = categoryIds.get(record.category);
      if (record.coordinates) {
        // Dùng lại điểm cùng mã/tên; không ghi đè dữ liệu do người dùng sửa.
        let existing = await client.query("SELECT id FROM tourism.diem_du_lich WHERE ma = $1 OR lower(trim(ten)) = lower(trim($2)) ORDER BY (ma = $1) DESC LIMIT 1", [record.ma, record.ten]);
        if (!existing.rowCount) {
          const [lon, lat] = record.coordinates;
          existing = await client.query(`INSERT INTO tourism.diem_du_lich
            (ma, ten, dia_chi, mo_ta, nguon_du_lieu, ngay_kiem_chung, website, geom)
            VALUES ($1,$2,$3,$4,$5,$6,$7,ST_SetSRID(ST_MakePoint($8,$9),4326)) RETURNING id`,
          [record.ma, record.ten, record.dia_ban,
            record.mo_ta + " " + record.ghi_chu_toa_do,
            `Cục Di sản văn hóa: ${record.nguon_url}; Tọa độ UNESCO: ${record.coordinateSource}`,
            checkedAt, record.nguon_url, lon, lat]);
          addedPoints++;
        }
        pointId = existing.rows[0].id;
        await client.query(`INSERT INTO tourism.diem_du_lich_loai_hinh (diem_du_lich_id,loai_hinh_id)
          VALUES ($1,$2) ON CONFLICT DO NOTHING`, [pointId, categoryId]);
      }
      const added = await client.query(`INSERT INTO tourism.di_san_van_hoa
        (ma,ten,loai_hinh_id,phan_loai,dia_ban,nam_ghi_danh,mo_ta,nguon_url,nguon_ten,ngay_doi_chieu,diem_du_lich_id,ghi_chu_toa_do)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (ma) DO NOTHING`,
      [record.ma, record.ten, categoryId, record.phan_loai, record.dia_ban || null,
        record.nam_ghi_danh || null, record.mo_ta || null, record.nguon_url,
        "Cục Di sản văn hóa", checkedAt, pointId,
        record.coordinates ? `${record.ghi_chu_toa_do} Nguồn tọa độ: ${record.coordinateSource}` : null]);
      addedRecords += added.rowCount;
    }
    const counts = await client.query(`SELECT l.ten, count(d.id)::int AS so_ho_so
      FROM tourism.di_san_van_hoa d JOIN tourism.loai_hinh_du_lich l ON l.id=d.loai_hinh_id
      GROUP BY l.id ORDER BY l.ten`);
    await client.query("COMMIT");
    console.log(JSON.stringify({ addedRecords, addedPoints, backupPath, groups: counts.rows }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
main().catch(error => {
  console.error("Nhập di sản thất bại:", error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
