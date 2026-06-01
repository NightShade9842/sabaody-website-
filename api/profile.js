// api/profile.js
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
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing ?id= parameter' });

    try {
        // 1. Exact match (e.g., 233560806367@s.whatsapp.net)
        let [rows] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [id]);
        if (rows.length) return res.json(rows[0]);

        // 2. Try @lid variant
        const lidId = id.replace('@s.whatsapp.net', '@lid');
        [rows] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [lidId]);
        if (rows.length) return res.json(rows[0]);

        // 3. Try any ID starting with the plain number
        const plainNumber = id.split('@')[0];
        [rows] = await pool.execute('SELECT * FROM players WHERE user_id LIKE ?', [`${plainNumber}%`]);
        if (rows.length) return res.json(rows[0]);

        return res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error('Profile API error:', err);
        return res.status(500).json({ error: 'Database error', message: err.message });
    }
};