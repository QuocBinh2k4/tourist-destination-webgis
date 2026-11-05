
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

module.exports = pool;

// Hàm kiểm tra kết nối
async function testConnection() {
  const result = await pool.query(`
    SELECT
      current_database() AS database_name,
      PostGIS_Version() AS postgis_version
  `);

  console.log("Kết nối PostgreSQL thành công!");
  console.log(result.rows[0]);
}

module.exports = {
  pool,
  testConnection
};