from db import db_execute
from pathlib import Path
from os import listdir


def main():
    photos_dir = Path("./photos")
    all_files_in_photo_dir = listdir(photos_dir)
    for directory in all_files_in_photo_dir:
        directory = photos_dir / Path(directory)
        for file in listdir(directory):
            if Path(file).suffix in [".jpg", ".png", ".jpeg"]:
                file_name = Path(file).stem
                print(file_name, "in directory", directory.name)
                with open(f"file", "rb") as photo:
                    binary_data = photo.read()
                    db_execute.insert_data(table_name=directory.name, name=file_name, spaces=20, photo=binary_data)


if __name__ == "__main__":
    main()
