const BoardModel = require("../../models/Boards/boardModel");

exports.getUserBoards = async (req, res) => {
  const { userId } = req.body; // Ambil hanya userId

  if (!userId) {
    return res.status(400).json({ message: "User ID tidak valid!" });
  }

  BoardModel.getUserBoards(userId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil boards:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success || result.boards.length === 0) {
      return res.status(200).json({
        message: "Belum ada board yang dibuat.",
        boards: [],
      });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan daftar board.",
      boards: result.boards,
    });
  });
};

exports.createBoard = async (req, res) => {
  const { userId } = req.body;
  const { boardName } = req.body;

  if (!boardName) {
    return res.status(400).json({ message: "Nama board harus diisi!" });
  }

  BoardModel.createBoard(userId, boardName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat membuat board:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    res.status(201).json({
      message: "Board berhasil dibuat!",
      boardId: result.boardId,
    });
  });
};

exports.getBoardDetails = async (req, res) => {
  const userId = req.req.body;
  const boardId = req.req.body;

  if (!boardId) {
    return res.status(400).json({ message: "Board ID tidak valid!" });
  }

  BoardModel.getBoardDetails(boardId, userId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil detail board:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Board tidak ditemukan." });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan detail board.",
      board: result.board,
    });
  });
};

// Controller fix
exports.deleteBoard = async (req, res) => {
  const { userId, boardId } = req.body; // Destructure properly from req.body

  if (!boardId || !userId) {
    return res
      .status(400)
      .json({ message: "Board ID atau User ID tidak valid!" });
  }

  try {
    const result = await BoardModel.deleteBoard({ boardId, userId });

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Board berhasil dihapus!",
      success: true,
    });
  } catch (error) {
    console.error("Kesalahan server saat menghapus board:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
      success: false,
    });
  }
};

exports.updateBoardName = async (req, res) => {
  const { userId, boardId, boardName } = req.body;

  if (!boardId || !boardName) {
    return res
      .status(400)
      .json({ message: "Board ID dan nama board harus diisi!" });
  }

  BoardModel.updateBoardName(boardId, userId, boardName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate nama board:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Nama board berhasil diupdate!",
      success: true,
    });
  });
};
