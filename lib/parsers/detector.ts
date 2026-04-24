import type { SourceArtifact } from "@/types";

type ArtifactType = SourceArtifact["detectedType"];

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

  // Extension-based detection first
  if (lower.endsWith(".xml")) {
    if (QUICK_LIST_PATTERNS.some((p) => p.test(lower))) return "quick_list";
    if (METADATA_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "metadata_template";
    if (DISPLAY_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "display_template";
    if (TEXT_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "text_template";
    return "xml_config";
  }

  if (lower.endsWith(".ini") || lower.endsWith(".cfg") || lower.endsWith(".conf")) {
    return "ini_config";
  }

  if (lower.endsWith(".json")) return "json_config";
  if (lower.endsWith(".csv")) return "csv_data";

  // Filename pattern detection
  if (QUICK_LIST_PATTERNS.some((p) => p.test(lower))) return "quick_list";
  if (METADATA_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "metadata_template";
  if (DISPLAY_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "display_template";
  if (TEXT_TEMPLATE_PATTERNS.some((p) => p.test(lower))) return "text_template";
  if (EDITOR_CONFIG_PATTERNS.some((p) => p.test(lower))) return "editor_config";

  // Content-based heuristics
  const content100 = rawContent.slice(0, 400).toLowerCase();
  if (content100.includes("<quicklist") || content100.includes("<vocabulary") || content100.includes("<picklist")) {
    return "quick_list";
  }
  if (content100.includes("<metadatatemplate") || content100.includes("<metadata_template") || content100.includes("<field") && content100.includes("<template")) {
    return "metadata_template";
  }
  if (content100.includes("<displaytemplate") || content100.includes("<display_template")) {
    return "display_template";
  }
  if (content100.includes("[field") || content100.includes("[section") || content100.includes("[editor")) {
    return "editor_config";
  }

  return "unknown";
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
  // Skip binary/irrelevant types
  const blocked = [".exe", ".dll", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".pdf", ".zip"];
  return !blocked.some((ext) => lower.endsWith(ext));
}
