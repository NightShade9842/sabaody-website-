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
    const { user } = req.query;
    if (!user) return res.json({});
    try {
        const [rows] = await pool.execute(
            `SELECT g.*, p.guild_role
             FROM guilds g
             JOIN players p ON p.guild_id = g.id
             WHERE p.user_id = ?`,
            [user]
        );
        return res.json(rows[0] || {});
    } catch (err) {
        console.error('Guild API error:', err);
        return res.json({});
    }
};