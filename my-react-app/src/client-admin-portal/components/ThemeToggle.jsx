import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
export default function ToggleTheme(){
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("crm-theme") || document.documentElement.getAttribute("data-theme") || "light";
    });

    useEffect(()=>{
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("crm-theme", theme);
    },[theme]);

    const toggleTheme = () =>{
        setTheme((current) => {
            const next = current === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("crm-theme", next);
            return next;
        });
    };

    return (
        <button type="button" className="toggle-theme" onClick={toggleTheme}>
            {theme === "light" ? (
                <>
                <Moon size={18}/>
                </>
            ):(
                <>
                <Sun size={18}/>
                </>
            )}
        </button>
    );
}
