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

    if (httpMethod === 'GET') {
      if (queryStringParameters?.list === 'true') {
        const [guilds] = await pool.execute(
          `SELECT g.*, p.pirate_name as leader_name, 
           (SELECT COUNT(*) FROM players WHERE guild_id = g.id) as member_count 
           FROM guilds g 
           LEFT JOIN players p ON g.leader_id = p.user_id 
           ORDER BY member_count DESC`
        );
        return { statusCode: 200, headers, body: JSON.stringify(guilds) };
      }

      if (userId) {
        const [[guild]] = await pool.execute(
          `SELECT g.*, p.pirate_name as leader_name,
           (SELECT COUNT(*) FROM players WHERE guild_id = g.id) as member_count 
           FROM guilds g 
           LEFT JOIN players p ON g.leader_id = p.user_id 
           WHERE g.id = (SELECT guild_id FROM players WHERE user_id = ?)`,
          [userId]
        );
        
        if (guild) {
          const [members] = await pool.execute(
            `SELECT user_id, pirate_name, level, guild_role 
             FROM players 
             WHERE guild_id = ? 
             ORDER BY guild_role, level DESC`,
            [guild.id]
          );
          guild.members = members;
        }
        
        return { statusCode: 200, headers, body: JSON.stringify(guild || {}) };
      }
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'create': {
          // Check if user already in guild
          const [[existingUser]] = await pool.execute(
            'SELECT guild_id FROM players WHERE user_id = ?',
            [data.userId]
          );
          
          if (existingUser?.guild_id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Already in a guild' }) };
          }
          
          // Check guild name availability
          const [[existingGuild]] = await pool.execute(
            'SELECT id FROM guilds WHERE name = ?',
            [data.guildName]
          );
          
          if (existingGuild) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Guild name taken' }) };
          }
          
          // Create guild
          const [result] = await pool.execute(
            'INSERT INTO guilds (name, leader_id, type) VALUES (?, ?, ?)',
            [data.guildName, data.userId, data.type || 'pirate']
          );
          
          // Assign user to guild as leader
          await pool.execute(
            'UPDATE players SET guild_id = ? WHERE user_id = ?',
            [result.insertId, data.userId]
          );
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true, guildId: result.insertId }) };
        }

        case 'join': {
          const [[guild]] = await pool.execute('SELECT id FROM guilds WHERE name = ?', [data.guildName]);
          
          if (!guild) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guild not found' }) };
          }
          
          const [[user]] = await pool.execute('SELECT guild_id FROM players WHERE user_id = ?', [data.userId]);
          
          if (user?.guild_id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Already in a guild' }) };
          }
          
          await pool.execute('UPDATE players SET guild_id = ? WHERE user_id = ?', [guild.id, data.userId]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'leave': {
          const [[user]] = await pool.execute(
            'SELECT p.guild_id, g.leader_id FROM players p LEFT JOIN guilds g ON p.guild_id = g.id WHERE p.user_id = ?',
            [data.userId]
          );
          
          if (!user?.guild_id) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Not in a guild' }) };
          }
          
          // Cannot leave if leader (must disband or transfer)
          if (user.leader_id === data.userId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Leader cannot leave. Disband guild first.' }) };
          }
          
          await pool.execute('UPDATE players SET guild_id = NULL WHERE user_id = ?', [data.userId]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'tax_member': {
          const { targetId, amount } = data;
          
          // Verify leader
          const [[guild]] = await pool.execute(
            'SELECT * FROM guilds WHERE leader_id = ?',
            [data.userId]
          );
          
          if (!guild) {
            return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not guild leader' }) };
          }
          
          // Verify target in same guild
          const [[target]] = await pool.execute(
            'SELECT * FROM players WHERE user_id = ? AND guild_id = ?',
            [targetId, guild.id]
          );
          
          if (!target) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Member not in your guild' }) };
          }
          
          if (target.beli < amount) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Member has insufficient beli' }) };
          }
          
          await pool.execute('UPDATE players SET beli = beli - ? WHERE user_id = ?', [amount, targetId]);
          await pool.execute('UPDATE guilds SET treasury = treasury + ? WHERE id = ?', [amount, guild.id]);
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }
      }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad request' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};