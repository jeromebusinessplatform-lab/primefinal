import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MapPin, Navigation, Layers, Compass } from "lucide-react";

interface GeoMapViewProps {
  centerLat: number;
  centerLon: number;
  zoom?: number;
  height?: number | string;
  destinationLabel?: string;
  originLat?: number;
  originLon?: number;
  originLabel?: string;
  routeCoordinates?: [number, number][]; // [lon, lat] from Geoapify GeoJSON
  apiKey?: string;
  interactive?: boolean;
}

export function GeoMapView({
  centerLat,
  centerLon,
  zoom = 14,
  height = 200,
  destinationLabel = "Delivery Destination",
  originLat,
  originLon,
  originLabel = "PRIME Logistics Hub",
  routeCoordinates,
  apiKey,
  interactive = true,
}: GeoMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized on this container
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      });

      // Add Zoom Control at top-right
      if (interactive) {
        L.control.zoom({ position: "topright" }).addTo(map);
      }

      // Geoapify or OSM Tile Layer
      const tileUrl =
        apiKey && apiKey.trim().length > 0
          ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (map && markersGroup) {
      markersGroup.clearLayers();

      const boundsPoints: L.LatLngExpression[] = [];

      // 1. Destination Marker (Black/Red pin with pulse)
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
            <div style="position: absolute; width: 30px; height: 30px; background: rgba(0,0,0,0.15); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; z-index: 10; background: #000000; color: #ffffff; border: 2px solid #ffffff; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const destMarker = L.marker([centerLat, centerLon], { icon: destIcon }).addTo(markersGroup);
      destMarker.bindPopup(`<strong>${destinationLabel}</strong><br/>${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}`);
      boundsPoints.push([centerLat, centerLon]);

      // 2. Origin Hub Marker (if provided)
      if (originLat !== undefined && originLon !== undefined) {
        const originIcon = L.divIcon({
          className: "custom-origin-pin",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
              <div style="position: relative; z-index: 10; background: #2563eb; color: #ffffff; border: 2px solid #ffffff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 20v-8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v8"/><path d="M4 10h16"/></svg>
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const originMarker = L.marker([originLat, originLon], { icon: originIcon }).addTo(markersGroup);
        originMarker.bindPopup(`<strong>${originLabel}</strong><br/>${originLat.toFixed(4)}, ${originLon.toFixed(4)}`);
        boundsPoints.push([originLat, originLon]);

        // 3. Polyline Route connecting Origin -> Destination
        let polylinePoints: [number, number][] = [];
        if (routeCoordinates && routeCoordinates.length > 0) {
          polylinePoints = routeCoordinates.map((coord) => [coord[1], coord[0]]); // [lat, lon]
        } else {
          polylinePoints = [
            [originLat, originLon],
            [centerLat, centerLon],
          ];
        }

        const routeLine = L.polyline(polylinePoints, {
          color: "#000000",
          weight: 4,
          opacity: 0.8,
          dashArray: "6, 8",
          lineCap: "round",
          lineJoin: "round",
        }).addTo(markersGroup);

        polylinePoints.forEach((p) => boundsPoints.push(p));
      }

      // Auto fit bounds if multiple points exist
      if (boundsPoints.length > 1) {
        map.fitBounds(boundsPoints, { padding: [30, 30], maxZoom: 15 });
      } else {
        map.setView([centerLat, centerLon], zoom);
      }

      // Invalidate size to ensure clean rendering inside containers/modals
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [centerLat, centerLon, originLat, originLon, routeCoordinates, zoom, apiKey, interactive, destinationLabel, originLabel]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-neutral-200 shadow-inner bg-neutral-100" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: height }} />

      {/* Map Badge Overlays */}
      <div className="absolute bottom-2 right-2 z-10 bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] px-2 py-0.5 rounded-md font-mono border border-neutral-200 shadow-xs pointer-events-none">
        {centerLat.toFixed(4)}°N, {centerLon.toFixed(4)}°E
      </div>
    </div>
  );
}
