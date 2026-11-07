
import sqlite3

# Step 1: Connect to the database
connection = sqlite3.connect("database.db")

# Step 2: Create a cursor
cursor = connection.cursor()

# Step 3: Create the customers table
cursor.execute("""
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT,
    total_orders INTEGER
)
""")

# Step 4: Insert sample customer data
customers = [
    ("Shakeela", "Hyderabad", 15),
    ("Rahul", "Mumbai", 20),
    ("Priya", "Bangalore", 12),
    ("Arjun", "Delhi", 25),
]

cursor.executemany("""
INSERT INTO customers (name, city, total_orders)
VALUES (?, ?, ?)
""", customers)

# Step 5: Save changes
connection.commit()

# Step 6: Close the connection
connection.close()

print("Database created successfully!")
