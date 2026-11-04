import React, { useEffect, useState, useRef } from "react";
import { Sun, Moon, Droplets, Check, ChevronDown } from "lucide-react";
import "./ThemeToggle.css";

const THEMES = [
  { id: "white", label: "White", icon: Sun, color: "#ffffff", textColor: "#0f172a" },
  { id: "black", label: "Black", icon: Moon, color: "#09090b", textColor: "#f4f4f5" },
  { id: "blue", label: "Blue", icon: Droplets, color: "#2563eb", textColor: "#38bdf8" },
];

function normalizeTheme(val) {
  if (!val) return "white";
  const lower = String(val).toLowerCase().trim();
  if (lower === "dark") return "black";
  if (lower === "light") return "white";
  if (lower === "black" || lower === "blue" || lower === "white") return lower;
  return "white";
}

export default function ToggleTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("crm-theme") || document.documentElement.getAttribute("data-theme");
    return normalizeTheme(stored);
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const apply = (val) => {
      const norm = normalizeTheme(val);
      document.documentElement.setAttribute("data-theme", norm);
      document.body.className = `theme-${norm}`;
      localStorage.setItem("crm-theme", norm);
    };
    apply(theme);

    const handleCustomChange = (e) => {
      if (e.detail && e.detail !== theme) {
        setTheme(normalizeTheme(e.detail));
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === "crm-theme" && e.newValue && e.newValue !== theme) {
        setTheme(normalizeTheme(e.newValue));
      }
    };

    window.addEventListener("crm-theme-changed", handleCustomChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("crm-theme-changed", handleCustomChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectTheme = (newTheme) => {
    const norm = normalizeTheme(newTheme);
    setTheme(norm);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", norm);
    document.body.className = `theme-${norm}`;
    localStorage.setItem("crm-theme", norm);
    window.dispatchEvent(new CustomEvent("crm-theme-changed", { detail: norm }));
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    selectTheme(THEMES[nextIndex].id);
  };

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const CurrentIcon = currentThemeObj.icon;

  return (
    <div className="crm-theme-dropdown-wrap" ref={containerRef}>
      <button
        type="button"
        className={`crm-theme-toggle-btn theme-active-${theme}`}
        onClick={() => setOpen((prev) => !prev)}
        title={`Theme: ${currentThemeObj.label} (Click to change)`}
        aria-label="Select theme"
        aria-expanded={open}
      >
        <CurrentIcon size={16} />
        <span className="crm-theme-label">{currentThemeObj.label}</span>
        <ChevronDown size={12} className={`crm-theme-arrow ${open ? "open" : ""}`} />
      </button>

      {open && (
        <div className="crm-theme-menu" role="menu">
          <div className="crm-theme-menu-header">Select Theme</div>
          {THEMES.map((t) => {
            const Icon = t.icon;
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                className={`crm-theme-menu-item ${isSelected ? "selected" : ""}`}
                onClick={() => selectTheme(t.id)}
                role="menuitem"
              >
                <div className="crm-theme-item-left">
                  <span
                    className="crm-theme-color-dot"
                    style={{ background: t.color, borderColor: t.id === "white" ? "#cbd5e1" : "transparent" }}
                  />
                  <Icon size={15} />
                  <span>{t.label}</span>
                </div>
                {isSelected && <Check size={14} className="crm-theme-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
