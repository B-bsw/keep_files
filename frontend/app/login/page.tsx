"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Card, TextField, Label, Input, FieldError, Button } from '@heroui/react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8"
      >
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <Card.Content className="p-8">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Keep Files</h1>
              <p className="text-gray-400">Enter your access key to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <TextField
                  isRequired
                  isInvalid={!!error}
                  value={key}
                  onChange={setKey}
                  className="w-full"
                >
                  <Label className="sr-only">Access Key</Label>
                  <Input
                    type="password"
                    placeholder="Enter Access Key"
                    className="w-full bg-black/50 border-white/10 hover:border-white/20 focus:border-white rounded-lg p-3 text-lg"
                  />
                  {error && <FieldError>{error}</FieldError>}
                </TextField>
              </div>

              <Button
                type="submit"
                isPending={loading}
                size="lg"
                className="w-full font-medium"
              >
                Continue
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </motion.div>
    </div>
  );
}
