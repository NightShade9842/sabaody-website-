// api/guild.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql.db.bot-hosting.net',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'u589445_TIgFM9UFfe',
    password: process.env.DB_PASSWORD || '9h5xn1.uo.HC3hQfku4Eib35',
    database: process.env.DB_NAME || 's589445_sabaody',
    waitForConnections: true,
    connectionLimit: 5,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { user } = req.query;

    if (!user) {
        return res.json({});                       // no user → empty object
    }

    try {
        const [rows] = await pool.execute(
            `SELECT g.*, p.guild_role
             FROM guilds g
             JOIN players p ON p.guild_id = g.id
             WHERE p.user_id = ?`,
            [user]
        );
        return res.json(rows[0] || {});            // always an object
    } catch (err) {
        console.error('Guild API error:', err);
        return res.json({});
    }
};