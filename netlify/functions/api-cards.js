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
    const userId = queryStringParameters?.userId;
    const all = queryStringParameters?.all;

    // GET all cards or user-specific cards
    if (httpMethod === 'GET') {
      if (all === 'true') {
        const [cards] = await pool.execute(`
          SELECT c.*, p.pirate_name as owner_name 
          FROM cards c 
          LEFT JOIN players p ON c.owner_id = p.user_id 
          ORDER BY c.created_at DESC 
          LIMIT 1000
        `);
        return { statusCode: 200, headers, body: JSON.stringify(cards) };
      }

      if (userId) {
        const [cards] = await pool.execute(
          'SELECT * FROM cards WHERE owner_id = ? ORDER BY deck_number, deck_slot',
          [userId]
        );
        return { statusCode: 200, headers, body: JSON.stringify(cards) };
      }
    }

    // POST - Move cards between decks/collection
    if (httpMethod === 'POST') {
      const data = JSON.parse(body);
      
      switch (data.action) {
        case 'move_to_deck': {
          const { cardId, deckNumber, slot } = data;
          
          // Check if slot is occupied
          const [existing] = await pool.execute(
            'SELECT id FROM cards WHERE owner_id = ? AND deck_number = ? AND deck_slot = ?',
            [data.userId, deckNumber, slot]
          );
          
          if (existing.length > 0) {
            // Move existing card to collection
            await pool.execute(
              'UPDATE cards SET deck_number = NULL, deck_slot = NULL WHERE id = ?',
              [existing[0].id]
            );
          }
          
          // Move target card to deck
          await pool.execute(
            'UPDATE cards SET deck_number = ?, deck_slot = ? WHERE id = ? AND owner_id = ?',
            [deckNumber, slot, cardId, data.userId]
          );
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'move_to_collection': {
          const { cardId } = data;
          await pool.execute(
            'UPDATE cards SET deck_number = NULL, deck_slot = NULL WHERE id = ? AND owner_id = ?',
            [cardId, data.userId]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'fusion': {
          const { card1Id, card2Id } = data;
          
          // Get both cards
          const [[card1]] = await pool.execute('SELECT * FROM cards WHERE id = ?', [card1Id]);
          const [[card2]] = await pool.execute('SELECT * FROM cards WHERE id = ?', [card2Id]);
          
          if (!card1 || !card2) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cards not found' }) };
          }
          
          // Create fused card (higher rarity, combined stats)
          const fusedRarity = getHigherRarity(card1.rarity, card2.rarity);
          const fusedAttack = Math.floor((card1.attack + card2.attack) * 1.2);
          const fusedDefense = Math.floor((card1.defense + card2.defense) * 1.2);
          
          // Generate fusion name
          const fusedName = `${card1.card_name.split(' ')[0]} ${card2.card_name.split(' ').pop()}`;
          
          // Delete old cards
          await pool.execute('DELETE FROM cards WHERE id IN (?, ?)', [card1Id, card2Id]);
          
          // Create fused card
          const [result] = await pool.execute(
            'INSERT INTO cards (owner_id, card_name, card_type, rarity, attack, defense, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [data.userId, fusedName, 'Fusion', fusedRarity, fusedAttack, fusedDefense, card1.image_url]
          );
          
          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
              success: true, 
              newCard: { id: result.insertId, name: fusedName, rarity: fusedRarity, attack: fusedAttack, defense: fusedDefense }
            }) 
          };
        }

        case 'delete_card': {
          const { cardId } = data;
          const [[card]] = await pool.execute('SELECT * FROM cards WHERE id = ?', [cardId]);
          
          if (!card) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Card not found' }) };
          }
          
          // Calculate rewards
          const rewards = calculateCardDeleteRewards(card);
          
          // Delete card
          await pool.execute('DELETE FROM cards WHERE id = ?', [cardId]);
          
          // Give rewards
          await pool.execute(
            'UPDATE players SET beli = beli + ?, dust = dust + ? WHERE user_id = ?',
            [rewards.beli, rewards.dust, data.userId]
          );
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, rewards }) };
        }
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};

function getHigherRarity(rarity1, rarity2) {
  const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  const index1 = rarityOrder.indexOf(rarity1);
  const index2 = rarityOrder.indexOf(rarity2);
  return index1 >= index2 ? rarity1 : rarity2;
}

function calculateCardDeleteRewards(card) {
  const rewards = {
    Common: { beli: 100, dust: 10 },
    Uncommon: { beli: 250, dust: 25 },
    Rare: { beli: 500, dust: 50 },
    Epic: { beli: 1000, dust: 100 },
    Legendary: { beli: 5000, dust: 500 },
    Mythic: { beli: 10000, dust: 1000 }
  };
  return rewards[card.rarity] || { beli: 50, dust: 5 };
}