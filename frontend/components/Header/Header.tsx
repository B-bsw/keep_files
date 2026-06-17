import { CloudUpload, LogOut } from "lucide-react";

export function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <CloudUpload className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Keep Files</h1>
        </div>
        <button
          onClick={onLogout}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
