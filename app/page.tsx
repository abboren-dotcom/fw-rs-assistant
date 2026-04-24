"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { DEMO_PROJECT } from "@/lib/demo/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/ui/badge";
import {
  Upload,
  FolderTree,
  ArrowLeftRight,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  List,
  LayoutTemplate,
  Zap,
} from "lucide-react";

const STEPS = [
  { href: "/analysis", icon: Upload, label: "1. Upload", desc: "Upload FotoWare config files" },
  { href: "/source", icon: FolderTree, label: "2. Explore", desc: "Browse parsed artifacts" },
  { href: "/mapping", icon: ArrowLeftRight, label: "3. Map", desc: "Review field mappings" },
  { href: "/preview", icon: Eye, label: "4. Preview", desc: "Compare editor workflows" },
  { href: "/export", icon: Download, label: "5. Export", desc: "Download setup files" },
];

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number | string;
  accent?: "warn" | "ok" | "error";
}) {
  return (
    <div className="bg-white dark:bg-[rgb(20,25,36)] rounded-lg border border-[rgb(var(--border))] p-4 flex gap-3 items-start">
      <div className={`p-2 rounded ${accent === "warn" ? "bg-amber-50 dark:bg-amber-900/20" : accent === "error" ? "bg-red-50 dark:bg-red-900/20" : accent === "ok" ? "bg-green-50 dark:bg-green-900/20" : "bg-[rgb(var(--secondary))]"}`}>
        <Icon className={`w-4 h-4 ${accent === "warn" ? "text-amber-600 dark:text-amber-400" : accent === "error" ? "text-red-600 dark:text-red-400" : accent === "ok" ? "text-green-600 dark:text-green-400" : "text-[rgb(var(--muted))]"}`} />
      </div>
      <div><div className="text-xl font-bold tabnum">{value}</div><div className="text-xs font-medium">{label}</div></div>
    </div>
  );
}

export default function DashboardPage() {
  const { project, setProject } = useAppStore();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {!project && (
        <div className="bg-white dark:bg-[rgb(20,25,36)] border border-[rgb(var(--border))] rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
              <ArrowLeftRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold mb-1.5">FotoWare → ResourceSpace Setup Assistant</h2>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-4">
                Upload a FotoWare or FotoStation configuration export to analyze your metadata structure and get a guided ResourceSpace setup with field proposals, type mappings, and export files.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/analysis"><Button size="md"><Upload className="w-3.5 h-3.5" />Upload configuration</Button></Link>
                <Button variant="outline" size="md" onClick={() => setProject(DEMO_PROJECT)}>
                  <Zap className="w-3.5 h-3.5" />Load demo project
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {project && (
        <>
          {project.isDemo && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-sm text-blue-700 dark:text-blue-300">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Viewing <strong>demo project</strong> — Museum FotoStation Config. No real files uploaded.</span>
              <Link href="/analysis" className="ml-auto text-xs underline whitespace-nowrap">Upload real files →</Link>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={FileText} label="Artifacts" value={project.stats.artifactCount} />
            <StatCard icon={LayoutTemplate} label="Templates" value={project.stats.templateCount} />
            <StatCard icon={ArrowLeftRight} label="Fields" value={project.stats.fieldCount} />
            <StatCard icon={List} label="Quick Lists" value={project.stats.quickListCount} />
            <StatCard icon={AlertTriangle} label="Needs review" value={project.stats.needsManualReviewCount} accent={project.stats.needsManualReviewCount > 0 ? "warn" : "ok"} />
            <StatCard icon={CheckCircle2} label="Issues" value={project.stats.issueCount} accent={project.stats.issueCount > 0 ? "warn" : "ok"} />
          </div>

          <Card>
            <CardHeader><CardTitle>Mapping Confidence</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-5">
                {(["high", "medium", "low"] as const).map((level) => {
                  const count = project.proposals.filter((p) => p.confidence === level).length;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <ConfidenceBadge level={level} />
                      <span className="text-sm tabnum font-semibold">{count}</span>
                      <span className="text-xs text-[rgb(var(--muted))]">proposals</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {project.issues.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Issues</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {project.issues.map((issue) => (
                  <div key={issue.id} className={`flex gap-2.5 p-3 rounded border text-sm ${issue.severity === "error" ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40" : issue.severity === "warning" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40" : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40"}`}>
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${issue.severity === "error" ? "text-red-600" : issue.severity === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                    <div>
                      <div className="font-medium text-xs">{issue.message}</div>
                      <div className="text-[11px] text-[rgb(var(--muted))] mt-0.5">→ {issue.suggestedAction}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader><CardTitle>Workflow</CardTitle></CardHeader>
        <CardContent>
          <ol className="flex flex-wrap gap-2">
            {STEPS.map(({ href, icon: Icon, label, desc }, i) => {
              const disabled = !project && i > 0;
              return (
                <li key={href} className="flex items-center gap-2">
                  {disabled ? (
                    <span className="flex items-center gap-2 px-3 py-2 rounded border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] opacity-50 cursor-not-allowed">
                      <Icon className="w-3.5 h-3.5" /><span className="font-medium">{label}</span>
                    </span>
                  ) : (
                    <Link href={href} className="flex items-center gap-2 px-3 py-2 rounded border border-[rgb(var(--border))] text-xs hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group">
                      <Icon className="w-3.5 h-3.5 text-[rgb(var(--muted))] group-hover:text-blue-600" />
                      <div><div className="font-medium">{label}</div><div className="text-[10px] text-[rgb(var(--muted))]">{desc}</div></div>
                    </Link>
                  )}
                  {i < STEPS.length - 1 && <span className="text-[rgb(var(--border))] text-xs">→</span>}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {!project && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>What this tool does</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm text-[rgb(var(--muted))]">
              <p>✓ Parses FotoStation metadata templates, display templates, and quick lists</p>
              <p>✓ Infers ResourceSpace field types and IPTC/XMP tag candidates</p>
              <p>✓ Lets you review and edit all mappings before export</p>
              <p>✓ Exports CSV, JSON, and Markdown setup files</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>What this tool does not do</CardTitle></CardHeader>
            <CardContent className="space-y-1.5 text-sm text-[rgb(var(--muted))]">
              <p>✗ Connect to a live FotoWare or ResourceSpace server</p>
              <p>✗ Migrate actual assets or media files</p>
              <p>✗ Replace manual ResourceSpace configuration steps</p>
              <p>✗ Guarantee exact field equivalence in all cases</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
