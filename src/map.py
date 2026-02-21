import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 1. Load Secrets
load_dotenv()
MY_PROJECT_ID = os.getenv("GCP_PROJECT_ID")

# 2. Setup Gemini
client = genai.Client(vertexai=True, project=MY_PROJECT_ID, location="us-central1")

def mom_search_engine(category, location="Western Massachusetts"):
    """
    Search engine optimized for Western Mass moms.
    Default location is Western Mass if none is provided.
    """
    # Specifically asking for Western Mass regional context
    user_query = (
        f"Find 3 top-rated {category} in {location}. "
        "Prioritize places with easy parking, kid-friendly waiting areas, "
        "and highly positive reviews from local parents in the Pioneer Valley."
    )
    
    print(f"Searching {category} in the 413...")

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_query,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_maps=types.GoogleMaps())]
            )
        )
        
        # Output results
        print("\n LOCAL RECOMMENDATIONS:")
        print(response.text)
        
        # Extract links for the frontend
        metadata = response.candidates[0].grounding_metadata
        if metadata.grounding_chunks:
            print("\nGOOGLE MAPS LINKS:")
            for chunk in metadata.grounding_chunks:
                if chunk.maps:
                    print(f"- {chunk.maps.title}: {chunk.maps.uri}")
                    
        return response

    except Exception as e:
        print(f"Error during Western Mass search: {e}")
        return None

# --- DEMO RUN ---
if __name__ == "__main__":
    # Test for a classic Western Mass mom need: a kid-friendly cafe or pediatrician
    mom_search_engine("Pediatrician", "Northampton and Amherst, MA")