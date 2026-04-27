import os
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
import cloudinary
import cloudinary.uploader
import cloudinary.api
import json

load_dotenv()
_DATABASE_URL = os.getenv("DATABASE_URL")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

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
        
def delete_user(user_id):
    try:
        with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM users WHERE user_id = %s;",
                    [user_id]
                )
            connection.commit()

        # Run Cloudinary AFTER commit
        try:
            cloudinary.api.delete_resources_by_prefix(f"user/{user_id}/")
            cloudinary.api.delete_folder(f"user/{user_id}")
        except Exception as e:
            print("Cloudinary error:", e)

        return {"message": "User deleted"}, 200

    except Exception as e:
        print("DELETE USER ERROR:", e)
        return {"error": str(e)}, 500

def send_friend_request(sender_id, receiver_id):
    if sender_id == receiver_id:
        return {"error": "Cannot friend yourself"}

    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:

            # Check if already friends
            cursor.execute(
                """
                SELECT 1 FROM friendships
                WHERE user_id = %s AND friend_id = %s;
                """,
                [sender_id, receiver_id]
            )
            if cursor.fetchone():
                return {"error": "Already friends"}

            # Check if request already exists
            cursor.execute(
                """
                SELECT status FROM friend_requests
                WHERE sender_id = %s AND receiver_id = %s;
                """,
                [sender_id, receiver_id]
            )
            existing = cursor.fetchone()

            if existing:
                return {"error": f"Request already {existing['status']}"}

            # Insert new request
            cursor.execute(
                """
                INSERT INTO friend_requests (sender_id, receiver_id, status)
                VALUES (%s, %s, 'pending');
                """,
                [sender_id, receiver_id]
            )

        connection.commit()

    return {"success": True}

def accept_friend_request(sender_id, receiver_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:

            # Update request
            cursor.execute(
                """
                UPDATE friend_requests
                SET status = 'accepted'
                WHERE sender_id = %s AND receiver_id = %s
                RETURNING *;
                """,
                [sender_id, receiver_id]
            )

            if not cursor.fetchone():
                return {"error": "Request not found"}

            # Insert BOTH directions!!!!!!!!!!
            cursor.execute(
                """
                INSERT INTO friendships (user_id, friend_id)
                VALUES (%s, %s), (%s, %s)
                ON CONFLICT DO NOTHING;
                """,
                [sender_id, receiver_id, receiver_id, sender_id]
            )

        connection.commit()

    return {"success": True}

def reject_friend_request(sender_id, receiver_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE friend_requests
                SET status = 'rejected'
                WHERE sender_id = %s AND receiver_id = %s;
                """,
                [sender_id, receiver_id]
            )
        connection.commit()

    return {"success": True}

def get_incoming_requests(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT fr.sender_id, u.name
                FROM friend_requests fr
                JOIN users u ON fr.sender_id = u.user_id
                WHERE fr.receiver_id = %s AND fr.status = 'pending';
                """,
                [user_id]
            )
            return cursor.fetchall()


def get_sent_requests(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT fr.receiver_id, u.name
                FROM friend_requests fr
                JOIN users u ON fr.receiver_id = u.user_id
                WHERE fr.sender_id = %s AND fr.status = 'pending';
                """,
                [user_id]
            )
            return cursor.fetchall()


def cancel_friend_request(sender_id, receiver_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                DELETE FROM friend_requests
                WHERE sender_id = %s AND receiver_id = %s AND status = 'pending';
                """,
                [sender_id, receiver_id]
            )
        connection.commit()
    return {"success": True}


def delete_friend(user_id, friend_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                DELETE FROM friendships
                WHERE (user_id = %s AND friend_id = %s)
                   OR (user_id = %s AND friend_id = %s);
                """,
                [user_id, friend_id, friend_id, user_id]
            )
            cursor.execute(
                """
                DELETE FROM friend_requests
                WHERE (sender_id = %s AND receiver_id = %s)
                   OR (sender_id = %s AND receiver_id = %s);
                """,
                [user_id, friend_id, friend_id, user_id]
            )
        connection.commit()
    return {"success": True}


def get_friends(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.name
                FROM friendships f
                JOIN users u ON f.friend_id = u.user_id
                WHERE f.user_id = %s;
                """,
                [user_id]
            )
            return cursor.fetchall()

# --------------------------------------------------

def upload_image(file, user_id, album_id, caption=""):
    try:
        # 1. Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder=f"users/{user_id}",
        )

        image_data = {
            "id": result["public_id"],
            "caption": caption or "",
        }

        # 2. Save into DB
        with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
            with connection.cursor(row_factory=dict_row) as cursor:

                # Append to pages JSON array
                cursor.execute(
                    """
                    UPDATE albums
                    SET pages = 
                        (
                            CASE 
                                WHEN jsonb_typeof(pages) = 'array' THEN pages
                                ELSE '[]'::jsonb
                            END
                        ) || %s::jsonb
                    WHERE album_id = %s AND user_id = %s;
                    """,
                    [json.dumps([image_data]), album_id, user_id],
                )

            connection.commit()

        return {
            "id": result["public_id"],
            "url": result["secure_url"],
        }

    except Exception as e:
        print("Upload failed:", e)
        return None

def add_album(info : dict):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO albums2 (user_id, lat, lng, place_id, name, notes, pages, start_date, end_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                RETURNING album_id;
                """,
                [
                    info.get("user_id"),
                    info.get("lat"),
                    info.get("lng"),
                    info.get("place_id"),
                    info.get("name"),
                    info.get("notes"),
                    info.get("pages", "[]"),
                    info.get("start_date"),
                    info.get("end_date"),
                ]
            )

            album_id = cursor.fetchone()["album_id"]
            place_id = info.get("place_id")

            # get location information 
            cursor.execute(
                """
                SELECT part_of
                FROM locations2
                WHERE place_id = %s;
                """,
                [place_id]
            )
            
            country = cursor.fetchone()
            country_place_id = country["part_of"]
            
            user_id = info.get("user_id")

            # insert country if it does not already exist
            cursor.execute(
                """
                INSERT INTO colors2 (place_id, user_id, color, type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, place_id) DO NOTHING;
                """,
                [
                    country_place_id,
                    user_id,
                    "#FF5733",
                    0
                ]
            )

            # insert adm1 if it does not already exist
            cursor.execute(
                """
                INSERT INTO colors2 (place_id, user_id, color, type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (user_id, place_id) DO NOTHING;
                """,
                [
                    place_id,
                    user_id,
                    "#FF5733",
                    1
                ]
            )
                
        connection.commit()
    return album_id

def update_album(original:dict, modified:dict):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            
            deleted_pages = []
            for page in original.get("pages"):
                if page not in modified.get("pages"):
                    deleted_pages.append(page)
            for page in deleted_pages:
                if "id" in page:
                    cloudinary.uploader.destroy(page["id"], invalidate=True)

            # Update directly
            cursor.execute(
                """
                UPDATE albums2
                SET name = %s,
                    notes = %s,
                    start_date = %s,
                    end_date = %s,
                    pages = %s
                WHERE album_id = %s AND user_id = %s;
                """,
                [
                    modified.get("name"),
                    
                    modified.get("notes"),
                    modified.get("start_date"),
                    modified.get("end_date"),
                    json.dumps(modified.get("pages")),
                    modified.get("album_id"),
                    modified.get("user_id"),
                ],
            )
        connection.commit()

def delete_album(info: dict):
    album_id = info.get("album_id")
    user_id = info.get("user_id")

    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT pages
                FROM albums2 a
                JOIN locations2 l ON a.place_id = l.place_id
                WHERE a.album_id = %s AND a.user_id = %s;  
                """,
                [album_id, user_id]
            )
            pages = cursor.fetchone()["pages"]
            for p in pages:
                if "id" in p:
                    cloudinary.uploader.destroy(p["id"], invalidate=True)

            cursor.execute(
                """
                DELETE FROM albums2 
                WHERE album_id = %s AND user_id = %s
                RETURNING place_id;
                """,
                [album_id, user_id]
            )
            place_id = cursor.fetchone()[0]
            
            if place_id:
                # check/delete location from colors table
                cursor.execute(
                    """
                    SELECT COUNT(*) as cnt, l.part_of as country
                    FROM albums2 a
                    JOIN locations2 l ON a.place_id = l.place_id
                    WHERE a.user_id = %s AND a.place_id = %s
                    GROUP BY l.part_of;
                    """,
                    [user_id, place_id]
                )
                result = cursor.fetchone()
                if result["cnt"] == 0:
                    cursor.execute(
                        """DELETE FROM colors2 
                        WHERE user_id = %s AND place_id = %s;
                        """,
                        [user_id, place_id]
                    )
                
                country_place_id = result["country"]
                cursor.execute(
                    """
                    SELECT COUNT(*) as cnt
                    FROM albums2 a
                    JOIN locations2 l ON a.place_id = l.place_id
                    WHERE a.user_id = %s AND l.part_of = %s;
                    """,
                    [user_id, country_place_id]
                )
                if cursor.fetchone()["cnt"]:
                    cursor.execute(
                        """DELETE FROM colors2 
                        WHERE user_id = %s AND place_id = %s;
                        """,
                        [user_id, country_place_id]
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

# do we need album id AND user id?
def get_album(user_id, album_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT user_id, album_id, name, location_id, notes, pages, start_date, end_date
                FROM albums
                WHERE album_id = %s AND user_id = %s;
                """,
                [album_id, user_id]
            )
            return cursor.fetchone()


# so that users can see albums from friends
def get_friends_albums(user_id):
    with psycopg.connect(_DATABASE_URL, connect_timeout=5) as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT a.*, u.name AS friend_name,
                       l.city AS location_city,
                       l.adm1 AS location_adm1,
                       l.country AS location_country
                FROM albums a
                JOIN users u ON a.user_id = u.user_id
                JOIN locations l ON a.location_id = l.location_id
                WHERE a.user_id IN (
                    SELECT friend_id
                    FROM friendships
                    WHERE user_id = %s
                )
                ORDER BY a.start_date DESC;
                """,
                [user_id]
            )
            return cursor.fetchall()

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
        