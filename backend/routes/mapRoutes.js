const express = require("express");

const router = express.Router();

const controller = require("../controllers/mapController");

// GeoJSON điểm du lịch
router.get(
  "/diem-du-lich",
  controller.getDiemDuLichGeoJSON
);

// GeoJSON cơ sở dịch vụ
router.get(
  "/co-so-dich-vu",
  controller.getCoSoDichVuGeoJSON
);

module.exports = router;
