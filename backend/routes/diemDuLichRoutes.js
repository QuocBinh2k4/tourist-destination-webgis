
const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/diemDuLichController"
);

// Lấy danh sách và tìm kiếm
router.get("/", controller.getAll);

// Xem chi tiết
router.get("/:id", controller.getById);

// Thêm điểm du lịch
router.post("/", controller.create);

// Sửa điểm du lịch
router.put("/:id", controller.update);

// Xóa điểm du lịch
router.delete("/:id", controller.remove);

module.exports = router;
