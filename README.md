# Emochi

Emochi turns your emotions into a room of characters — Cheer, Fear, Buzzy, Tear, Zen, Bubble, Dozy, and Wisey — who debate, support, and help you make sense of how you feel. Each character is a real AI agent (Azure AI Foundry prompt agent), not a scripted response.

## Features

- **Daily check-in** — log sleep, workload, and mood; each answer shifts your characters' "scores" for the day.
- **Home dashboard** — your crew reacts to your stats, with a live, data-driven suggestion from Wisey (not canned text — it reads your actual sleep/work/mood numbers and today's emotional shifts).
- **1:1 chat** — talk to any single character with full conversation memory.
- **Group chat ("Everyone")** — message the whole crew at once; they reply independently.
- **Debate arena** (`/debate`) — describe a situation and watch a real, moderated debate unfold: a director agent casts 3–5 relevant characters (guaranteeing a mix of upbeat and cautious voices so it's a genuine argument, not a pile-on), they push back on each other by name, and Wisey delivers a final verdict. Small talk gets a direct reply instead of a full debate.
- **Friends, quiz, interests, history** — social and onboarding features backed by SQL Server via Prisma.
- **Sign-in** via Microsoft Entra ID (personal Microsoft accounts).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React
- [Auth.js / NextAuth](https://authjs.dev) with the Microsoft Entra ID provider
- [Azure AI Foundry](https://ai.azure.com) (`@azure/ai-projects`) for all character agents, via the OpenAI-compatible Responses API
- [Prisma](https://www.prisma.io) + SQL Server (`mssql`) for user/friends/quiz data
- Tailwind CSS

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js session secret — generate with `npx auth secret` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `_SECRET` / `_ISSUER` | Microsoft Entra ID app registration for sign-in |
| `AZURE_FOUNDRY_PROJECT_ENDPOINT` | Your Foundry project endpoint, e.g. `https://<resource>.services.ai.azure.com/api/projects/<project>` |
| `AZURE_TENANT_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` | **Production only.** A service-principal credential for calling Foundry where `az login` isn't available (e.g. Vercel). Leave empty for local dev. |
| `DATABASE_URL` | SQL Server connection string for Prisma, e.g. `sqlserver://host:1433;database=...;user=...;password=...;encrypt=true` |

**Foundry auth, local vs. production:**
- **Local dev:** leave `AZURE_TENANT_ID`/`AZURE_CLIENT_ID`/`AZURE_CLIENT_SECRET` empty. Install the [Azure CLI](https://aka.ms/azure-cli) and run `az login` once — `DefaultAzureCredential` picks up that session automatically.
- **Production (Vercel, etc.):** there's no CLI or managed identity available, so create an Entra "App registration" with a client secret, grant it access to your Foundry project (Azure Portal → your resource → Access control (IAM) → add role e.g. "Cognitive Services User"), and set the three `AZURE_*` vars as environment variables in your hosting provider.

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.js                Sign-in
  home/                  Main dashboard (daily check-in, Wisey suggestions, character roster)
  chat/                  1:1 and group ("Everyone") chat
  debate/                Debate arena — director-cast, multi-turn, judged by Wisey
  quiz/ interests/       Onboarding flows
  api/
    agents/              Lists enabled Foundry agents
    chat/                Streams a single agent's reply
    debate/               Streams a full multi-agent debate (director + judge)
    wisey-tip/            One-off, data-grounded Wisey suggestion for the home page
    daily-checkin/ friends/ quiz-scores/ ...   Prisma-backed app data
lib/
  foundry.js             Shared Azure AI Foundry client
  prisma.js / db.js       Database clients
```

## Notes on the agent architecture

- All character calls go through the Foundry Responses API using `agent_reference` (not the standard `agent` field, which Foundry rejects as deprecated).
- Replies are streamed token-by-token (`stream: true` passed as the *first* argument to `responses.create`, since the streaming flag is read from there rather than from the raw request body).
- The debate route's "director" is a plain model call (no persona) that decides casting, turn order, and when to stop — tuned to enforce genuine disagreement (a mix of upbeat and cautious characters) and a minimum number of turns, so it doesn't just let everyone agree and end early.
