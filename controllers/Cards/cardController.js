const CardModel = require("../../models/Cards/cardModel");

exports.createCard = async (req, res) => {
  const { columnId, cardTitle, priority, description, name, job } = req.body;

  if (!columnId || !cardTitle) {
    return res
      .status(400)
      .json({ message: "Column ID dan judul kartu harus diisi!" });
  }

  CardModel.createCard(
    columnId,
    cardTitle,
    priority,
    description,
    name,
    job,
    (err, result) => {
      if (err) {
        console.error("Kesalahan server saat membuat kartu:", err);
        return res
          .status(500)
          .json({ message: "Terjadi kesalahan pada server." });
      }

      res.status(201).json({
        message: "Kartu berhasil dibuat!",
        cardId: result.cardId,
        position: result.position,
      });
    }
  );
};

exports.getColumnCards = async (req, res) => {
  const { columnId } = req.params;

  if (!columnId) {
    return res.status(400).json({ message: "Column ID tidak valid!" });
  }

  CardModel.getColumnCards(columnId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success || result.cards.length === 0) {
      return res.status(200).json({
        message: "Belum ada kartu yang dibuat untuk kolom ini.",
        cards: [],
      });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan daftar kartu.",
      cards: result.cards,
    });
  });
};

exports.getCardById = async (req, res) => {
  const { cardId } = req.body;

  if (!cardId) {
    return res.status(400).json({ message: "Card ID tidak valid!" });
  }

  CardModel.getCardById(cardId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kartu tidak ditemukan." });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan detail kartu.",
      card: result.card,
    });
  });
};

exports.updateCard = async (req, res) => {
  const { cardId, card_title, priority, description, name, job } = req.body;

  if (!cardId) {
    return res.status(400).json({ message: "Card ID tidak valid!" });
  }

  // Collect update data
  const updateData = {};

  if (card_title !== undefined) updateData.card_title = card_title;
  if (priority !== undefined) updateData.priority = priority;
  if (description !== undefined) updateData.description = description;
  if (name !== undefined) updateData.name = name;
  if (job !== undefined) updateData.job = job;

  CardModel.updateCard(cardId, updateData, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kartu tidak ditemukan." });
    }

    res.status(200).json({
      message: "Kartu berhasil diupdate!",
      updatedCard: result.updatedCard, // Kirim data terbaru ke frontend
    });
  });
};

exports.deleteCard = async (req, res) => {
  const { cardId } = req.body;

  if (!cardId) {
    return res.status(400).json({ message: "Card ID tidak valid!" });
  }

  CardModel.deleteCard(cardId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menghapus kartu:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kartu tidak ditemukan." });
    }

    res.status(200).json({
      message: "Kartu berhasil dihapus!",
    });
  });
};

exports.updateCardPosition = async (req, res) => {
  const { cardId, newColumnId, newPosition } = req.body;

  if (!cardId || !newColumnId || newPosition === undefined) {
    return res.status(400).json({
      message: "Card ID, Column ID baru, dan posisi baru harus diisi!",
    });
  }

  CardModel.updateCardPosition(
    cardId,
    newColumnId,
    newPosition,
    (err, result) => {
      if (err) {
        console.error("Kesalahan server saat mengupdate posisi kartu:", err);
        return res
          .status(500)
          .json({ message: "Terjadi kesalahan pada server." });
      }

      if (!result.success) {
        return res.status(404).json({ message: "Kartu tidak ditemukan." });
      }

      res.status(200).json({
        message: "Posisi kartu berhasil diupdate!",
      });
    }
  );
};

exports.getFilteredCards = async (req, res) => {
  // Extract filter parameters from query
  const { name, priority, job, column_id } = req.query;

  // Build filter object
  const filters = {};
  if (name) filters.name = name;
  if (priority) filters.priority = priority;
  if (job) filters.job = job;
  if (column_id) filters.column_id = column_id;

  CardModel.getCards(filters, (err, result) => {
    if (err) {
      console.error(
        "Kesalahan server saat mengambil kartu dengan filter:",
        err
      );
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan daftar kartu.",
      cards: result.cards,
    });
  });
};
