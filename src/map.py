from google import genai
from google.genai import types

# --- CONFIGURATION ---
MY_PROJECT_ID = "hackher-488104" 

# Initialize the Client using your terminal login (gcloud auth)
client = genai.Client(
    vertexai=True, 
    project=MY_PROJECT_ID, 
    location="us-central1"
)

def test_map_grounding(user_query):
    print(f"Mom's Request: {user_query}")
    print("Searching Google Maps via Gemini...\n")
    
    try:
        # 1. Ask Gemini to use the Google Maps Tool
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_query,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_maps=types.GoogleMaps())]
            )
        )

        # 2. Print the text response
        print("AI RESPONSE:")
        print(response.text)
        print("\n" + "="*40)

        # 3. Print the "Grounded" Links (The clickable parts)
        print("CLICKABLE MAP RESOURCES:")
        metadata = response.candidates[0].grounding_metadata
        if metadata.grounding_chunks:
            for i, chunk in enumerate(metadata.grounding_chunks):
                if chunk.maps:
                    print(f"{i+1}. {chunk.maps.title}")
                    print(f"   Link: {chunk.maps.uri}")
        else:
            print("No map links found. (Note: It may take a few mins for billing to sync).")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_query = "Find 3 pediatricians near Times Square, NY that are open now."
    test_map_grounding(test_query)