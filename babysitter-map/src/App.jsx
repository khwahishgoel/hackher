import { useEffect, useRef, useState } from "react";

const center = { lat: 42.25, lng: -72.65 };
const defaultZoom = 9;

const WESTERN_MA_BOUNDS = {
  minLat: 41.9,
  maxLat: 42.9,
  minLng: -73.6,
  maxLng: -72.0,
};

const inWesternMA = (lat, lng) =>
  lat >= WESTERN_MA_BOUNDS.minLat &&
  lat <= WESTERN_MA_BOUNDS.maxLat &&
  lng >= WESTERN_MA_BOUNDS.minLng &&
  lng <= WESTERN_MA_BOUNDS.maxLng;

const mapStyles = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#ffecf2" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#b8d4e8" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7a9bb5" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#e8b99a" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d4a882" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#f0cdb0" }] },
  { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#d4a882" }] },
  { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#f5d9c0" }] },
  { featureType: "road.local", elementType: "geometry.stroke", stylers: [{ color: "#d4a882" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9a7a65" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#f7ddc6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a6a55" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7ddc6" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

export default function App() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const initMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: defaultZoom,
        styles: mapStyles,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();
      setMapReady(true);
    };

    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || places.length === 0) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    places.forEach((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInstanceRef.current,
        icon: {
          url: "/marker.png",
          scaledSize: new window.google.maps.Size(50, 50),
          anchor: new window.google.maps.Point(25, 50),
        },
      });

      marker.addListener("click", () => {
        infoWindowRef.current.setContent(`
          <div style="font-family:sans-serif;max-width:200px">
            <div style="font-weight:700;color:#8a6a55;margin-bottom:4px">${p.title}</div>
            <div style="font-size:12px;color:#9a7a65;margin-bottom:6px">${p.address}</div>
            <a href="${p.maps_uri}" target="_blank" rel="noreferrer"
              style="color:#e8957a;font-size:12px;font-weight:600">
              Open in Google Maps
            </a>
          </div>
        `);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [mapReady, places]);

  const geocodeAddress = (address) =>
    new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          reject(new Error("Geocode failed: " + status));
        }
      });
    });

  const runSearch = async () => {
    setLoading(true);
    infoWindowRef.current?.close();

    try {
      const res = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "pediatrician",
          location: "Western Massachusetts, MA",
        }),
      });

      if (!res.ok) throw new Error(await res.text());

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

      const filtered = withCoords.filter(
        (p) =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          inWesternMA(p.lat, p.lng)
      );

      console.log("filtered (Western MA only):", filtered);
      setPlaces(filtered);
    } catch (e) {
      alert("Search failed: " + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(), 1000);
    return () => clearTimeout(t);
  }, [apiKey]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 9999,
          background: "#f7ddc6",
          padding: 8,
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={runSearch}
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#e8957a",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Searching..." : "Search Pediatricians"}
        </button>
      </div>
    </div>
  );
}