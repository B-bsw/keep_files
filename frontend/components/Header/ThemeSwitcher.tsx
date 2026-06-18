"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button, Dropdown } from "@heroui/react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />; // placeholder to prevent layout shift
  }

  return (
    <Dropdown>
      <Button
        isIconOnly
        variant="ghost"
        className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#151515] rounded-lg h-8 w-8"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Moon className="w-4 h-4" />
        ) : theme === "light" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Monitor className="w-4 h-4" />
        )}
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu
          aria-label="Theme selection"
          selectedKeys={new Set([theme || "system"])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            setTheme(Array.from(keys)[0] as string);
          }}
        >
          <Dropdown.Item id="light" textValue="Light">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 opacity-70" />
              <span className={theme === "light" ? "font-medium text-black dark:text-white" : ""}>Light</span>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="dark" textValue="Dark">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 opacity-70" />
              <span className={theme === "dark" ? "font-medium text-black dark:text-white" : ""}>Dark</span>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="system" textValue="System">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 opacity-70" />
              <span className={theme === "system" ? "font-medium text-black dark:text-white" : ""}>System</span>
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
