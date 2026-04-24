import type { FWFieldType, RSFieldType, FieldTypeInference } from "@/types";

// Static mapping: FotoWare field type → ResourceSpace field type
const FW_TO_RS_TYPE: Record<FWFieldType, RSFieldType> = {
  text: "text",
  longtext: "textarea",
  date: "date",
  number: "integer",
  dropdown: "dropdown",
  multiselect: "check_box_list",
  keyword: "keyword_list",
  person: "text",
  boolean: "radio_buttons",
  url: "text",
  unknown: "text",
};

// Known semantic field → IPTC/XMP tag candidates
const SEMANTIC_TAG_MAP: Record<string, { iptc?: string; xmp?: string; exif?: string }> = {
  title: { iptc: "IPTC:ObjectName", xmp: "XMP:Title" },
  caption: { iptc: "IPTC:Caption-Abstract", xmp: "XMP:Description" },
  description: { iptc: "IPTC:Caption-Abstract", xmp: "XMP:Description" },
  keywords: { iptc: "IPTC:Keywords", xmp: "XMP:Subject" },
  subject: { iptc: "IPTC:Keywords", xmp: "XMP:Subject" },
  creator: { iptc: "IPTC:By-line", xmp: "XMP:Creator" },
  photographer: { iptc: "IPTC:By-line", xmp: "XMP:Creator" },
  byline: { iptc: "IPTC:By-line", xmp: "XMP:Creator" },
  credit: { iptc: "IPTC:Credit", xmp: "XMP:Credit" },
  copyright: { iptc: "IPTC:CopyrightNotice", xmp: "XMP:Rights" },
  rights: { iptc: "IPTC:CopyrightNotice", xmp: "XMP:Rights" },
  source: { iptc: "IPTC:Source", xmp: "XMP:Source" },
  city: { iptc: "IPTC:City", xmp: "XMP:City" },
  country: { iptc: "IPTC:Country-PrimaryLocationName", xmp: "XMP:Country" },
  category: { iptc: "IPTC:Category", xmp: "XMP:Category" },
  urgency: { iptc: "IPTC:Urgency" },
  date: { iptc: "IPTC:DateCreated", xmp: "XMP:CreateDate", exif: "EXIF:DateTimeOriginal" },
  datecreated: { iptc: "IPTC:DateCreated", xmp: "XMP:CreateDate" },
  dateshot: { iptc: "IPTC:DateCreated", xmp: "XMP:DateCreated", exif: "EXIF:DateTimeOriginal" },
  headline: { iptc: "IPTC:Headline", xmp: "XMP:Headline" },
  location: { xmp: "XMP:Location", iptc: "IPTC:Sub-location" },
  sublocation: { iptc: "IPTC:Sub-location", xmp: "XMP:Location" },
  genre: { xmp: "XMP:Genre" },
  objectnumber: { xmp: "XMP:Identifier" },
  accessionnumber: { xmp: "XMP:Identifier" },
  objectname: { iptc: "IPTC:ObjectName", xmp: "XMP:Title" },
  identifiernumber: { xmp: "XMP:Identifier" },
  collection: { xmp: "XMP:CollectionName" },
  medium: { xmp: "XMP:Medium" },
  format: { iptc: "IPTC:OriginalTransmissionReference" },
  producer: { xmp: "XMP:Producer" },
  contact: { xmp: "XMP:Contact" },
};

export function inferRSType(fwType: FWFieldType): RSFieldType {
  return FW_TO_RS_TYPE[fwType] ?? "text";
}

export function inferSemanticTags(
  code: string,
  label: string
): { iptcTag?: string; xmpTag?: string; exifTag?: string } {
  const key = (code + " " + label)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  // Try direct match
  for (const [pattern, tags] of Object.entries(SEMANTIC_TAG_MAP)) {
    if (key.includes(pattern)) {
      return { iptcTag: tags.iptc, xmpTag: tags.xmp, exifTag: tags.exif };
    }
  }

  return {};
}

export function buildFieldTypeInference(
  code: string,
  label: string,
  fwType: FWFieldType,
  hasQuickList: boolean
): FieldTypeInference {
  // Override type if a quick list is attached
  const resolvedFwType: FWFieldType = hasQuickList && fwType === "text" ? "dropdown" : fwType;
  const rsType = hasQuickList
    ? "dropdown"
    : inferRSType(resolvedFwType);

  const tags = inferSemanticTags(code, label);

  const hasTag = !!(tags.iptcTag || tags.xmpTag || tags.exifTag);

  return {
    fwType: resolvedFwType,
    rsType,
    iptcTag: tags.iptcTag,
    xmpTag: tags.xmpTag,
    confidence: hasTag ? "high" : hasQuickList ? "medium" : "low",
    rationale: hasTag
      ? `Matched known semantic tag for "${label}"`
      : hasQuickList
      ? "Has associated quick list; dropdown type inferred"
      : "No semantic match; type guessed from field name pattern",
  };
}
