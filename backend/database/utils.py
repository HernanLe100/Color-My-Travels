import os
from dotenv import load_dotenv

# import psycopg <-- is this needed here?
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

# starts search from where program is started --> backend/
load_dotenv()

_DATABASE_URL = os.getenv("DATABASE_URL")

# the connection pool
connection_pool = ConnectionPool(conninfo=_DATABASE_URL, kwargs={"row_factory":dict_row}) 


# handles escape sequences in input string <s> to prep for SQL queries,
# returns the handled string
def add_escape(s):
    # first make sure to keep existing escapes,
    # then replace % with \% and _ with \_
    return s.replace("\\", "\\\\")\
        .replace("%", "\\%").replace("_", "\\_")


