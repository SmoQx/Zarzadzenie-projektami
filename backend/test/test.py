import pytest
from db import db_execute
from app import add_two


def test_add_two():
    assert add_two(2) == 4
    assert add_two(3) == 5


def test_database():
    assert db_execute.test_select(auto_test=True) != None
