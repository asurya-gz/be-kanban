const db = require("../../db");

const BoardModel = {
  // Get all boards with columns and cards for a specific user
  getUserBoards: async (userId, callback) => {
    try {
      console.log("➡️ Getting boards for user:", userId);

      const [boards] = await db.query(
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
                card.position as card_position
         FROM boards b
         LEFT JOIN columns c ON b.id = c.board_id
         LEFT JOIN cards card ON c.id = card.column_id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC, c.position ASC, card.position ASC`,
        [userId]
      );

      if (!boards.length) {
        console.log("📝 No boards found for user:", userId);
        return callback(null, { success: true, boards: [] });
      }

      const formattedBoards = formatBoardData(boards);
      console.log("✅ Boards retrieved successfully");
      callback(null, { success: true, boards: formattedBoards });
    } catch (error) {
      console.error("❌ Error getting boards:", error.message);
      callback(error, null);
    }
  },

  // Create new board
  createBoard: async (userId, boardName, callback) => {
    try {
      console.log("➡️ Creating board for user:", userId);
      console.log("📝 Board name:", boardName);

      if (!userId || !boardName) {
        throw new Error("User ID and board name are required");
      }

      const [result] = await db.query(
        "INSERT INTO boards (user_id, board_name) VALUES (?, ?)",
        [userId, boardName]
      );

      console.log("✅ Board created successfully, ID:", result.insertId);
      callback(null, { success: true, boardId: result.insertId });
    } catch (error) {
      console.error("❌ Error creating board:", error.message);
      callback(error, null);
    }
  },

  // Get single board with all details
  getBoardDetails: async (boardId, userId, callback) => {
    try {
      console.log("➡️ Getting board details:", boardId);
      console.log("👤 For user:", userId);

      const [board] = await db.query(
        `SELECT b.*, 
                c.id as column_id, 
                c.column_name, 
                c.position as column_position,
                card.id as card_id,
                card.card_title,
                card.priority,
                card.job,
                card.description,
                card.position as card_position
         FROM boards b
         LEFT JOIN columns c ON b.id = c.board_id
         LEFT JOIN cards card ON c.id = card.column_id
         WHERE b.id = ? AND b.user_id = ?`,
        [boardId, userId]
      );

      if (!board.length) {
        return callback(null, { success: false, message: "Board not found" });
      }

      const formattedBoard = formatBoardData([...board])[0];
      console.log("✅ Board details retrieved successfully");
      callback(null, { success: true, board: formattedBoard });
    } catch (error) {
      console.error("❌ Error getting board details:", error.message);
      callback(error, null);
    }
  },

  deleteBoard: async (board) => {
    let connection;
    try {
      const boardId = parseInt(board.boardId);
      const userId = parseInt(board.userId);

      console.log("➡️ Deleting board for boardId:", boardId);
      console.log("👤 For userId:", userId);

      // Validate inputs
      if (!boardId || !userId) {
        throw new Error("Invalid board ID or user ID");
      }

      // Start transaction
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Verify board ownership with parameterized query
      const [boardExists] = await connection.query(
        "SELECT id FROM boards WHERE id = ? AND user_id = ?",
        [boardId, userId]
      );

      if (boardExists.length === 0) {
        await connection.rollback();
        connection.release();
        return {
          success: false,
          message: "Board not found or unauthorized",
        };
      }

      // Get all columns for this board
      const [columns] = await connection.query(
        "SELECT id FROM columns WHERE board_id = ?",
        [boardId]
      );

      // Delete all cards from all columns
      if (columns.length > 0) {
        const columnIds = columns.map((col) => col.id);
        await connection.query("DELETE FROM cards WHERE column_id IN (?)", [
          columnIds,
        ]);
      }

      // Delete all columns
      await connection.query("DELETE FROM columns WHERE board_id = ?", [
        boardId,
      ]);

      // Delete the board
      await connection.query(
        "DELETE FROM boards WHERE id = ? AND user_id = ?",
        [boardId, userId]
      );

      // Commit transaction
      await connection.commit();
      connection.release();

      console.log("✅ Board and associated data deleted successfully");
      return {
        success: true,
        message: "Board deleted successfully",
      };
    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error("❌ Error deleting board:", error.message);
      throw error;
    }
  },
  updateBoardName: async (boardId, userId, newBoardName, callback) => {
    try {
      console.log("➡️ Updating board name");
      console.log("📝 Board ID:", boardId);
      console.log("👤 User ID:", userId);
      console.log("📝 New board name:", newBoardName);

      // Input validation
      if (!boardId || !userId || !newBoardName) {
        throw new Error("Board ID, user ID, and new board name are required");
      }

      // Update board name with user verification
      const [result] = await db.query(
        "UPDATE boards SET board_name = ? WHERE id = ? AND user_id = ?",
        [newBoardName, boardId, userId]
      );

      if (result.affectedRows === 0) {
        console.log("❌ Board not found or unauthorized");
        return callback(null, {
          success: false,
          message: "Board not found or unauthorized",
        });
      }

      console.log("✅ Board name updated successfully");
      callback(null, {
        success: true,
        message: "Board name updated successfully",
      });
    } catch (error) {
      console.error("❌ Error updating board name:", error.message);
      callback(error, null);
    }
  },
};

// Helper function to format board data
function formatBoardData(results) {
  const boardsMap = new Map();

  results.forEach((row) => {
    const boardId = row.id;

    // Initialize board if not exists
    if (!boardsMap.has(boardId)) {
      boardsMap.set(boardId, {
        id: boardId,
        board_name: row.board_name,
        created_at: row.created_at,
        columns: new Map(),
      });
    }

    const board = boardsMap.get(boardId);

    // Skip if no columns
    if (!row.column_id) return;

    // Initialize column if not exists
    if (!board.columns.has(row.column_id)) {
      board.columns.set(row.column_id, {
        id: row.column_id,
        column_name: row.column_name,
        position: row.column_position,
        cards: [],
      });
    }

    // Add card if exists
    if (row.card_id) {
      board.columns.get(row.column_id).cards.push({
        id: row.card_id,
        title: row.card_title,
        name: row.name, // Tambahkan name di sini
        priority: row.priority,
        job: row.job,
        description: row.description,
        position: row.card_position,
      });
    }
  });

  // Convert Maps to arrays and sort
  return Array.from(boardsMap.values()).map((board) => {
    return {
      ...board,
      columns: Array.from(board.columns.values())
        .sort((a, b) => a.position - b.position)
        .map((column) => ({
          ...column,
          cards: column.cards.sort((a, b) => a.position - b.position),
        })),
    };
  });
}

module.exports = BoardModel;
