// api/cards.js
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
    const { owner, limit } = req.query;

    try {
        let query = 'SELECT * FROM cards';
        const params = [];

        if (owner) {
            query += ' WHERE owner_id = ?';
            params.push(owner);
        }

        query += ' ORDER BY rarity_order DESC, card_name';

        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [rows] = await pool.execute(query, params);
        return res.json(rows);                     // always an array
    } catch (err) {
        console.error('Cards API error:', err);
        return res.json([]);                       // return empty array on failure
    }
};