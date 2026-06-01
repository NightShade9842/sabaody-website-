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
    const { owner, limit } = req.query;
    let query = 'SELECT * FROM cards';
    const params = [];

    if (owner) {
        query += ' WHERE owner_id = ?';
        params.push(owner);
    }
    query += ' ORDER BY rarity_order DESC, card_name';
    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit, 10));
    }

    try {
        const [rows] = await pool.execute(query, params);
        return res.json(rows);
    } catch (err) {
        console.error('Cards API error:', err);
        return res.json([]);
    }
};