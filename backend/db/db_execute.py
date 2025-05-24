from db.db_controler import PostgresConnector


def database_connection(func):
    def wrap(*args, **kwargs):
        with PostgresConnector(
            dbname='mydatabase',  
            user='myuser',        
            password='mypassword', 
            host='db'
        ) as db:
            return func(*args, **kwargs, db=db)
    return wrap


@database_connection
def test_select(db):
    what_was_returned = db.fetch_query("SELECT * FROM users;")
    print(what_was_returned)
    return what_was_returned


@database_connection
def insert_user(user_name: str, user_email: str, db):
    return db.execute_query("""
    INSERT INTO users(name, email) values(%s, %s)
                            """, (user_name, user_email))


@database_connection
def insert_data(table_name: str, name: str, spaces: int, photo, db):
    return db.execute_query(f"""
    INSERT INTO {table_name}(name, photo, available, spaces, spaces_left) values(%s, %s, TRUE, %s, 0)
                            """, (name, photo, spaces))


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

if __name__ == "__main__":
    print("asdf")
    init_db()
