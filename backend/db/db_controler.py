import psycopg2
from psycopg2 import sql, OperationalError


class PostgresConnector:
    def __init__(self, host, dbname, user, password, port=5432):
        self.connection = None
        self.cursor = None
        self.config = {
            "host": host,
            "database": dbname,
            "user": user,
            "password": password,
            "port": port
        }

    def connect(self):
        try:
            self.connection = psycopg2.connect(**self.config)
            self.cursor = self.connection.cursor()
            print("Connection to PostgreSQL DB successful")
        except OperationalError as e:
            print(f"The error '{e}' occurred")

    def execute_query(self, query, params=None):
        try:
            self.cursor.execute(query, params)
            self.connection.commit()
            print("Query executed successfully")
        except Exception as e:
            print(f"Error executing query: {e}")
            self.connection.rollback()

    def fetch_query(self, query, params=None):
        try:
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except Exception as e:
            print(f"Error fetching data: {e}")
            return None

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            print("Connection closed")

    def __enter__(self):
        try:
            self.connection = psycopg2.connect(**self.config)
            self.cursor = self.connection.cursor()
            print("Connected to PostgreSQL")
        except OperationalError as e:
            print(f"Connection error: {e}")
            raise
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            if exc_type:
                self.connection.rollback()
            else:
                self.connection.commit()
            self.connection.close()
            print("Connection closed")
