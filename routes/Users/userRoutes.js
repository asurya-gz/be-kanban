const express = require("express");
const router = express.Router();
const userController = require("../../controllers/Users/userController");

// Rute untuk membuat pengguna baru
router.post("/register", userController.registerUser);
router.get("/all-users", userController.getAllUsers);
router.post("/login", userController.loginUser);
router.get("/user/:id", userController.getUserById);
router.post("/change-password", userController.changePassword);
router.post("/change-password-email", userController.changePasswordByEmail);
router.delete("/delete-user", userController.deleteUser);

module.exports = router;
