from db import db_execute
from pathlib import Path
from os import listdir


def insert_photos_to_db():
    repsonse_from_db = []
    photos_dir = Path("./Logos")
    all_files_in_photo_dir = listdir(photos_dir)
    for directory in all_files_in_photo_dir:
        directory = photos_dir / Path(directory)
        for file in listdir(directory):
            if Path(file).suffix in [".jpg", ".png", ".jpeg"]:
                file_name = Path(file).stem
                print(file_name, "in directory", directory.name)
                with open(f"{directory / file}", "rb") as photo:
                    binary_data = photo.read()
                    resp = db_execute.insert_data(table_name=directory.name, name=file_name, spaces=20, photo=binary_data)
                repsonse_from_db.append(resp)
    return repsonse_from_db


if __name__ == "__main__":
    insert_photos_to_db()
