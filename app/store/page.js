'use client';
import { useEffect, useState } from 'react';

export default function Store() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/store')
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  const buy = async (itemId) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    if (data.success) {
      // refresh user data in local storage
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-[Pirata One] text-amber-300 mb-4">Store</h2>
      {message && <p className="mb-4 text-green-400">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white/5 p-4 rounded-xl border border-amber-500/20">
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-sm text-gray-400">{item.description}</p>
            <p className="mt-2">
              {item.price_gems ? `${item.price_gems} 💎` : ''}
              {item.price_beli ? ` ${item.price_beli.toLocaleString()}฿` : ''}
            </p>
            <button
              onClick={() => buy(item.id)}
              className="mt-3 bg-amber-500 text-black px-4 py-1 rounded font-bold hover:bg-amber-600"
            >
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}