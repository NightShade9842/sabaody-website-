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
    try {
        const [rows] = await pool.execute(
            `SELECT cl.id, c.card_name, c.rarity, c.attack, c.defense, c.image_url,
                    cl.price, cl.expires_at, p.pirate_name AS seller_name
             FROM card_listings cl
             JOIN cards c ON cl.card_id = c.id
             JOIN players p ON cl.seller_id = p.user_id
             WHERE cl.status = 'active' AND cl.expires_at > NOW()
             ORDER BY cl.expires_at ASC`
        );
        return res.json(rows);
    } catch (err) {
        console.error('Marketplace API error:', err);
        return res.json([]);
    }
};