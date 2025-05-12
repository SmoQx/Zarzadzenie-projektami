import pytest
from app import add_two


def test_add_two():
    assert add_two(2) == 4
    assert add_two(3) == 5
