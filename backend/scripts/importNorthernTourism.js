const fs = require("node:fs/promises");
const path = require("node:path");
const { pool } = require("../config/db");
const { destinations, services, checkedAt } = require("../../database/data/northernTourism");

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(11112026)");

    const backup = {};
    for (const table of [
      "diem_du_lich", "diem_du_lich_loai_hinh", "co_so_dich_vu",
      "co_so_dich_vu_loai", "loai_dich_vu"
    ]) {
      backup[table] = (await client.query(`SELECT * FROM tourism.${table}`)).rows;
    }
    const backupDir = path.join(__dirname, "../../database/backups");
    await fs.mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-northern-tourism-${Date.now()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");

    await client.query(`INSERT INTO tourism.loai_dich_vu (ma,ten,mo_ta)
      VALUES ('VAN_CHUYEN','Bến/cảng du lịch','Bến thuyền, cảng hành khách và đầu mối vận chuyển phục vụ du lịch')
      ON CONFLICT (ma) DO NOTHING`);
    for (const [ma, oldName, name, description] of [
      ["AN_UONG", "An uong", "Ăn uống", "Nhà hàng, quán ăn"],
      ["LUU_TRU", "Luu tru", "Lưu trú", "Khách sạn, khu nghỉ dưỡng, nhà nghỉ"],
      ["Y_TE", "Y te", "Y tế", "Cơ sở y tế"],
      ["DO_XE", "Bai do xe", "Bãi đỗ xe", "Bãi đỗ xe"]
    ]) {
      await client.query(`UPDATE tourism.loai_dich_vu SET ten=$1, mo_ta=$2
        WHERE ma=$3 AND ten=$4`, [name, description, ma, oldName]);
    }

    const categoryIds = new Map((await client.query(
      "SELECT ma,id FROM tourism.loai_hinh_du_lich"
    )).rows.map(row => [row.ma, row.id]));
    const serviceTypeIds = new Map((await client.query(
      "SELECT ma,id FROM tourism.loai_dich_vu"
    )).rows.map(row => [row.ma, row.id]));

    let addedDestinations = 0;
    let reusedDestinations = 0;
    for (const item of destinations) {
      let result = await client.query(`SELECT id FROM tourism.diem_du_lich
        WHERE ma=$1 OR lower(trim(ten))=lower(trim($2)) ORDER BY (ma=$1) DESC LIMIT 1`,
      [item.ma, item.ten]);
      if (!result.rowCount) {
        result = await client.query(`INSERT INTO tourism.diem_du_lich
          (ma,ten,dia_chi,mo_ta,gio_mo_cua,trang_thai,nguon_du_lieu,ngay_kiem_chung,geom)
          VALUES ($1,$2,$3,$4,'{}'::jsonb,'dang_hoat_dong',$5,$6,
          ST_SetSRID(ST_MakePoint($7,$8),4326)) RETURNING id`,
        [item.ma, item.ten, item.dia_chi, item.mo_ta,
          `OpenStreetMap contributors (ODbL): ${item.source}`, checkedAt,
          item.longitude, item.latitude]);
        addedDestinations++;
      } else {
        reusedDestinations++;
      }
      for (const code of item.categories) {
        const categoryId = categoryIds.get(code);
        if (!categoryId) throw new Error(`Thiếu loại hình du lịch: ${code}`);
        await client.query(`INSERT INTO tourism.diem_du_lich_loai_hinh
          (diem_du_lich_id,loai_hinh_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [result.rows[0].id, categoryId]);
      }
    }

    let addedServices = 0;
    let reusedServices = 0;
    for (const item of services) {
      let result = await client.query(`SELECT id FROM tourism.co_so_dich_vu
        WHERE ma=$1 OR lower(trim(ten))=lower(trim($2)) ORDER BY (ma=$1) DESC LIMIT 1`,
      [item.ma, item.ten]);
      if (!result.rowCount) {
        result = await client.query(`INSERT INTO tourism.co_so_dich_vu
          (ma,ten,dia_chi,gio_mo_cua,trang_thai,nguon_du_lieu,ngay_kiem_chung,geom)
          VALUES ($1,$2,$3,'{}'::jsonb,'dang_hoat_dong',$4,$5,
          ST_SetSRID(ST_MakePoint($6,$7),4326)) RETURNING id`,
        [item.ma, item.ten, item.dia_chi,
          `OpenStreetMap contributors (ODbL): ${item.source}`, checkedAt,
          item.longitude, item.latitude]);
        addedServices++;
      } else {
        reusedServices++;
      }
      for (const code of item.types) {
        const typeId = serviceTypeIds.get(code);
        if (!typeId) throw new Error(`Thiếu loại dịch vụ: ${code}`);
        await client.query(`INSERT INTO tourism.co_so_dich_vu_loai
          (co_so_dich_vu_id,loai_dich_vu_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [result.rows[0].id, typeId]);
      }
    }

    await client.query("COMMIT");
    console.log(JSON.stringify({
      addedDestinations, reusedDestinations, addedServices, reusedServices,
      backupPath
    }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main().catch(error => {
  console.error("Nhập dữ liệu miền Bắc thất bại:", error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
