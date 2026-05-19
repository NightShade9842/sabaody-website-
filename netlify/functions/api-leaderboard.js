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
    const type = event.queryStringParameters?.type || 'level';
    
    let query = '';
    
    switch (type) {
      case 'level':
        query = `
          SELECT user_id, pirate_name, level, xp,
          (SELECT COUNT(*) FROM cards WHERE owner_id = p.user_id) as card_count
          FROM players p 
          ORDER BY level DESC, xp DESC 
          LIMIT 100
        `;
        break;
        
      case 'richest':
        query = `
          SELECT user_id, pirate_name, beli, gems,
          (beli + gems * 10000) as total_value
          FROM players p 
          ORDER BY total_value DESC 
          LIMIT 100
        `;
        break;
        
      case 'legendary':
        query = `
          SELECT p.user_id, p.pirate_name,
          COUNT(CASE WHEN c.rarity = 'Legendary' THEN 1 END) as legendary_count,
          COUNT(CASE WHEN c.rarity = 'Mythic' THEN 1 END) as mythic_count,
          COUNT(c.id) as total_cards
          FROM players p 
          LEFT JOIN cards c ON p.user_id = c.owner_id
          GROUP BY p.user_id, p.pirate_name
          ORDER BY legendary_count DESC, mythic_count DESC
          LIMIT 100
        `;
        break;
        
      case 'guild':
        query = `
          SELECT g.*, 
          (SELECT COUNT(*) FROM players WHERE guild_id = g.id) as member_count
          FROM guilds g 
          ORDER BY g.treasury DESC 
          LIMIT 50
        `;
        break;
        
      case 'casino':
        query = `
          SELECT user_id, pirate_name as player_name,
          games_played, total_won, biggest_win
          FROM players p 
          WHERE games_played > 0
          ORDER BY total_won DESC 
          LIMIT 50
        `;
        break;
        
      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid type' }) };
    }
    
    const [results] = await pool.execute(query);
    return { statusCode: 200, headers, body: JSON.stringify(results) };
    
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};