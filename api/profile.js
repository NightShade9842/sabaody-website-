const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, waitForConnections: true
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing user ID' });
    try {
        const [rows] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [id]);
        if (!rows.length) return res.status(404).json({ error: 'User not found. Register in the bot first!' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};