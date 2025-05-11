import React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export function SettingsSection({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user } = useUser();
  const userId = user?.id;
  const [subscription, setSubscription] = useState<string>("...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me/subscription?user_id=${userId}`)
      .then(res => res.json())
      .then(data => setSubscription(data.subscription_type || "Free"));
  }, [userId]);

  async function handleUpgrade() {
    if (!userId) return;
    setLoading(true);
    // Determine next plan
    const nextPlan = subscription === "Free" ? "Basic" : "Pro";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, plan: nextPlan }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={`group flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:scale-105 relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full cursor-pointer`}>
          <Settings className="h-5 w-5" />
          {!isCollapsed && <span>Settings</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>My settings</DialogTitle>
        </DialogHeader>
        <Separator className="my-2" />
        <div>
          <div className="mb-2 font-medium">Appearance</div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-muted-foreground text-sm">Customize how Pagey AI looks on your device</span>
            <ThemeToggle />
          </div>
          <div className="mb-2 font-medium">Subscription</div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Current plan: <span className="font-semibold">{subscription}</span></span>
            <button
              className="ml-2 px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition cursor-pointer"
              type="button"
              onClick={handleUpgrade}
              disabled={loading || subscription === "Pro" || !userId}
            >
              {loading ? "Redirecting..." : subscription === "Pro" ? "Up to date" : "Upgrade"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 