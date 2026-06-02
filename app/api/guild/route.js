import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guild_id');
  const [[guild]] = await pool.execute('SELECT * FROM guilds WHERE id = ?', [guildId]);
  const [members] = await pool.execute(
    `SELECT p.user_id, p.pirate_name, p.level, p.guild_role FROM players p WHERE p.guild_id = ?
     ORDER BY FIELD(p.guild_role, 'captain', 'first mate', 'member'), p.level DESC`,
    [guildId]
  );
  return Response.json({ guild, members });
}