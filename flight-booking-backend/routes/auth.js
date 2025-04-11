const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const router = require("express").Router();
const cors = require("cors");

router.use(cors()); // ✅ Bật CORS nếu frontend chạy trên port khác

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/change-password", verifyToken, authController.changePassword);
router.get("/profile", verifyToken, authController.getUserProfile);
router.put("/update", verifyToken, authController.updateProfile);

module.exports = router;
