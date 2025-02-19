const UserModel = require("../../models/Users/userModel");

exports.registerUser = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Semua field harus diisi!" });
  }

  UserModel.createUser(email, password, username, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    res
      .status(201)
      .json({ message: "Registrasi berhasil!", userId: result.userId });
  });
};

// Login pengguna
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi!" });
  }

  UserModel.loginUser(email, password, (err, result) => {
    if (err) {
      console.error("Kesalahan server saat login:", err);
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    res.status(200).json({
      message: "Login berhasil!",
      user: result.user,
      token: result.token,
    });
  });
};

// Ganti password pengguna berdasarkan email dengan password default
exports.changePasswordByEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email wajib diisi!" });
  }

  UserModel.changePasswordByEmail(email, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    res.status(200).json({ message: result.message });
  });
};

// Mendapatkan semua pengguna
exports.getAllUsers = async (req, res) => {
  UserModel.getAllUsers((err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!result.success || result.users.length === 0) {
      return res.status(404).json({ message: "Tidak ada pengguna ditemukan." });
    }

    res.status(200).json({
      message: "Berhasil mendapatkan daftar pengguna.",
      users: result.users,
    });
  });
};

// Mendapatkan detail pengguna berdasarkan ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  UserModel.getUserById(id, (err, user) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Terjadi kesalahan pada server." });
    }

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    res.status(200).json(user);
  });
};

// Ubah password pengguna
exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Semua field harus diisi!" });
  }

  try {
    // Verifikasi password lama
    const isMatch = await UserModel.verifyPassword(email, oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Password lama salah." });
    }

    const result = await UserModel.changePassword(
      email,
      oldPassword,
      newPassword
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Hapus pengguna berdasarkan email
exports.deleteUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email wajib diisi!" });
  }

  UserModel.deleteUserByEmail(email, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    res.status(200).json(result);
  });
};
