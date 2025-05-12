from flask import Flask
from db.db_controler import init_db


app = Flask(__name__)


@app.route("/")
def main():
    return {"message": "hello"}


@app.route("/initdb")
def init_db_route():
    init_db()
    return {"message": "baza_tes"}


def add_two(num: int) -> int:
    return num + 2


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
