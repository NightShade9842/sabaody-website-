import pool from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const [rows] = await pool.execute('SELECT * FROM pokemon WHERE owner_id = ?', [userId]);
  return Response.json(rows);
}