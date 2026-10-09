import { useEffect } from "react";

export function useKeyboardShortcuts({
  onOpenPalette,
  onToggleTheme,
}: {
  onOpenPalette: () => void;
  onToggleTheme: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        (e.key === "/" || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) &&
        !isInput
      ) {
        e.preventDefault();
        onOpenPalette();
      }

      if (e.key === "t" && !isInput) {
        onToggleTheme();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenPalette, onToggleTheme]);
}
