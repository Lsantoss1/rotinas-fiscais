"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  const label = theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema";

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
      title={`Tema atual: ${label}`}
    >
      {theme === "dark" && <Moon className="h-5 w-5 text-indigo-400" />}
      {theme === "light" && <Sun className="h-5 w-5 text-amber-500" />}
      {theme === "system" && <Laptop className="h-5 w-5 text-blue-500" />}
    </button>
  );
}