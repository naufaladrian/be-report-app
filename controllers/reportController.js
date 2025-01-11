const { turso } = require("../database/turso");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getReports = async (req, res) => {
    const { latitude, longitude, radius } = req.query;

    if (latitude && longitude && radius) {
        const lat = Number(latitude);
        const lon = Number(longitude);
        const rad = Number(radius);

        if (isNaN(lat) || isNaN(lon) || isNaN(rad)) {
            return res.status(400).json({ error: "Invalid query parameters" });
        }

        const reports = await turso.execute({
            sql: `SELECT * FROM reports WHERE (latitude BETWEEN ? AND ?) AND (longitude BETWEEN ? AND ?)`,
            args: [lat - rad, lat + rad, lon - rad, lon + rad],
        });

        return res.json(reports.rows);
    }

    const allReports = await turso.execute("SELECT * FROM reports");
    res.json(allReports.rows);
};

const createReport = async (req, res) => {
    const { latitude, longitude, description, title } = req.body;

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "report_images",
    });

    await turso.execute({
        sql: `
            INSERT INTO reports (id, user_id, latitude, longitude, description, photo_url, title)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
            crypto.randomUUID(),
            req.user.id,
            parseFloat(latitude),
            parseFloat(longitude),
            description,
            uploadResult.secure_url,
            title,
        ],
    });

    res.json({ success: true });
};

module.exports = { getReports, createReport };
