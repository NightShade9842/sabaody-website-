const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { type } = req.query;
    const tables = { players: 'players', cards: 'cards', pokemon: 'pokemon', guilds: 'guilds' };
    if (!tables[type]) return res.status(400).json({ error: 'Invalid type' });
    try {
        const [[{ count }]] = await pool.execute(`SELECT COUNT(*) as count FROM ${tables[type]}`);
        res.json({ count });
    } catch (err) { res.status(500).json({ error: err.message }); }
};