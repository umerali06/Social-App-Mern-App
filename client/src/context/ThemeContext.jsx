// src/context/ThemeContext.jsx
import { createContext, useState, useEffect } from "react";
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
