const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { turso } = require("../database/turso");

const register = async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await turso.execute({
        sql: `INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)`,
        args: [crypto.randomUUID(), name, email, hashedPassword],
    });

    res.json({ success: true });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const result = await turso.execute({
        sql: "SELECT * FROM users WHERE email = ?",
        args: [email],
    });

    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, String(user.password_hash)))) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: String(user.id), email: String(user.email) },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
};

module.exports = { register, login };
