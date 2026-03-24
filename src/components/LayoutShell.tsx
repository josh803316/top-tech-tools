"use client";

import { SidebarProvider, useSidebar } from "@/components/SidebarContext";

function Shell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const { open, close } = useSidebar();

  return (
    <div className="layout-body">
      {/* Mobile backdrop */}
      <div className={`sidebar-overlay${open ? " visible" : ""}`} onClick={close} />

      {/* Sidebar — normal flow on desktop, fixed drawer on mobile */}
      <div className={`sidebar-wrapper${open ? " open" : ""}`}>
        {sidebar}
      </div>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export function LayoutShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Shell sidebar={sidebar}>{children}</Shell>
    </SidebarProvider>
  );
}
