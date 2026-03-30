from database.utils import connection_pool as _connection_pool
# --------------------------------------------------

def get_nonce(nonce):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "SELECT username FROM nonces WHERE nonce = %s;"
            cursor.execute(query_str, [nonce])
            table = cursor.fetchall()
            if len(table) == 0:
                return None
            username = table[0][0]
            return username
        
def put_nonce(nonce, sub):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "INSERT INTO nonces (nonce, sub) VALUES (%s, %s);"
            cursor.execute(query_str, [nonce, sub])
            connection.commit()
            
def delete_nonce(nonce):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "DELETE FROM nonces WHERE nonce = %s;"
            cursor.execute(query_str, [nonce])
            connection.commit()
# --------------------------------------------------

def get_userinfo(username):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "SELECT userinfo FROM users WHERE username = %s;"
            cursor.execute(query_str, [username])
            table = cursor.fetchall()
            if len(table) == 0:
                return None
            userinfo = table[0][0]
            return userinfo

def put_userinfo(username, userinfo):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "DELETE FROM users WHERE username = %s;"
            cursor.execute(query_str, [username])
            query_str = "INSERT INTO users (username, userinfo) VALUES (%s, %s);"
            cursor.execute(query_str, [username, userinfo])
            connection.commit()
            
def delete_userinfo(username):
    with _connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            query_str = "DELETE FROM users WHERE username = %s;"
            cursor.execute(query_str, [username])
            connection.commit()
            