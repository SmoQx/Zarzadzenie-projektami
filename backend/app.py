from flask import Flask, request
from db import db_controler, db_execute
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

@app.route("/")
def main():
    return {"message": "hello"}


@app.route("/initdb")
def init_db_route():
    db_execute.init_db()
    return {"message": "baza_tes"}


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


@app.route("/rezerwacja")
def reservation():
    return {"message": "reservation"}


@app.route("/loty")
def flight():
    return {"message": "flight"}


@app.route("/atrakcje")
def atractions():
    return {"message": "atractions"}


@app.route("/pobyt")
def stay():
    return {"message": "stay"}


@app.route("/powrot")
def trip_return():
    return {"message": "trip_return"}


def add_two(num: int) -> int:
    return num + 2


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
