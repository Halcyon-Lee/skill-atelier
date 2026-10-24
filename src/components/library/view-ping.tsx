"use client";

import { useEffect } from "react";

export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `atelier-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage may be unavailable in private browsing.
    }

    const timer = window.setTimeout(() => {
      fetch("/api/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => undefined);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [slug]);

  return null;
}
