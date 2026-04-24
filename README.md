# FotoWare → ResourceSpace Setup Assistant

A production-ready, browser-based analysis and setup assistant that helps DAM administrators migrate metadata structure from **FotoWare / FotoStation** to **ResourceSpace**.

Built with Next.js 15 · TypeScript · Tailwind CSS · Zustand · App Router

---

## What this tool does

1. **Parses** FotoWare/FotoStation configuration files — metadata templates, display templates, quick lists (controlled vocabularies), and editor config files
2. **Infers** ResourceSpace field definitions, types, and IPTC/XMP/ExifTool tag mapping candidates using semantic heuristics
3. **Presents** all proposed mappings in an editable Mapping Studio — accept, reject, or adjust each field
4. **Previews** the FotoWare metadata editor alongside the proposed ResourceSpace field layout for comparison
5. **Exports** a ready-to-use setup package:
   - `mapping-report.json` — structured full export
   - `mapping-report.csv` — spreadsheet-friendly review table
   - `resourcespace-fields.csv` — one row per proposed RS field
   - `metadata-crosswalk.csv` — source-to-target field crosswalk
   - `sample-import.csv` — CSV template with example rows for RS import
   - `setup-report.md` — human-readable admin guide with manual checklist

---

## Who it is for

- DAM administrators migrating from FotoWare/FotoStation to ResourceSpace
- Museum staff, archivists, metadata managers, and collection managers
- Anyone who needs to translate a FotoStation metadata structure into ResourceSpace field configuration without connecting to live systems

---

## Why this is a setup assistant, not a full migration engine

A full DAM migration requires transferring assets, metadata records, user accounts, permissions, workflows, and integrations — a process that requires direct access to both the source and target systems.

This tool focuses only on **metadata structure**: the field definitions and controlled vocabularies derivable from FotoStation configuration files alone. The output files are designed as starting points for manual ResourceSpace configuration, not automated import scripts.

---

## Assumptions about ResourceSpace metadata mapping

- Field types are based on standard ResourceSpace Community Edition types (text, textarea, date, dropdown, keyword\_list, etc.)
- IPTC and XMP tag names use ExifTool's standard naming convention
- Hierarchical vocabularies are flattened to a single level (ResourceSpace does not natively support hierarchical fields in the same way)
- Display-only FotoStation template fields are flagged as read-only candidates — they may require different handling in ResourceSpace
- GPS fields are not mapped as custom text fields; ResourceSpace reads GPS from embedded EXIF data via ExifTool
- This tool does not model ResourceSpace user groups, collections, or access control

---

## Supported input types

| Extension | Content |
|---|---|
| `.xml` | Metadata templates, display templates, quick lists |
| `.fmt` | FotoStation format/template files |
| `.ini`, `.cfg` | FotoStation editor configuration |
| `.txt` | Plain-text quick lists or caption templates |
| `.csv` | CSV-format controlled vocabularies |
| `.json` | JSON configuration fragments |

Binary files, images, and files over 10 MB are automatically skipped.

---

## Demo mode

Click **"Load demo project"** on the Dashboard to load a pre-built example representing a museum FotoStation configuration with:

- 2 metadata/display templates
- 12 fields (high, medium, and low confidence)
- 3 quick lists (Subject Categories, Rights Status, Collections)
- 3 inference issues flagged for review

No file upload required for demo mode.

---

## Export outputs

All exports are generated client-side in your browser. No files are sent to a server.

| File | Format | Use |
|---|---|---|
| `mapping-report.json` | JSON | Complete structured export for further processing |
| `mapping-report.csv` | CSV | Spreadsheet-friendly review table |
| `resourcespace-fields.csv` | CSV | One row per proposed ResourceSpace field |
| `metadata-crosswalk.csv` | CSV | FW field → RS field crosswalk |
| `sample-import.csv` | CSV | Import template for ResourceSpace CSV batch update |
| `setup-report.md` | Markdown | Human-readable setup guide with manual checklist |

---

## Local development

```bash
# Clone / download the project
cd fw-rs-assistant

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment to Vercel

This project is a standard Next.js 15 App Router project and deploys to Vercel without any special configuration.

### Steps

1. **Push to GitHub** (or GitLab / Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-org/fw-rs-assistant.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Framework preset: **Next.js** (auto-detected)
   - Root directory: leave as `/` (or your subdirectory if in a monorepo)
   - No environment variables are required for the base app

3. **Deploy**:
   - Click **Deploy**
   - Vercel will run `npm run build` automatically

### Environment variables

The base app requires no environment variables. If you add server-side ResourceSpace API integration later, add:

```env
# Optional: for future ResourceSpace API integration
RESOURCESPACE_API_URL=
RESOURCESPACE_API_KEY=
```

Create a `.env.local` file for local development:

```bash
cp .env.example .env.local
```

### Notes for Vercel deployment

- All file parsing runs client-side — no serverless function size concerns
- The app uses static rendering for all pages (no dynamic server data)
- No database or file storage required

---

## Privacy and security

- All uploaded files are parsed entirely in the browser — no data is sent to any server
- Session state is stored in browser memory only and is cleared when the tab is closed or the project is reset
- This tool is intended for trusted internal use by DAM administrators
- Do not expose it as a public web service without adding authentication (e.g. Vercel password protection or an auth middleware)

---

## Known limitations

- FotoWare internal field numbering (e.g. field 5 = title) is not modeled — field purpose must be derivable from labels in the config files
- Hierarchical vocabularies are not fully supported — sub-items are flattened
- FotoWare workflow rules, approval flows, and access control are not parsed
- FotoWare display template rendering logic cannot be replicated as ResourceSpace fields
- FotoStation-specific field types without ResourceSpace equivalents are mapped to `text` with a warning
- This tool does not connect to live FotoWare or ResourceSpace systems — it works from exported config files only

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State | Zustand |
| Icons | Lucide React |
| File reading | Browser FileReader API |
| Exports | Blob / URL.createObjectURL |

---

## Project structure

```
/app              — Next.js App Router pages
  /analysis       — File upload and parse trigger
  /source         — Source config explorer
  /mapping        — Mapping Studio (field-by-field review)
  /preview        — FW vs RS side-by-side preview
  /export         — Export Center
  /docs           — Built-in documentation
/components
  /ui             — Button, Badge, Card, Input, Select, Tooltip
  /app-shell      — Sidebar, Header
/lib
  /parsers        — File detection and parsing logic
  /inference      — Field type and RS mapping inference engine
  /exporters      — JSON, CSV, Markdown export generators
  /demo           — Demo dataset (museum FotoStation config)
  /utils          — Shared utilities
/types            — TypeScript domain model
```
