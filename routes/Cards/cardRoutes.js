const express = require("express");
const router = express.Router();
const cardRoutes = require("../../controllers/Cards/cardController");

// Get cards by column ID
router.get("/column/:columnId/cards", cardRoutes.getColumnCards);

// Get a specific card by ID
router.post("/getbyid-card", cardRoutes.getCardById);

// Update a card
router.put("/update-card", cardRoutes.updateCard);

// Delete a card
router.delete("/delete-card", cardRoutes.deleteCard);

// Update card position (moving between columns or within a column)
router.put("/update-card-position", cardRoutes.updateCardPosition);

// Get filtered cards
router.get("/cards", cardRoutes.getFilteredCards);

module.exports = router;
