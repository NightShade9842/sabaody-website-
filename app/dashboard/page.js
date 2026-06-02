'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token) router.push('/');
    else if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const stats = [
    { label: 'Beli', value: user?.beli?.toLocaleString() + '฿' },
    { label: 'Gems', value: user?.gems },
    { label: 'Level', value: user?.level },
    { label: 'Gold Coins', value: user?.gold_coins }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-4xl font-[Pirata One] text-amber-300 mb-6">
        Ahoy, {user?.pirate_name}!
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white/5 p-4 rounded-xl border border-amber-500/20 hover:border-amber-400 transition">
            <p className="text-sm text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
      {/* Quick links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {['Profile', 'Store', 'Guild', 'Cards', 'Pokémon'].map((page) => (
          <button
            key={page}
            onClick={() => router.push('/' + page.toLowerCase())}
            className="bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/30 p-6 rounded-xl text-center font-bold text-lg transition"
          >
            {page}
          </button>
        ))}
      </div>
    </div>
  );
}