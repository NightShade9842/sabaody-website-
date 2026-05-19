const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql.db.bot-hosting.net',
  port: 3306,
  user: 'u589445_TIgFM9UFfe',
  password: '9h5xn1.uo.HC3hQfku4Eib35',
  database: 'u589445_TIgFM9UFfe',
  waitForConnections: true,
  connectionLimit: 10,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const userId = event.queryStringParameters?.id;
    
    if (event.httpMethod === 'GET' && userId) {
      const [rows] = await pool.execute(
        `SELECT p.*, g.name as guild_name, g.type as guild_type 
         FROM players p 
         LEFT JOIN guilds g ON p.guild_id = g.id 
         WHERE p.user_id = ?`,
        [userId]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(rows[0] || {}),
      };
    }
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Bad request' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};