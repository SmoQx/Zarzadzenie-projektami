from flask import Flask, request, jsonify
from db import db_controler, db_execute
from flask_cors import CORS
from insert_data_into_table import insert_photos_to_db
import re


app = Flask(__name__)
CORS(app)

EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@app.route("/")
def main():
    return {"message": "hello"}


@app.route("/initdb")
def init_db_route():
    return {"message": f"{db_execute.init_db()}"}


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


@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    errors = {}
    if not username:
        errors["username"] = "Pole wymagane"
    if not EMAIL.match(email):
        errors["email"] = "Niepoprawny e-mail"
    if len(password) < 8:
        errors["password"] = "Hasło ≥ 8 znaków"
    if errors:
        return jsonify({"message": str(errors)}), 400

    if db_execute.get_user_email(email):
        app.logger.error("Adres istnieje")
        return jsonify({"message": str({"email": "Adres już istnieje"})}), 409

    app.logger.info("przed stworzeniem usera")
    user_id = db_execute.insert_user(username, email, password)
    app.logger.info("stworzono usera")
    return jsonify({"message": "Konto utworzone", "user_id": user_id}), 201


@app.route("/login",  methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("username") or "").lower().strip()
    password = data.get("password") or ""
    check = db_execute.check_user_cred_and_return_id(email, password)
    app.logger.info(check)
    if check:
        return jsonify({"message": check}), 200
    return jsonify({"errors": {"credentials": "Niepoprawny login lub hasło"}}), 401


@app.route("/reserve_item", methods=["POST"])
def reserve_item():
    data = request.get_json()
    email = data.get("email")
    user_id = data.get("id")
    item_type = data.get("item_type")
    item_id = data.get("item_id")
    data_list = [email, user_id, item_id, item_type]
    data_name_list = ["username", "user_id", "item_id", "item_type"]
    check = db_execute.get_user_email(email)
    if not check:
        return jsonify({"error": "there was an error"})
    if None in data_list:
        return jsonify({"error": f"data is mising {[item_name for item, item_name in zip(data_list, data_name_list) if item is None]}"}), 400

    if (slots := db_execute.increment_slots(table_name=item_type, id=item_id)) == "success":
        db_execute.reserve(table_name=item_type, id=item_id, user_id=user_id)
        return jsonify({"message": "reserved item"}), 200

    return jsonify({"message": f"item not reserved , {slots}"}), 400



@app.route("/check_if_user_auth")
def check_if_user_auth():
    data = request.get_json(force=True)
    email = (data.get("email") or "").lower().strip()
    check = db_execute.get_user_email(email)
    app.logger.info(check)
    if check:
        return jsonify({"message": "user_authorized"}), 200
    return jsonify({"errors": "user un authorized"}), 401


@app.route("/insert_photos")
def insert_photos():
    return {"message": insert_photos_to_db()}


@app.route("/rezerwacja", methods=["POST", "GET"])
def reservation():
    data = request.get_json()
    email = data.get("email")
    user_id = data.get("id")
    data = db_execute.reservations_for_users(user_id=user_id, email=email)
    app.logger.info(data)
    return jsonify({"message": f"{data}"}), 200


@app.route("/loty")
def flight():
    data = db_execute.select_data_if_available(table_name="loty")
    app.logger.info(data)
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
