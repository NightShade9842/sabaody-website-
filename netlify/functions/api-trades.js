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
      const userId = queryStringParameters?.userId;
      
      if (userId) {
        const [trades] = await pool.execute(
          `SELECT t.*, 
           fp.pirate_name as from_name,
           tp.pirate_name as to_name
           FROM trades t
           JOIN players fp ON t.from_user = fp.user_id
           JOIN players tp ON t.to_user = tp.user_id
           WHERE (t.from_user = ? OR t.to_user = ?) AND t.status = 'pending'
           ORDER BY t.created_at DESC`,
          [userId, userId]
        );
        return { statusCode: 200, headers, body: JSON.stringify(trades) };
      }
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'offer_trade': {
          // Validate both users exist
          const [[fromUser]] = await pool.execute('SELECT user_id FROM players WHERE user_id = ?', [data.fromUser]);
          const [[toUser]] = await pool.execute('SELECT user_id FROM players WHERE user_id = ?', [data.toUser]);
          
          if (!fromUser || !toUser) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'User not found' }) };
          }

          // Verify offered cards belong to fromUser
          if (data.offerCards && data.offerCards.length > 0) {
            const [cards] = await pool.execute(
              'SELECT id FROM cards WHERE owner_id = ? AND id IN (?)',
              [data.fromUser, data.offerCards]
            );
            if (cards.length !== data.offerCards.length) {
              return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid cards' }) };
            }
          }

          // Create trade offer
          const [result] = await pool.execute(
            'INSERT INTO trades (from_user, to_user, offer_cards, offer_pokemon, offer_beli) VALUES (?, ?, ?, ?, ?)',
            [
              data.fromUser,
              data.toUser,
              JSON.stringify(data.offerCards || []),
              JSON.stringify(data.offerPokemon || []),
              data.offerBeli || 0
            ]
          );

          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ success: true, tradeId: result.insertId }) 
          };
        }

        case 'accept_trade': {
          const { tradeId } = data;
          
          const [[trade]] = await pool.execute(
            'SELECT * FROM trades WHERE id = ? AND status = "pending"',
            [tradeId]
          );
          
          if (!trade) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Trade not found' }) };
          }
          
          if (trade.to_user !== data.userId) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized' }) };
          }

          // Process trade
          const offerCards = JSON.parse(trade.offer_cards || '[]');
          const offerPokemon = JSON.parse(trade.offer_pokemon || '[]');

          // Transfer cards
          if (offerCards.length > 0) {
            await pool.execute(
              'UPDATE cards SET owner_id = ? WHERE id IN (?)',
              [trade.to_user, offerCards]
            );
          }

          // Transfer pokemon
          if (offerPokemon.length > 0) {
            await pool.execute(
              'UPDATE pokemon SET owner_id = ? WHERE id IN (?)',
              [trade.to_user, offerPokemon]
            );
          }

          // Transfer beli
          if (trade.offer_beli > 0) {
            await pool.execute(
              'UPDATE players SET beli = beli - ? WHERE user_id = ?',
              [trade.offer_beli, trade.from_user]
            );
            await pool.execute(
              'UPDATE players SET beli = beli + ? WHERE user_id = ?',
              [trade.offer_beli, trade.to_user]
            );
          }

          // Update trade status
          await pool.execute(
            'UPDATE trades SET status = "accepted" WHERE id = ?',
            [tradeId]
          );

          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'decline_trade': {
          const { tradeId } = data;
          
          const [[trade]] = await pool.execute(
            'SELECT * FROM trades WHERE id = ? AND status = "pending" AND to_user = ?',
            [tradeId, data.userId]
          );
          
          if (!trade) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Trade not found' }) };
          }

          await pool.execute(
            'UPDATE trades SET status = "declined" WHERE id = ?',
            [tradeId]
          );

          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};