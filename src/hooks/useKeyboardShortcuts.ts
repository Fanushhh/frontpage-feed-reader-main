"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = () => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

/**
 * Global keyboard shortcut registry.
 * Supports single keys and vim-style compound keys (g+h, g+s, g+f).
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  const pendingG = useRef(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore when typing in inputs, textareas, etc.
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow Escape to blur
        if (e.key === "Escape") target.blur();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Handle compound "g" shortcuts
      if (pendingG.current) {
        pendingG.current = false;
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        const compound = `g${key}`;
        if (shortcuts[compound]) {
          e.preventDefault();
          shortcuts[compound]();
          return;
        }
      }

      if (key === "g") {
        pendingG.current = true;
        pendingTimer.current = setTimeout(() => {
          pendingG.current = false;
        }, 500);
        return;
      }

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [handleKey]);
}

/** App-level shortcuts: navigation, search focus */
export function useAppShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts({
    "/": () => {
      const searchInput = document.querySelector<HTMLInputElement>('input[type="search"]');
      if (searchInput) {
        searchInput.focus();
      } else {
        router.push("/search");
      }
    },
    "gh": () => router.push("/feed"),
    "gs": () => router.push("/saved"),
    "gf": () => router.push("/settings/feeds"),
    "?": () => {
      const overlay = document.getElementById("keyboard-shortcuts-overlay");
      if (overlay) overlay.toggleAttribute("hidden");
    },
  });
}
