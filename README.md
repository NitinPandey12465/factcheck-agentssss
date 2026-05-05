# TruthLayer — AI Fact Checker

> Upload a PDF. Get every claim verified against live web data in seconds.

Built with **Next.js**, **Claude AI (Anthropic)**, and **Tavily Search** — deployed on **Vercel**.

---

## Live Demo

**→ [https://your-app.vercel.app](https://your-app.vercel.app)**

---

## What It Does

1. **Extract** — Parses your PDF and identifies specific, verifiable claims (stats, dates, figures)
2. **Search** — Queries the live web via Tavily for each claim
3. **Verify** — Claude AI cross-references claims against search results
4. **Report** — Flags each claim as:
   - ✅ **VERIFIED** — Matches current web data
   - ⚠️ **INACCURATE** — Outdated or wrong numbers
   - ❌ **FALSE** — Directly contradicted by evidence
   - ❓ **UNVERIFIED** — No reliable evidence found

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, CSS Variables |
| AI / LLM | Anthropic Claude (claude-opus-4-5) |
| Web Search | Tavily API |
| PDF Parsing | pdf-parse |
| Deployment | Vercel |

---

## Setup & Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/truth-layer.git
cd truth-layer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Get API Keys

| Service | Where to get it | Free tier |
|---------|----------------|-----------|
| Anthropic | [console.anthropic.com](https://console.anthropic.com) | Pay-per-use |
| Tavily | [tavily.com](https://tavily.com) | 1000 searches/month free |

### 4. Set environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
```

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual:

```bash
npm install -g vercel
vercel
```

**Add environment variables in Vercel Dashboard:**
- `ANTHROPIC_API_KEY`
- `TAVILY_API_KEY`

---

## Project Structure

```
fact-checker/
├── app/
│   ├── api/
│   │   └── verify/
│   │       └── route.js      # Core API: extract + search + verify
│   ├── globals.css           # Design system, CSS variables
│   ├── layout.js             # Root layout
│   └── page.js               # Main UI
├── .env.local.example        # Environment variable template
├── next.config.mjs
├── package.json
└── README.md
```

---

## How Verification Works

```
PDF Upload
    ↓
pdf-parse → raw text
    ↓
Claude API → extract 5-15 specific claims (JSON)
    ↓
For each claim:
    Tavily API → live web search results
    Claude API → verdict + explanation + corrected fact
    ↓
Aggregate results → Truth Score → Display report
```

---

## Evaluation

Tested against "Trap Documents" containing:
- Intentionally outdated statistics ✅ Caught
- Completely fabricated figures ✅ Flagged as FALSE
- Real, accurate claims ✅ Verified correctly

---

## License

MIT — built for CogCulture PM Trainee Assessment.
