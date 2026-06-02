import pool from '@/lib/db';
import { verifyAuth } from '../login/route';

export async function GET() {
  const [rows] = await pool.execute('SELECT * FROM store_items ORDER BY id');
  return Response.json(rows);
}

export async function POST(request) {
  const user = verifyAuth(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await request.json();
  const [[item]] = await pool.execute('SELECT * FROM store_items WHERE id = ?', [itemId]);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const [[player]] = await pool.execute('SELECT beli, gems, gold_coins FROM players WHERE user_id = ?', [user.userId]);
  if (!player) return Response.json({ error: 'Player not found' }, { status: 404 });

  if (item.price_beli > player.beli) return Response.json({ error: 'Not enough Beli' });
  if (item.price_gems > player.gems) return Response.json({ error: 'Not enough Gems' });

  // Deduct
  await pool.execute('UPDATE players SET beli = beli - ?, gems = gems - ? WHERE user_id = ?',
    [item.price_beli, item.price_gems, user.userId]);

  // Add to inventory
  await pool.execute(
    'INSERT INTO inventory (owner_id, item_name, item_type, quantity) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
    [user.userId, item.name, item.item_type]
  );

  return Response.json({ success: true, message: `Purchased ${item.name}!` });
}