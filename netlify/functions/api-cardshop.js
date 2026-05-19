const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { httpMethod, queryStringParameters, body } = event;

    if (httpMethod === 'GET') {
      const [listings] = await pool.execute(
        `SELECT cl.*, c.card_name, c.rarity, c.attack, c.defense, c.image_url,
         p.pirate_name as seller_name
         FROM card_listings cl
         JOIN cards c ON cl.card_id = c.id
         JOIN players p ON cl.seller_id = p.user_id
         WHERE cl.status = 'active'
         ORDER BY cl.created_at DESC
         LIMIT 100`
      );
      return { statusCode: 200, headers, body: JSON.stringify(listings) };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'sell_card': {
          const { cardId, price } = data;
          
          // Verify card ownership
          const [[card]] = await pool.execute(
            'SELECT * FROM cards WHERE id = ? AND owner_id = ?',
            [cardId, data.userId]
          );
          
          if (!card) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Card not found' }) };
          }
          
          // Create listing
          await pool.execute(
            'INSERT INTO card_listings (card_id, seller_id, price) VALUES (?, ?, ?)',
            [cardId, data.userId, price]
          );
          
          // Remove card from user temporarily
          await pool.execute('UPDATE cards SET owner_id = "market" WHERE id = ?', [cardId]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'buy_card': {
          const { listingId } = data;
          
          const [[listing]] = await pool.execute(
            'SELECT * FROM card_listings WHERE id = ? AND status = "active"',
            [listingId]
          );
          
          if (!listing) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Listing not found' }) };
          }
          
          // Check buyer's balance
          const [[buyer]] = await pool.execute(
            'SELECT beli FROM players WHERE user_id = ?',
            [data.userId]
          );
          
          if (!buyer || buyer.beli < listing.price) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Insufficient funds' }) };
          }
          
          // Process transaction
          await pool.execute('UPDATE players SET beli = beli - ? WHERE user_id = ?', [listing.price, data.userId]);
          await pool.execute('UPDATE players SET beli = beli + ? WHERE user_id = ?', [listing.price, listing.seller_id]);
          await pool.execute('UPDATE cards SET owner_id = ? WHERE id = ?', [data.userId, listing.card_id]);
          await pool.execute('UPDATE card_listings SET status = "sold", buyer_id = ? WHERE id = ?', [data.userId, listingId]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'cancel_listing': {
          const { listingId } = data;
          
          const [[listing]] = await pool.execute(
            'SELECT * FROM card_listings WHERE id = ? AND seller_id = ? AND status = "active"',
            [listingId, data.userId]
          );
          
          if (!listing) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Listing not found' }) };
          }
          
          await pool.execute('UPDATE cards SET owner_id = ? WHERE id = ?', [data.userId, listing.card_id]);
          await pool.execute('UPDATE card_listings SET status = "cancelled" WHERE id = ?', [listingId]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};