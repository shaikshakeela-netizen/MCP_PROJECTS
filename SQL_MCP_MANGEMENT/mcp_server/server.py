"""SQL Database MCP Server (hardened copy).

Same nine tools as the original server. The only behavioural changes are in
`run_sql_query`, which now has a row cap, a time limit, a function allowlist
and cleaner error messages. Its original call `run_sql_query(query)` still works.
"""

import sqlite3
import time
from contextlib import closing
from pathlib import Path

from fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("SQL Database MCP Server")

# Get the database file location
DATABASE_PATH = Path(__file__).parent / "database.db"

# ---- Limits for run_sql_query -------------------------------------------
MAX_QUERY_LENGTH = 10_000
DEFAULT_MAX_ROWS = 500
HARD_MAX_ROWS = 1_000
QUERY_TIMEOUT_SECONDS = 3.0

# Only these SQL functions may be called from run_sql_query. Functions that can
# allocate huge amounts of memory (zeroblob, randomblob, printf) are left out.
ALLOWED_FUNCTIONS = {
    "count", "sum", "avg", "min", "max", "total", "group_concat",
    "abs", "round", "length", "lower", "upper", "trim", "ltrim", "rtrim",
    "substr", "substring", "replace", "instr", "coalesce", "ifnull", "nullif",
    "iif", "typeof", "like", "glob", "hex", "quote", "sign", "random",
    "date", "time", "datetime", "julianday", "strftime",
    "row_number", "rank", "dense_rank", "ntile", "lag", "lead",
    "first_value", "last_value",
}


# Create a read-only database connection
def get_connection():
    return sqlite3.connect(
        f"file:{DATABASE_PATH}?mode=ro",
        uri=True
    )


# MCP tool to retrieve all customers
@mcp.tool()
def get_customers() -> list[dict]:
    """Retrieve all customers from the database."""

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM customers")
        customers = cursor.fetchall()
        return [dict(customer) for customer in customers]


def _read_only_authorizer(action, arg1, arg2, database, trigger):
    """Allow only reading data. Everything else is denied by default."""

    if action in (
        sqlite3.SQLITE_SELECT,
        sqlite3.SQLITE_READ,
        sqlite3.SQLITE_RECURSIVE,
    ):
        return sqlite3.SQLITE_OK

    if action == sqlite3.SQLITE_FUNCTION:
        name = (arg2 or arg1 or "").lower()
        return sqlite3.SQLITE_OK if name in ALLOWED_FUNCTIONS else sqlite3.SQLITE_DENY

    return sqlite3.SQLITE_DENY


@mcp.tool()
def run_sql_query(query: str, max_rows: int = DEFAULT_MAX_ROWS) -> list[dict]:
    """Execute a read-only SQL query and return at most max_rows rows (1-1000)."""

    if not query or not query.strip():
        raise ValueError("Query cannot be empty.")

    if len(query) > MAX_QUERY_LENGTH:
        raise ValueError(f"Query is too long (maximum {MAX_QUERY_LENGTH} characters).")

    max_rows = max(1, min(int(max_rows), HARD_MAX_ROWS))
    deadline = time.monotonic() + QUERY_TIMEOUT_SECONDS

    try:
        with closing(get_connection()) as connection:
            # Cap the size of any single value or statement SQLite will build.
            if hasattr(connection, "setlimit"):
                connection.setlimit(sqlite3.SQLITE_LIMIT_LENGTH, 1_000_000)
                connection.setlimit(sqlite3.SQLITE_LIMIT_SQL_LENGTH, MAX_QUERY_LENGTH)

            connection.set_authorizer(_read_only_authorizer)
            # A non-zero return value from the progress handler aborts the query.
            connection.set_progress_handler(
                lambda: 1 if time.monotonic() > deadline else 0, 10_000
            )
            connection.row_factory = sqlite3.Row

            cursor = connection.execute(query)
            results = cursor.fetchmany(max_rows)
            return [dict(row) for row in results]

    except sqlite3.Error as error:
        message = str(error)
        if "not authorized" in message:
            raise ValueError(
                "Only read-only SELECT queries with standard functions are allowed."
            ) from None
        if "interrupted" in message:
            raise ValueError(
                f"Query stopped after {QUERY_TIMEOUT_SECONDS:g} seconds. Try a narrower query."
            ) from None
        raise ValueError(f"SQL error: {message}") from None


@mcp.tool()
def list_tables() -> list[str]:
    """List all tables available in the SQLite database."""

    query = """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    """

    with closing(get_connection()) as connection:
        cursor = connection.execute(query)
        tables = cursor.fetchall()
        return [row[0] for row in tables]


@mcp.tool()
def describe_table(table_name: str) -> list[dict]:
    """Describe the columns, data types, and primary keys of a database table."""

    allowed_tables = list_tables()

    if table_name not in allowed_tables:
        raise ValueError("Table does not exist in the database.")

    query = f"PRAGMA table_info('{table_name}')"

    with closing(get_connection()) as connection:
        cursor = connection.execute(query)
        columns = cursor.fetchall()

        return [
            {
                "column_name": column[1],
                "data_type": column[2],
                "not_null": bool(column[3]),
                "primary_key": bool(column[5])
            }
            for column in columns
        ]


@mcp.tool()
def get_customer_summary() -> dict:
    """Return business summary metrics for the customer database."""

    query = """
        SELECT
            COUNT(*) AS total_customers,
            COALESCE(SUM(total_orders), 0) AS total_orders,
            COALESCE(AVG(total_orders), 0) AS average_orders,
            COALESCE(MAX(total_orders), 0) AS highest_orders
        FROM customers
    """

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query)
        result = cursor.fetchone()
        return dict(result)


@mcp.tool()
def get_city_order_summary() -> list[dict]:
    """Summarize customer count and total orders by city."""

    query = """
        SELECT
            COALESCE(city, 'Unknown') AS city,
            COUNT(*) AS total_customers,
            SUM(COALESCE(total_orders, 0)) AS total_orders
        FROM customers
        GROUP BY city
        ORDER BY total_orders DESC
    """

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query)
        results = cursor.fetchall()
        return [dict(row) for row in results]


@mcp.tool()
def get_top_customers(limit: int = 5) -> list[dict]:
    """Return the top customers ranked by total orders."""

    if limit < 1 or limit > 100:
        raise ValueError("Limit must be between 1 and 100.")

    query = """
        SELECT
            id,
            name,
            city,
            total_orders
        FROM customers
        ORDER BY total_orders DESC, id ASC
        LIMIT ?
    """

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query, (limit,))
        results = cursor.fetchall()
        return [dict(row) for row in results]


@mcp.tool()
def check_customer_data_quality() -> dict:
    """Check customer records for missing values and invalid order counts."""

    query = """
        SELECT
            COUNT(*) AS total_records,

            SUM(CASE
                WHEN name IS NULL OR TRIM(name) = ''
                THEN 1 ELSE 0
            END) AS missing_names,

            SUM(CASE
                WHEN city IS NULL OR TRIM(city) = ''
                THEN 1 ELSE 0
            END) AS missing_cities,

            SUM(CASE
                WHEN total_orders IS NULL
                THEN 1 ELSE 0
            END) AS missing_order_counts,

            SUM(CASE
                WHEN total_orders < 0
                THEN 1 ELSE 0
            END) AS negative_order_counts

        FROM customers
    """

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query)
        result = cursor.fetchone()
        return dict(result)


@mcp.tool()
def find_duplicate_customers() -> list[dict]:
    """Find possible duplicate customers based on name and city."""

    query = """
        SELECT
            name,
            city,
            COUNT(*) AS duplicate_count
        FROM customers
        WHERE name IS NOT NULL
          AND TRIM(name) != ''
        GROUP BY LOWER(TRIM(name)), LOWER(TRIM(city))
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC
    """

    with closing(get_connection()) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query)
        results = cursor.fetchall()
        return [dict(row) for row in results]


# Start the MCP server
if __name__ == "__main__":
    mcp.run()
