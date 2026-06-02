import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  const { pirate_name, whatsapp_number } = await request.json();
  const userId = `${whatsapp_number}@s.whatsapp.net`;

  const [rows] = await pool.execute(
    'SELECT * FROM players WHERE pirate_name = ? AND user_id = ?',
    [pirate_name, userId]
  );

  if (rows.length === 0) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: rows[0].user_id, pirateName: rows[0].pirate_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return Response.json({ token, user: rows[0] });
}