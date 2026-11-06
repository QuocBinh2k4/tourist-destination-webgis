const express = require("express");
const cors = require("cors");

const diemDuLichRoutes = require("./routes/diemDuLichRoutes");

const loaiHinhRoutes = require("./routes/loaiHinhRoutes");

const mapRoutes = require("./routes/mapRoutes");

const phanTichRoutes = require("./routes/phanTichRoutes");

const errorHandler = require("./middleware/errorHandler");

const { pool } = require("./config/db");

const app = express();

const coSoDichVuRoutes = require("./routes/coSoDichVuRoutes");

const loaiDichVuRoutes = require("./routes/loaiDichVuRoutes");

const thongKeRoutes = require("./routes/thongKeRoutes");

const thieuDichVuRoutes = require("./routes/thieuDichVuRoutes");

// Cho phép React trên máy cục bộ truy cập API
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Đọc dữ liệu JSON từ request
app.use(express.json({ limit: "1mb" }));

// Kiểm tra server và kết nối database
app.get("/api/health", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        current_database() AS database,
        PostGIS_Version() AS postgis
    `);

    res.json({
      success: true,
      message: "TourismGIS Backend hoạt động",
      database: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Đăng ký các nhóm API
app.use("/api/diem-du-lich", diemDuLichRoutes);

app.use("/api/loai-hinh", loaiHinhRoutes);

app.use("/api/map", mapRoutes);

app.use("/api/analysis", phanTichRoutes);

app.use("/api/co-so-dich-vu", coSoDichVuRoutes);

app.use("/api/loai-dich-vu", loaiDichVuRoutes);

app.use("/api/stats", thongKeRoutes);

app.use("/api/gaps", thieuDichVuRoutes);


// API không tồn tại
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Không tìm thấy API",
  });
});

// Middleware xử lý lỗi phải nằm cuối
app.use(errorHandler);

module.exports = app;
