import os
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

load_dotenv()
_DATABASE_URL = os.getenv("DATABASE_URL")


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
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, name)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO NOTHING;
            """, [user_id, name])
        connection.commit()
        

def get_user(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT user_id, name FROM users WHERE user_id = %s;",
                [user_id]
            )
            user = cursor.fetchone()
            return user

# --------------------------------------------------

def add_album(info : dict):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO albums (user_id, location_id, notes, start_date, end_date, name)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING location_id;
                """,
                [
                    info.get("user_id"),
                    info.get("location_id"),
                    info.get("notes"),
                    info.get("start_date"),
                    info.get("end_date"),
                    info.get("name"),
                ]
            )

            location_id = cursor.fetchone()["location_id"]

            # get location information
            cursor.execute(
                """
                SELECT country, adm1
                FROM locations
                WHERE location_id = %s;
                """,
                [location_id]
            )

            location = cursor.fetchone()
            country = location["country"]
            adm1 = location["adm1"]
            user_id = info.get("user_id")

            if adm1:
                region_code = adm1
                region_type = "adm1"
            else:
                region_code = country
                region_type = "country"

            # insert country if it does not already exist
            cursor.execute(
                """
                INSERT INTO colors (region_code, color, region_type, user_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, region_code) DO NOTHING;
                """,
                [
                    country,
                    "#FF5733",
                    "country",
                    user_id,
                ]
            )

            # insert adm1 if it does not already exist
            if adm1:
                cursor.execute(
                    """
                    INSERT INTO colors (region_code, color, region_type, user_id)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, region_code) DO NOTHING;
                    """,
                    [
                        adm1,
                        "#FF5733",
                        "adm1",
                        user_id,
                    ]
                )
                
        connection.commit()


def update_album(info: dict):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                UPDATE albums
                SET name = %s, notes = %s, start_date = %s, end_date = %s
                WHERE album_id = %s AND user_id = %s;
                """,
                [
                    info.get("name"),
                    info.get("notes"),
                    info.get("start_date"),
                    info.get("end_date"),
                    info.get("album_id"),
                    info.get("user_id"),
                ]
            )
        connection.commit()

def delete_album(info: dict):
    album_id = info.get("album_id")
    user_id = info.get("user_id")

    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT l.country, l.adm1
                FROM albums a
                JOIN locations l ON a.location_id = l.location_id
                WHERE a.album_id = %s AND a.user_id = %s;
                """,
                [album_id, user_id]
            )
            location = cursor.fetchone()

            cursor.execute(
                """
                DELETE FROM albums 
                WHERE album_id = %s AND user_id = %s;
                """,
                [album_id, user_id]
            )

            if location:
                country = location["country"]
                adm1 = location["adm1"]

                cursor.execute(
                    """
                    SELECT COUNT(*) AS cnt 
                    FROM albums a
                    JOIN locations l ON a.location_id = l.location_id
                    WHERE a.user_id = %s AND l.country = %s;
                    """,
                    [user_id, country]
                )
                if cursor.fetchone()["cnt"] == 0:
                    cursor.execute(
                        """
                        DELETE FROM colors 
                        WHERE user_id = %s AND region_code = %s 
                        AND region_type = 'country';
                        """,
                        [user_id, country]
                    )

                if adm1:
                    cursor.execute(
                        """
                        SELECT COUNT(*) AS cnt 
                        FROM albums a
                        JOIN locations l ON a.location_id = l.location_id
                        WHERE a.user_id = %s AND l.adm1 = %s;
                        """,
                        [user_id, adm1]
                    )
                    if cursor.fetchone()["cnt"] == 0:
                        cursor.execute(
                            """DELETE FROM colors 
                            WHERE user_id = %s AND region_code = %s 
                            AND region_type = 'adm1';
                            """,
                            [user_id, adm1]
                        )

        connection.commit()

def ensure_location(info: dict):
    """Return location_id for an existing row matching city/country/adm1, else insert."""
    city = info.get("city")
    country = info.get("country")
    adm1 = info.get("adm1")
    lat = info.get("lat")
    lng = info.get("lng")

    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT location_id FROM locations
                WHERE city = %s AND country = %s
                  AND (adm1 IS NOT DISTINCT FROM %s)
                LIMIT 1;
                """,
                [city, country, adm1],
            )
            row = cursor.fetchone()
            if row:
                return row["location_id"]

            cursor.execute(
                """
                INSERT INTO locations (lat, lng, country, adm1, city)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING location_id;
                """,
                [lat, lng, country, adm1, city],
            )
            row = cursor.fetchone()
        connection.commit()
        return row["location_id"]
    

def get_albums(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT * FROM albums WHERE user_id = %s::text;",
                [user_id]
            )
            result = cursor.fetchall()
            return result

# --------------------------------------------------

# get location details by <location_id>
def get_location(location_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(f"SELECT * FROM locations WHERE location_id = %s;", [location_id])
            result = cursor.fetchall()
            return result

# get locations from <user_id>
def get_locations(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
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
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
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
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
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
        