const db = require("../../db");

const ColumnModel = {
  // Create new column
  createColumn: async (boardId, columnName, callback) => {
    try {
      console.log("➡️ Creating column for board:", boardId);
      console.log("📝 Column name:", columnName);

      if (!boardId || !columnName) {
        throw new Error("Board ID and column name are required");
      }

      // Get current max position for the board
      const [existingColumns] = await db.query(
        "SELECT position FROM columns WHERE board_id = ? ORDER BY position DESC LIMIT 1",
        [boardId]
      );

      // Calculate new position
      const newPosition = existingColumns.length
        ? existingColumns[0].position + 1
        : 1;

      const [result] = await db.query(
        "INSERT INTO columns (board_id, column_name, position) VALUES (?, ?, ?)",
        [boardId, columnName, newPosition]
      );

      console.log("✅ Column created successfully, ID:", result.insertId);
      callback(null, {
        success: true,
        columnId: result.insertId,
        position: newPosition,
      });
    } catch (error) {
      console.error("❌ Error creating column:", error.message);
      callback(error, null);
    }
  },

  // Get all columns for a board
  getBoardColumns: async (boardId, callback) => {
    try {
      console.log("➡️ Getting columns for board:", boardId);

      const [columns] = await db.query(
        "SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC",
        [boardId]
      );

      console.log("✅ Columns retrieved successfully");
      callback(null, { success: true, columns });
    } catch (error) {
      console.error("❌ Error getting columns:", error.message);
      callback(error, null);
    }
  },

  // Update column
  updateColumn: async (columnId, columnName, callback) => {
    try {
      console.log("➡️ Updating column:", columnId);

      const [result] = await db.query(
        "UPDATE columns SET column_name = ? WHERE id = ?",
        [columnName, columnId]
      );

      if (result.affectedRows === 0) {
        return callback(null, { success: false, message: "Column not found" });
      }

      console.log("✅ Column updated successfully");
      callback(null, { success: true });
    } catch (error) {
      console.error("❌ Error updating column:", error.message);
      callback(error, null);
    }
  },

  // Delete column
  deleteColumn: async (columnId, callback) => {
    try {
      console.log("➡️ Deleting column:", columnId);

      // First, get the column details to know its position and board_id
      const [column] = await db.query(
        "SELECT board_id, position FROM columns WHERE id = ?",
        [columnId]
      );

      if (!column.length) {
        return callback(null, { success: false, message: "Column not found" });
      }

      // Start transaction
      await db.query("START TRANSACTION");

      // Delete the column
      await db.query("DELETE FROM columns WHERE id = ?", [columnId]);

      // Update positions of remaining columns
      await db.query(
        `UPDATE columns 
         SET position = position - 1 
         WHERE board_id = ? AND position > ?`,
        [column[0].board_id, column[0].position]
      );

      // Commit transaction
      await db.query("COMMIT");

      console.log("✅ Column deleted successfully");
      callback(null, { success: true });
    } catch (error) {
      // Rollback in case of error
      await db.query("ROLLBACK");
      console.error("❌ Error deleting column:", error.message);
      callback(error, null);
    }
  },

  // Update column positions
  updateColumnPosition: async (columnId, newPosition, callback) => {
    try {
      console.log("➡️ Updating column position:", columnId, "to", newPosition);

      // Get current column info
      const [column] = await db.query(
        "SELECT board_id, position FROM columns WHERE id = ?",
        [columnId]
      );

      if (!column.length) {
        return callback(null, { success: false, message: "Column not found" });
      }

      const oldPosition = column[0].position;
      const boardId = column[0].board_id;

      // Start transaction
      await db.query("START TRANSACTION");

      if (newPosition > oldPosition) {
        // Moving right: decrease positions of columns in between
        await db.query(
          `UPDATE columns 
           SET position = position - 1 
           WHERE board_id = ? AND position > ? AND position <= ?`,
          [boardId, oldPosition, newPosition]
        );
      } else {
        // Moving left: increase positions of columns in between
        await db.query(
          `UPDATE columns 
           SET position = position + 1 
           WHERE board_id = ? AND position >= ? AND position < ?`,
          [boardId, newPosition, oldPosition]
        );
      }

      // Update position of the moved column
      await db.query("UPDATE columns SET position = ? WHERE id = ?", [
        newPosition,
        columnId,
      ]);

      // Commit transaction
      await db.query("COMMIT");

      console.log("✅ Column position updated successfully");
      callback(null, { success: true });
    } catch (error) {
      // Rollback in case of error
      await db.query("ROLLBACK");
      console.error("❌ Error updating column position:", error.message);
      callback(error, null);
    }
  },
};

module.exports = ColumnModel;
