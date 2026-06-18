import { LogOut } from "lucide-react";
import { Button } from "@heroui/react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 bg-[#F5FEFD]/80 dark:bg-[#050505]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#222222] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Keep Files</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Button
            onPress={onLogout}
            variant="secondary"
            className="text-white dark:text-black bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-white/90 font-medium rounded-lg h-8 px-4 text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
