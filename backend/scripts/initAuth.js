const fs = require("node:fs/promises");
const path = require("node:path");
const { pool } = require("../config/db");

async function main() {
  const sql = await fs.readFile(
    path.join(__dirname, "../../database/04_authentication.sql"), "utf8"
  );
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("CREATE SCHEMA IF NOT EXISTS tourism");
    await client.query(sql);
    const result = await client.query(`
      SELECT current_database() AS database,
             to_regclass('tourism.tai_khoan') AS accounts,
             to_regclass('tourism.phien_dang_nhap') AS sessions,
             (SELECT count(*)::int FROM tourism.tai_khoan) AS account_count
    `);
    await client.query("COMMIT");
    console.log("Đã khởi tạo bảng xác thực:", result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main().catch(error => {
  console.error("Không thể khởi tạo bảng xác thực:", error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
