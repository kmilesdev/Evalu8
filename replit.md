# Evalu8 - AI-Powered Hiring Platform

## Overview
Evalu8 is an AI-powered hiring simulation platform that evaluates candidate decision-making before the first interview. Recruiters create job simulations, share links with candidates, and receive AI-generated evaluation reports.

## Architecture
- **Frontend**: React (Vite) + TailwindCSS + shadcn/ui + wouter routing + TanStack Query
- **Backend**: Express.js with session-based auth (passport-local)
- **Database**: PostgreSQL (Replit built-in) with Drizzle ORM
- **AI**: OpenAI via Replit AI Integrations (gpt-5-mini model)

## Key Files
- `shared/schema.ts` - Drizzle schemas for users, jobs, applications, messages, evaluations, flags
- `server/db.ts` - Database connection
- `server/storage.ts` - IStorage interface and DatabaseStorage implementation
- `server/auth.ts` - Passport-local auth with session management
- `server/routes.ts` - Express API routes (recruiter + candidate)
- `server/services/interviewAgent.ts` - AI interview engine
- `server/services/evaluationAgent.ts` - AI evaluation engine
- `client/src/App.tsx` - Main app with routing (public vs recruiter layouts)
- `client/src/lib/auth.tsx` - AuthProvider + useAuth hook
- `client/src/lib/queryClient.ts` - TanStack Query setup with apiRequest helper

## User Flows
### Recruiter
1. Register/Login at /auth
2. View dashboard at /dashboard (list of jobs)
3. Create job at /jobs/new (generates shareable link)
4. View job detail at /jobs/:jobId (list candidates)
5. View candidate report at /applications/:appId/report

### Candidate
1. Open shared link /apply/:jobToken
2. Fill intake form (name, email, etc.)
3. Complete AI interview at /interview/:appId
4. See completion page at /interview-complete/:appId

## Database Tables
- `users` - Recruiter accounts
- `jobs` - Job simulations with jobToken for sharing
- `applications` - Candidate applications
- `messages` - Interview conversation history
- `evaluations` - AI-generated evaluation scores
- `flags` - Red flags detected during interview

## API Routes
### Auth
- POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/auth/user

### Recruiter (auth-protected)
- POST /api/jobs, GET /api/jobs, GET /api/jobs/:jobId
- GET /api/jobs/:jobId/applications
- GET /api/applications/:appId/report
- PATCH /api/applications/:appId/status

### Candidate (public)
- GET /api/public/job/:jobToken
- POST /api/public/applications
- GET /api/public/applications/:appId/messages
- POST /api/public/applications/:appId/message
- POST /api/public/applications/:appId/submit

## Environment Variables
- DATABASE_URL - PostgreSQL connection
- SESSION_SECRET - Session encryption key
- AI_INTEGRATIONS_OPENAI_API_KEY - Auto-set by Replit AI Integrations
- AI_INTEGRATIONS_OPENAI_BASE_URL - Auto-set by Replit AI Integrations
