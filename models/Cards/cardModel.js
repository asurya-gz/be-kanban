const db = require("../../db");

const CardModel = {
  // Create new card
  createCard: async (
    columnId,
    cardTitle,
    priority,
    description,
    name,
    job,
    callback
  ) => {
    try {
      console.log("➡️ Creating card for column:", columnId);
      console.log("📝 Card title:", cardTitle);

      if (!columnId || !cardTitle) {
        throw new Error("Column ID and card title are required");
      }

      // Get current max position for the column
      const [existingCards] = await db.query(
        "SELECT position FROM cards WHERE column_id = ? ORDER BY position DESC LIMIT 1",
        [columnId]
      );

      // Calculate new position
      const newPosition = existingCards.length
        ? existingCards[0].position + 1
        : 1;

      const [result] = await db.query(
        "INSERT INTO cards (column_id, card_title, priority, description, name, job, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          columnId,
          cardTitle,
          priority || "Medium",
          description,
          name,
          job,
          newPosition,
        ]
      );

      console.log("✅ Card created successfully, ID:", result.insertId);
      callback(null, {
        success: true,
        cardId: result.insertId,
        position: newPosition,
      });
    } catch (error) {
      console.error("❌ Error creating card:", error.message);
      callback(error, null);
    }
  },

  // Get all cards for a column
  getColumnCards: async (columnId, callback) => {
    try {
      console.log("➡️ Getting cards for column:", columnId);

      const [cards] = await db.query(
        "SELECT * FROM cards WHERE column_id = ? ORDER BY position ASC",
        [columnId]
      );

      console.log("✅ Cards retrieved successfully");
      callback(null, { success: true, cards });
    } catch (error) {
      console.error("❌ Error getting cards:", error.message);
      callback(error, null);
    }
  },

  // Get a specific card by ID
  getCardById: async (cardId, callback) => {
    try {
      console.log("➡️ Getting card with ID:", cardId);

      const [card] = await db.query("SELECT * FROM cards WHERE id = ?", [
        cardId,
      ]);

      if (!card.length) {
        return callback(null, { success: false, message: "Card not found" });
      }

      console.log("✅ Card retrieved successfully");
      callback(null, { success: true, card: card[0] });
    } catch (error) {
      console.error("❌ Error getting card:", error.message);
      callback(error, null);
    }
  },

  updateCard: async (cardId, updateData, callback) => {
    try {
      console.log("➡️ Updating card:", cardId);
  
      // Extract updateable fields
      const { card_title, priority, description, name, job } = updateData;
  
      // Build SQL and params for the update
      let sql = "UPDATE cards SET ";
      const params = [];
      const updates = [];
  
      if (card_title !== undefined) {
        updates.push("card_title = ?");
        params.push(card_title);
      }
      if (priority !== undefined) {
        updates.push("priority = ?");
        params.push(priority);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        params.push(description);
      }
      if (name !== undefined) {
        updates.push("name = ?");
        params.push(name);
      }
      if (job !== undefined) {
        updates.push("job = ?");
        params.push(job);
      }
  
      // Finalize SQL
      sql += updates.join(", ") + " WHERE id = ?";
      params.push(cardId);
  
      const [result] = await db.query(sql, params);
  
      if (result.affectedRows === 0) {
        return callback(null, { success: false, message: "Card not found" });
      }
  
      // Ambil data terbaru setelah update
      const [updatedCard] = await db.query("SELECT * FROM cards WHERE id = ?", [
        cardId,
      ]);
  
      console.log("✅ Card updated successfully", updatedCard[0]);
      callback(null, { success: true, updatedCard: updatedCard[0] });
    } catch (error) {
      console.error("❌ Error updating card:", error.message);
      callback(error, null);
    }
  },
  

  // Delete card
  deleteCard: async (cardId, callback) => {
    try {
      console.log("➡️ Deleting card:", cardId);

      // First, get the card details to know its position and column_id
      const [card] = await db.query(
        "SELECT column_id, position FROM cards WHERE id = ?",
        [cardId]
      );

      if (!card.length) {
        return callback(null, { success: false, message: "Card not found" });
      }

      // Start transaction
      await db.query("START TRANSACTION");

      // Delete the card
      await db.query("DELETE FROM cards WHERE id = ?", [cardId]);

      // Update positions of remaining cards
      await db.query(
        `UPDATE cards 
         SET position = position - 1 
         WHERE column_id = ? AND position > ?`,
        [card[0].column_id, card[0].position]
      );

      // Commit transaction
      await db.query("COMMIT");

      console.log("✅ Card deleted successfully");
      callback(null, { success: true });
    } catch (error) {
      // Rollback in case of error
      await db.query("ROLLBACK");
      console.error("❌ Error deleting card:", error.message);
      callback(error, null);
    }
  },

  // Update card position
  updateCardPosition: async (cardId, newColumnId, newPosition, callback) => {
    try {
      console.log(
        "➡️ Updating card position:",
        cardId,
        "to column:",
        newColumnId,
        "position:",
        newPosition
      );

      // Get current card info
      const [card] = await db.query(
        "SELECT column_id, position FROM cards WHERE id = ?",
        [cardId]
      );

      if (!card.length) {
        return callback(null, { success: false, message: "Card not found" });
      }

      const oldPosition = card[0].position;
      const oldColumnId = card[0].column_id;

      // Start transaction
      await db.query("START TRANSACTION");

      if (oldColumnId === newColumnId) {
        // Moving within the same column
        if (newPosition > oldPosition) {
          // Moving down: decrease positions of cards in between
          await db.query(
            `UPDATE cards 
             SET position = position - 1 
             WHERE column_id = ? AND position > ? AND position <= ?`,
            [oldColumnId, oldPosition, newPosition]
          );
        } else {
          // Moving up: increase positions of cards in between
          await db.query(
            `UPDATE cards 
             SET position = position + 1 
             WHERE column_id = ? AND position >= ? AND position < ?`,
            [oldColumnId, newPosition, oldPosition]
          );
        }
      } else {
        // Moving to a different column

        // Decrease positions in the original column
        await db.query(
          `UPDATE cards 
           SET position = position - 1 
           WHERE column_id = ? AND position > ?`,
          [oldColumnId, oldPosition]
        );

        // Increase positions in the target column
        await db.query(
          `UPDATE cards 
           SET position = position + 1 
           WHERE column_id = ? AND position >= ?`,
          [newColumnId, newPosition]
        );
      }

      // Update position and column of the moved card
      await db.query(
        "UPDATE cards SET column_id = ?, position = ? WHERE id = ?",
        [newColumnId, newPosition, cardId]
      );

      // Commit transaction
      await db.query("COMMIT");

      console.log("✅ Card position updated successfully");
      callback(null, { success: true });
    } catch (error) {
      // Rollback in case of error
      await db.query("ROLLBACK");
      console.error("❌ Error updating card position:", error.message);
      callback(error, null);
    }
  },

  // Get all cards with filters
  getCards: async (filters, callback) => {
    try {
      console.log("➡️ Getting cards with filters:", filters);

      let sql = "SELECT * FROM cards WHERE 1=1";
      const params = [];

      // Apply filters if provided
      if (filters.name) {
        sql += " AND name LIKE ?";
        params.push(`%${filters.name}%`);
      }

      if (filters.priority) {
        sql += " AND priority = ?";
        params.push(filters.priority);
      }

      if (filters.job) {
        sql += " AND job LIKE ?";
        params.push(`%${filters.job}%`);
      }

      if (filters.column_id) {
        sql += " AND column_id = ?";
        params.push(filters.column_id);
      }

      // Add order by
      sql += " ORDER BY column_id, position ASC";

      const [cards] = await db.query(sql, params);

      console.log("✅ Filtered cards retrieved successfully");
      callback(null, { success: true, cards });
    } catch (error) {
      console.error("❌ Error getting filtered cards:", error.message);
      callback(error, null);
    }
  },
};

module.exports = CardModel;
