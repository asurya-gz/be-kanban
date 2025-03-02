const db = require("../../db");

const BoardModel = {
  // Get the main kanban board with all columns and cards
  getMainBoard: async (callback) => {
    try {
      console.log("➡️ Getting main kanban board");

      // Get first board (id=1) with all columns and cards
      const [boardData] = await db.query(
        `SELECT b.*, 
                c.id as column_id, 
                c.column_name, 
                c.position as column_position,
                card.id as card_id,
                card.card_title,
                card.name,
                card.priority,
                card.job,
                card.description,
                card.position as card_position,
                card.user_id,
                u.username
         FROM boards b
         LEFT JOIN columns c ON b.id = c.board_id
         LEFT JOIN cards card ON c.id = card.column_id
         LEFT JOIN users u ON card.user_id = u.id
         WHERE b.id = 1
         ORDER BY c.position ASC, card.position ASC`
      );

      if (!boardData.length) {
        console.log("❌ Main board not found");
        return callback(null, {
          success: false,
          message: "Main board not found",
        });
      }

      const formattedBoard = formatBoardData(boardData);
      console.log("✅ Main board retrieved successfully");
      callback(null, { success: true, board: formattedBoard });
    } catch (error) {
      console.error("❌ Error getting main board:", error.message);
      callback(error, null);
    }
  },

  // Update the main board name
  updateBoardName: async (newBoardName, callback) => {
    try {
      console.log("➡️ Updating main board name");
      console.log("📝 New board name:", newBoardName);

      // Input validation
      if (!newBoardName) {
        throw new Error("New board name is required");
      }

      // Update board name for the main board (id=1)
      const [result] = await db.query(
        "UPDATE boards SET board_name = ? WHERE id = 1",
        [newBoardName]
      );

      if (result.affectedRows === 0) {
        console.log("❌ Main board not found");
        return callback(null, {
          success: false,
          message: "Main board not found",
        });
      }

      console.log("✅ Main board name updated successfully");
      callback(null, {
        success: true,
        message: "Board name updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating board name:", error.message);
      callback(error, null);
    }
  },

  // Add a column to the main board
  addColumn: async (columnName, callback) => {
    try {
      console.log("➡️ Adding column to main board");
      console.log("📝 Column name:", columnName);

      // Input validation
      if (!columnName) {
        throw new Error("Column name is required");
      }

      // Get the highest position value
      const [positionResult] = await db.query(
        "SELECT COALESCE(MAX(position), 0) as max_pos FROM columns WHERE board_id = 1"
      );
      const newPosition = positionResult[0].max_pos + 1;

      // Insert the new column
      const [result] = await db.query(
        "INSERT INTO columns (board_id, column_name, position) VALUES (1, ?, ?)",
        [columnName, newPosition]
      );

      console.log("✅ Column added successfully, ID:", result.insertId);
      callback(null, {
        success: true,
        columnId: result.insertId,
        message: "Column added successfully",
      });
    } catch (error) {
      console.error("❌ Error adding column:", error.message);
      callback(error, null);
    }
  },

  // Update a column name
  updateColumnName: async (columnId, newColumnName, callback) => {
    try {
      console.log("➡️ Updating column name");
      console.log("📝 Column ID:", columnId);
      console.log("📝 New column name:", newColumnName);

      // Input validation
      if (!columnId || !newColumnName) {
        throw new Error("Column ID and new column name are required");
      }

      // Verify column belongs to main board
      const [columnCheck] = await db.query(
        "SELECT id FROM columns WHERE id = ? AND board_id = 1",
        [columnId]
      );

      if (!columnCheck.length) {
        console.log("❌ Column not found or not part of main board");
        return callback(null, {
          success: false,
          message: "Column not found or not part of main board",
        });
      }

      // Update column name
      await db.query("UPDATE columns SET column_name = ? WHERE id = ?", [
        newColumnName,
        columnId,
      ]);

      console.log("✅ Column name updated successfully");
      callback(null, {
        success: true,
        message: "Column name updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating column name:", error.message);
      callback(error, null);
    }
  },

  // Delete a column
  deleteColumn: async (columnId, callback) => {
    let connection;
    try {
      console.log("➡️ Deleting column from main board");
      console.log("📝 Column ID:", columnId);

      // Validate input
      if (!columnId) {
        throw new Error("Column ID is required");
      }

      // Start transaction
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Verify column belongs to main board
      const [columnCheck] = await connection.query(
        "SELECT id, position FROM columns WHERE id = ? AND board_id = 1",
        [columnId]
      );

      if (!columnCheck.length) {
        await connection.rollback();
        connection.release();
        return callback(null, {
          success: false,
          message: "Column not found or not part of main board",
        });
      }

      const deletedPosition = columnCheck[0].position;

      // Delete all cards in the column (will be handled by foreign key constraint with ON DELETE CASCADE)
      // Delete the column
      await connection.query("DELETE FROM columns WHERE id = ?", [columnId]);

      // Update positions of remaining columns
      await connection.query(
        "UPDATE columns SET position = position - 1 WHERE board_id = 1 AND position > ?",
        [deletedPosition]
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      console.log("✅ Column deleted successfully");
      callback(null, {
        success: true,
        message: "Column deleted successfully",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error("❌ Error deleting column:", error.message);
      callback(error, null);
    }
  },

  // Add a card to a column
  addCard: async (columnId, cardData, userId, callback) => {
    try {
      console.log("➡️ Adding card to column");
      console.log("📝 Column ID:", columnId);
      console.log("👤 User ID:", userId);

      // Input validation
      if (!columnId || !cardData || !userId) {
        throw new Error("Column ID, card data, and user ID are required");
      }

      // Verify column exists and belongs to main board
      const [columnCheck] = await db.query(
        "SELECT id FROM columns WHERE id = ? AND board_id = 1",
        [columnId]
      );

      if (!columnCheck.length) {
        return callback(null, {
          success: false,
          message: "Column not found or not part of main board",
        });
      }

      // Get the highest position value to add the card at the end
      const [positionResult] = await db.query(
        "SELECT COALESCE(MAX(position), 0) as max_pos FROM cards WHERE column_id = ?",
        [columnId]
      );
      const newPosition = positionResult[0].max_pos + 1;

      // Insert the new card
      const [insertResult] = await db.query(
        `INSERT INTO cards (column_id, user_id, card_title, name, priority, job, description, position) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          columnId,
          userId,
          cardData.card_title,
          cardData.name || null,
          cardData.priority || "Medium",
          cardData.job || null,
          cardData.description || null,
          newPosition,
        ]
      );

      console.log("✅ Card added successfully");
      callback(null, {
        success: true,
        cardId: insertResult.insertId,
        message: "Card added successfully",
      });
    } catch (error) {
      console.error("❌ Error adding card:", error.message);
      callback(error, null);
    }
  },

  // Update a card
  updateCard: async (cardId, cardData, userId, callback) => {
    try {
      console.log("➡️ Updating card");
      console.log("📝 Card ID:", cardId);
      console.log("👤 User ID:", userId);

      // Input validation
      if (!cardId || !cardData) {
        throw new Error("Card ID and card data are required");
      }

      // Verify card exists and is part of main board
      const [cardCheck] = await db.query(
        `SELECT c.id FROM cards c
         JOIN columns col ON c.column_id = col.id
         WHERE c.id = ? AND col.board_id = 1`,
        [cardId]
      );

      if (!cardCheck.length) {
        return callback(null, {
          success: false,
          message: "Card not found or not part of main board",
        });
      }

      // Update the card
      await db.query(
        `UPDATE cards 
         SET card_title = ?, 
             name = ?, 
             priority = ?, 
             job = ?, 
             description = ?
         WHERE id = ?`,
        [
          cardData.card_title,
          cardData.name || null,
          cardData.priority || "Medium",
          cardData.job || null,
          cardData.description || null,
          cardId,
        ]
      );

      console.log("✅ Card updated successfully");
      callback(null, {
        success: true,
        message: "Card updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating card:", error.message);
      callback(error, null);
    }
  },

  // Delete a card
  deleteCard: async (cardId, callback) => {
    try {
      console.log("➡️ Deleting card");
      console.log("📝 Card ID:", cardId);

      // Input validation
      if (!cardId) {
        throw new Error("Card ID is required");
      }

      // Verify card exists and is part of main board
      const [cardCheck] = await db.query(
        `SELECT c.id, c.position, c.column_id FROM cards c
         JOIN columns col ON c.column_id = col.id
         WHERE c.id = ? AND col.board_id = 1`,
        [cardId]
      );

      if (!cardCheck.length) {
        return callback(null, {
          success: false,
          message: "Card not found or not part of main board",
        });
      }

      const deletedPosition = cardCheck[0].position;
      const columnId = cardCheck[0].column_id;

      // Delete the card
      await db.query("DELETE FROM cards WHERE id = ?", [cardId]);

      // Update positions of remaining cards in the same column
      await db.query(
        "UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?",
        [columnId, deletedPosition]
      );

      console.log("✅ Card deleted successfully");
      callback(null, {
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting card:", error.message);
      callback(error, null);
    }
  },

  // Move a card between columns
  moveCard: async (cardId, newColumnId, newPosition, callback) => {
    let connection;
    try {
      console.log("➡️ Moving card");
      console.log("📝 Card ID:", cardId);
      console.log("📝 New column ID:", newColumnId);
      console.log("📝 New position:", newPosition);

      // Validate inputs
      if (!cardId || !newColumnId || newPosition === undefined) {
        throw new Error(
          "Card ID, new column ID, and new position are required"
        );
      }

      // Start transaction
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Verify card exists and is part of main board
      const [cardCheck] = await connection.query(
        `SELECT c.id, c.column_id, c.position 
         FROM cards c
         JOIN columns col ON c.column_id = col.id
         WHERE c.id = ? AND col.board_id = 1`,
        [cardId]
      );

      if (!cardCheck.length) {
        await connection.rollback();
        connection.release();
        return callback(null, {
          success: false,
          message: "Card not found or not part of main board",
        });
      }

      const oldColumnId = cardCheck[0].column_id;
      const oldPosition = cardCheck[0].position;

      // Verify new column exists and is part of main board
      const [columnCheck] = await connection.query(
        "SELECT id FROM columns WHERE id = ? AND board_id = 1",
        [newColumnId]
      );

      if (!columnCheck.length) {
        await connection.rollback();
        connection.release();
        return callback(null, {
          success: false,
          message: "Target column not found or not part of main board",
        });
      }

      // If moving within the same column
      if (oldColumnId === parseInt(newColumnId)) {
        if (oldPosition < newPosition) {
          // Moving down - shift cards between old and new positions up
          await connection.query(
            `UPDATE cards 
             SET position = position - 1
             WHERE column_id = ? AND position > ? AND position <= ?`,
            [oldColumnId, oldPosition, newPosition]
          );
        } else if (oldPosition > newPosition) {
          // Moving up - shift cards between new and old positions down
          await connection.query(
            `UPDATE cards 
             SET position = position + 1
             WHERE column_id = ? AND position >= ? AND position < ?`,
            [oldColumnId, newPosition, oldPosition]
          );
        }
      } else {
        // Moving to different column
        // 1. Shift cards in old column up to fill the gap
        await connection.query(
          `UPDATE cards 
           SET position = position - 1
           WHERE column_id = ? AND position > ?`,
          [oldColumnId, oldPosition]
        );

        // 2. Shift cards in new column down to make space
        await connection.query(
          `UPDATE cards 
           SET position = position + 1
           WHERE column_id = ? AND position >= ?`,
          [newColumnId, newPosition]
        );
      }

      // Update the card's column and position
      await connection.query(
        `UPDATE cards SET column_id = ?, position = ? WHERE id = ?`,
        [newColumnId, newPosition, cardId]
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      console.log("✅ Card moved successfully");
      callback(null, {
        success: true,
        message: "Card moved successfully",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error("❌ Error moving card:", error.message);
      callback(error, null);
    }
  },
};

// Helper function to format board data
function formatBoardData(results) {
  // Return empty object if no results
  if (!results.length) return {};

  // Extract board info from first row
  const boardInfo = {
    id: results[0].id,
    board_name: results[0].board_name,
    created_at: results[0].created_at,
    columns: [],
  };

  const columnsMap = new Map();

  results.forEach((row) => {
    // Skip if no column data
    if (!row.column_id) return;

    // Add column if not already added
    if (!columnsMap.has(row.column_id)) {
      columnsMap.set(row.column_id, {
        id: row.column_id,
        column_name: row.column_name,
        position: row.column_position,
        cards: [],
      });
    }

    // Add card if exists
    if (row.card_id) {
      columnsMap.get(row.column_id).cards.push({
        id: row.card_id,
        title: row.card_title,
        name: row.name,
        priority: row.priority,
        job: row.job,
        description: row.description,
        position: row.card_position,
        user_id: row.user_id,
        username: row.username,
      });
    }
  });

  // Convert columns map to sorted array
  boardInfo.columns = Array.from(columnsMap.values())
    .sort((a, b) => a.position - b.position)
    .map((column) => ({
      ...column,
      cards: column.cards.sort((a, b) => a.position - b.position),
    }));

  return boardInfo;
}

module.exports = BoardModel;
