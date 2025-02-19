const db = require("../../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserModel = {
  createUser: async (email, password, username, callback) => {
    try {
      console.log("➡️ Debugging createUser function:");
      console.log("📩 Email:", email);
      console.log("🔑 Password:", password);
      console.log("🎭 Username:", username);

      // Pastikan semua input ada
      if (!email || !password || !username) {
        throw new Error("Email, password, username harus diisi.");
      }

      const emailStr = email.toLowerCase();
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log("📩 Email (Processed):", emailStr);
      console.log("🔒 Hashed Password:", hashedPassword);

      // Cek apakah email sudah terdaftar
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [emailStr]
      );
      console.log("🔍 Cek existingUsers:", existingUsers);

      if (existingUsers.length > 0) {
        throw new Error("Email sudah terdaftar.");
      }

      // Masukkan user ke database
      const [result] = await db.query(
        "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
        [emailStr, hashedPassword, username]
      );

      console.log("✅ Insert Success, User ID:", result.insertId);
      callback(null, { success: true, userId: result.insertId });
    } catch (error) {
      console.error("❌ Error:", error.message);
      if (callback && typeof callback === "function") {
        callback(error, null);
      }
    }
  },

  loginUser: async (email, password, callback) => {
    try {
      console.log("Masuk ke fungsi loginUser");

      if (!email || !password) {
        console.error("Email atau password kosong.");
        return callback(null, {
          success: false,
          message: "Email dan password harus diisi!",
        });
      }

      console.log("Mencari pengguna dengan email:", email.toLowerCase());

      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
        email.toLowerCase(),
      ]);

      if (users.length === 0) {
        console.error("Pengguna tidak ditemukan dengan email:", email);
        return callback(null, {
          success: false,
          message: "Email atau password salah.",
        });
      }

      const user = users[0];

      console.log("Pengguna ditemukan:", user);

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.error(
          "Password tidak cocok untuk pengguna dengan email:",
          email
        );
        return callback(null, {
          success: false,
          message: "Email atau password salah.",
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1h" }
      );

      console.log("Token dibuat:", token);

      delete user.password; // Hapus password dari objek user
      callback(null, { success: true, user, token });
    } catch (error) {
      console.error("Terjadi error:", error.message);
      callback(error, null);
    }
  },

  changePassword: async (email, oldPassword, newPassword) => {
    try {
      if (!email || !oldPassword || !newPassword) {
        throw new Error("Email, password lama, dan password baru harus diisi.");
      }
  
      // Ambil data user dari database
      const [rows] = await db.query(
        "SELECT password FROM users WHERE email = ?",
        [email.toLowerCase()]
      );
  
      if (rows.length === 0) {
        throw new Error("Email tidak ditemukan.");
      }
  
      const storedPassword = rows[0].password;
  
      // Verifikasi password lama
      const isMatch = await bcrypt.compare(oldPassword, storedPassword);
      if (!isMatch) {
        throw new Error("Password lama salah.");
      }
  
      // Hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // Update password di database
      const [result] = await db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hashedPassword, email.toLowerCase()]
      );
  
      if (result.affectedRows === 0) {
        throw new Error("Gagal mengubah password.");
      }
  
      return { success: true, message: "Password berhasil diubah." };
    } catch (error) {
      throw error;
    }
  },
  

  changePasswordByEmail: async (email, callback) => {
    try {
      if (!email) {
        throw new Error("Email harus diisi.");
      }

      // Password default
      const defaultPassword = "kateguhan123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Update password di database berdasarkan email
      const [result] = await db.query(
        "UPDATE users SET password = ? WHERE email = ?",
        [hashedPassword, email.toLowerCase()]
      );

      // Cek jika tidak ada baris yang terpengaruh (email tidak ditemukan)
      if (result.affectedRows === 0) {
        throw new Error("Email tidak ditemukan.");
      }

      // Kirimkan respon sukses ke callback
      callback(null, { success: true, message: "Password berhasil diubah." });
    } catch (error) {
      // Tangani error dan kirim ke callback
      console.error("❌ Error:", error.message);
      callback(error, null);
    }
  },

  verifyPassword: async (email, oldPassword) => {
    try {
      const [results] = await db.query(
        "SELECT password FROM users WHERE email = ?",
        [email.toLowerCase()]
      );

      if (results.length === 0) {
        throw new Error("Email tidak ditemukan.");
      }

      const isMatch = await bcrypt.compare(oldPassword, results[0].password);
      return isMatch;
    } catch (error) {
      throw error;
    }
  },

  getAllUsers: async (callback) => {
    try {
      // Query untuk mengambil semua pengguna dari tabel users
      const [users] = await db.query(
        "SELECT id, email, role, nama, created_at FROM users"
      );

      // Mengecek apakah data ditemukan
      if (users.length === 0) {
        throw new Error("Tidak ada pengguna ditemukan.");
      }

      // Kembalikan data pengguna
      callback(null, { success: true, users });
    } catch (error) {
      console.error("❌ Error:", error.message);
      callback(error, null);
    }
  },

  deleteUserByEmail: async (email, callback) => {
    try {
      if (!email) {
        throw new Error("Email harus diisi.");
      }

      const [result] = await db.query("DELETE FROM users WHERE email = ?", [
        email.toLowerCase(),
      ]);

      if (result.affectedRows === 0) {
        throw new Error("Email tidak ditemukan.");
      }

      callback(null, { success: true, message: "Pengguna berhasil dihapus." });
    } catch (error) {
      callback(error, null);
    }
  },
};

module.exports = UserModel;
