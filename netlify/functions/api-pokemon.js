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
      const [pokemon] = await pool.execute(
        'SELECT * FROM pokemon WHERE owner_id = ? ORDER BY party_slot',
        [userId]
      );
      return { statusCode: 200, headers, body: JSON.stringify(pokemon) };
    }

    if (httpMethod === 'POST') {
      const data = JSON.parse(body);

      switch (data.action) {
        case 'add_to_party': {
          const { pokemonId, slot } = data;
          
          // Check if slot is occupied
          const [existing] = await pool.execute(
            'SELECT id FROM pokemon WHERE owner_id = ? AND party_slot = ?',
            [data.userId, slot]
          );
          
          if (existing.length > 0) {
            await pool.execute(
              'UPDATE pokemon SET party_slot = NULL WHERE id = ?',
              [existing[0].id]
            );
          }
          
          // Add to party
          await pool.execute(
            'UPDATE pokemon SET party_slot = ? WHERE id = ? AND owner_id = ?',
            [slot, pokemonId, data.userId]
          );
          
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'remove_from_party': {
          const { pokemonId } = data;
          await pool.execute(
            'UPDATE pokemon SET party_slot = NULL WHERE id = ? AND owner_id = ?',
            [pokemonId, data.userId]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        case 'evolve': {
          const { pokemonId, evolutionStone } = data;
          const [[pokemon]] = await pool.execute('SELECT * FROM pokemon WHERE id = ?', [pokemonId]);
          
          if (!pokemon) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pokémon not found' }) };
          }
          
          // Get evolution data (simplified)
          const evolvedForm = await getEvolution(pokemon.pokemon_name);
          
          if (!evolvedForm) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cannot evolve' }) };
          }
          
          // Update pokemon
          await pool.execute(
            'UPDATE pokemon SET pokemon_name = ?, hp = hp + 20, attack = attack + 10, defense = defense + 10, speed = speed + 5 WHERE id = ?',
            [evolvedForm, pokemonId]
          );
          
          // Remove evolution stone from inventory
          await pool.execute(
            'DELETE FROM inventory WHERE owner_id = ? AND item_name = ? LIMIT 1',
            [data.userId, evolutionStone]
          );
          
          return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ success: true, evolvedTo: evolvedForm }) 
          };
        }

        case 'delete_pokemon': {
          const { pokemonId } = data;
          const [[pokemon]] = await pool.execute('SELECT * FROM pokemon WHERE id = ?', [pokemonId]);
          
          if (!pokemon) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
          }
          
          // Calculate rewards based on level
          const rewards = {
            beli: pokemon.level * 100,
            dust: pokemon.level * 10
          };
          
          await pool.execute('DELETE FROM pokemon WHERE id = ?', [pokemonId]);
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

async function getEvolution(pokemonName) {
  // Simplified evolution chain
  const evolutions = {
    'Charmander': 'Charmeleon',
    'Charmeleon': 'Charizard',
    'Squirtle': 'Wartortle',
    'Wartortle': 'Blastoise',
    'Bulbasaur': 'Ivysaur',
    'Ivysaur': 'Venusaur',
    'Pikachu': 'Raichu',
    'Eevee': 'Vaporeon',
    'Dratini': 'Dragonair',
    'Dragonair': 'Dragonite'
  };
  return evolutions[pokemonName] || null;
}