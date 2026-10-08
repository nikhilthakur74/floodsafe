# FloodSafe API Documentation

## Base URL
`http://localhost:5000/api`

---

## Endpoints

### 1. `POST /api/routes/analyze`
Analyzes driving routes between start and destination coordinates (or location names) under live weather or historical storm replay scenarios.

#### Request Body
```json
{
  "start": {
    "latitude": 28.6304,
    "longitude": 77.2177
  },
  "destination": {
    "latitude": 28.5562,
    "longitude": 77.1000
  },
  "mode": "historical",
  "eventId": "delhi-july-08-2023"
}
```

#### Response (200 OK)
```json
{
  "provider": "OpenRouteService",
  "mode": "historical",
  "eventId": "delhi-july-08-2023",
  "alternativesAvailable": true,
  "count": 3,
  "recommendedRouteId": "route-1",
  "routes": [
    {
      "id": "route-1",
      "name": "Primary Route (ORS)",
      "distanceMeters": 18589,
      "durationSeconds": 1421,
      "provider": "OpenRouteService",
      "risk": {
        "average": 49,
        "maximum": 52,
        "highRiskPointCount": 0,
        "highRiskPercentage": 0,
        "detectedHotspots": [],
        "components": {
          "rainfallRisk": 100,
          "historicalWaterloggingRisk": 0,
          "rainfallSimilarityRisk": 74,
          "terrainRisk": 28
        }
      },
      "riskExplanation": [
        "Historical rainfall pattern indicates elevated rainfall intensity risk.",
        "No coordinate-backed historical waterlogging hotspot was detected along this route.",
        "Terrain elevation profile contributed moderately to the estimated risk."
      ],
      "recommendationScore": 33,
      "severityLevel": "HIGH",
      "isRecommended": true,
      "geometry": [
        [28.6304, 77.2177],
        [28.6305, 77.2175]
      ]
    }
  ]
}
```

---

### 2. `GET /api/health`
Returns backend health status.

#### Response (200 OK)
```json
{
  "status": "ok",
  "service": "FloodSafe API",
  "message": "Backend is running smoothly",
  "timestamp": "2026-10-08T18:00:00.000Z",
  "version": "1.0.0"
}
```

---

### 3. `GET /api/replay/events`
Returns all documented historical storm replay events.

#### Response (200 OK)
```json
{
  "count": 3,
  "events": [
    {
      "id": "delhi-july-08-2023",
      "date": "2023-07-08",
      "city": "Delhi",
      "title": "Delhi Torrential Downpour (July 8, 2023)",
      "rainfallStations": [
        { "station": "Safdarjung", "rainfallMm": 98.7, "timeframe": "24h" }
      ],
      "waterloggingLocations": [
        {
          "name": "Minto Bridge",
          "latitude": 28.637179,
          "longitude": 77.222333,
          "severity": "high",
          "source": "Indian Express",
          "coordinateSource": "Delhi Government PWD document"
        }
      ]
    }
  ]
}
```
