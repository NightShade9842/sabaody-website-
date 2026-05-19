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
      const [auctions] = await pool.execute(
        `SELECT a.*, c.card_name, c.rarity, c.attack, c.defense, c.image_url,
         p.pirate_name as seller_name,
         (SELECT MAX(bid_amount) FROM auction_bids WHERE auction_id = a.id) as current_bid,
         (SELECT COUNT(*) FROM auction_bids WHERE auction_id = a.id) as bid_count
         FROM auctions a
         JOIN cards c ON a.card_id = c.id
         JOIN players p ON a.seller_id = p.user_id
         WHERE a.status = 'active' AND a.end_time > NOW()
         ORDER BY a.end_time ASC`
      );
      return { statusCode: 200, headers, body: JSON.stringify(auctions) };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'start_auction': {
          const { cardId, startingBid, duration } = data;
          
          // Verify card ownership
          const [[card]] = await pool.execute(
            'SELECT * FROM cards WHERE id = ? AND owner_id = ?',
            [cardId, data.userId]
          );
          
          if (!card) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Card not found' }) };
          }
          
          // Calculate end time (default 24 hours)
          const endTime = new Date(Date.now() + (duration || 24) * 60 * 60 * 1000);
          
          // Create auction
          const [result] = await pool.execute(
            'INSERT INTO auctions (card_id, seller_id, starting_bid, current_bid, end_time) VALUES (?, ?, ?, ?, ?)',
            [cardId, data.userId, startingBid, startingBid, endTime]
          );
          
          // Remove card from user
          await pool.execute('UPDATE cards SET owner_id = "auction" WHERE id = ?', [cardId]);
          
          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ success: true, auctionId: result.insertId }) 
          };
        }

        case 'place_bid': {
          const { auctionId, amount } = data;
          
          const [[auction]] = await pool.execute(
            'SELECT * FROM auctions WHERE id = ? AND status = "active" AND end_time > NOW()',
            [auctionId]
          );
          
          if (!auction) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Auction not found or ended' }) };
          }
          
          // Get current highest bid
          const [[highestBid]] = await pool.execute(
            'SELECT MAX(bid_amount) as max_bid FROM auction_bids WHERE auction_id = ?',
            [auctionId]
          );
          
          const minBid = highestBid?.max_bid || auction.starting_bid;
          
          if (amount <= minBid) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `Bid must be higher than ${minBid}฿` }) };
          }
          
          // Check buyer's balance
          const [[bidder]] = await pool.execute(
            'SELECT beli FROM players WHERE user_id = ?',
            [data.userId]
          );
          
          if (!bidder || bidder.beli < amount) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Insufficient funds' }) };
          }
          
          // Place bid
          await pool.execute(
            'INSERT INTO auction_bids (auction_id, bidder_id, bid_amount) VALUES (?, ?, ?)',
            [auctionId, data.userId, amount]
          );
          
          // Update current bid
          await pool.execute(
            'UPDATE auctions SET current_bid = ? WHERE id = ?',
            [amount, auctionId]
          );
          
          // Refund previous highest bidder
          if (highestBid?.max_bid) {
            const [[previousBidder]] = await pool.execute(
              'SELECT bidder_id FROM auction_bids WHERE auction_id = ? AND bid_amount = ?',
              [auctionId, highestBid.max_bid]
            );
            
            if (previousBidder) {
              await pool.execute(
                'UPDATE players SET beli = beli + ? WHERE user_id = ?',
                [highestBid.max_bid, previousBidder.bidder_id]
              );
            }
          }
          
          // Deduct from current bidder
          await pool.execute(
            'UPDATE players SET beli = beli - ? WHERE user_id = ?',
            [amount, data.userId]
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