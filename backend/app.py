from flask import Flask, request
from db import db_controler, db_execute
from flask_cors import CORS
from insert_data_into_table import insert_photos_to_db


app = Flask(__name__)
CORS(app)

@app.route("/")
def main():
    return {"message": "hello"}


@app.route("/initdb")
def init_db_route():
    return {"message": f"{db_execute.init_db()}"}


@app.route("/create_user_table")
def create_user_table():
    db_execute.create_user_table()
    return {"message": "created_user_table"}


@app.route("/test_query")
def test_query():
    resp = db_execute.test_select()
    return {"message": f"{resp}"}


@app.route("/add_user")
def add_user():
    user = request.args.get("user")
    email = request.args.get("email")
    if user != None and email != None:
        resp = db_execute.insert_user(user_name=user, user_email=email)
        return {"message": f"{resp}, {user}, {email}"}
    else:
        return {"message": "no user and email"} 


@app.route("/register")
def register():
    return {"message": "registered"}


@app.route("/login")
def login():
    return {"message": "logged in"}


@app.route("/insert_photos")
def insert_photos():
    return {"message": insert_photos_to_db()}


@app.route("/rezerwacja")
def reservation():
    data = db_execute.select_data_if_available(table_name="rezerwacje")
    return {"message": f"{data}"}


@app.route("/loty")
def flight():
    data = db_execute.select_data_if_available(table_name="loty")
    return {"message": f"{data}"}


@app.route("/atrakcje")
def atractions():
    data = db_execute.select_data_if_available(table_name="atrakcje")
    return {"message": f"{data}"}


@app.route("/pobyt")
def stay():
    data = db_execute.select_data_if_available(table_name="pobyt")
    return {"message": f"{data}"}


@app.route("/powrot")
def trip_return():
    data = db_execute.select_data_if_available(table_name="powrot")
    return {"message": f"{data}"}


def add_two(num: int) -> int:
    return num + 2


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
