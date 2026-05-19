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

    if (httpMethod === 'GET' && userId) {
      const [inventory] = await pool.execute(
        'SELECT * FROM inventory WHERE owner_id = ? AND quantity > 0 ORDER BY item_type',
        [userId]
      );
      return { statusCode: 200, headers, body: JSON.stringify(inventory) };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'use_item': {
          const { itemId, target } = data;
          
          const [[item]] = await pool.execute(
            'SELECT * FROM inventory WHERE id = ? AND owner_id = ? AND quantity > 0',
            [itemId, data.userId]
          );
          
          if (!item) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Item not found' }) };
          }
          
          switch (item.item_type) {
            case 'potion': {
              // Use on pokemon
              await pool.execute(
                'UPDATE pokemon SET hp = hp + 50 WHERE id = ? AND owner_id = ?',
                [target, data.userId]
              );
              break;
            }
            case 'rare_candy': {
              await pool.execute(
                'UPDATE pokemon SET level = level + 1, hp = hp + 10, attack = attack + 5, defense = defense + 5 WHERE id = ? AND owner_id = ?',
                [target, data.userId]
              );
              break;
            }
            case 'fusion_stone': {
              // Fusion logic handled in api-cards
              break;
            }
            case 'evolution_stone': {
              // Evolution logic handled in api-pokemon
              break;
            }
          }
          
          // Decrease quantity
          await pool.execute(
            'UPDATE inventory SET quantity = quantity - 1 WHERE id = ?',
            [itemId]
          );
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'melt_item': {
          const { itemId } = data;
          
          const [[item]] = await pool.execute(
            'SELECT * FROM inventory WHERE id = ? AND owner_id = ? AND quantity > 0',
            [itemId, data.userId]
          );
          
          if (!item) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Item not found' }) };
          }
          
          // Melt rewards
          const meltRewards = {
            potion: { beli: 50 },
            rare_candy: { beli: 100 },
            fusion_stone: { beli: 500, dust: 50 },
            evolution_stone: { beli: 1000, dust: 100 }
          };
          
          const rewards = meltRewards[item.item_type] || { beli: 25 };
          
          await pool.execute('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?', [itemId]);
          await pool.execute(
            'UPDATE players SET beli = beli + ?, dust = dust + ? WHERE user_id = ?',
            [rewards.beli || 0, rewards.dust || 0, data.userId]
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