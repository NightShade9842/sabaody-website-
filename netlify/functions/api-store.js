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
      const type = queryStringParameters?.type || 'items';
      
      let query = 'SELECT * FROM store_items WHERE 1=1';
      
      switch (type) {
        case 'items':
          query += " AND item_type IN ('potion', 'rare_candy', 'fusion_stone', 'evolution_stone')";
          break;
        case 'packs':
          query += " AND item_type = 'pack'";
          break;
        case 'events':
          query += " AND item_type LIKE 'event_%'";
          break;
      }
      
      const [items] = await pool.execute(query);
      return { statusCode: 200, headers, body: JSON.stringify(items) };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);
      
      switch (data.action) {
        case 'buy_item': {
          // Get item details
          const [[item]] = await pool.execute('SELECT * FROM store_items WHERE id = ?', [data.itemId]);
          
          if (!item || (item.stock !== -1 && item.stock <= 0)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Out of stock' }) };
          }
          
          // Get user
          const [[user]] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [data.userId]);
          
          if (!user) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
          }
          
          // Check currency
          if (item.price_gems && user.gems < item.price_gems) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough gems' }) };
          }
          if (item.price_beli && user.beli < item.price_beli) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough beli' }) };
          }
          
          // Process purchase
          if (item.price_gems) {
            await pool.execute('UPDATE players SET gems = gems - ? WHERE user_id = ?', [item.price_gems, data.userId]);
          }
          if (item.price_beli) {
            await pool.execute('UPDATE players SET beli = beli - ? WHERE user_id = ?', [item.price_beli, data.userId]);
          }
          
          // Add to inventory
          await pool.execute(
            'INSERT INTO inventory (owner_id, item_name, item_type, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
            [data.userId, item.name, item.item_type]
          );
          
          // Decrease stock if limited
          if (item.stock > 0) {
            await pool.execute('UPDATE store_items SET stock = stock - 1 WHERE id = ?', [data.itemId]);
          }
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'buy_pack': {
          const [[pack]] = await pool.execute('SELECT * FROM store_items WHERE id = ? AND item_type = "pack"', [data.itemId]);
          
          if (!pack) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pack not found' }) };
          }
          
          const [[user]] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [data.userId]);
          
          if (user.gems < pack.price_gems) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough gems' }) };
          }
          
          // Deduct gems
          await pool.execute('UPDATE players SET gems = gems - ? WHERE user_id = ?', [pack.price_gems, data.userId]);
          
          // Generate cards based on pack rates
          const cards = generatePackCards(pack.rates || { Common: 60, Uncommon: 25, Rare: 10, Epic: 4, Legendary: 1 });
          
          // Insert cards
          for (const card of cards) {
            await pool.execute(
              'INSERT INTO cards (owner_id, card_name, card_type, rarity, attack, defense, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [data.userId, card.name, 'Character', card.rarity, card.attack, card.defense, card.image || '']
            );
          }
          
          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ success: true, cards }) 
          };
        }

        case 'buy_event_item': {
          const [[item]] = await pool.execute('SELECT * FROM store_items WHERE id = ?', [data.itemId]);
          
          if (!item || !item.item_type.startsWith('event_')) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid item' }) };
          }
          
          const [[user]] = await pool.execute('SELECT * FROM players WHERE user_id = ?', [data.userId]);
          
          if (user.gold_coins < item.price_coins) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not enough gold coins' }) };
          }
          
          await pool.execute('UPDATE players SET gold_coins = gold_coins - ? WHERE user_id = ?', [item.price_coins, data.userId]);
          await pool.execute(
            'INSERT INTO inventory (owner_id, item_name, item_type, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
            [data.userId, item.name, item.item_type]
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

function generatePackCards(rates) {
  const cards = [];
  const packSize = 5;
  
  for (let i = 0; i < packSize; i++) {
    const rarity = rollRarity(rates);
    cards.push(generateCard(rarity));
  }
  
  return cards;
}

function rollRarity(rates) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, rate] of Object.entries(rates)) {
    cumulative += rate;
    if (roll <= cumulative) return rarity;
  }
  
  return 'Common';
}

function generateCard(rarity) {
  const names = {
    Common: ['Luffy', 'Zoro', 'Nami'],
    Uncommon: ['Sanji', 'Chopper', 'Robin'],
    Rare: ['Ace', 'Sabo', 'Law'],
    Epic: ['Kaido', 'Big Mom', 'Shanks'],
    Legendary: ['Roger', 'Whitebeard', 'Garp']
  };
  
  const baseStats = {
    Common: 100,
    Uncommon: 200,
    Rare: 350,
    Epic: 500,
    Legendary: 800
  };
  
  const namePool = names[rarity] || names.Common;
  const name = namePool[Math.floor(Math.random() * namePool.length)];
  const base = baseStats[rarity] || 100;
  
  return {
    name: `${name} (${rarity})`,
    rarity,
    attack: Math.floor(base * (0.8 + Math.random() * 0.4)),
    defense: Math.floor(base * (0.8 + Math.random() * 0.4)),
    image: `https://example.com/cards/${name.toLowerCase()}.png`
  };
}