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
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, pl.pirate_name AS owner_name
             FROM pokemon p
             LEFT JOIN players pl ON p.owner_id = pl.user_id
             ORDER BY p.level DESC, p.pokemon_name`
        );
        return res.json(rows);
    } catch (err) {
        console.error('Pokemon-all API error:', err);
        return res.json([]);
    }
};