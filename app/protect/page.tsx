'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Page() {
    const [type, setType] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (type === process.env.NEXT_PUBLIC_KEY) {
            document.cookie = `files_access=${process.env.NEXT_PUBLIC_KEY}; path=/; max-age=10;`
            router.push('/files')
        }
    }

    return (
        <>
            <div className="flex min-h-screen w-screen items-center justify-center bg-black p-6 text-gray-300">
                <div className="w-full max-w-sm space-y-8">
                    <h1 className="text-center text-3xl font-light tracking-wider">
                        <span className="text-cyan-400">Access</span> Point
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium tracking-wide text-gray-400">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your key..."
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full border-b border-gray-700 bg-transparent px-0 py-3 pr-10 text-sm tracking-wide text-white placeholder-gray-600 outline-none transition-colors focus:border-cyan-400"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-500 transition-colors hover:text-cyan-400"
                                >
                                    {!showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-4 text-sm font-medium uppercase tracking-wider text-cyan-400 transition-all duration-300 hover:bg-cyan-500/20"
                        >
                            <span className="transition-transform group-hover:translate-x-1">
                                Enter
                            </span>
                            <span className="text-xs">→</span>
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500">
                        Secure access • 2025
                    </p>
                </div>
            </div>
        </>
    )
}
