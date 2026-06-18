"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@heroui/react';

export default function LoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid key');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#050505] px-6">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">Sign in to your Vault</h1>
          <p className="text-gray-500 text-sm">Enter your secure access key to continue.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="key" className="text-xs font-medium text-gray-400 uppercase tracking-widest">
              Access Key
            </label>
            <input
              id="key"
              type="password"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••"
              className={`w-full bg-[#111111] border ${error ? 'border-white focus:border-white' : 'border-[#222222] focus:border-white'} rounded-lg p-4 text-white placeholder-gray-600 outline-none transition-colors font-mono text-sm`}
            />
            {error && <p className="text-white text-sm mt-2 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white"></span>{error}</p>}
          </div>

          <Button
            type="submit"
            isPending={loading}
            className="w-full bg-white text-black hover:bg-white/90 font-medium rounded-lg h-12"
          >
            Continue
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
