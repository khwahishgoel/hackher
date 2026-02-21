import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

const containerStyle = { width: "100vw", height: "100vh" };
const center = { lat: 42.3732, lng: -72.5199 }; // Amherst

export default function App() {
  console.log("App.jsx loaded ✅");

  const [places, setPlaces] = useState([]); // {title,address,maps_uri,lat,lng}
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const googleMapsApiKey = "AIzaSyDbuIQab9qeavSasA4qEsbjOUv5DKo4wLQ";

  // helper: geocode address -> {lat,lng}
  const geocodeAddress = (address) =>
    new Promise((resolve, reject) => {
      if (!window.google?.maps?.Geocoder) return reject(new Error("Geocoder not loaded"));
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          reject(new Error(`Geocode failed: ${status}`));
        }
      });
    });

  // fetch from backend + geocode
  const runSearch = async () => {
    setLoading(true);
    setSelected(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "pediatrician",
          location: "Amherst, MA",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();

      const withCoords = await Promise.all(
        (data.results || []).map(async (p) => {
          try {
            const coords = await geocodeAddress(p.address);
            return { ...p, ...coords };
          } catch {
            return { ...p, lat: null, lng: null };
          }
        })
      );

      console.log("places with coords:", withCoords);
      setPlaces(withCoords);
    } catch (e) {
      alert(`Search failed: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // auto-run once after map loads (you can remove this later)
  useEffect(() => {
    const t = setTimeout(() => runSearch(), 500);
    return () => clearTimeout(t);
  }, []);

  const markers = useMemo(
    () => places.filter((p) => typeof p.lat === "number" && typeof p.lng === "number"),
    [places]
  );

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
        {/* button that cannot hide */}
        <div
          style={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 9999,
            background: "white",
            padding: 8,
            borderRadius: 8,
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          <button onClick={runSearch} disabled={loading} style={{ padding: "10px 12px" }}>
            {loading ? "Searching..." : "Search Pediatricians"}
          </button>
        </div>

        {markers.map((p, i) => (
          <Marker key={i} position={{ lat: p.lat, lng: p.lng }} onClick={() => setSelected(p)} />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{selected.title}</div>
              <div style={{ fontSize: 12 }}>{selected.address}</div>
              <a href={selected.maps_uri} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}