const ColumnModel = require("../../models/Column/columnModel");

exports.createColumn = async (req, res) => {
  const { boardId, columnName } = req.body;

  if (!boardId || !columnName) {
    return res
      .status(400)
      .json({ message: "Board ID dan nama kolom harus diisi!" });
  }

  ColumnModel.createColumn(boardId, columnName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat membuat kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    res.status(201).json({
      message: "Kolom berhasil dibuat!",
      columnId: result.columnId,
      position: result.position,
    });
  });
};

exports.getBoardColumns = async (req, res) => {
  const { boardId } = req.body;

  if (!boardId) {
    return res.status(400).json({ message: "Board ID tidak valid!" });
  }

  ColumnModel.getBoardColumns(boardId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengambil kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success || result.columns.length === 0) {
      return res.status(200).json({
        message: "Belum ada kolom yang dibuat.",
        columns: [],
      });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan daftar kolom.",
      columns: result.columns,
    });
  });
};

exports.updateColumn = async (req, res) => {
  const { columnId, columnName } = req.body;

  if (!columnId || !columnName) {
    return res
      .status(400)
      .json({ message: "Column ID dan nama kolom harus diisi!" });
  }

  ColumnModel.updateColumn(columnId, columnName, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kolom tidak ditemukan." });
    }

    res.status(200).json({
      message: "Kolom berhasil diupdate!",
    });
  });
};

exports.deleteColumn = async (req, res) => {
  const { columnId } = req.body;

  if (!columnId) {
    return res.status(400).json({ message: "Column ID tidak valid!" });
  }

  ColumnModel.deleteColumn(columnId, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat menghapus kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kolom tidak ditemukan." });
    }

    res.status(200).json({
      message: "Kolom berhasil dihapus!",
    });
  });
};

exports.updateColumnPosition = async (req, res) => {
  const { columnId, newPosition } = req.body;

  if (!columnId || newPosition === undefined) {
    return res
      .status(400)
      .json({ message: "Column ID dan posisi baru harus diisi!" });
  }

  ColumnModel.updateColumnPosition(columnId, newPosition, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat mengupdate posisi kolom:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(404).json({ message: "Kolom tidak ditemukan." });
    }

    res.status(200).json({
      message: "Posisi kolom berhasil diupdate!",
    });
  });
};
