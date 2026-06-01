const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { owner, limit } = req.query;
    let query = 'SELECT * FROM cards';
    const params = [];
    if (owner) { query += ' WHERE owner_id = ?'; params.push(owner); }
    query += ' ORDER BY rarity_order DESC, card_name';
    if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
    try {
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};