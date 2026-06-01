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
    let query = '';

    switch (type) {
        case 'level':
            query = 'SELECT user_id, pirate_name, level, xp FROM players ORDER BY level DESC, xp DESC LIMIT 20';
            break;
        case 'richest':
            query = 'SELECT user_id, pirate_name, beli, bank, (beli+bank) AS total FROM players ORDER BY total DESC LIMIT 20';
            break;
        case 'legendary':
            query = `SELECT p.user_id, p.pirate_name, COUNT(c.id) AS count
                     FROM players p
                     LEFT JOIN cards c ON p.user_id = c.owner_id AND c.rarity IN ('t5','t6','tx')
                     GROUP BY p.user_id, p.pirate_name
                     ORDER BY count DESC LIMIT 20`;
            break;
        case 'guild':
            query = `SELECT name, treasury,
                     (SELECT COUNT(*) FROM players WHERE guild_id = g.id) AS members
                     FROM guilds g ORDER BY treasury DESC LIMIT 20`;
            break;
        default:
            return res.status(400).json({ error: 'Invalid type' });
    }

    try {
        const [rows] = await pool.execute(query);
        return res.json(rows);
    } catch (err) {
        console.error('Leaderboard API error:', err);
        return res.json([]);
    }
};