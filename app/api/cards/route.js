import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const [rows] = await pool.execute(
    'SELECT * FROM cards WHERE owner_id = ? ORDER BY rarity_order DESC',
    [userId]
  );
  return Response.json(rows);
}