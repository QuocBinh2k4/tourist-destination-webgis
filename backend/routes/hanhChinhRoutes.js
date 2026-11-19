
const express = require("express");

const router = express.Router();

const controller = require(
  "../controllers/hanhChinhController"
);

router.get("/tinh", controller.getTinh);

router.get("/tinh/:id/xa", controller.getXaTheoTinh);

router.get(
  "/khu-vuc/:id/du-lieu",
  controller.getDuLieuKhuVuc
);

module.exports = router;
