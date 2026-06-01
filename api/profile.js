// api/profile.js
const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql.db.bot-hosting.net',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'u589445_TIgFM9UFfe',
    password: process.env.DB_PASSWORD || '9h5xn1.uo.HC3hQfku4Eib35',
    database: process.env.DB_NAME || 's589445_sabaody',
    waitForConnections: true,
    connectionLimit: 5,                     // stay within free tier limits
});

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Get user ID from query string (already includes @s.whatsapp.net)
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'Missing user ID. Provide ?id=233560806367@s.whatsapp.net' });
    }

    try {
        // Try a quick connection test (optional, but helps debugging)
        const conn = await pool.getConnection();
        conn.release();

        // Query the player
        const [rows] = await pool.execute(
            'SELECT * FROM players WHERE user_id = ?',
            [id]
        );

        if (rows.length === 0) {
            // User not found – the frontend will show a registration form
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the player object
        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Profile API error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message,
            code: err.code || 'UNKNOWN',
        });
    }
};