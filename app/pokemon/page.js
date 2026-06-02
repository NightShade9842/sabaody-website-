'use client';
import { useEffect, useState } from 'react';

export default function Pokemon() {
  const [pokemon, setPokemon] = useState([]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      fetch(`/api/pokemon?user_id=${user.user_id}`)
        .then(res => res.json())
        .then(setPokemon);
    }
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-[Pirata One] text-amber-300 mb-4">Your Pokémon</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pokemon.map(p => (
          <div key={p.id} className="bg-white/5 p-2 rounded border border-amber-500/20">
            <img src={p.image_url || '/placeholder.png'} className="w-full h-32 object-contain" />
            <p className="text-sm">{p.pokemon_name} {p.shiny ? '✨' : ''}</p>
            <p className="text-xs">Lv.{p.level} | HP: {p.hp}/{p.max_hp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}