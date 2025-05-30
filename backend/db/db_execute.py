from db.db_controler import PostgresConnector
from insert_data_into_table import insert_photos_to_db


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
    return db.fetch_query(f"SELECT * FROM {table_name} where available = true;")


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
                                ;""", (user_id, id))
    elif table_name == "loty":
        return db.execute_query(f"""
        insert into reserved(user_id, loty_id) values(%s, %s)
                                ;""", (user_id, id))
    elif table_name == "atrakcje":
        return db.execute_query(f"""
        insert into reserved(user_id, atrakcje_id) values(%s, %s)
                                ;""", (user_id, id))



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
    user_id SERIAL REFERENCES users(id),
    pobyt_id SERIAL REFERENCES powrot(id),
    atrakcje_id SERIAL REFERENCES powrot(id),
    loty_id SERIAL REFERENCES powrot(id)
    );""")
        insert_photos_to_db()

if __name__ == "__main__":
    print("asdf")
    init_db()
