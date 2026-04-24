import type { SourceArtifact } from "@/types";

type ArtifactType = SourceArtifact["detectedType"];

// ── FotoStation native filename patterns ───────────────────────────────────
// FotoStation ships config files prefixed with "fs" and uses specific names.

// Files that contain popup/quick lists for metadata fields
const FS_QUICK_LIST_FILES = new Set([
  "fsmetapopuplists.xml",   // Primary popup list store — most important
  "fsmetaupdate.xml",
]);

// Files that define metadata fields / editor panels
const FS_METADATA_FILES = new Set([
  "fsmetadata.xml",
  "fsmetafields.xml",
  "fsmetaeditor.xml",
  "fsmeta.xml",
  "fsmetaformat.xml",
  // FotoWare (not FotoStation) metadata schema
  "metadataconfiguration.xml",
]);

// Files that define display/view panels
const FS_DISPLAY_FILES = new Set([
  "fssidepanels.xml",       // Side panel layout — display-oriented
  "fsviewdata.xml",
  "fswebexportdata.xml",
]);

// Files that define field groups / editor sections
const FS_EDITOR_FILES = new Set([
  "fsgroups.xml",           // Field group definitions
  "fstextimportformat.xml", // Text import field mapping
  "fsodbc.xml",
]);

// FS files that are pure application config (not metadata-relevant)
const FS_APP_CONFIG = new Set([
  "fsactionitems.xml",
  "fsappearance.xml",
  "fsarchives.xml",
  "fscolormanagedata.xml",
  "fscropdata.xml",
  "fsextream.xml",
  "fsfilefilters.xml",
  "fsfolderlocation.xml",
  "fsimageactions.xml",
  "fsmarkerdata.xml",
  "fssearchhistory.xml",
  "fssystemdata.xml",
]);

const METADATA_TEMPLATE_PATTERNS = [
  /metadata.*template/i,
  /metadatamal/i,
  /\.fmt$/i,
  /metaform/i,
  /\.mdt$/i,
];

const DISPLAY_TEMPLATE_PATTERNS = [
  /display.*template/i,
  /visningsmal/i,
  /presentation.*template/i,
];

const TEXT_TEMPLATE_PATTERNS = [
  /text.*template/i,
  /tekstmal/i,
  /caption.*template/i,
];

const QUICK_LIST_PATTERNS = [
  /quicklist/i,
  /quick.?list/i,
  /hurtigliste/i,
  /kontrollert.*vokabular/i,
  /controlled.*vocab/i,
  /vocabulary/i,
  /picklist/i,
  /pick.?list/i,
  /kodelist/i,
  /popuplist/i,
  /popup.?list/i,
  /\.ql$/i,
  /\.qls$/i,
];

const EDITOR_CONFIG_PATTERNS = [
  /editor.*config/i,
  /field.*config/i,
  /feltconfig/i,
];

export function detectArtifactType(filename: string, rawContent: string): ArtifactType {
  const lower = filename.toLowerCase();
  const base = lower.split("/").pop() ?? lower; // strip path prefix

  // ── FotoStation native file recognition (highest priority) ─────────────
  if (FS_QUICK_LIST_FILES.has(base)) return "quick_list";
  if (FS_METADATA_FILES.has(base)) return "metadata_template";
  if (FS_DISPLAY_FILES.has(base)) return "display_template";
  if (FS_EDITOR_FILES.has(base)) return "editor_config";
  if (FS_APP_CONFIG.has(base)) return "unknown"; // skip gracefully

  // ── Extension-based detection ───────────────────────────────────────────
  if (lower.endsWith(".xml")) {
    if (QUICK_LIST_PATTERNS.some((p) => p.test(lower))) return "quick_list";
    if (METADATA_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "metadata_template";
    if (DISPLAY_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "display_template";
    if (TEXT_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "text_template";

    // Content-based detection for unrecognised XML files
    return detectFromXmlContent(rawContent);
  }

  if (lower.endsWith(".ini") || lower.endsWith(".cfg") || lower.endsWith(".conf")) {
    return "ini_config";
  }
  if (lower.endsWith(".json")) return "json_config";
  if (lower.endsWith(".csv")) return "csv_data";

  // ── Filename pattern detection ──────────────────────────────────────────
  if (QUICK_LIST_PATTERNS.some((p) => p.test(lower))) return "quick_list";
  if (METADATA_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "metadata_template";
  if (DISPLAY_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "display_template";
  if (TEXT_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "text_template";
  if (EDITOR_CONFIG_PATTERNS.some((p) => p.test(lower))) return "editor_config";

  // ── Content heuristics ──────────────────────────────────────────────────
  return detectFromXmlContent(rawContent);
}

function detectFromXmlContent(rawContent: string): ArtifactType {
  const c = rawContent.slice(0, 600).toLowerCase();

  // FotoStation-specific root elements
  if (c.includes("<fsmetapopuplists") || c.includes("<popuplist") || c.includes("<fspopuplists")) return "quick_list";
  if (c.includes("<fsgroups") || c.includes("<fieldgroup") || c.includes("<metadatagroup")) return "editor_config";
  if (c.includes("<metadataschema") || c.includes("<fsmetadata") || c.includes("<fieldset") || c.includes("<metadatafield")) return "metadata_template";

  // Generic patterns
  if (c.includes("<quicklist") || c.includes("<vocabulary") || c.includes("<picklist")) return "quick_list";
  if (
    c.includes("<metadatatemplate") ||
    c.includes("<metadata_template") ||
    (c.includes("<field") && c.includes("<template"))
  ) return "metadata_template";
  if (c.includes("<displaytemplate") || c.includes("<display_template")) return "display_template";
  if (c.includes("[field") || c.includes("[section") || c.includes("[editor")) return "editor_config";

  return "xml_config";
}

export function isTextFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return [
    ".txt", ".xml", ".json", ".csv", ".ini", ".cfg", ".conf",
    ".fmt", ".mdt", ".ql", ".qls", ".htm", ".html", ".md",
    ".properties", ".yaml", ".yml",
  ].some((ext) => lower.endsWith(ext));
}

export function isSupportedFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  const blocked = [".exe", ".dll", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".pdf", ".zip"];
  return !blocked.some((ext) => lower.endsWith(ext));
}
