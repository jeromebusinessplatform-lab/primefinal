import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Default Warehouse Location: PRIME Logistics Hub (BGC, Taguig, Metro Manila)
const DEFAULT_WAREHOUSE = {
  name: "PRIME Central Logistics Hub",
  address: "High Street South, Bonifacio Global City, Taguig, Metro Manila, 1634",
  lat: 14.5516,
  lon: 121.0503,
};

// Fallback Philippine Addresses for demo / offline / dev mode
const FALLBACK_PH_LOCATIONS = [
  {
    formatted: "Bonifacio Global City, 5th Avenue, Taguig, Metro Manila, 1634, Philippines",
    street: "5th Avenue",
    suburb: "Bonifacio Global City",
    city: "Taguig",
    state: "Metro Manila",
    postcode: "1634",
    country: "Philippines",
    lat: 14.5507,
    lon: 121.0477,
  },
  {
    formatted: "Ayala Avenue, Makati Central Business District, Makati, Metro Manila, 1226, Philippines",
    street: "Ayala Avenue",
    suburb: "Bel-Air",
    city: "Makati",
    state: "Metro Manila",
    postcode: "1226",
    country: "Philippines",
    lat: 14.5547,
    lon: 121.0244,
  },
  {
    formatted: "Ortigas Center, ADB Avenue, Mandaluyong / Pasig, Metro Manila, 1550, Philippines",
    street: "ADB Avenue",
    suburb: "Ortigas Center",
    city: "Pasig",
    state: "Metro Manila",
    postcode: "1550",
    country: "Philippines",
    lat: 14.5866,
    lon: 121.0611,
  },
  {
    formatted: "Eastwood City, E. Rodriguez Jr. Ave, Bagumbayan, Quezon City, Metro Manila, 1110, Philippines",
    street: "E. Rodriguez Jr. Avenue",
    suburb: "Eastwood City",
    city: "Quezon City",
    state: "Metro Manila",
    postcode: "1110",
    country: "Philippines",
    lat: 14.6095,
    lon: 121.0805,
  },
  {
    formatted: "Alabang Town Center, Commerce Ave, Ayala Alabang, Muntinlupa, Metro Manila, 1780, Philippines",
    street: "Commerce Avenue",
    suburb: "Ayala Alabang",
    city: "Muntinlupa",
    state: "Metro Manila",
    postcode: "1780",
    country: "Philippines",
    lat: 14.4255,
    lon: 121.0315,
  },
  {
    formatted: "Cebu IT Park, Salinas Drive, Lahug, Cebu City, Cebu, 6000, Philippines",
    street: "Salinas Drive",
    suburb: "Lahug",
    city: "Cebu City",
    state: "Cebu",
    postcode: "6000",
    country: "Philippines",
    lat: 10.3297,
    lon: 123.9061,
  },
  {
    formatted: "SM Lanang Premier, J.P. Laurel Ave, San Antonio, Davao City, Davao del Sur, 8000, Philippines",
    street: "J.P. Laurel Avenue",
    suburb: "San Antonio",
    city: "Davao City",
    state: "Davao del Sur",
    postcode: "8000",
    country: "Philippines",
    lat: 7.0984,
    lon: 125.6315,
  },
  {
    formatted: "Clark Freeport Zone, Manuel A. Roxas Hwy, Angeles, Pampanga, 2009, Philippines",
    street: "Manuel A. Roxas Highway",
    suburb: "Clark",
    city: "Angeles",
    state: "Pampanga",
    postcode: "2009",
    country: "Philippines",
    lat: 15.1764,
    lon: 120.5312,
  },
];

// Helper: Haversine distance in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ----------------------------------------------------
// 1. GEO CONFIG ENDPOINT
// ----------------------------------------------------
app.get("/api/geo/config", (_req, res) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  res.json({
    hasApiKey: !!apiKey && apiKey.trim().length > 0,
    warehouse: DEFAULT_WAREHOUSE,
  });
});

// ----------------------------------------------------
// 2. GEOAPIFY ADDRESS AUTOCOMPLETE (Debounce Target)
// ----------------------------------------------------
app.get("/api/geo/autocomplete", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    const country = (req.query.country as string) || "ph";
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;

    if (!text.trim()) {
      return res.json({ results: [] });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      let geoapifyUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        text
      )}&limit=${limit}&apiKey=${apiKey}`;

      if (country) {
        geoapifyUrl += `&filter=countrycode:${encodeURIComponent(country)}`;
      }
      if (lat !== undefined && lon !== undefined) {
        geoapifyUrl += `&bias=proximity:${lon},${lat}`;
      }

      const response = await fetch(geoapifyUrl);
      if (response.ok) {
        const data = await response.json();
        const results = (data.features || []).map((f: any) => ({
          id: f.properties.place_id || `${f.properties.lat},${f.properties.lon}`,
          formatted: f.properties.formatted,
          street: f.properties.street || f.properties.name,
          housenumber: f.properties.housenumber,
          suburb: f.properties.suburb || f.properties.district,
          city: f.properties.city || f.properties.municipality || f.properties.county,
          state: f.properties.state || f.properties.region,
          postcode: f.properties.postcode,
          country: f.properties.country,
          lat: f.properties.lat,
          lon: f.properties.lon,
          confidence: f.properties.rank?.confidence || 1,
        }));
        return res.json({ results, source: "geoapify" });
      }
    }

    // Fallback search over Philippine locations
    const queryLower = text.toLowerCase();
    const matched = FALLBACK_PH_LOCATIONS.filter(
      (loc) =>
        loc.formatted.toLowerCase().includes(queryLower) ||
        loc.city.toLowerCase().includes(queryLower) ||
        loc.suburb.toLowerCase().includes(queryLower) ||
        loc.street.toLowerCase().includes(queryLower)
    );

    const fallbackResults =
      matched.length > 0
        ? matched
        : [
            {
              formatted: `${text}, Metro Manila, Philippines`,
              street: text,
              suburb: "Central District",
              city: "Metro Manila",
              state: "NCR",
              postcode: "1000",
              country: "Philippines",
              lat: 14.5547 + (Math.random() - 0.5) * 0.05,
              lon: 121.0244 + (Math.random() - 0.5) * 0.05,
            },
          ];

    return res.json({
      results: fallbackResults.map((r, i) => ({ ...r, id: `fallback-${i}` })),
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Geoapify Autocomplete error:", error);
    return res.status(500).json({ error: "Failed to autocomplete address" });
  }
});

// ----------------------------------------------------
// 3. GEOAPIFY FORWARD GEOCODING (Search)
// ----------------------------------------------------
app.get("/api/geo/geocode", async (req, res) => {
  try {
    const text = (req.query.text as string) || "";
    if (!text.trim()) {
      return res.status(400).json({ error: "Text parameter is required" });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        text
      )}&limit=1&apiKey=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const f = data.features[0];
          return res.json({
            formatted: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon,
            city: f.properties.city,
            country: f.properties.country,
            source: "geoapify",
          });
        }
      }
    }

    // Fallback Geocoding
    const found = FALLBACK_PH_LOCATIONS.find((loc) =>
      loc.formatted.toLowerCase().includes(text.toLowerCase())
    ) || FALLBACK_PH_LOCATIONS[0];

    return res.json({
      formatted: found.formatted,
      lat: found.lat,
      lon: found.lon,
      city: found.city,
      country: found.country,
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Geocoding error:", error);
    return res.status(500).json({ error: "Geocoding lookup failed" });
  }
});

// ----------------------------------------------------
// 4. GEOAPIFY REVERSE GEOCODING (GPS coordinates -> Address)
// ----------------------------------------------------
app.get("/api/geo/reverse-geocode", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: "Valid lat and lon parameters are required" });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const f = data.features[0];
          return res.json({
            formatted: f.properties.formatted,
            street: f.properties.street || f.properties.name,
            housenumber: f.properties.housenumber,
            suburb: f.properties.suburb || f.properties.district,
            city: f.properties.city || f.properties.municipality,
            state: f.properties.state,
            postcode: f.properties.postcode,
            country: f.properties.country,
            lat: f.properties.lat,
            lon: f.properties.lon,
            source: "geoapify",
          });
        }
      }
    }

    // Fallback reverse geocoding: find nearest
    let nearest = FALLBACK_PH_LOCATIONS[0];
    let minDistance = Infinity;

    for (const loc of FALLBACK_PH_LOCATIONS) {
      const d = calculateHaversineKm(lat, lon, loc.lat, loc.lon);
      if (d < minDistance) {
        minDistance = d;
        nearest = loc;
      }
    }

    return res.json({
      formatted: `${nearest.street}, ${nearest.suburb}, ${nearest.city}, Philippines`,
      street: nearest.street,
      suburb: nearest.suburb,
      city: nearest.city,
      state: nearest.state,
      postcode: nearest.postcode,
      country: "Philippines",
      lat,
      lon,
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Reverse geocoding error:", error);
    return res.status(500).json({ error: "Reverse geocoding failed" });
  }
});

// ----------------------------------------------------
// 5. GEOAPIFY IP GEOLOCATION (IP -> Location)
// ----------------------------------------------------
app.get("/api/geo/ip-lookup", async (req, res) => {
  try {
    const clientIp =
      (req.query.ip as string) ||
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      const url = `https://api.geoapify.com/v1/ipinfo?apiKey=${apiKey}${
        clientIp && clientIp !== "::1" && clientIp !== "127.0.0.1"
          ? `&ip=${encodeURIComponent(clientIp)}`
          : ""
      }`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json({
          ip: data.ip || clientIp,
          city: data.city?.name || "Manila",
          region: data.state?.name || "Metro Manila",
          country: data.country?.name || "Philippines",
          countryCode: data.country?.iso_code || "PH",
          postcode: data.postcode || "1000",
          lat: data.location?.latitude || 14.5547,
          lon: data.location?.longitude || 121.0244,
          timezone: data.timezone?.name || "Asia/Manila",
          source: "geoapify",
        });
      }
    }

    // Default IP lookup fallback (Metro Manila location)
    return res.json({
      ip: clientIp || "120.28.0.1",
      city: "Taguig",
      region: "Metro Manila",
      country: "Philippines",
      countryCode: "PH",
      postcode: "1634",
      lat: 14.5507,
      lon: 121.0477,
      timezone: "Asia/Manila",
      source: "fallback",
    });
  } catch (error: any) {
    console.error("IP lookup error:", error);
    return res.status(500).json({ error: "IP Geolocation failed" });
  }
});

// ----------------------------------------------------
// 6. GEOAPIFY ROUTING API (Hub to Delivery Address Route)
// ----------------------------------------------------
app.get("/api/geo/route", async (req, res) => {
  try {
    const fromLat = req.query.fromLat
      ? parseFloat(req.query.fromLat as string)
      : DEFAULT_WAREHOUSE.lat;
    const fromLon = req.query.fromLon
      ? parseFloat(req.query.fromLon as string)
      : DEFAULT_WAREHOUSE.lon;
    const toLat = parseFloat(req.query.toLat as string);
    const toLon = parseFloat(req.query.toLon as string);
    const mode = (req.query.mode as string) || "drive";

    if (isNaN(toLat) || isNaN(toLon)) {
      return res.status(400).json({ error: "Valid toLat and toLon are required" });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (apiKey && apiKey.trim().length > 0) {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLon}|${toLat},${toLon}&mode=${mode}&apiKey=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const distanceMeters = feature.properties.distance || 0;
          const timeSeconds = feature.properties.time || 0;
          const coordinates = feature.geometry?.coordinates || [];

          return res.json({
            distanceKm: Number((distanceMeters / 1000).toFixed(2)),
            durationMinutes: Math.ceil(timeSeconds / 60),
            coordinates,
            legs: feature.properties.legs || [],
            source: "geoapify",
          });
        }
      }
    }

    // Fallback route calculation using Haversine with 1.35x road factor
    const directKm = calculateHaversineKm(fromLat, fromLon, toLat, toLon);
    const roadKm = Number((Math.max(directKm * 1.35, 1.2)).toFixed(2));
    // Average urban speed ~ 25 km/h in Metro Manila + 8 min buffer
    const durationMins = Math.max(Math.ceil((roadKm / 25) * 60 + 8), 15);

    // Intermediate sample coordinates for fallback polyline
    const steps = 6;
    const coordinates: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curLon = fromLon + (toLon - fromLon) * t + (Math.sin(t * Math.PI) * 0.005);
      const curLat = fromLat + (toLat - fromLat) * t + (Math.sin(t * Math.PI) * 0.003);
      coordinates.push([curLon, curLat]);
    }

    return res.json({
      distanceKm: roadKm,
      durationMinutes: durationMins,
      coordinates,
      legs: [],
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Routing error:", error);
    return res.status(500).json({ error: "Route calculation failed" });
  }
});

// ----------------------------------------------------
// 7. GEOAPIFY STATIC MAP / MAP TILE PROXY
// ----------------------------------------------------
app.get("/api/geo/static-map", (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : DEFAULT_WAREHOUSE.lat;
  const lon = req.query.lon ? parseFloat(req.query.lon as string) : DEFAULT_WAREHOUSE.lon;
  const zoom = req.query.zoom ? parseInt(req.query.zoom as string, 10) : 14;
  const width = req.query.width ? parseInt(req.query.width as string, 10) : 600;
  const height = req.query.height ? parseInt(req.query.height as string, 10) : 280;
  const markerColor = (req.query.markerColor as string) || "black";
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (apiKey && apiKey.trim().length > 0) {
    const geoapifyMapUrl = `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=${width}&height=${height}&center=lonlat:${lon},${lat}&zoom=${zoom}&marker=lonlat:${lon},${lat};color:${encodeURIComponent(
      markerColor
    )};size:medium&apiKey=${apiKey}`;
    return res.redirect(geoapifyMapUrl);
  }

  // Fallback OpenStreetMap static tile rendering service
  const osmUrl = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&z=${zoom}&l=map&size=${Math.min(
    width,
    600
  )},${Math.min(height, 280)}&pt=${lon},${lat},pm2rdm`;
  return res.redirect(osmUrl);
});

// ----------------------------------------------------
// VITE MIDDLEWARE OR PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
