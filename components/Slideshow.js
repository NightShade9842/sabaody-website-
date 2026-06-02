'use client';
import { useEffect, useState } from 'react';

export default function Slideshow({ cards }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [cards]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-amber-500/30">
      {cards.map((card, idx) => (
        <div
          key={card.id}
          className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={card.image_url} className="w-full h-full object-contain bg-black/50" />
          <div className="absolute bottom-0 w-full bg-black/60 p-2 text-center">
            <p className="text-lg font-bold">{card.card_name}</p>
            <p className="text-amber-400">{card.rarity}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full ${idx === current ? 'bg-amber-400' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}