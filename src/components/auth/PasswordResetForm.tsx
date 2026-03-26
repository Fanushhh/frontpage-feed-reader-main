"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setError(error.message); return; }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Check your email</h1>
        <p className="text-sm text-text-secondary">
          We sent a password reset link to <strong>{email}</strong>.
        </p>
        <Link href="/sign-in" className="text-sm text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reset password</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
      </form>
      <p className="text-center text-sm text-text-secondary">
        <Link href="/sign-in" className="text-accent hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Password updated</h1>
        <p className="text-sm text-text-secondary">Your password has been changed successfully.</p>
        <Link href="/sign-in" className="text-sm text-accent hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">New password</h1>
        <p className="mt-1 text-sm text-text-secondary">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required hint="At least 8 characters" />
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Update password</Button>
      </form>
    </div>
  );
}
