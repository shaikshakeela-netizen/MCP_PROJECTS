
import sqlite3
from pathlib import Path

from fastmcp import FastMCP

# Create MCP server
mcp = FastMCP("SQL Database MCP Server")

# Get the database file location
DATABASE_PATH = Path(__file__).parent / "database.db"


# Create the database connection
def get_connection():
    return sqlite3.connect(
        f"file:{DATABASE_PATH}?mode=ro",
        uri=True
    )


# MCP tool to retrieve all customers
@mcp.tool()
def get_customers() -> list[dict]:
    """Retrieve all customers from the database."""

    with get_connection() as connection:

        connection.row_factory = sqlite3.Row

        cursor = connection.cursor()

        cursor.execute("SELECT * FROM customers")

        customers = cursor.fetchall()

        return [dict(customer) for customer in customers]



@mcp.tool()
def run_sql_query(query: str) -> list[dict]:
    """Execute read-only SQL queries and return the results."""

    if not query.strip():
        raise ValueError("Query cannot be empty.")

    def read_only_authorizer(action, arg1, arg2, database, trigger):
        allowed_actions = {
            sqlite3.SQLITE_SELECT,
            sqlite3.SQLITE_READ,
            sqlite3.SQLITE_FUNCTION,
            sqlite3.SQLITE_RECURSIVE,
        }

        if action in allowed_actions:
            return sqlite3.SQLITE_OK

        return sqlite3.SQLITE_DENY

    with get_connection() as connection:
        connection.set_authorizer(read_only_authorizer)
        connection.row_factory = sqlite3.Row

        cursor = connection.execute(query)
        results = cursor.fetchall()

        return [dict(row) for row in results]


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

    with get_connection() as connection:
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

    with get_connection() as connection:
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

    with get_connection() as connection:
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

    with get_connection() as connection:
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

    with get_connection() as connection:
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

    with get_connection() as connection:
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

    with get_connection() as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(query)
        results = cursor.fetchall()

        return [dict(row) for row in results]




# Start the MCP server
if __name__ == "__main__":
    mcp.run()
