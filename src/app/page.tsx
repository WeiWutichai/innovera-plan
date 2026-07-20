"use client";

import { usePlanner } from "@/store/planner";
import { useIsMobile } from "@/store/useIsMobile";
import { DesktopShell } from "@/components/desktop/DesktopShell";
import { MobileShell } from "@/components/mobile/MobileShell";

export default function Home() {
  const { state } = usePlanner();
  const isMobile = useIsMobile();

  // Avoid a hydration flash: render nothing until we know the viewport.
  if (state.loading || isMobile === null) {
    return <div style={{ height: "100vh", background: "var(--color-bg)" }} />;
  }

  return isMobile ? <MobileShell /> : <DesktopShell />;
}
