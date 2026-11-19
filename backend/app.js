const express = require("express");
const cors = require("cors");
const { getTrustedOrigins } = require("./config/origins");

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


const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");

const hanhChinhRoutes = require("./routes/hanhChinhRoutes");

const {
  requireAuth,
  allowRoles,
  requireTrustedOrigin
} = require("./middleware/auth");

app.use(helmet());
app.use(cookieParser());

// Cho phép React trên máy cục bộ truy cập API
app.use(
  cors({
    origin: getTrustedOrigins(),
    credentials: true,
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
// API đăng nhập
app.use("/api", requireTrustedOrigin);
app.use("/api/auth", authRoutes);

// Từ đây, mọi API nghiệp vụ đều cần đăng nhập
app.use("/api", requireAuth);
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/di-san", require("./routes/diSanRoutes"));

// API danh mục loại hình
app.use(
  "/api/loai-hinh",
  (req, res, next) => {
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      return allowRoles("admin")(req, res, next);
    }

    if (req.path === "/all") {
      return allowRoles("admin")(req, res, next);
    }

    next();
  },
  loaiHinhRoutes
);

// Điểm du lịch
app.use(
  "/api/diem-du-lich",
  (req, res, next) => {
    if (req.method === "DELETE") {
      return allowRoles("admin")(req, res, next);
    }

    if (["POST", "PUT"].includes(req.method)) {
      return allowRoles("admin", "editor")(req, res, next);
    }

    next();
  },
  diemDuLichRoutes
);

// Cơ sở dịch vụ
app.use(
  "/api/co-so-dich-vu",
  (req, res, next) => {
    if (req.method === "DELETE") {
      return allowRoles("admin")(req, res, next);
    }

    if (["POST", "PUT"].includes(req.method)) {
      return allowRoles("admin", "editor")(req, res, next);
    }

    next();
  },
  coSoDichVuRoutes
);

// Loại dịch vụ
app.use(
  "/api/loai-dich-vu",
  (req, res, next) => {
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      return allowRoles("admin")(req, res, next);
    }
    next();
  },
  loaiDichVuRoutes
);

// Các API đọc và phân tích
app.use("/api/map", mapRoutes);
app.use("/api/analysis", phanTichRoutes);
app.use("/api/stats", thongKeRoutes);
app.use("/api/gaps", thieuDichVuRoutes);

app.use("/api/hanh-chinh", hanhChinhRoutes);

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
