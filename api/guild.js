const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { user } = req.query;
    try {
        const [rows] = await pool.execute(
            `SELECT g.*, p.guild_role FROM guilds g JOIN players p ON p.guild_id = g.id WHERE p.user_id = ?`, [user]);
        res.json(rows[0] || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
};