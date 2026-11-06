
const express = require("express");
const router = express.Router();

const controller = require(
  "../controllers/phanTichController"
);

router.get("/distance", controller.tinhKhoangCach);

router.get("/nearest", controller.timGanNhat);

router.get("/radius", controller.timTrongBanKinh);

router.get("/buffer", controller.taoBuffer);

router.get("/access", controller.danhGiaTiepCan);

module.exports = router;
