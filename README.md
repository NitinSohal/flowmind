# FlowMind — AI Flowchart Generator & Editor

> **Create professional flowcharts from plain English in seconds.** FlowMind is an open-source, AI-powered flowchart builder that turns natural language descriptions into fully editable diagrams — no design skills needed.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![OpenAI GPT-4](https://img.shields.io/badge/OpenAI-GPT--4-412991?logo=openai)](https://openai.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What is FlowMind?

**FlowMind** is a free, open-source AI flowchart maker built with Next.js and powered by OpenAI GPT-4. Just describe your process in plain English — *"user login flow with forgot password"* — and FlowMind instantly generates an interactive, editable flowchart diagram.

Perfect for:
- Software engineers documenting system architecture
- Product managers mapping user journeys
- Students creating process diagrams
- Anyone who hates manual diagram tools

---

## Features

- **AI Flowchart Generation** — Describe any process, get a complete flowchart instantly using GPT-4
- **Interactive Canvas** — Drag nodes, connect edges, zoom & pan with a smooth React Flow-based editor
- **Live DSL Editor** — Edit flowcharts as code with a Monaco-powered syntax editor (same editor as VS Code)
- **Drag-and-Drop Sidebar** — Add Process, Decision, Start/End, and I/O nodes by dragging them onto the canvas
- **Auto Layout** — Automatic hierarchical layout powered by the Dagre graph library
- **Multiple Export Formats** — Export as PNG, SVG, PDF, or VSDX (Microsoft Visio)
- **Flowchart as Code** — Human-readable, version-control-friendly DSL syntax for defining diagrams as text

---

## Demo

```
You type:  "User registration flow with email verification and error handling"

FlowMind generates:
  [Start] --> Register Form --> {Email Valid?}
  {Email Valid?} --Yes--> Send Verification Email --> {Verified?}
  {Email Valid?} --No--> >Show Error< --> Register Form
  {Verified?} --Yes--> Create Account --> [End]
  {Verified?} --No--> >Resend Email< --> {Verified?}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| AI | [OpenAI GPT-4](https://platform.openai.com) |
| Diagram Engine | [@xyflow/react](https://reactflow.dev) |
| Code Editor | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) |
| Graph Layout | [Dagre](https://github.com/dagrejs/dagre) |
| Styling | Tailwind CSS 4 |
| PDF Export | jsPDF |
| Image Export | html-to-image |
| Visio Export | JSZip (VSDX format) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NitinSohal/flowmind.git
cd flowmind

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the root of the project:

```env
# Required — get your key at https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...your-key-here...
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for GPT-4 flowchart generation |

> **Never commit your `.env.local` file.** It is already in `.gitignore`.

---

## FlowMind DSL Syntax

FlowMind uses a simple, human-readable DSL to define flowcharts as text. Write it directly in the editor or let AI generate it for you.

```
# Node types
[Label]       → Start / End node    (rounded rectangle)
Label         → Process node         (rectangle)
{Label}       → Decision node        (diamond)
>Label<       → Input / Output node  (parallelogram)

# Edges
A --> B             → Simple connection
A --Label--> B      → Labeled connection

# Comments
# This is a comment
```

### Example

```
[Start]
[Start] --> Get User Input
Get User Input --> >Read Input<
>Read Input< --> {Is Valid?}
{Is Valid?} --Yes--> Process Data
{Is Valid?} --No--> >Show Error<
>Show Error< --> Get User Input
Process Data --> [End]
```

---

## Project Structure

```
flowmind/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main app UI & state
│   │   ├── layout.tsx            # Root layout & metadata
│   │   └── api/generate/
│   │       └── route.ts          # POST /api/generate — GPT-4 endpoint
│   ├── components/
│   │   ├── FlowDiagram.tsx       # React Flow canvas
│   │   ├── FlowNodes.tsx         # Custom node shapes
│   │   ├── SyntaxEditor.tsx      # Monaco DSL editor
│   │   ├── DnDSidebar.tsx        # Drag-and-drop node palette
│   │   └── ExportMenu.tsx        # PNG / SVG / PDF / VSDX export
│   ├── lib/
│   │   ├── dslParser.ts          # DSL parser & serializer
│   │   ├── graphBuilder.ts       # DSL → React Flow nodes/edges
│   │   ├── layout.ts             # Dagre auto-layout
│   │   ├── exportUtils.ts        # Export implementations
│   │   └── idGenerator.ts        # Unique node ID generation
│   └── types/
│       └── flow.ts               # TypeScript interfaces
├── public/                       # Static assets
├── .env.local                    # Your environment variables (not committed)
├── package.json
└── next.config.ts
```

---

## Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Export Formats

| Format | Description |
|--------|-------------|
| **PNG** | High-resolution raster image (2x pixel ratio) |
| **SVG** | Scalable vector graphic — perfect for embedding |
| **PDF** | Auto-scaled to fit A4, ideal for documentation |
| **VSDX** | Microsoft Visio format for enterprise use |

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Built by [@NitinSohal](https://github.com/NitinSohal)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<details>
<summary>SEO Keywords</summary>

`ai flowchart generator` · `flowchart maker ai` · `free flowchart tool` · `natural language flowchart` · `gpt-4 diagram generator` · `ai flowchart from text` · `react flow diagram builder` · `flowchart generator open source` · `process flow diagram ai` · `flowchart as code` · `next.js flowchart app` · `visio alternative free` · `diagram generator gpt` · `ai diagramming tool` · `flowchart builder typescript`

</details>
