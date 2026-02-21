from pymongo import MongoClient
from volunteer import get_link
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client["hackher"]
profiles_collection = db["profiles"]

def seed_profiles():
    """Only inserts starter profiles if the collection is empty."""
    if profiles_collection.count_documents({}) == 0:
        starter_profiles = [
            {
                "name": "Elena R.",
                "location": "Northampton, MA",
                "kids": "2 (Ages 3 & 5)",
                "needs": "Looking for someone for 'Date Nights' on Fridays. Must be comfortable with large dogs.",
                "requirements": ["CPR Certified", "Non-smoker", "Has own transportation"],
                "apply_url": get_link()
            },
            {
                "name": "Sarah J.",
                "location": "Amherst, MA",
                "kids": "1 (Infant, 6 months)",
                "needs": "Part-time help during working hours (Tues/Thurs). Focus on infant care and light housework.",
                "requirements": ["Infant experience", "Vaccinated", "Background check required"],
                "apply_url": get_link()
            },
            {
                "name": "Maya W.",
                "location": "Easthampton, MA",
                "kids": "3 (School age)",
                "needs": "After-school pickup and help with homework/snacks until 6:00 PM.",
                "requirements": ["Clean driving record", "Able to help with Math/Science", "High energy!"],
                "apply_url": get_link()
            }
        ]
        profiles_collection.insert_many(starter_profiles)
        print("Seeded starter profiles.")


def add_profile(name, location, kids, needs, requirements):
    new_profile = {
        "name": name,
        "location": location,
        "kids": kids,
        "needs": needs,
        "requirements": requirements,
        "apply_url": get_link()
    }
    profiles_collection.insert_one(new_profile)
    return f"Profile for {name} has been created."


def get_profiles():
    profiles = []
    for profile in profiles_collection.find():
        profile["id"] = str(profile["_id"])  # convert ObjectId to string for frontend
        del profile["_id"]
        profiles.append(profile)
    return profiles


# Seed on import
seed_profiles()
