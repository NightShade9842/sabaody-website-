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
    if (!owner) return res.json([]);
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM inventory WHERE owner_id = ? AND quantity > 0 ORDER BY item_type',
            [owner]
        );
        return res.json(rows);
    } catch (err) {
        console.error('Inventory API error:', err);
        return res.json([]);
    }
};