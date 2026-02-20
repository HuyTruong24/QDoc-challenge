// app/client/src/pages/clinic/Map.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

const VACCINE_OPTIONS = ["", "HPV", "TDAP", "FLU", "MMR"];

export default function MapPage() {
  const [coords, setCoords] = useState({ lat: 49.8951, lng: -97.1384 }); // Winnipeg default
  const [vaccineKey, setVaccineKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ clinics: [] });
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);
      const res = await api.getNearbyClinics(coords.lat, coords.lng, vaccineKey || undefined);
      setData(res);
    } catch (e) {
      setError(e.message || "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineKey]);

  const sorted = useMemo(() => {
    const list = data?.clinics || [];
    return [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }, [data]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // reload with new coords
        api.getNearbyClinics(pos.coords.latitude, pos.coords.longitude, vaccineKey || undefined)
          .then(setData)
          .catch((e) => setError(e.message || "Failed to load clinics"))
          .finally(() => setLoading(false));
      },
      () => setError("Location permission denied. Using default coords.")
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Find Clinics</div>
          <div style={{ opacity: 0.7, marginTop: 4 }}>
            Lat: {coords.lat.toFixed(4)} | Lng: {coords.lng.toFixed(4)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={vaccineKey} onChange={(e) => setVaccineKey(e.target.value)} style={styles.select}>
            {VACCINE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v ? `Filter: ${v}` : "All vaccines"}
              </option>
            ))}
          </select>
          <button style={styles.button} onClick={useMyLocation}>Use my location</button>
          <button style={styles.linkBtn} onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <a href="/clinic/dashboard" style={styles.linkBtn}>Back to Dashboard</a>
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Clinics list</div>
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading...</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {sorted.map((c) => (
                <div key={c.id} style={styles.item}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ opacity: 0.7 }}>{c.distanceKm} km</div>
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 2 }}>{c.address}</div>
                  <div style={{ marginTop: 6 }}>
                    {(c.vaccinesSupported || []).map((v) => (
                      <span key={v} style={styles.badge}>{v}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <a
                      style={styles.link}
                      target="_blank"
                      rel="noreferrer"
                      href={googleMapsDirections(coords.lat, coords.lng, c.geo?.lat, c.geo?.lng)}
                    >
                      Directions
                    </a>
                    <a
                      style={styles.link}
                      target="_blank"
                      rel="noreferrer"
                      href={googleMapsSearch(c.address)}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              ))}
              {!sorted.length ? <div style={{ opacity: 0.7 }}>No clinics found.</div> : null}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Map (simple embed)</div>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>
            This is an embed for speed. You can replace with Mapbox/Google Maps JS later.
          </div>
          <iframe
            title="map"
            width="100%"
            height="420"
            style={{ border: 0, borderRadius: 12 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={embedMapUrl(coords.lat, coords.lng)}
          />
        </div>
      </div>
    </div>
  );
}

function googleMapsDirections(fromLat, fromLng, toLat, toLng) {
  if (typeof toLat !== "number" || typeof toLng !== "number") return "https://www.google.com/maps";
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&travelmode=driving`;
}
function googleMapsSearch(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function embedMapUrl(lat, lng) {
  // lightweight embed centered on user coords
  return `https://www.google.com/maps?q=${lat},${lng}&z=12&output=embed`;
}

const styles = {
  page: { padding: 18, maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, boxShadow: "0 1px 10px rgba(0,0,0,0.04)" },
  item: { border: "1px solid #f0f0f0", borderRadius: 12, padding: 12, background: "#fff" },
  badge: { display: "inline-block", padding: "4px 8px", borderRadius: 999, background: "#f2f2f2", fontSize: 12, marginRight: 6, marginBottom: 6 },
  select: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" },
  button: { padding: "10px 12px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer" },
  linkBtn: { padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  link: { fontSize: 13, color: "#111" },
  error: { marginBottom: 12, padding: "10px 12px", borderRadius: 12, background: "#ffe6e6", border: "1px solid #ffb3b3", color: "#8a0000" }
};