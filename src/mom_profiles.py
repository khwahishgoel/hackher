from volunteer import get_link

requirements=[
    {
        "id": 1,
        "name": "Elena R.",
        "location": "Northampton, MA",
        "kids": "2 (Ages 3 & 5)",
        "needs": "Looking for someone for 'Date Nights' on Fridays. Must be comfortable with large dogs.",
        "requirements": ["CPR Certified", "Non-smoker", "Has own transportation"],
        "apply_url": get_link()
    },
    {
        "id": 2,
        "name": "Sarah J.",
        "location": "Amherst, MA",
        "kids": "1 (Infant, 6 months)",
        "needs": "Part-time help during working hours (Tues/Thurs). Focus on infant care and light housework.",
        "requirements": ["Infant experience", "Vaccinated", "Background check required"],
        "apply_url": get_link()
    },

    {
        "id": 3,
        "name": "Maya W.",
        "location": "Easthampton, MA",
        "kids": "3 (School age)",
        "needs": "After-school pickup and help with homework/snacks until 6:00 PM.",
        "requirements": ["Clean driving record", "Able to help with Math/Science", "High energy!"],
        "apply_url": get_link()
    }
]

def add_profiles(name,location,kids,needs,requirements):
    new_id = len(requirements)+1
    new_profile = {
        "id": new_id,
        "name": name,
        "location": location,
        "kids": kids,
        "needs": needs,
        "requirements": requirements,
        "apply_url": get_link()  
    }
    requirements.append(new_profile)
    return f"Profile for {name} has been created."
    




def get_profiles():
    return requirements
