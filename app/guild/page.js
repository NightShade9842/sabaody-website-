'use client';
import { useEffect, useState } from 'react';

export default function Guild() {
  const [guild, setGuild] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.guild_id) {
      fetch(`/api/guild?guild_id=${user.guild_id}`)
        .then(res => res.json())
        .then(data => {
          setGuild(data.guild);
          setMembers(data.members);
        });
    }
  }, []);

  if (!guild) return <div className="p-6 text-gray-400">You are not in a guild.</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-[Pirata One] text-amber-300">{guild.name}</h2>
      <p className="text-gray-300">{guild.description}</p>
      <p className="text-amber-400">Treasury: {guild.treasury.toLocaleString()}฿</p>
      <h3 className="text-xl mt-4">Members</h3>
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.user_id} className="bg-white/5 p-3 rounded flex justify-between">
            <span>{m.pirate_name} <span className="text-xs text-gray-400">({m.guild_role})</span></span>
            <span>Level {m.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}