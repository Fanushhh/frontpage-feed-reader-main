"use client";
import Link from "next/link";
import { useGuestStore } from "@/store/guest";
import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

export function GuestBanner() {
  const { isGuest } = useGuestStore();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className="sticky top-0 z-20 bg-accent text-white px-4 py-2.5 flex items-center gap-3 text-sm">
      <p className="flex-1 text-center">
        You&apos;re browsing as a guest.{" "}
        <Link href="/sign-up" className="font-semibold underline hover:no-underline inline-flex items-center gap-1">
          Sign up free to save your feeds <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 opacity-75 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
