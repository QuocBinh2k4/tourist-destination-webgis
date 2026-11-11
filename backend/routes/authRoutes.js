
const express = require("express");
const { rateLimit } = require("express-rate-limit");

const controller = require(
  "../controllers/authController"
);

const { requireAuth } = require(
  "../middleware/auth"
);

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập. Vui lòng thử lại sau."
  }
});

router.post("/login", loginLimiter, controller.login);
router.get("/me", requireAuth, controller.me);
router.post("/logout", requireAuth, controller.logout);

module.exports = router;
