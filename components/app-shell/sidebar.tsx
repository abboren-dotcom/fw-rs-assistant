"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard,
  Upload,
  FolderTree,
  ArrowLeftRight,
  Eye,
  Download,
  HelpCircle,
  Database,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/analysis", icon: Upload, label: "New Analysis" },
  { href: "/source", icon: FolderTree, label: "Source Config" },
  { href: "/mapping", icon: ArrowLeftRight, label: "Mapping Studio" },
  { href: "/preview", icon: Eye, label: "Editor Preview" },
  { href: "/export", icon: Download, label: "Export Center" },
  { href: "/docs", icon: HelpCircle, label: "Documentation" },
];

export function Sidebar() {
  const pathname = usePathname();
  const project = useAppStore((s) => s.project);

  return (
    <nav
      className="sidebar flex flex-col"
      style={{ width: 220, minHeight: "100vh" }}
      aria-label="Main navigation"
    >
      {/* Logo / product name */}
      <div className="px-4 py-4 border-b border-[rgb(30,38,52)]">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[rgb(99,149,225)]" />
          <div>
            <div className="text-xs font-bold text-white leading-tight">FotoWare → RS</div>
            <div className="text-[10px] text-[rgb(100,115,140)] leading-tight">Setup Assistant</div>
          </div>
        </div>
      </div>

      {/* Project badge */}
      {project && (
        <div className="mx-3 mt-3 px-2.5 py-2 rounded bg-[rgb(22,30,46)] border border-[rgb(35,48,68)]">
          <div className="text-[10px] text-[rgb(80,100,130)] uppercase tracking-wider mb-0.5">Active project</div>
          <div className="text-xs text-[rgb(180,195,220)] truncate font-medium">{project.name}</div>
          {project.isDemo && (
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[rgb(42,90,165,0.3)] text-[rgb(120,170,240)] border border-[rgb(42,90,165,0.4)]">
              Demo
            </span>
          )}
        </div>
      )}

      {/* Nav links */}
      <ul className="flex-1 px-2 pt-3 space-y-0.5" role="list">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const disabled = !project && href !== "/" && href !== "/analysis" && href !== "/docs";

          return (
            <li key={href}>
              {disabled ? (
                <span
                  className="flex items-center gap-2.5 px-3 py-2 rounded text-xs text-[rgb(55,70,90)] cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded text-xs transition-colors group",
                    active
                      ? "bg-[rgb(22,35,58)] text-white font-medium"
                      : "text-[rgb(140,160,190)] hover:bg-[rgb(20,28,42)] hover:text-[rgb(190,205,225)]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 transition-colors", active ? "text-[rgb(99,149,225)]" : "text-[rgb(80,100,130)] group-hover:text-[rgb(120,150,190)]")} />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-[rgb(60,90,130)]" />}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {/* Footer note */}
      <div className="px-4 py-3 border-t border-[rgb(25,33,48)]">
        <p className="text-[10px] text-[rgb(50,65,85)] leading-relaxed">
          Internal admin tool.<br />Not for public distribution.
        </p>
      </div>
    </nav>
  );
}
