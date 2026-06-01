const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
        const [rows] = await pool.execute('SELECT * FROM store_items ORDER BY id');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};