const express = require("express");
const cors = require("cors");
const app = express();
const port = 4000;
const userRoutes = require("./routes/Users/userRoutes");
const boardRoutes = require("./routes/Boards/boardRoutes");
const columnRoutes = require("./routes/Column/columnRoutes");
const cardRoutes = require("./routes/Cards/cardRoutes");

// Opsi CORS untuk mengizinkan hanya localhost:3000
const corsOptions = {
  origin: "http://localhost:3000",
  // origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Metode yang diizinkan
  credentials: true, // Izinkan cookies
  optionsSuccessStatus: 200, // Untuk beberapa versi lama browsers
};

// Middleware untuk mengizinkan CORS
app.use(cors(corsOptions));

// Middleware untuk parsing JSON
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api", boardRoutes);
app.use("/api", columnRoutes);
app.use("/api", cardRoutes);

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
