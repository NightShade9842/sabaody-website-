const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
});
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { type } = req.query;
    let query = '';
    if (type === 'level') query = 'SELECT user_id, pirate_name, level, xp FROM players ORDER BY level DESC, xp DESC LIMIT 20';
    else if (type === 'richest') query = 'SELECT user_id, pirate_name, beli, bank, (beli+bank) as total FROM players ORDER BY total DESC LIMIT 20';
    else if (type === 'legendary') query = `SELECT p.user_id, p.pirate_name, COUNT(c.id) as count FROM players p LEFT JOIN cards c ON p.user_id=c.owner_id AND c.rarity IN ('t5','t6','tx') GROUP BY p.user_id ORDER BY count DESC LIMIT 20`;
    else if (type === 'guild') query = 'SELECT name, treasury, (SELECT COUNT(*) FROM players WHERE guild_id=g.id) as members FROM guilds g ORDER BY treasury DESC LIMIT 20';
    else return res.status(400).json({ error: 'Invalid type' });
    try {
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};