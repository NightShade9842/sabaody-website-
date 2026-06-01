// api/inventory.js
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
    const { owner } = req.query;

    if (!owner) {
        return res.json([]);                       // no owner → empty array
    }

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM inventory WHERE owner_id = ? AND quantity > 0 ORDER BY item_type',
            [owner]
        );
        return res.json(rows);
    } catch (err) {
        console.error('Inventory API error:', err);
        return res.json([]);
    }
};