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
    const file = req.file;

    if (!latitude) {
        return res.status(400).json({ error: "Missing lat" });
    }

    if (!longitude) {
        return res.status(400).json({ error: "Missing lon" });
    }

    if (!description) {
        return res.status(400).json({ error: "Missing description" });
    }

    if (!title) {
        return res.status(400).json({ error: "Missing title" });
    }

    if (!file) {
        return res.status(400).json({ error: "Missing image file" });
    }

    const options = {
        public_id: `report_images/report_${Date.now()}`,
        folder: 'report_images',
        unique_filename: true,
        use_filename: true,
    };

    const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(file.buffer);
    });

    console.log('Image uploaded to Cloudinary:', uploadResult.secure_url);


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

const getReportById = async (req, res) => {
    const { id } = req.params;

    const report = await turso.execute({
        sql: `SELECT * FROM reports WHERE id = ?`,
        args: [id],
    });

    if (report.rows.length === 0) {
        return res.status(404).json({ error: "Report not found" });
    }

    res.json(report.rows[0]);
};

const updateReportStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "Missing status" });
    }

    const validStatuses = ["new", "progress", "resolved"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    await turso.execute({
        sql: `UPDATE reports SET status = ? WHERE id = ?`,
        args: [status, id],
    });

    res.json({ success: true });
};

const deleteReport = async (req, res) => {
    const { id } = req.params;

    const result = await turso.execute({
        sql: `DELETE FROM reports WHERE id = ?`,
        args: [id],
    });

    if (result.rowCount === 0) {
        return res.status(404).json({ error: "Report not found" });
    }

    res.json({ success: true });
};

module.exports = { getReports, createReport, getReportById, updateReportStatus, deleteReport };
