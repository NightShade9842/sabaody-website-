'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-amber-500/20 p-4 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-amber-400 font-[Pirata One]">
        ⚓ SABAODY
      </Link>
      {loggedIn && (
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-amber-300">Dashboard</Link>
          <Link href="/profile" className="hover:text-amber-300">Profile</Link>
          <Link href="/store" className="hover:text-amber-300">Store</Link>
          <Link href="/guild" className="hover:text-amber-300">Guild</Link>
          <Link href="/cards" className="hover:text-amber-300">Cards</Link>
          <Link href="/pokemon" className="hover:text-amber-300">Pokémon</Link>
        </div>
      )}
    </nav>
  );
}