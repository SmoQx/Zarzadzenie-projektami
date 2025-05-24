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


if __name__ == "__main__":
    print("asdf")
    init_db()
