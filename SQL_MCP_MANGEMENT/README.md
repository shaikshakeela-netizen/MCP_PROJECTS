# SQL MCP Studio

Intelligent Database Analytics & Management: a React dashboard for a SQLite database served by a FastMCP server.

```
Browser (React)  ──HTTP──▶  FastAPI bridge  ──STDIO / MCP──▶  FastMCP server  ──read-only──▶  SQLite
 frontend/                    bridge/main.py                    mcp_server/server.py             database.db
```

Your MCP server uses STDIO, which a browser cannot talk to. The bridge starts `server.py` as a subprocess, calls its tools with a FastMCP client, and returns JSON. The bridge never opens `database.db` itself; every database operation is an MCP tool call.

## Verification status (please read)

This project was written in an environment with no internet access, so **the frontend and the bridge have not been run**. What was and was not checked:

| Part | Status |
| --- | --- |
| `mcp_server/server.py` hardening (read-only, row cap, timeout, function allowlist) | Tested against your real `database.db` using a stand-in for `fastmcp`. Writes, `PRAGMA`, `ATTACH`, multi-statement SQL, `zeroblob` and a runaway recursive query were all rejected; the 8 other tools returned the expected shapes. |
| `bridge/main.py` | Syntax checked only. The FastMCP client calls and result unwrapping have **not** run against a real client. |
| `frontend/` | Parsed by TypeScript with no syntax errors and all imports resolve to real files. `npm install`, `npm run build` and the UI have **not** been run. |

Expect to fix a few small things on the first run (most likely a version mismatch or a type error). The commands below will show them.

## What changed in your backend

Your original `server.py` is not modified. `mcp_server/server.py` is a copy with the same nine tools. Only `run_sql_query` changed, and `run_sql_query(query)` still works:

- Optional `max_rows` argument (default 500, hard limit 1,000).
- 3-second time limit, 10,000-character query limit.
- The authorizer now allows only an explicit list of SQL functions (the old one allowed every function, including ones that can allocate gigabytes).
- Cleaner error messages (no raw SQLite errors for denied statements).
- Connections are now closed after each call.

Read-only safety does not rely on checking for `SELECT`: the database is opened with `mode=ro` and every statement passes SQLite's authorizer.

## Setup

You need Python 3.10+ and Node.js 18+.

### 1. Backend (bridge + MCP server)

```bash
cd sql-mcp-studio
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r mcp_server/requirements.txt -r bridge/requirements.txt

cd bridge
uvicorn main:app --port 8000
```

On Windows, do **not** add `--reload`: it switches Python to an event loop that cannot start the MCP subprocess.

If `mcp_server/database.db` is missing, create it once with `cd mcp_server && python setup_database.py`.

Check it works: open <http://127.0.0.1:8000/api/health>. You should see `"mcp_connected": true` and nine tool names. Interactive API docs are at <http://127.0.0.1:8000/docs>.

### 2. Frontend

In a second terminal:

```bash
cd sql-mcp-studio/frontend
npm install
npm run dev
```

Open <http://localhost:5173>. In development, Vite forwards `/api` to the bridge on port 8000, so no CORS setup is needed.

### Configuration

| Variable | Where | Default | Purpose |
| --- | --- | --- | --- |
| `MCP_SERVER_PATH` | bridge | `../mcp_server/server.py` | Which MCP server script to launch |
| `CORS_ORIGINS` | bridge | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins (only needed when not using the Vite proxy) |
| `VITE_PROXY_TARGET` | frontend | `http://127.0.0.1:8000` | Where the dev server forwards `/api` |
| `VITE_API_URL` | frontend | empty (same origin) | Absolute bridge URL for deployed builds |

### Build and type check

```bash
cd frontend
npm run typecheck
npm run build        # runs tsc, then vite build, output in frontend/dist
npm run preview
```

The SQL editor (Monaco) loads its files from a CDN, so the SQL Playground needs internet access the first time it opens.

## Testing it by hand

1. **Dashboard**: figures should match `SELECT COUNT(*), SUM(total_orders) FROM customers`. Each card names the MCP tool behind it.
2. **Explorer**: pick `customers`, check the schema, switch to Data.
3. **SQL Playground**: run `SELECT * FROM customers;`, then try `DROP TABLE customers;` and `PRAGMA table_info(customers);`. Both should be rejected with a read-only message.
4. **Data Quality**: all checks are clear on the sample data. To see the non-empty states, add bad rows to a *copy* of the database.
5. **Settings**: stop the bridge to see the "API unreachable" state; restart it and press Reconnect or Refresh.

## Project layout

```
mcp_server/   server.py (hardened copy), setup_database.py, database.db
bridge/       main.py: FastAPI app, MCP client lifecycle, JSON endpoints
frontend/src/
  components/  layout/ ui/ dashboard/ analytics/ database/ sql-editor/
  pages/       one file per sidebar item
  services/    api.ts: the only place that calls fetch
  hooks/       useApi (loading/error/refresh), useQueryHistory, useCopy
  context/     StudioContext: connection state and the global refresh
  types/       shapes of the API responses
```

### Bridge endpoints

| Endpoint | MCP tool |
| --- | --- |
| `GET /api/summary` | `get_customer_summary` |
| `GET /api/cities` | `get_city_order_summary` |
| `GET /api/top-customers?limit=` | `get_top_customers` |
| `GET /api/customers` | `get_customers` |
| `GET /api/quality` | `check_customer_data_quality` + `find_duplicate_customers` |
| `GET /api/tables` | `list_tables` |
| `GET /api/tables/{name}/schema` | `describe_table` (+ a `COUNT(*)` via `run_sql_query`) |
| `GET /api/tables/{name}/rows` | `run_sql_query` |
| `POST /api/query` | `run_sql_query` |
| `GET /api/health`, `GET /api/tools`, `POST /api/reconnect` | connection info and `list_tools` |

## Design notes and limits

- The duration shown in the playground is the measured round trip from the bridge to the MCP server and back, not database execution time.
- Query history is stored in the browser's `localStorage`: SQL text, time, status and row count only.
- Duplicate detection compares name and city after trimming and lowercasing. It is a heuristic and is labelled as such in the UI.
- There is no authentication. Run the bridge on localhost; do not expose it to the internet as-is.
- Tailwind v3 is used with hand-written components in the shadcn/ui style (no CLI step); the shadcn CLI was not used.
