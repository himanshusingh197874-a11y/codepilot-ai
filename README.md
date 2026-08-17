# Codepilot AI

Codepilot AI is a GitHub-connected pull-request review dashboard. It lets users sign in with GitHub, synchronize repositories, enable repositories for review, and inspect AI-generated pull-request review results and repository analytics.

## Architecture

| Component | Location | Stack |
| --- | --- | --- |
| Web dashboard | `frontend/` | Next.js, React, TypeScript, Tailwind CSS |
| API | `backend/` | Fastify, Prisma, PostgreSQL |
| GitHub integration | `backend/src/providers/github/` | GitHub OAuth, repository and webhook APIs |
| AI reviews | `backend/src/modules/ai/` | Google Gemini |

The frontend calls the API under `/api/v1`. The backend owns GitHub OAuth, database access, repository synchronization, webhooks, and review generation.

## Prerequisites

- Node.js 20 or later
- PostgreSQL 16 (or Docker)
- A GitHub OAuth App
- A Google Gemini API key

## Local setup

1. Start PostgreSQL:

   ```bash
   cd backend
   docker compose up -d postgres
   ```

2. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Configure the backend. Copy `backend/.env.example` to `backend/.env` and provide the required values:

   ```env
   PORT=3001
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codepilot
   JWT_SECRET=replace-with-a-random-value-at-least-32-characters-long
   JWT_REFRESH_SECRET=replace-with-a-second-random-value-at-least-32-characters-long
   GITHUB_CLIENT_ID=your-github-oauth-app-client-id
   GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
   GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback
   GEMINI_API_KEY=your-gemini-api-key
   WEBHOOK_SECRET=replace-with-a-webhook-secret-of-at-least-10-characters
   FRONTEND_URL=http://localhost:3000
   PUBLIC_API_URL=http://localhost:3001
   ```

   `GEMINI_MODEL` and `AI_PROVIDER` are optional; the backend supplies defaults.

4. Configure the frontend in `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```

5. Create the database schema and generate Prisma Client:

   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

6. Run both applications in separate terminals:

   ```bash
   cd backend
   npm run dev
   ```

   ```bash
   cd frontend
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The API health endpoint is available at [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health).

## GitHub OAuth configuration

Create a GitHub OAuth App and set its authorization callback URL to the same value as `GITHUB_CALLBACK_URL`.

For local development, use:

```text
http://localhost:3001/api/v1/auth/github/callback
```

For production, use the public HTTPS callback URL of the deployed backend. The app initiates sign-in at `/api/v1/auth/github` and redirects back to the frontend after a successful login.

## Production deployment

Deploy the backend to a publicly accessible HTTPS service with PostgreSQL available through `DATABASE_URL`. Set the backend environment variables listed above, updating these URLs for production:

```env
GITHUB_CALLBACK_URL=https://api.example.com/api/v1/auth/github/callback
FRONTEND_URL=https://app.example.com
PUBLIC_API_URL=https://api.example.com
```

Deploy `frontend/` to Vercel (or another Next.js host) and set:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

`NEXT_PUBLIC_API_URL` is embedded during the frontend build. It must never be `http://localhost:3001/api/v1` in a production deployment: in a visitor's browser, `localhost` points to that visitor's computer, so repository synchronization and other API requests will fail. Redeploy the frontend after changing this variable.

## Useful commands

| Command | Purpose |
| --- | --- |
| `cd backend && npm run dev` | Start the Fastify API in watch mode |
| `cd backend && npm run build` | Compile the backend |
| `cd backend && npm run lint` | Lint backend TypeScript |
| `cd frontend && npm run dev` | Start the Next.js dashboard |
| `cd frontend && npm run build` | Create a production frontend build |
| `cd frontend && npm run lint` | Lint the frontend |
| `cd backend && npx prisma migrate deploy` | Apply committed database migrations |
| `cd backend && npx prisma generate` | Generate Prisma Client |

## Main API areas

- `GET /api/v1/health` — health check
- `/api/v1/auth/*` — GitHub sign-in and authentication
- `/api/v1/repositories/*` — repository synchronization, configuration, pull requests, and insights
- `/api/v1/reviews/*` — saved review results and analytics
- `POST /api/v1/webhooks/github` — GitHub webhook receiver

Authenticated routes require the JWT returned by the OAuth flow. The frontend stores it locally and sends it as a Bearer token with API requests.

## Security notes

- Do not commit `.env`, `.env.local`, OAuth secrets, JWT secrets, webhook secrets, or database credentials.
- Use strong, distinct JWT secrets in every deployed environment.
- Restrict GitHub OAuth app credentials and webhook configuration to the intended domains.
