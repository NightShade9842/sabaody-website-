// api/profile.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing ?id= parameter' });
    }

    try {
        // First, test the database connection
        const conn = await pool.getConnection();
        conn.release();

        // Fetch the user
        const [rows] = await pool.execute(
            'SELECT * FROM players WHERE user_id = ?',
            [id]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'User not found. Register in the bot first!' });
        }

        return res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Profile API error:', err);
        return res.status(500).json({
            error: 'Database error',
            message: err.message,
            code: err.code || 'UNKNOWN',
        });
    }
};