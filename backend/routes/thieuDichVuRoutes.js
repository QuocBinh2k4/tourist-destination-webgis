
const express = require("express");
const router = express.Router();

const controller = require(
  "../controllers/thieuDichVuController"
);

router.get("/points", controller.getMissingPoints);
router.get("/grid", controller.getGapGrid);
router.get("/regions", controller.getRegions);

module.exports = router;
