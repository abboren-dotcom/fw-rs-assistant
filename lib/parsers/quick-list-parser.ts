import type { ParsedQuickList, QuickListValue, SourceArtifact, ConfidenceLevel } from "@/types";
import { nanoid } from "@/lib/utils";

// Parse quick lists from various formats: XML, CSV, plain text, INI-style
export function parseQuickList(artifact: SourceArtifact, content: string): ParsedQuickList | null {
  const lower = content.slice(0, 200).toLowerCase();

  if (lower.includes("<?xml") || lower.includes("<vocabulary") || lower.includes("<quicklist") || lower.includes("<list")) {
    return parseXmlQuickList(artifact, content);
  }

  if (content.includes(",") && content.split("\n").length > 2) {
    return parseCsvQuickList(artifact, content);
  }

  // Fall back to plain text — one value per line
  return parsePlainTextQuickList(artifact, content);
}

function parseXmlQuickList(artifact: SourceArtifact, content: string): ParsedQuickList {
  const values: QuickListValue[] = [];
  const notes: string[] = [];

  // Extract name from XML attributes or filename
  const nameMatch = content.match(/name=["']([^"']+)["']/i);
  const displayName = nameMatch ? nameMatch[1] : artifact.filename.replace(/\.[^.]+$/, "");

  // Extract items: <item>, <value>, <entry>, <term>, <option> patterns
  const itemPatterns = [
    /<item[^>]*>([^<]+)<\/item>/gi,
    /<value[^>]*>([^<]+)<\/value>/gi,
    /<entry[^>]*code=["']([^"']+)["'][^>]*label=["']([^"']+)["'][^>]*/gi,
    /<term[^>]*>([^<]+)<\/term>/gi,
    /<option[^>]*value=["']([^"']+)["'][^>]*>([^<]*)<\/option>/gi,
    /<label[^>]*>([^<]+)<\/label>/gi,
    /<code[^>]*>([^<]+)<\/code>/gi,
  ];

  // Try structured code+label pattern first
  const structuredPattern = /<(item|entry|option|row)[^>]*>/gi;
  const codePattern = /<code[^>]*>([^<]+)<\/code>/i;
  const labelPattern = /<label[^>]*>([^<]+)<\/label>|<name[^>]*>([^<]+)<\/name>/i;

  const blockMatches = [...content.matchAll(/<(item|entry|row)([^>]*)>([\s\S]*?)<\/(item|entry|row)>/gi)];

  if (blockMatches.length > 0) {
    blockMatches.forEach((match, i) => {
      const block = match[3];
      const codeM = block.match(codePattern);
      const labelM = block.match(labelPattern);
      const code = codeM ? codeM[1].trim() : `item_${i + 1}`;
      const label = labelM ? (labelM[1] || labelM[2]).trim() : code;
      values.push({ code, label, sortOrder: i });
    });
  } else {
    // Fall back to simple item extraction
    const simpleItems = [...content.matchAll(/<(?:item|value|term|label)[^>]*>([^<]+)<\/(?:item|value|term|label)>/gi)];
    simpleItems.forEach((m, i) => {
      const v = m[1].trim();
      values.push({ code: v, label: v, sortOrder: i });
    });
  }

  if (values.length === 0) notes.push("Could not extract list values from XML structure");

  return {
    id: nanoid("ql"),
    sourceArtifactId: artifact.id,
    name: slugifyName(displayName),
    displayName,
    values,
    confidence: values.length > 0 ? "medium" : "low",
    notes,
  };
}

function parseCsvQuickList(artifact: SourceArtifact, content: string): ParsedQuickList {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const values: QuickListValue[] = [];
  const displayName = artifact.filename.replace(/\.[^.]+$/, "");

  // Try to detect header
  const first = lines[0].split(",");
  const hasHeader = first.some((h) => /code|label|name|value|id/i.test(h));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const [codeIdx, labelIdx] = hasHeader
    ? [
        first.findIndex((h) => /code|id/i.test(h)),
        first.findIndex((h) => /label|name|value/i.test(h)),
      ]
    : [-1, -1];

  dataLines.forEach((line, i) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (parts.length === 0 || !parts[0]) return;

    const code = codeIdx >= 0 ? parts[codeIdx] ?? `item_${i}` : parts[0];
    const label = labelIdx >= 0 ? parts[labelIdx] ?? code : parts[1] ?? code;
    values.push({ code, label: label || code, sortOrder: i });
  });

  return {
    id: nanoid("ql"),
    sourceArtifactId: artifact.id,
    name: slugifyName(displayName),
    displayName,
    values,
    confidence: "medium",
    notes: hasHeader ? [] : ["No header row detected; first column treated as code"],
  };
}

function parsePlainTextQuickList(artifact: SourceArtifact, content: string): ParsedQuickList {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
  const displayName = artifact.filename.replace(/\.[^.]+$/, "");
  const values: QuickListValue[] = lines.map((line, i) => {
    const parts = line.split(/\t|;/).map((p) => p.trim());
    return { code: parts[0], label: parts[1] ?? parts[0], sortOrder: i };
  });

  return {
    id: nanoid("ql"),
    sourceArtifactId: artifact.id,
    name: slugifyName(displayName),
    displayName,
    values,
    confidence: "low",
    notes: ["Parsed as plain-text list; code and label may be the same value"],
  };
}

function slugifyName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
