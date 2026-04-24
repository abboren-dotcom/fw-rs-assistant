import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, HelpCircle, ArrowRight, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start gap-3 mb-2">
        <BookOpen className="w-6 h-6 text-[rgb(var(--muted))] flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-semibold">Documentation</h2>
          <p className="text-sm text-[rgb(var(--muted))]">How to use this tool and understand its output</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>What this tool does</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-2 leading-relaxed">
          <p>
            The <strong>FotoWare → ResourceSpace Setup Assistant</strong> helps DAM administrators analyze a FotoWare or
            FotoStation configuration export and plan a ResourceSpace metadata field setup that closely mirrors the source workflow.
          </p>
          <p>
            It parses configuration files such as metadata templates, display templates, quick lists (controlled vocabulary files),
            and editor configuration files. It then uses heuristic inference to propose ResourceSpace field definitions, IPTC/XMP
            metadata tag mappings, and export-ready setup files.
          </p>
          <p>
            The tool is intended to be used offline — you upload local configuration files, and the analysis runs entirely in
            your browser. No files are sent to any external server.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Why this is a setup assistant, not a full migration engine</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-2 leading-relaxed">
          <p>
            A full DAM migration would require transferring all assets, metadata records, user accounts, permissions,
            workflows, and integrations. That is a complex, system-specific process that requires direct access to both
            the source and target systems.
          </p>
          <p>
            This tool focuses only on the <strong>metadata structure</strong> — the field definitions and controlled vocabularies —
            because that is the part that can be reasoned about from configuration files alone, without connecting to either system.
          </p>
          <p>
            The output files are designed to be used as starting points for manual ResourceSpace configuration,
            not as automated import scripts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Supported input types</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: ".xml", desc: "Metadata templates, display templates, quick lists" },
              { label: ".fmt", desc: "FotoStation format/template files" },
              { label: ".ini / .cfg", desc: "FotoStation editor configuration files" },
              { label: ".txt", desc: "Plain-text quick lists or caption templates" },
              { label: ".csv", desc: "CSV-format controlled vocabularies" },
              { label: ".json", desc: "JSON configuration fragments" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex gap-2 p-2 rounded border border-[rgb(var(--border))]">
                <code className="text-xs font-mono text-[rgb(var(--primary))] font-medium w-20 flex-shrink-0">{label}</code>
                <span className="text-xs text-[rgb(var(--muted))]">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Binary files (images, executables) and files larger than 10 MB are automatically skipped.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Understanding confidence levels</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-3">
          <div className="flex gap-3 p-2.5 rounded border border-[rgb(var(--border))]">
            <span className="badge-high px-1.5 py-0.5 text-[11px] rounded font-medium flex-shrink-0 h-5">High</span>
            <p className="text-xs leading-relaxed">
              The field was found directly in a named template, the label was matched to a known semantic category
              (e.g. title, creator, keywords), and/or a matching IPTC/XMP tag was identified. The proposed
              ResourceSpace mapping is reliable and generally requires no changes.
            </p>
          </div>
          <div className="flex gap-3 p-2.5 rounded border border-[rgb(var(--border))]">
            <span className="badge-medium px-1.5 py-0.5 text-[11px] rounded font-medium flex-shrink-0 h-5">Medium</span>
            <p className="text-xs leading-relaxed">
              The field was found in the configuration, but the type or mapping was inferred by pattern matching
              rather than direct semantic recognition. Review the field type and tag suggestion before accepting.
            </p>
          </div>
          <div className="flex gap-3 p-2.5 rounded border border-[rgb(var(--border))]">
            <span className="badge-low px-1.5 py-0.5 text-[11px] rounded font-medium flex-shrink-0 h-5">Low</span>
            <p className="text-xs leading-relaxed">
              The field name did not match any known pattern and the type is a fallback guess. Manual review and
              correction is strongly recommended before using the proposed mapping in ResourceSpace.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Understanding evidence labels</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-3">
          {[
            { kind: "parsed", label: "Parsed", desc: "The value was read directly from a configuration file with a clear structure. Highest reliability." },
            { kind: "inferred", label: "Inferred", desc: "The value was guessed from the field name, position, or context using heuristic rules. Should be verified." },
            { kind: "manual", label: "Manual", desc: "The value was entered or corrected by the user in the Mapping Studio." },
          ].map(({ kind, label, desc }) => (
            <div key={kind} className="flex gap-3 p-2.5 rounded border border-[rgb(var(--border))]">
              <span className={`badge-${kind} px-1.5 py-0.5 text-[11px] rounded font-medium flex-shrink-0 h-5`}>{label}</span>
              <p className="text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How ResourceSpace metadata mapping works</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-2 leading-relaxed">
          <p>
            ResourceSpace stores metadata in a database and can read and write embedded metadata in files
            using <strong>ExifTool</strong>. Each field can be mapped to an IPTC, XMP, or EXIF tag — for example:
          </p>
          <ul className="list-none space-y-1 ml-0">
            {[
              ["Title", "IPTC:ObjectName", "XMP:Title"],
              ["Caption/Description", "IPTC:Caption-Abstract", "XMP:Description"],
              ["Creator/Photographer", "IPTC:By-line", "XMP:Creator"],
              ["Copyright", "IPTC:CopyrightNotice", "XMP:Rights"],
              ["Keywords", "IPTC:Keywords", "XMP:Subject"],
              ["Date Created", "IPTC:DateCreated", "EXIF:DateTimeOriginal"],
            ].map(([field, iptc, xmp]) => (
              <li key={field} className="flex items-center gap-2 text-xs border-b border-[rgb(var(--border))] pb-1 last:border-0">
                <span className="w-40 font-medium text-[rgb(var(--foreground))]">{field}</span>
                <code className="text-[11px] text-orange-600 dark:text-orange-400">{iptc}</code>
                <span className="text-[rgb(var(--muted))]">·</span>
                <code className="text-[11px] text-purple-600 dark:text-purple-400">{xmp}</code>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            To configure ExifTool mapping in ResourceSpace, go to <em>System → Manage metadata fields</em> and
            set the <em>"ExifTool or IPTC/XMP field"</em> value for each field using the tag name format above.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Assumptions about ResourceSpace metadata mapping</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-2 leading-relaxed">
          <p>The following assumptions are made when generating ResourceSpace proposals:</p>
          <ul className="space-y-1.5">
            {[
              "ResourceSpace field types used are the standard types available in ResourceSpace Community Edition (2.x / 3.x+)",
              "The 'dropdown' type maps to a standard ResourceSpace dropdown with fixed options",
              "The 'keyword_list' type maps to a free-text tag input with semicolon-separated values",
              "Hierarchical vocabularies from FotoStation are flattened to a single level in ResourceSpace",
              "Display-only FotoStation fields may require different handling in ResourceSpace (e.g., read-only embedded fields)",
              "GPS coordinate fields are mapped to ExifTool GPS tags, not as custom fields",
              "IPTC and XMP tag names are based on standard ExifTool tag names and may need adjustment for your ResourceSpace version",
              "This tool does not model ResourceSpace user groups, collections, or access control",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy and security</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-2 leading-relaxed">
          <div className="flex items-start gap-2 p-2.5 rounded border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs">All file parsing runs entirely in your browser. No uploaded files are sent to any server.</p>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs">This tool is intended for trusted internal use by DAM administrators. Do not expose it as a public web service without adding authentication.</p>
          </div>
          <p className="text-xs">
            Uploaded files are only stored in your browser session memory and are discarded when you close the tab or click "Clear project".
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Known limitations</CardTitle></CardHeader>
        <CardContent className="text-sm text-[rgb(var(--muted))] space-y-1.5">
          {[
            "FotoWare internal field numbering (e.g. field 5 = title) is not modeled — field purpose must be derivable from labels",
            "Hierarchical/nested vocabularies are not fully supported — sub-items are treated as flat lists",
            "FotoWare workflow rules, approval flows, and access control are not parsed",
            "FotoWare display template rendering logic (formatting, layout) cannot be replicated in ResourceSpace fields",
            "FotoWare text template substitution variables are not parsed",
            "FotoStation-specific field types without ResourceSpace equivalents will be mapped to 'text' with a warning",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-[rgb(var(--border))] mt-0.5">—</span>
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
