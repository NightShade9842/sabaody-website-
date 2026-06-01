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
    const { type } = req.query;
    const tables = { players: 'players', cards: 'cards', pokemon: 'pokemon', guilds: 'guilds' };
    if (!tables[type]) return res.status(400).json({ error: 'Invalid type' });

    try {
        const [[{ count }]] = await pool.execute(`SELECT COUNT(*) AS count FROM ${tables[type]}`);
        return res.json({ count });
    } catch (err) {
        console.error('Stats API error:', err);
        return res.json({ count: 0 });
    }
};