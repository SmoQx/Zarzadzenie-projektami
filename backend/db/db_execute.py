from db_controler import PostgresConnector


def init_db():
    with PostgresConnector(
        dbname='mydatabase',  
        user='myuser',        
        password='mypassword', 
        host='db'
    ) as db:
        db_dispaly = db.fetch_query("SELECT 1;")
        print(db_dispaly)


if __name__ == "__main__":
    print("asdf")
    init_db()
