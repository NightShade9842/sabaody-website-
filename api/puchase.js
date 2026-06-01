// api/purchase.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, type, id } = req.body; // type: 'item' or 'card', id: item_id or listing_id
    if (!userId || !type || !id) return res.status(400).json({ error: 'Missing fields' });

    try {
        if (type === 'item') {
            // Buy from store_items
            const [[item]] = await pool.execute('SELECT * FROM store_items WHERE id = ?', [id]);
            if (!item) return res.status(404).json({ error: 'Item not found' });

            const [[user]] = await pool.execute('SELECT beli, gems FROM players WHERE user_id = ?', [userId]);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const costBeli = item.price_beli || 0;
            const costGems = item.price_gems || 0;
            if (costBeli > user.beli) return res.json({ success: false, message: 'Not enough Beli' });
            if (costGems > user.gems) return res.json({ success: false, message: 'Not enough Gems' });

            // Deduct and add to inventory
            if (costBeli) await pool.execute('UPDATE players SET beli = beli - ? WHERE user_id = ?', [costBeli, userId]);
            if (costGems) await pool.execute('UPDATE players SET gems = gems - ? WHERE user_id = ?', [costGems, userId]);
            await pool.execute(
                'INSERT INTO inventory (owner_id, item_name, item_type, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
                [userId, item.name, item.item_type]
            );

            return res.json({ success: true, message: `You bought ${item.name}!` });
        } else if (type === 'card') {
            // Buy from card_listings (marketplace)
            const [[listing]] = await pool.execute(
                "SELECT * FROM card_listings WHERE id = ? AND status = 'active' AND expires_at > NOW()",
                [id]
            );
            if (!listing) return res.status(404).json({ error: 'Listing not available' });

            const [[buyer]] = await pool.execute('SELECT beli FROM players WHERE user_id = ?', [userId]);
            if (!buyer || buyer.beli < listing.price) return res.json({ success: false, message: 'Not enough Beli' });

            // Transfer
            await pool.execute('UPDATE players SET beli = beli - ? WHERE user_id = ?', [listing.price, userId]);
            await pool.execute('UPDATE players SET beli = beli + ? WHERE user_id = ?', [listing.price, listing.seller_id]);
            await pool.execute('UPDATE cards SET owner_id = ?, deck_number = NULL, deck_slot = NULL WHERE id = ?', [userId, listing.card_id]);
            await pool.execute("UPDATE card_listings SET status = 'sold', buyer_id = ? WHERE id = ?", [userId, id]);

            return res.json({ success: true, message: 'Card purchased! Check your collection.' });
        }

        return res.status(400).json({ error: 'Invalid type' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};