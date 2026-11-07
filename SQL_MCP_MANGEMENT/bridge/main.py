"""HTTP bridge between the React frontend and the FastMCP server.

The browser cannot speak STDIO, so this service starts the MCP server as a
subprocess, talks to it with a FastMCP client, and exposes the tool results as
JSON. It never opens the SQLite file itself: every database operation is an
MCP tool call.
"""

import asyncio
import json
import logging
import os
import re
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from fastmcp import Client
from fastmcp.client.transports import PythonStdioTransport
from fastmcp.exceptions import ToolError

log = logging.getLogger("sql-mcp-studio")
logging.basicConfig(level=logging.INFO)

SERVER_PATH = Path(
    os.getenv("MCP_SERVER_PATH", Path(__file__).resolve().parent.parent / "mcp_server" / "server.py")
)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]
QUERY_ROW_LIMIT = 500
CONNECT_TIMEOUT_SECONDS = 20

# Removes filesystem paths from error text before it reaches the browser.
PATH_PATTERN = re.compile(r"(?:[A-Za-z]:\\|/)(?:[\w.\- ]+[\\/])+[\w.\-]*")


def clean_message(text: str) -> str:
    text = re.sub(r"^Error calling tool '[^']*':\s*", "", text.strip())
    return PATH_PATTERN.sub("[path]", text)[:500]


def extract(result: Any) -> Any:
    """Turn a FastMCP CallToolResult into plain JSON-compatible data."""

    structured = getattr(result, "structured_content", None)
    if structured is not None:
        if isinstance(structured, dict) and set(structured.keys()) == {"result"}:
            return structured["result"]
        return structured

    data = getattr(result, "data", None)
    if data is not None:
        return data

    parsed = []
    for block in getattr(result, "content", None) or []:
        text = getattr(block, "text", None)
        if text is None:
            continue
        try:
            parsed.append(json.loads(text))
        except ValueError:
            parsed.append(text)
    if len(parsed) == 1:
        return parsed[0]
    return parsed


class McpConnection:
    """Owns the MCP client in one long-lived task so it opens and closes cleanly."""

    def __init__(self) -> None:
        self.client: Client | None = None
        self.tools: list[Any] = []
        self.error: str | None = None
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()
        self._ready = asyncio.Event()

    async def _run(self) -> None:
        try:
            transport = PythonStdioTransport(str(SERVER_PATH), python_cmd=sys.executable)
            async with Client(transport) as client:
                self.client = client
                self.tools = await client.list_tools()
                self.error = None
                self._ready.set()
                await self._stop.wait()
        except Exception:
            log.exception("MCP connection failed")
            self.error = "Could not start or reach the MCP server."
        finally:
            self.client = None
            self._ready.set()

    async def connect(self) -> None:
        await self.close()
        self._stop = asyncio.Event()
        self._ready = asyncio.Event()
        self.error = None
        self._task = asyncio.create_task(self._run())
        try:
            await asyncio.wait_for(self._ready.wait(), CONNECT_TIMEOUT_SECONDS)
        except asyncio.TimeoutError:
            self.error = "Timed out while starting the MCP server."

    async def close(self) -> None:
        if self._task is not None:
            self._stop.set()
            try:
                await asyncio.wait_for(self._task, 5)
            except Exception:
                self._task.cancel()
            self._task = None
        self.client = None

    async def call(self, name: str, arguments: dict[str, Any] | None = None) -> Any:
        if self.client is None:
            await self.connect()
        if self.client is None:
            raise HTTPException(503, self.error or "MCP server is not connected.")
        try:
            result = await self.client.call_tool(name, arguments or {})
        except ToolError as exc:
            raise HTTPException(400, clean_message(str(exc))) from None
        except Exception:
            log.exception("MCP call failed: %s", name)
            raise HTTPException(502, "The MCP server did not respond. Try reconnecting from Settings.") from None
        return extract(result)


mcp = McpConnection()


@asynccontextmanager
async def lifespan(_: FastAPI):
    await mcp.connect()
    yield
    await mcp.close()


app = FastAPI(title="SQL MCP Studio bridge", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def as_list(value: Any) -> list:
    return value if isinstance(value, list) else []


# ---- Health and metadata ---------------------------------------------------

@app.get("/api/health")
async def health():
    connected = mcp.client is not None
    return {
        "bridge": "ok",
        "mcp_connected": connected,
        "mcp_error": None if connected else mcp.error,
        "server_name": "SQL Database MCP Server",
        "database_type": "SQLite",
        "tools": [tool.name for tool in mcp.tools],
    }


@app.get("/api/tools")
async def tools():
    return [{"name": tool.name, "description": (tool.description or "").strip()} for tool in mcp.tools]


@app.post("/api/reconnect")
async def reconnect():
    await mcp.connect()
    if mcp.client is None:
        raise HTTPException(503, mcp.error or "Could not reconnect.")
    return {"mcp_connected": True, "tools": [tool.name for tool in mcp.tools]}


# ---- Analytics -------------------------------------------------------------

@app.get("/api/summary")
async def summary():
    return await mcp.call("get_customer_summary")


@app.get("/api/cities")
async def cities():
    return as_list(await mcp.call("get_city_order_summary"))


@app.get("/api/top-customers")
async def top_customers(limit: int = Query(5, ge=1, le=100)):
    return as_list(await mcp.call("get_top_customers", {"limit": limit}))


@app.get("/api/customers")
async def customers():
    return as_list(await mcp.call("get_customers"))


@app.get("/api/quality")
async def quality():
    report, duplicates = await asyncio.gather(
        mcp.call("check_customer_data_quality"),
        mcp.call("find_duplicate_customers"),
    )
    return {"summary": report, "duplicates": as_list(duplicates)}


# ---- Database explorer -----------------------------------------------------

async def require_table(name: str) -> str:
    tables = as_list(await mcp.call("list_tables"))
    if name not in tables:
        raise HTTPException(404, "Table does not exist in the database.")
    return name


def quote_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


@app.get("/api/tables")
async def tables():
    return as_list(await mcp.call("list_tables"))


@app.get("/api/tables/{name}/schema")
async def table_schema(name: str):
    await require_table(name)
    columns, count = await asyncio.gather(
        mcp.call("describe_table", {"table_name": name}),
        mcp.call("run_sql_query", {"query": f"SELECT COUNT(*) AS row_count FROM {quote_identifier(name)}", "max_rows": 1}),
    )
    rows = as_list(count)
    return {"columns": as_list(columns), "row_count": rows[0]["row_count"] if rows else None}


@app.get("/api/tables/{name}/rows")
async def table_rows(name: str, limit: int = Query(100, ge=1, le=QUERY_ROW_LIMIT)):
    await require_table(name)
    rows = as_list(
        await mcp.call(
            "run_sql_query",
            {"query": f"SELECT * FROM {quote_identifier(name)}", "max_rows": limit + 1},
        )
    )
    return {"rows": rows[:limit], "truncated": len(rows) > limit, "limit": limit}


# ---- SQL playground --------------------------------------------------------

class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10_000)


@app.post("/api/query")
async def run_query(payload: QueryRequest):
    if not payload.query.strip():
        raise HTTPException(400, "Query cannot be empty.")

    started = time.perf_counter()
    rows = as_list(
        await mcp.call("run_sql_query", {"query": payload.query, "max_rows": QUERY_ROW_LIMIT + 1})
    )
    duration_ms = round((time.perf_counter() - started) * 1000, 1)

    columns = list(rows[0].keys()) if rows else []
    return {
        "columns": columns,
        "rows": rows[:QUERY_ROW_LIMIT],
        "row_count": min(len(rows), QUERY_ROW_LIMIT),
        "truncated": len(rows) > QUERY_ROW_LIMIT,
        "row_limit": QUERY_ROW_LIMIT,
        "duration_ms": duration_ms,  # round trip through the bridge and MCP server
    }
