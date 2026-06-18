import { LogOut } from "lucide-react";
import { Button } from "@heroui/react";

export function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-[#050505] border-b border-[#222222]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-white">Keep Files</h1>
        </div>
        <Button
          onPress={onLogout}
          variant="secondary"
          className="text-black bg-white hover:bg-white/90 font-medium rounded-lg h-8 px-4 text-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </Button>
      </div>
    </header>
  );
}
