const express = require("express");
const router = express.Router();
const columnRoutes = require("../../controllers/Column/columnController");

router.post("/getbyid-column", columnRoutes.getBoardColumns);
router.post("/create-column", columnRoutes.createColumn);
router.delete("/delete-column", columnRoutes.deleteColumn);
router.put("/update-column", columnRoutes.updateColumn);

module.exports = router;
