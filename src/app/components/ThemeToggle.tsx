import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "switch";
}

export default function ThemeToggle({ size = "md", variant = "switch" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSize = sizeClasses[size];

  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        {theme === "dark" ? (
          <Sun className={`${iconSize} text-amber-400`} />
        ) : (
          <Moon className={`${iconSize} text-foreground`} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors w-full sm:w-auto"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-11 h-6 bg-muted rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${
            theme === "dark" ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {theme === "dark" ? (
            <Moon className="w-3 h-3 text-foreground" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-foreground">
        {theme === "dark" ? "Dark Mode" : "Light Mode"}
      </span>
    </button>
  );
}
