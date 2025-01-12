require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const multer = require('multer');
const { register, login } = require("../controllers/authController");
const { getReports, createReport, getReportById, updateReportStatus, deleteReport } = require("../controllers/reportController");
const { getMessage, postMessage } = require("../controllers/messageController");
const jwtMiddleware = require("../middlewares/jwtMiddleware");


const app = express();

app.use(cors(
    {
        origin: 'http://localhost:5173',
        allowedHeaders: ['Content-Type', 'Authorization'],
    }
));
app.use(bodyParser.json());

const storage = multer.memoryStorage(); // Menggunakan memori untuk file sementara
const upload = multer({ storage });
// Routes
app.get("/", (req, res) => {
    res.send("Hello World");
})
app.post("/auth/register", register);
app.post("/auth/login", login);

app.get("/reports", getReports);
app.post("/reports", upload.single('image'), jwtMiddleware, createReport);
app.get('/reports/:id', getReportById);
app.put('/reports/:id/status', updateReportStatus);
app.delete('/reports/:id', deleteReport);

app.get("/message", getMessage);
app.post("/message", postMessage);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
