# Kenya Election Results Tracker

A comprehensive election results management system built with Next.js 15, Prisma, PostgreSQL (Neon), and Chakra UI v3. Designed for the 2026 Kenya General Election, supporting multi-level results entry from polling station streams up to national-level tallies.

In Kenya elections, each elective seat has its own set of official result declaration forms—similar to the presidential Form 34A, 34B, 34C.

Here’s a clear breakdown for all 6 elective positions:

🇰🇪 1. President
Form 34A – Polling station results
Form 34B – Constituency tally
Form 34C – National tally (final declaration)
🏛️ 2. Governor
Form 37A – Polling station results
Form 37B – Constituency tally
Form 37C – County final results (declaration)
🏗️ 3. Senator
Form 38A – Polling station results
Form 38B – Constituency tally
Form 38C – County final results
🏘️ 4. Member of National Assembly (MP)
Form 35A – Polling station results
Form 35B – Constituency tally (final declaration)

(No “C” form because constituency is the final level for MPs)

🏘️ 5. Woman Representative
Form 36A – Polling station results
Form 36B – Constituency tally
Form 36C – County final results
🗳️ 6. Member of County Assembly (MCA)
Form 33A – Polling station results
Form 33B – Ward tally (final declaration)

## 🗳️ How it works

A stream is basically a subdivision of a polling station (used when voters are many). However:

Voting happens at the stream
Counting is done at the stream
But results are officially recorded at the polling station level
📄 Where stream results go

All stream results are aggregated into the polling station form, for example:

President → Form 34A
MP → Form 35A
Governor → Form 37A
etc.

👉 These “A forms” represent the entire polling station, which may include:

Stream 1
Stream 2
Stream 3
(all combined)
🔍 What happens practically

At the station:

Each stream counts its votes separately
Results from all streams are combined
A single Form XA (e.g., 34A) is filled for the whole polling station

## Features

### Results Entry & Management

- **Stream-level entry (Form A)**: Agents enter raw vote counts per polling station stream
- **Level tally entry (Form B/C)**: Administrators enter aggregated results at ward, constituency, county, and national levels
- **System aggregate comparison**: Automatic aggregation from lower levels with mismatch highlighting
- **Multi-language support**: Forms support multilingual labels
- **Form image upload**: Attach scanned result forms to entries
- **Draft & submit workflow**: Save drafts before final submission

### Data Integrity & Security

- **Authorization guards**: Stream-level entry restricted to assigned agents; level entry restricted to admins
- **Prisma transactions**: All vote entries wrapped in database transactions for atomicity
- **Status tracking**: DRAFT → SUBMITTED → VERIFIED workflow
- **Audit trail**: Track who entered data and when

### Election Hierarchy

- National → County → Constituency → Ward → Polling Station → Stream
- Support for multiple position types (President, Governor, Senator, MP, MCA, etc.)
- Geographic candidate filtering based on aggregation level

### Performance Optimizations

- **Parallel data fetching**: Agent stream results loaded in parallel via `Promise.all`
- **React Query caching**: 5-minute stale time prevents unnecessary re-fetches
- **SQL-level aggregation**: Election-wide results computed via database groupBy operations
- **Debounced search**: Admin stream search with proper useRef-based debouncing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- An S3-compatible storage service (for form image uploads)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   Configure the following:
   - `DATABASE_URL` - PostgreSQL connection string (Neon)
   - `NEXTAUTH_SECRET` - Secret for NextAuth.js
   - `NEXTAUTH_URL` - Your application URL
   - S3 storage credentials for file uploads

3. **Set up the database:**

   ```bash
   npx prisma generate
   npx prisma db push
   # Seed election data (optional)
   npx prisma db seed
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) and log in.**

### User Roles

- **Agent**: Assigned to specific polling station streams, can enter Form A results
- **Admin/Super Admin**: Full access including level tally entry (Forms B & C), hierarchy management, and reporting

## Database Schema

### Core Models

#### Election Hierarchy

- **Election**: Election metadata (title, year, date)
- **County**: 47 counties
- **Constituency**: Electoral constituencies
- **Ward**: Wards within constituencies
- **PollingStation**: Physical polling locations with registered voter counts
- **Stream**: Vote-counting streams within polling stations (A, B, C, etc.)

#### Positions & Candidates

- **ElectionPosition**: Position types (President, Governor, Senator, etc.) with aggregation levels
- **Candidate**: Candidates per position with party affiliation and geographic scope

#### Results Storage

- **StreamResult**: Raw vote counts from polling station streams (Form A)
  - Links to Stream, Position, Agent
  - Stores total votes, rejected votes, notes, form images
  - Status: DRAFT | SUBMITTED | VERIFIED | DISPUTED | REJECTED
- **StreamCandidateVote**: Individual candidate vote counts per stream result
- **LevelResult**: Aggregated tally results (Forms B & C)
  - Stores ward/constituency/county/national level tallies
  - Links to Position, Validator (admin user)
  - Same status workflow as StreamResult
- **LevelCandidateVote**: Candidate vote counts per level result

#### User Management

- **User**: System users (agents, admins, super admins)
- **Role**: User roles with permissions
- **AgentStream**: Assignments linking agents to specific streams

## Architecture & Key Components

### Enter Results Flow

The results entry system is optimized for both agent and admin workflows:

#### Agent Flow (Form A - Stream Entry)

1. **Election Selection**: Auto-select if only one active election
2. **Stream Selection**: View assigned streams grouped by polling station
3. **Position Selection**: Choose position (filtered candidates by geography)
4. **Vote Entry**: Enter votes using the shared `VoteTable` component

#### Admin Flow (Forms A, B, C)

1. **Election Selection**: Choose from all active elections
2. **Tab Selection**: Toggle between "Stream Entry (Form A)" and "Level Tally (Form B/C)"
3. **Stream Search** (Form A): Search any stream across the election
4. **Level Entry** (Forms B/C): 4-step wizard
   - Select aggregation level (Ward/Constituency/County/National)
   - Select entity (which ward/constituency/county)
   - Select position
   - Enter votes with system aggregate comparison

#### Shared VoteTable Component

Centralized vote entry UI (~280 lines) used by both stream and level entry:

- Candidate rows with vote inputs
- Rejected ballots row
- Grand total calculation
- Optional aggregate comparison column (for level entry)
- Notes input
- Form image upload slot
- Save draft / Submit buttons
- Error & success messaging
- Disabled state when submitted

### Server Actions (Authorization & Transactions)

#### `upsertStreamResult` (StreamResults.ts)

- **Authorization**: Verifies agent is assigned to stream OR has admin role
- **Transaction**: Wraps header upsert + vote loop in `prisma.$transaction`
- **Atomic submit**: Sets `submittedAt` when `status === "SUBMITTED"` (no separate call)

#### `upsertLevelResult` (LevelResults.ts)

- **Authorization**: Requires admin/super admin role
- **Transaction**: Same atomic pattern as stream results
- **System aggregate**: `computeAggregateFromStreams` provides comparison data

## Technologies Used

- **Next.js 15.0.5** - React framework with App Router
- **Prisma** - Database ORM with PostgreSQL
- **PostgreSQL (Neon)** - Serverless Postgres database
- **Chakra UI v3** - Component library
- **TanStack React Query** - Server state management
- **NextAuth.js** - Authentication
- **TypeScript** - Type safety
- **React Hook Form + Yup** - Form validation (builder forms)

## Project Structure

```
src/
├── app/
│   ├── (agent)/          # Agent-only routes
│   │   └── enter-results/  # Main results entry flow
│   ├── (backend)/        # Admin routes
│   │   ├── dashboard/
│   │   ├── elections/
│   │   ├── hierarchy/
│   │   └── polling-stations/
│   └── (frontend)/       # Public routes
│       └── election-results/
├── components/
│   ├── Builder/          # Form builder components
│   ├── Generic/          # Reusable UI components
│   └── ...
├── services/             # Server actions
│   ├── StreamResults.ts  # Stream-level results
│   ├── LevelResults.ts   # Level tally results
│   └── ...
├── hooks/
└── types/
```

## Recent Optimizations (April 2026)

1. **Shared VoteTable Component**: Eliminated ~200 lines of duplicated UI code
2. **Prisma Transactions**: All vote entries now atomic (prevents partial writes)
3. **Authorization Guards**: Stream & level entry now properly restricted
4. **Fixed Debounce Bug**: Admin stream search now correctly cancels pending timeouts
5. **Inline Tabs**: Replaced full-page mode picker with inline tab switcher
6. **Parallel Prefetch**: Agent results now load in parallel via `Promise.all`

## License

Proprietary - Kenya Elections 2026
