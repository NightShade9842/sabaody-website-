const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { owner } = req.query;
    try {
        const [rows] = await pool.execute('SELECT * FROM pokemon WHERE owner_id = ? ORDER BY level DESC', [owner]);
        return res.json(rows);
    } catch (err) {
        console.error('Pokemon API error:', err);
        return res.json([]);
    }
};