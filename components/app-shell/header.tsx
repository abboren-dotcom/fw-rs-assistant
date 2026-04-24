"use client";

import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/": { title: "Dashboard", description: "Project overview and session summary" },
  "/analysis": { title: "New Analysis", description: "Upload FotoWare / FotoStation configuration files" },
  "/source": { title: "Source Configuration Explorer", description: "Browse parsed artifacts and extracted entities" },
  "/mapping": { title: "Mapping Studio", description: "Review and edit field mappings" },
  "/preview": { title: "Editor Preview", description: "Compare FotoWare and ResourceSpace workflows" },
  "/export": { title: "Export Center", description: "Download generated setup files" },
  "/docs": { title: "Documentation", description: "How to use this tool and understand its output" },
};

export function Header() {
  const pathname = usePathname();
  const { project, clearProject } = useAppStore();
  const meta = PAGE_TITLES[pathname] ?? { title: "FotoWare → RS Setup Assistant", description: "" };

  return (
    <header className="h-12 border-b border-[rgb(var(--border))] bg-white dark:bg-[rgb(14,17,24)] px-5 flex items-center gap-4 flex-shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[rgb(var(--foreground))] truncate">{meta.title}</h1>
        {meta.description && (
          <p className="text-[11px] text-[rgb(var(--muted))] hidden sm:block">{meta.description}</p>
        )}
      </div>

      {project && (
        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs text-[rgb(var(--muted))]">
            {project.stats.fieldCount} fields · {project.stats.proposalCount} proposals
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearProject}
            title="Clear project and start over"
            className="text-[rgb(var(--muted))] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      )}
    </header>
  );
}
