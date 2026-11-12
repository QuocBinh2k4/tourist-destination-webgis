const router = require("express").Router();
const controller = require("../controllers/accountController");
const { allowRoles } = require("../middleware/auth");

router.get("/sessions", controller.sessions);
router.delete("/sessions/:id", controller.revoke);
router.use(allowRoles("admin"));
router.get("/", controller.list);
router.post("/", controller.save);
router.put("/:id", controller.save);
router.delete("/:id", controller.remove);

module.exports = router;
