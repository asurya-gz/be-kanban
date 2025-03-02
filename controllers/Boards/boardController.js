const BoardModel = require("../../models/Boards/boardModel");

exports.getMainBoard = async (req, res) => {
  BoardModel.getMainBoard((err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil board utama:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Board utama tidak ditemukan." });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan board utama.",
      board: result.board,
    });
  });
};

exports.updateBoardName = async (req, res) => {
  const { boardName } = req.body;

  if (!boardName) {
    return res.status(400).json({ message: "Nama board harus diisi!" });
  }

  BoardModel.updateBoardName(boardName, (err, result) => {
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

exports.addColumn = async (req, res) => {
  const { columnName } = req.body;

  if (!columnName) {
    return res.status(400).json({ message: "Nama kolom harus diisi!" });
  }

  BoardModel.addColumn(columnName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menambah kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    res.status(201).json({
      message: "Kolom berhasil ditambahkan!",
      columnId: result.columnId,
      success: true,
    });
  });
};

exports.updateColumnName = async (req, res) => {
  const { columnId, columnName } = req.body;

  if (!columnId || !columnName) {
    return res
      .status(400)
      .json({ message: "ID kolom dan nama kolom harus diisi!" });
  }

  BoardModel.updateColumnName(columnId, columnName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate nama kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Nama kolom berhasil diupdate!",
      success: true,
    });
  });
};

exports.deleteColumn = async (req, res) => {
  const { columnId } = req.body;

  if (!columnId) {
    return res.status(400).json({ message: "ID kolom tidak valid!" });
  }

  BoardModel.deleteColumn(columnId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menghapus kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Kolom berhasil dihapus!",
      success: true,
    });
  });
};

exports.addCard = async (req, res) => {
  const { columnId, cardData, userId } = req.body;

  if (!columnId || !cardData) {
    return res
      .status(400)
      .json({ message: "ID kolom dan data kartu harus diisi!" });
  }

  BoardModel.addCard(columnId, cardData, userId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menambah kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(201).json({
      message: "Kartu berhasil ditambahkan!",
      cardId: result.cardId,
      success: true,
    });
  });
};

exports.updateCard = async (req, res) => {
  const { cardId, cardData, userId } = req.body;

  if (!cardId || !cardData) {
    return res
      .status(400)
      .json({ message: "ID kartu dan data kartu harus diisi!" });
  }

  BoardModel.updateCard(cardId, cardData, userId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Kartu berhasil diupdate!",
      success: true,
    });
  });
};

exports.deleteCard = async (req, res) => {
  const { cardId } = req.body;

  if (!cardId) {
    return res.status(400).json({ message: "ID kartu tidak valid!" });
  }

  BoardModel.deleteCard(cardId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menghapus kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Kartu berhasil dihapus!",
      success: true,
    });
  });
};

exports.moveCard = async (req, res) => {
  const { cardId, newColumnId, newPosition } = req.body;

  if (!cardId || !newColumnId || newPosition === undefined) {
    return res.status(400).json({
      message: "ID kartu, ID kolom baru, dan posisi baru harus diisi!",
    });
  }

  BoardModel.moveCard(cardId, newColumnId, newPosition, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat memindahkan kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({
      message: "Kartu berhasil dipindahkan!",
      success: true,
    });
  });
};
