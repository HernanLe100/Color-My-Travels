import os
from dotenv import load_dotenv

# import psycopg <-- is this needed here?
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

load_dotenv()
_DATABASE_URL = os.getenv("DATABASE_URL")

connection_pool = ConnectionPool(conninfo=_DATABASE_URL, timeout=120, kwargs={"row_factory":dict_row}) 
print(connection_pool.connection())

# --------------------------------------------------

# handles escape sequences in input string <s> to prep for SQL queries,
# returns the handled string
def add_escape(s):
    # first make sure to keep existing escapes,
    # then replace % with \% and _ with \_
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

# --------------------------------------------------

# adds a user of <user_id> and <name> to the users table
# does nothing if user already exists
def add_user(user_id, name):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, name)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO NOTHING;
            """, [user_id, name])
        connection.commit()
        

def get_user(user_id):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, name FROM users WHERE user_id = %s;",
                [user_id]
            )
            user = cursor.fetchone()
            return user

# --------------------------------------------------

def add_album(info : dict):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO albums (user_id, location_id, caption)
                VALUES (%s, %s, %s);
                """,
                [
                    info.get("user_id"), 
                    info.get("location_id"), 
                    info.get("caption")
                ]
            )
        connection.commit()
    

def get_albums(user_id):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM albums WHERE user_id = %s::text;",
                [user_id]
            )
            result = cursor.fetchall()
            return result

# --------------------------------------------------

# get location details by <location_id>

def get_location(location_id):
    print("connection:")
    print(connection_pool.connection())
    with connection_pool.connection() as connection:
        print(connection)
        with connection.cursor() as cursor:
            print("here")
            cursor.execute(f"SELECT * FROM locations WHERE location_id = %s;", [location_id])
            result = cursor.fetchall()
            return result

# get locations from <user_id>
def get_locations(user_id):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT locations.* FROM albums
                JOIN locations ON albums.location_id = locations.location_id
                WHERE albums.user_id = %s::text;
                """,
                [user_id]
            )

            result = cursor.fetchall()
            return result
        
# --------------------------------------------------

def get_colors(user_id):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM colors
                WHERE user_id = %s::text
                ORDER BY region_code ASC;
                """,
                [user_id]
            )
            result = cursor.fetchall()
            return result
        
def update_color(info : dict):
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE colors
                SET color = %s
                WHERE user_id = %s
                AND region_code = %s
                AND region_type = %s;
                """,
                [
                    info.get("color"), 
                    info.get("user_id"), 
                    info.get("region_code"),
                    info.get("region_type")
                ]
            )
        connection.commit()
        