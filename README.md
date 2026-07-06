# LEANR — AI Diet Report Generator

Upload a client's diet PDF and instantly generate a **premium, on-brand nutrition &
performance report**. The app extracts the plan's text, uses OpenAI (Structured
Outputs) to produce a strict JSON analysis — calories, macros, micronutrients,
meals, workout, hydration and recovery — and renders a multi-page, LEANR-themed
PDF (black / yellow / white). Everything is stored in Supabase (Storage + Postgres)
behind authentication, with full upload history, preview and download.

---

## ✨ Features

- 🔐 **Auth** — email/password via Supabase, route-protected with middleware.
- 📤 **Drag-and-drop upload** with client-side validation and staged loading UI.
- 🧠 **AI analysis** — OpenAI Structured Outputs guarantee schema-valid JSON.
- 📄 **Text extraction** — `pdf-parse`, with clear errors for scanned/image PDFs.
- 🎨 **Premium PDF** — multi-page, branded report via `@react-pdf/renderer`.
- 🗂 **Storage** — original PDF, generated JSON and final PDF kept per report.
- 🗃 **History** — searchable table, per-report preview, download, delete.
- 🖥 **Responsive UI** — Tailwind + shadcn/ui, loading skeletons, toasts, empty/error states.
- 🚀 **Vercel-ready** — Node runtime routes, sensible function limits.

---

## 🧱 Tech stack

| Layer        | Choice                                        |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 15 (App Router) + TypeScript          |
| Styling      | Tailwind CSS + shadcn/ui + lucide-react       |
| Auth / DB    | Supabase (Postgres + RLS)                     |
| Storage      | Supabase Storage (private bucket)             |
| AI           | OpenAI GPT (Structured Outputs) + Zod         |
| PDF in       | `pdf-parse`                                   |
| PDF out      | `@react-pdf/renderer`                         |
| Deploy       | Vercel                                        |

> **Why React-PDF over Puppeteer?** React-PDF runs cleanly in a Node serverless
> function with no headless-Chromium binary to ship. If you prefer HTML→PDF via
> Puppeteer, swap `lib/pdf/generate.ts` to use `puppeteer-core` +
> `@sparticuz/chromium`; the rest of the pipeline is unchanged.

---

## 📁 Project structure

```
diet-report-generator/
├── app/
│   ├── (auth)/                    # login / signup (route group)
│   │   ├── actions.ts             # signIn / signUp / signOut server actions
│   │   ├── auth-form.tsx
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/               # authenticated app shell
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── dashboard/page.tsx     # upload + recent reports
│   │   └── reports/
│   │       ├── actions.ts         # delete / signed-url server actions
│   │       ├── page.tsx           # full history
│   │       └── [id]/page.tsx      # detail: structured view + PDF preview
│   ├── api/reports/
│   │   ├── generate/route.ts      # the full pipeline (upload→parse→GPT→render→store)
│   │   └── [id]/pdf/route.ts      # serves the final PDF (inline/download)
│   ├── auth/callback/route.ts     # email-confirmation code exchange
│   ├── error.tsx • not-found.tsx • layout.tsx • page.tsx • globals.css
├── components/
│   ├── brand/logo.tsx
│   ├── dashboard/                 # nav, upload form, tables, detail view, ...
│   └── ui/                        # shadcn primitives
├── lib/
│   ├── supabase/                  # client / server / admin / middleware
│   ├── pdf/                       # extract.ts, report-document.tsx, generate.ts
│   ├── openai.ts • prompts.ts • schemas.ts • storage.ts • reports.ts
│   ├── env.ts • types.ts • theme.ts • utils.ts
├── supabase/migrations/0001_init.sql
├── middleware.ts • next.config.mjs • tailwind.config.ts • vercel.json
└── .env.example
```

---

## 🚀 Local setup

### 1. Prerequisites
- **Node.js 18.18+** (20 LTS recommended)
- A **Supabase** project — <https://app.supabase.com>
- An **OpenAI API key** — <https://platform.openai.com/api-keys>

### 2. Install
```bash
npm install
```

### 3. Configure Supabase
1. Open your Supabase project → **SQL Editor** → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and **Run**.
   This creates the `reports` table, RLS policies, and the private
   `diet-reports` Storage bucket.
2. (Auth) Under **Authentication → Providers → Email**, enable email sign-in.
   For the fastest local start, you can turn **"Confirm email" off** so sign-up
   logs you straight in. Leave it on for production and set the redirect URL to
   `https://your-app.vercel.app/auth/callback`.

### 4. Environment variables
```bash
cp .env.example .env.local
```
Fill in the values (see the table below). Find the Supabase keys under
**Project Settings → API**.

| Variable                        | Where            | Notes                                   |
| ------------------------------- | ---------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | client + server  | Project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server  | Anon public key                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | **server only**  | Never expose to the browser             |
| `SUPABASE_STORAGE_BUCKET`       | server           | Defaults to `diet-reports`              |
| `OPENAI_API_KEY`                | server           | OpenAI secret key                       |
| `OPENAI_MODEL`                  | server           | `gpt-4o-mini` (default) or `gpt-4o-2024-08-06` |
| `NEXT_PUBLIC_SITE_URL`          | client           | `http://localhost:3000` locally         |

> ⚠️ The `OPENAI_MODEL` **must support Structured Outputs** (`gpt-4o-mini`,
> `gpt-4o-2024-08-06`, or newer). Older models will error.

### 5. (Optional) Add your logo
Drop `logo.png` into `public/` (see `public/README.md`). Without it, the app
uses the "LEANR." wordmark.

### 6. Run
```bash
npm run dev
```
Open <http://localhost:3000>, sign up, and generate your first report.

Other scripts:
```bash
npm run build       # production build
npm run start       # run the production build
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
```

---

## 🔄 How generation works

`POST /api/reports/generate` (Node runtime) runs the whole pipeline in one request:

1. **Auth** the user (`supabase.auth.getUser()`).
2. **Validate** the client name (Zod) and the file (PDF, ≤ 10 MB).
3. **Create** a `processing` row so it shows in history immediately.
4. **Store** the original PDF in Storage.
5. **Extract** text with `pdf-parse` (rejects empty/scanned PDFs).
6. **Analyse** with OpenAI Structured Outputs → JSON validated against
   `DietReportSchema` (`lib/schemas.ts`).
7. **Store** the JSON, then **render** the branded PDF (`lib/pdf/`) and store it.
8. **Finalise** the row → `completed`, or mark `failed` (+ cleanup) on error.

The single Zod schema is the contract for the model, the database and the PDF —
so the three never drift apart.

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. **Vercel → New Project → Import** the repo (framework auto-detected as Next.js).
3. Add the **same environment variables** from `.env.local` in
   **Project Settings → Environment Variables**. Set
   `NEXT_PUBLIC_SITE_URL` to your production URL.
4. In Supabase **Authentication → URL Configuration**, add
   `https://your-app.vercel.app/auth/callback` to the redirect allow-list.
5. **Deploy.**

`vercel.json` grants the generate/PDF routes `maxDuration: 60` and `1024 MB`.
On the **Hobby** plan the function ceiling is 60s — enough for typical plans; use
**Pro** for very large documents or slower models.

### Known constraints
- **Serverless request-body limit (~4.5 MB on Vercel).** Most text-based diet
  PDFs are well under this. For larger files, upload directly to Supabase Storage
  from the client (signed upload URL) and pass the path to the API — the storage
  helpers in `lib/storage.ts` make this a small change.
- **Scanned / image-only PDFs** contain no selectable text; the app returns a
  clear 422. Add an OCR step (e.g. Tesseract / a vision model) if you need them.

---

## 🔒 Security notes
- The **service-role key is server-only** and never sent to the client.
- All report reads use the **user session** and are constrained by **RLS**, so
  users can only ever see their own data.
- Storage objects are in a **private bucket**; downloads use short-lived
  **signed URLs** or auth-checked server routes.

---

## 📜 Disclaimer
Generated reports are informational and **not a substitute for personalised
medical advice**. Every report embeds safety disclaimers.
