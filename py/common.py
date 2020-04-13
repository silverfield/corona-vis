import os

def get_root():
    this_folder = os.path.dirname(__file__)
    root_folder = os.path.realpath(f'{this_folder}/..')

    return root_folder