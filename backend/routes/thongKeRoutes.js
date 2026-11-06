
const express = require("express");
const router = express.Router();

const controller = require(
  "../controllers/thongKeController"
);

router.get("/dashboard", controller.dashboard);

module.exports = router;
