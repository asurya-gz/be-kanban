const mysql = require("mysql2");
require("dotenv").config();

// Buat pool koneksi ke database
const db = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Sesuaikan limit koneksi
    queueLimit: 0,
  })
  .promise(); // Tambahkan `.promise()` agar dapat menggunakan async/await

module.exports = db;
