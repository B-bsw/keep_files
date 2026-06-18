import { CloudUpload, LogOut } from "lucide-react";
import { Button } from "@heroui/react";

export function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <CloudUpload className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Keep Files</h1>
        </div>
        <Button
          onPress={onLogout}
          variant="secondary"
          className="text-black bg-white hover:bg-white/90 font-medium rounded-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
