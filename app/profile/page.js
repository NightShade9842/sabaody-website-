'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
  }, []);

  const handleUpdate = async () => {
    // update logic via API
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-[Pirata One] text-amber-300 mb-4">Edit Profile</h2>
      {user && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Pirate Name</label>
            <input value={user.pirate_name} className="w-full p-2 bg-white/10 rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-400">Profile Picture URL</label>
            <input defaultValue={user.profile_pic} className="w-full p-2 bg-white/10 rounded" />
          </div>
          <button onClick={handleUpdate} className="bg-amber-500 px-6 py-2 rounded font-bold hover:bg-amber-600">
            Save
          </button>
        </div>
      )}
    </div>
  );
}