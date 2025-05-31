from db.db_controler import PostgresConnector
from insert_data_into_table import insert_photos_to_db
import base64


def database_connection(func):
    def wrap(*args, **kwargs):
        with PostgresConnector(
            dbname='mydatabase',  
            user='myuser',        
            password='mypassword', 
            host="127.0.0.1" if "auto_test" in kwargs.keys() and kwargs["auto_test"] == True else "db"
        ) as db:
            return func(*args, **kwargs, db=db)
    return wrap


@database_connection
def test_select(db, auto_test = False):
    what_was_returned = db.fetch_query("SELECT * FROM users;")
    print(what_was_returned)
    return what_was_returned


@database_connection
def insert_data(table_name: str, name: str, spaces: int, photo, db):
    return db.execute_query(f"""
    INSERT INTO {table_name}(name, photo, available, spaces, spaces_left) values(%s, %s, TRUE, %s, 0)
                            """, (name, photo, spaces))


@database_connection
def select_data_if_available(table_name: str, db):
    data = db.fetch_query(f"SELECT * FROM {table_name} where available = true;")
    for idx, item in enumerate(data):
        data[idx] = list(item)
        data[idx][2] = base64.b64encode(bytes(data[idx][2])).decode('utf-8')
    return data


@database_connection
def get_user_email(email: str, db) -> tuple[str] | None:
    res = db.fetch_query("SELECT * FROM users WHERE email = %s;", (email,))
    return res[0] if res else None


@database_connection
def insert_user(user_name:str, user_email: str, password: str, db) -> int:
    result = db.execute_query(
        """
        INSERT INTO users (name, email, password)
        VALUES (%s, %s, %s)
        RETURNING id;
        """,
        (user_name,user_email, password)
    )
    return result[0]


@database_connection
def check_user_cred_and_return_id(email: str, password: str, db) -> list[int | str] | None:
    user = get_user_email(email)
    return [user[0], str(user[3])] if user else None


@database_connection
def reserve(table_name: str, id: str, user_id: int, db):
    if table_name == "pobyt":
        return db.execute_query(f"""
        insert into reserved(user_id, pobyt_id) values(%s, %s)
                                ;""", (user_id, id,))
    elif table_name == "loty":
        return db.execute_query(f"""
        insert into reserved(user_id, loty_id) values(%s, %s)
                                ;""", (user_id, id,))
    elif table_name == "atrakcje":
        return db.execute_query(f"""
        insert into reserved(user_id, atrakcje_id) values(%s, %s)
                                ;""", (user_id, id,))


@database_connection
def increment_slots(table_name: str, id: int, db):
    spaces = db.fetch_query(f"select spaces_left, spaces from {table_name} where id = {id}")
    if spaces:
        spaces_left = spaces[0][0]
        spaces_max = spaces[0][1]
    else:
        return "no such item in table"

    if spaces_left < spaces_max:
        db.execute_query(f"update {table_name} set spaces_left = spaces_left + 1 WHERE id = (%s);", (id,))
        return "success"
    else:
        db.execute_query(f"update {table_name} set available = False where id = (%s);", (id, ))

    return "no_space"


@database_connection
def reservations_for_users(user_id: int, email: str ,db):
    data = db.fetch_query(f"""
SELECT
	coalesce(l.name, p.name, a.name) nazwa,
	coalesce(l.photo, p.photo, a.photo) zdjecia
FROM reserved r
LEFT JOIN pobyt p ON r.pobyt_id = p.id
LEFT JOIN atrakcje a ON r.atrakcje_id = a.id
LEFT JOIN loty l ON r.loty_id = l.id
where r.user_id = {user_id};""")
    print(data)
    return data


def init_db():
    with PostgresConnector(
        dbname='mydatabase',  
        user='myuser',        
        password='mypassword', 
        host='db'
    ) as db:
        db.execute_query("""
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    email TEXT UNIQUE,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE rezerwacje(
    id SERIAL PRIMARY KEY,
    name VARCHAR(1000),
    photo BYTEA,
    available BOOLEAN,
    spaces INTEGER,
    spaces_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE loty(
    id SERIAL PRIMARY KEY,
    name VARCHAR(1000),
    photo BYTEA,
    available BOOLEAN,
    spaces INTEGER,
    spaces_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE atrakcje(
    id SERIAL PRIMARY KEY,
    name VARCHAR(1000),
    photo BYTEA,
    available BOOLEAN,
    spaces INTEGER,
    spaces_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE pobyt(
    id SERIAL PRIMARY KEY,
    name VARCHAR(1000),
    photo BYTEA,
    available BOOLEAN,
    spaces INTEGER,
    spaces_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE powrot(
    id SERIAL PRIMARY KEY,
    name VARCHAR(1000),
    photo BYTEA,
    available BOOLEAN,
    spaces INTEGER,
    spaces_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")
        db.execute_query("""
CREATE TABLE reserved(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    pobyt_id INTEGER REFERENCES pobyt(id),
    atrakcje_id INTEGER REFERENCES atrakcje(id),
    loty_id INTEGER REFERENCES loty(id)
    );""")
        insert_photos_to_db()

if __name__ == "__main__":
    print("asdf")
    init_db()
