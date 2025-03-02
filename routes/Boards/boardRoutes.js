const express = require("express");
const router = express.Router();
const boardController = require("../../controllers/Boards/boardController");

// Main board routes (based on the BoardModel implementation)
router.get("/main-board", boardController.getMainBoard);
router.put("/update-board-name", boardController.updateBoardName);

// Column operations
router.post("/add-column", boardController.addColumn);
router.put("/update-column", boardController.updateColumnName);
router.delete("/delete-column", boardController.deleteColumn);

// Card operations
router.post("/add-card", boardController.addCard);
router.put("/update-card", boardController.updateCard);
router.delete("/delete-card", boardController.deleteCard);
router.put("/move-card", boardController.moveCard);

module.exports = router;
