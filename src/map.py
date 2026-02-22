import os
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from profiles import add_profile

# 1. Load Secrets
load_dotenv()
MY_PROJECT_ID = os.getenv("GCP_PROJECT_ID")

# 2. Setup Gemini
client = genai.Client(vertexai=True, project=MY_PROJECT_ID, location="us-central1")

# 3. FastAPI app
app = FastAPI()

# 4. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Request schemas
class SearchReq(BaseModel):
    category: str
    location: str | None = "Western Massachusetts"

class ProfileReq(BaseModel):
    name: str
    location: str
    email: str
    kids: str
    needs: str
    requirements: str


def mom_search_engine(category: str, location: str = "Western Massachusetts"):
    user_query = f"""
Return ONLY valid JSON — no markdown, no explanation, no code fences.
Use exactly this schema:
{{
  "results": [
    {{
      "title": "string",
      "address": "string (full street address)",
      "maps_uri": "string (Google Maps URL)"
    }}
  ]
}}

Find 3 top-rated {category} in {location}.
Prioritize easy parking, kid-friendly waiting areas, and highly positive reviews from local parents.
Every result MUST include a real street address.
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=user_query,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_maps=types.GoogleMaps())]
            )
        )

        text = response.text.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        data = json.loads(text)

        metadata = response.candidates[0].grounding_metadata
        if metadata and metadata.grounding_chunks:
            maps_chunks = [
                chunk.maps for chunk in metadata.grounding_chunks if chunk.maps
            ]
            for i, result in enumerate(data.get("results", [])):
                if not result.get("maps_uri") and i < len(maps_chunks):
                    result["maps_uri"] = maps_chunks[i].uri
                    if not result.get("title"):
                        result["title"] = maps_chunks[i].title

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini returned non-JSON response: {e}. Raw: {text[:300]}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 6. POST /search endpoint
@app.post("/search")
def search(req: SearchReq):
    return mom_search_engine(req.category, req.location)


# 7. POST /save-profile endpoint
@app.post("/save-profile")
def save_profile(req: ProfileReq):
    try:
        result = add_profile(
            name=req.name,
            location=req.location,
            kids=req.kids,
            needs=req.needs,
            requirements=[req.requirements]
        )
        return {"message": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))