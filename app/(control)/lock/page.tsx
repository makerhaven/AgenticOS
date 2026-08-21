"use client";

import React from "react";
import { Card, Input, GoldButton } from "@/components/ui";

export default function LockPage() {
  const [pass, setPass] = React.useState("");
  const [error, setError] = React.useState(false);

  const unlock = async () => {
    const r = await fetch("/control/api/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass }),
    });
    if (r.ok) {
      window.location.href = "/control";
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="font-hand text-gold text-3xl mb-2">Agentic OS</div>
        <p className="text-sm text-cream-dim mb-6">This deck is locked. Passcode.</p>
        <div className="space-y-3">
          <Input
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="••••••••"
          />
          {error && <p className="text-xs text-plum">Wrong passcode.</p>}
          <GoldButton onClick={unlock} className="w-full justify-center">
            Unlock
          </GoldButton>
        </div>
      </Card>
    </div>
  );
}
