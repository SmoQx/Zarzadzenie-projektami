from db_controler import PostgresConnector


db = PostgresConnector(
    dbname='mydatabase',  
    user='myuser',        
    password='mypassword', 
    host='db'
)


def init_db():
    pass


if __name__ == "__main__":
    print("asdf")
