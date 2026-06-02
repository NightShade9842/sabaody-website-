'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [pirateName, setPirateName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pirate_name: pirateName, whatsapp_number: whatsapp })
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[90vh] overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a]">
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <form onSubmit={handleLogin} className="relative z-10 bg-black/40 backdrop-blur-xl p-8 rounded-2xl border border-amber-500/30 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-[Pirata One] text-amber-400 text-center mb-6">
          🏴‍☠️ SABAODY PIRATES
        </h1>
        <input
          type="text"
          placeholder="Pirate Name"
          value={pirateName}
          onChange={(e) => setPirateName(e.target.value)}
          className="w-full p-3 mb-3 bg-white/10 rounded-lg border border-white/20 focus:border-amber-400 outline-none"
        />
        <input
          type="text"
          placeholder="WhatsApp Number (with country code)"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full p-3 mb-4 bg-white/10 rounded-lg border border-white/20 focus:border-amber-400 outline-none"
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition"
        >
          Set Sail ⚓
        </button>
      </form>
    </div>
  );
}