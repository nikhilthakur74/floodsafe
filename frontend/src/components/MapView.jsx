import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Compass, ShieldCheck } from 'lucide-react';

// Custom marker icon builder
const createMarkerIcon = (color, size = 18, glowColor = color) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid #0f172a;
        box-shadow: 0 0 14px ${glowColor};
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const startIcon = createMarkerIcon('#10b981', 18);
const destIcon = createMarkerIcon('#f43f5e', 18);
const hotspotIcon = createMarkerIcon('#f59e0b', 22, '#f59e0b');

// Distinct color tokens for route visual contrast
const ROUTE_COLOR_PALETTE = [
  { primary: '#10b981', name: 'Emerald (Recommended)' }, // Route 1
  { primary: '#3b82f6', name: 'Royal Blue' },            // Route 2
  { primary: '#8b5cf6', name: 'Purple Slate' }           // Route 3
];

/**
 * Helper component to automatically fit bounds to displayed routes
 */
function MapBoundsFitter({ routes, startCoords, destCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const points = [];
    if (startCoords) points.push(startCoords);
    if (destCoords) points.push(destCoords);

    routes.forEach((r) => {
      if (r.geometry && Array.isArray(r.geometry)) {
        r.geometry.forEach((pt) => points.push(pt));
      }
    });

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (e) {
        console.warn('[MapBoundsFitter]:', e);
      }
    }
  }, [map, routes, startCoords, destCoords]);

  return null;
}

export default function MapView({ routeInfo, routeAnalysisData, selectedRouteId, onSelectRoute }) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const routes = routeAnalysisData?.routes || [];
  const recommendedId = routeAnalysisData?.recommendedRouteId;

  const startCoords = (routeAnalysisData?.startCoordinates && typeof routeAnalysisData.startCoordinates.latitude === 'number' && typeof routeAnalysisData.startCoordinates.longitude === 'number')
    ? [routeAnalysisData.startCoordinates.latitude, routeAnalysisData.startCoordinates.longitude]
    : [28.6435, 77.2215];

  const destCoords = (routeAnalysisData?.destinationCoordinates && typeof routeAnalysisData.destinationCoordinates.latitude === 'number' && typeof routeAnalysisData.destinationCoordinates.longitude === 'number')
    ? [routeAnalysisData.destinationCoordinates.latitude, routeAnalysisData.destinationCoordinates.longitude]
    : [28.5562, 77.1000];

  const activeSelectedId = selectedRouteId || recommendedId || (routes[0] && routes[0].id);
  const activeRoute = routes.find(r => r.id === activeSelectedId) || routes[0];

  // Collect hotspots detected on the selected route (only include valid geocoded hotspots)
  const hotspotMap = new Map();
  routes.forEach(r => {
    const isSelected = r.id === activeSelectedId;
    if (isSelected && r.risk && r.risk.detectedHotspots) {
      r.risk.detectedHotspots.forEach(spot => {
        if (!hotspotMap.has(spot.name)) {
          let coords = null;
          if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number' && !isNaN(spot.latitude) && !isNaN(spot.longitude)) {
            coords = [spot.latitude, spot.longitude];
          } else if (spot.name === 'Minto Bridge') {
            coords = [28.637179, 77.222333];
          }

          // Only add to map rendering if valid numeric coordinates exist
          if (coords && typeof coords[0] === 'number' && typeof coords[1] === 'number' && !isNaN(coords[0]) && !isNaN(coords[1])) {
            hotspotMap.set(spot.name, {
              ...spot,
              coords
            });
          }
        }
      });
    }
  });

  const activeHotspotList = Array.from(hotspotMap.values());

  // SORT ROUTES FOR RENDERING LAYER ORDER:
  // Render unselected routes FIRST, and selected route LAST so it is always on top in the Leaflet SVG layer stack!
  const sortedRoutesForRendering = [...routes].sort((a, b) => {
    if (a.id === activeSelectedId) return 1;  // render selected last (top layer)
    if (b.id === activeSelectedId) return -1;
    return 0;
  });

  return (
    <div className="relative w-full h-[500px] lg:h-[640px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg pointer-events-auto flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Compass className="w-4 h-4 text-teal-400" />
          <span>
            {routes.length > 0 ? `Displaying ${routes.length} Route Alternatives` : 'Delhi Route & Flood Risk Map'}
          </span>
        </div>

        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-xl shadow-lg pointer-events-auto flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
            <span>Start</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
            <span>Destination</span>
          </div>
          {routes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              <span>Recommended Route</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet Map container */}
      {mapReady ? (
        <MapContainer
          center={startCoords}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsFitter routes={routes} startCoords={startCoords} destCoords={destCoords} />

          {/* Start Marker */}
          <Marker position={startCoords} icon={startIcon}>
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <strong className="text-xs uppercase text-emerald-600 block font-bold">Start Location</strong>
                <p className="text-sm font-extrabold">{routeInfo?.start || 'New Delhi Station (Ajmeri Gate)'}</p>
                <p className="text-xs text-slate-600">{startCoords[0]}, {startCoords[1]}</p>
              </div>
            </Popup>
          </Marker>

          {/* Destination Marker */}
          <Marker position={destCoords} icon={destIcon}>
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <strong className="text-xs uppercase text-rose-600 block font-bold">Destination</strong>
                <p className="text-sm font-extrabold">{routeInfo?.destination || 'IGI Airport, Delhi'}</p>
                <p className="text-xs text-slate-600">{destCoords[0]}, {destCoords[1]}</p>
              </div>
            </Popup>
          </Marker>

          {/* Render Route Geometries with Visual Hierarchy based on actual risk severity */}
          {sortedRoutesForRendering.map((route) => {
            const origIndex = routes.findIndex(r => r.id === route.id);
            const isSelected = route.id === activeSelectedId;
            const isRec = route.id === recommendedId;

            // Route colors derived directly from severity level / recommendation status
            let routeColor = isRec ? '#10b981' : '#3b82f6';
            const severity = route.severityLevel?.toUpperCase();
            if (!isRec) {
              if (severity === 'HIGH' || severity === 'SEVERE') {
                routeColor = '#f43f5e'; // Rose / Red
              } else if (severity === 'MODERATE') {
                routeColor = '#f59e0b'; // Amber
              } else if (severity === 'LOW') {
                routeColor = '#10b981'; // Emerald
              }
            }

            if (isSelected && !isRec) {
              // Highlight active selected route while keeping risk tone
              routeColor = severity === 'HIGH' || severity === 'SEVERE' ? '#fb7185' : '#38bdf8';
            }

            const pathOptions = {
              color: routeColor,
              weight: isRec ? (isSelected ? 9 : 7) : (isSelected ? 7 : 4),
              opacity: isSelected ? 0.95 : (isRec ? 0.85 : 0.45),
              dashArray: isRec ? undefined : (isSelected ? undefined : '6, 6')
            };

            return (
              <Polyline
                key={route.id}
                positions={route.geometry}
                pathOptions={pathOptions}
                eventHandlers={{
                  click: () => onSelectRoute && onSelectRoute(route.id)
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-900 font-sans space-y-1">
                    <strong className="text-xs uppercase text-teal-700 block font-bold">{route.name}</strong>
                    <p className="text-sm font-bold text-slate-900">
                      {isRec ? '★ RECOMMENDED SAFER ROUTE' : `ALTERNATIVE ROUTE ${origIndex}`}
                    </p>
                    <p className="text-xs text-slate-700">
                      Duration: ~{Math.round(route.durationSeconds / 60)} min | Distance: {(route.distanceMeters / 1000).toFixed(1)} km
                    </p>
                    <p className="text-xs font-extrabold text-amber-700">
                      Prototype risk index: {route.risk.maximum || route.risk.average} / 100 ({route.severityLevel})
                    </p>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Render Hotspot Markers */}
          {activeHotspotList.map((spot, idx) => (
            <Marker key={idx} position={spot.coords} icon={hotspotIcon}>
              <Popup>
                <div className="p-1.5 text-slate-900 font-sans space-y-1 max-w-[220px]">
                  <span className="text-[10px] uppercase font-bold text-amber-600 block">⚠️ Historical Hotspot Detected</span>
                  <p className="text-sm font-extrabold text-slate-950">{spot.name}</p>
                  <p className="text-xs font-semibold text-slate-700">Historically documented waterlogging</p>
                  <p className="text-xs text-amber-700 font-bold">{spot.distanceMeters}m from this route</p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    Source: {spot.source || 'Indian Express'} / {spot.coordinateSource || 'Delhi Government PWD'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
          Loading map visualization...
        </div>
      )}

      {/* Footer Info Overlay on Map */}
      <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex justify-between items-end">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 px-3.5 py-2 rounded-xl text-xs text-slate-300 pointer-events-auto flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            {routes.length > 0
              ? `Selected route highlighted in bold (${activeRoute ? activeRoute.name : ''}). Click cards or map lines to switch.`
              : 'FloodSafe compares route options using rainfall, historical waterlogging evidence and terrain.'}
          </span>
        </div>
      </div>
    </div>
  );
}
