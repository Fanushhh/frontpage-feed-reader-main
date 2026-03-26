"use client";
import { useAppShortcuts } from "@/hooks/useKeyboardShortcuts";

/** Mounts global app keyboard shortcuts. Must be a Client Component. */
export function AppShortcuts() {
  useAppShortcuts();
  return null;
}
