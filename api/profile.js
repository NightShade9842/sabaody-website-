// api/profile.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql.db.bot-hosting.net',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'u589445_TIgFM9UFfe',
    password: process.env.DB_PASSWORD || '9h5xn1.uo.HC3hQfku4Eib35',
    database: process.env.DB_NAME || 's589445_sabaody',
    waitForConnections: true,
    connectionLimit: 5,
});

module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Missing user ID. Provide ?id=233560806367@s.whatsapp.net' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM players WHERE user_id = ?',
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({
                error: 'User not found. Register in the bot first!\nUse .register <pirate name> in any group.',
            });
        }

        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Profile API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};