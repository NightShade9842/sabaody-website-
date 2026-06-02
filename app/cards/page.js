'use client';
import { useEffect, useState } from 'react';
import Slideshow from '@/components/Slideshow';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [highTier, setHighTier] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      fetch(`/api/cards?user_id=${user.user_id}`)
        .then(res => res.json())
        .then(data => {
          setCards(data);
          setHighTier(data.filter(c => ['t5','t6','tx'].includes(c.rarity)));
        });
    }
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-[Pirata One] text-amber-300 mb-4">Your Cards</h2>
      {highTier.length > 0 && (
        <>
          <h3 className="text-xl text-amber-400 mb-2">🌟 High Tier Showcase</h3>
          <Slideshow cards={highTier} />
        </>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {cards.map(card => (
          <div key={card.id} className="bg-white/5 p-2 rounded border border-amber-500/20 hover:scale-105 transition">
            <img src={card.image_url} alt={card.card_name} className="w-full h-48 object-cover rounded" />
            <p className="text-sm mt-1">{card.card_name}</p>
            <p className="text-xs text-gray-400">{card.rarity} | ⚔️{card.attack} 🛡️{card.defense}</p>
          </div>
        ))}
      </div>
    </div>
  );
}