"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const [type, setType] = useState<string | null>(null);
  const [showPassword,setShowPassword] = useState<boolean>(false)
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === process.env.NEXT_PUBLIC_KEY) {
      console.log("ok");
      document.cookie = `files_access=ok; path=/; max-age=90;`;
      router.push("/files");
    }
  };

  return (
    <>
      <div className="min-h-screen w-screen bg-black text-gray-300 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">

          <h1 className="text-3xl font-light tracking-wider text-center">
            <span className="text-cyan-400">Access</span> Point
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your key..."
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-0 py-3 bg-transparent border-b border-gray-700 focus:border-cyan-400 outline-none transition-colors text-white placeholder-gray-600 text-sm tracking-wide pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors p-2"
                >
                  {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 text-sm font-medium tracking-wider uppercase bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:translate-x-1 transition-transform">Enter</span>
              <span className="text-xs">→</span>
            </button>

          </form>

          <p className="text-center text-xs text-gray-500">
            Secure access • 2025
          </p>
        </div>
      </div>
    </>
  );
}
