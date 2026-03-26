"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast(error.message, "error"); return; }
      toast("Password updated", "success");
      setNewPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-text-primary">Account</h1>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary">Change password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="At least 8 characters"
            required
          />
          <Button type="submit" loading={loading}>Update password</Button>
        </form>
      </section>

      <section className="pt-4 border-t border-border space-y-3">
        <h2 className="text-base font-semibold text-text-primary">Sign out</h2>
        <p className="text-sm text-text-secondary">Sign out of your Frontpage account on this device.</p>
        <Button variant="secondary" onClick={handleSignOut} loading={signingOut}>Sign out</Button>
      </section>
    </div>
  );
}
