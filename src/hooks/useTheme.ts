import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useTheme() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme !== "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = (showToast = true) => {
    setDark((prev) => {
      const next = !prev;
      if (showToast) {
        toast.info(`Switched to ${next ? "dark" : "light"} theme`);
      }
      return next;
    });
  };

  return { dark, setDark, toggleTheme };
}
