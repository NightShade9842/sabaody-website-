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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, pirateName } = req.body;
    if (!userId || !pirateName) return res.status(400).json({ error: 'Missing userId or pirateName' });

    try {
        const [existing] = await pool.execute('SELECT user_id FROM players WHERE user_id = ?', [userId]);
        if (existing.length) return res.json({ success: false, message: 'Number already registered.' });

        await pool.execute(
            'INSERT INTO players (user_id, pirate_name, beli, gems) VALUES (?, ?, 500, 10)',
            [userId, pirateName]
        );
        return res.json({ success: true, message: 'Registration successful!' });
    } catch (err) {
        console.error('Register API error:', err);
        return res.status(500).json({ error: err.message });
    }
};