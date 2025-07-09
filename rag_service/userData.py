import os 
from dotenv import load_dotenv

class UserData :
    def __init__ (self) :
        load_dotenv() 

    def get (self, key_name) :
        return os.getenv(key_name)
    