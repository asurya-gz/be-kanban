const express = require("express");
const router = express.Router();
const boardController = require("../../controllers/Boards/boardController");

// Rute untuk membuat pengguna baru
router.post("/all-userboard", boardController.getUserBoards);
router.post("/create-userboard", boardController.createBoard);
router.delete("/delete-userboard", boardController.deleteBoard);
router.put("/update-userboard", boardController.updateBoardName);

module.exports = router;
