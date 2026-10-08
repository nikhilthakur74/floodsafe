/**
 * Historical Waterlogging & Flood Events Data Layer for Delhi
 * Documented Replay Events from verified news reports and official government records.
 * 
 * Geolocation Policy:
 * Coordinates are provided ONLY when backed by a traceable official source.
 * Otherwise latitude and longitude remain null.
 */

export const historicalEvents = [
  {
    id: 'delhi-july-08-2023',
    date: '2023-07-08',
    city: 'Delhi',
    title: 'Delhi Torrential Downpour (July 8, 2023)',
    description: 'Heavy monsoon rainfall triggered widespread waterlogging across major thoroughfares and arterial underpasses in Delhi.',
    rainfallStations: [
      { station: 'Safdarjung', rainfallMm: 98.7, timeframe: '24h' },
      { station: 'Lodhi Road', rainfallMm: 92.0, timeframe: '24h' },
      { station: 'Ridge', rainfallMm: 111.4, timeframe: '24h' }
    ],
    waterloggingLocations: [
      {
        name: 'Minto Bridge',
        latitude: 28.637179,
        longitude: 77.222333,
        severity: 'high',
        source: 'Indian Express',
        coordinateSource: 'Delhi Government PWD document (https://ifc.delhi.gov.in/sites/default/files/inline-files/appendix_vii.pdf)'
      },
      {
        name: 'Rohtak Road',
        latitude: null,
        longitude: null,
        severity: 'high',
        source: 'Indian Express',
        coordinateSource: null
      },
      {
        name: 'Ring Road',
        latitude: null,
        longitude: null,
        severity: 'high',
        source: 'Indian Express',
        coordinateSource: null
      },
      {
        name: 'Connaught Place',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Indian Express',
        coordinateSource: null
      },
      {
        name: 'Rabindra Nagar',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Indian Express',
        coordinateSource: null
      },
      {
        name: 'Vinod Nagar',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Indian Express',
        coordinateSource: null
      }
    ],
    source: 'https://indianexpress.com/article/cities/delhi/waterlogging-across-delhi-as-heavy-rain-pounds-national-capital-8817352/'
  },
  {
    id: 'delhi-july-24-2024',
    date: '2024-07-24',
    city: 'Delhi',
    title: 'Delhi Monsoon Spells (July 24, 2024)',
    description: 'Substantial rainfall across NCR leading to waterlogging and traffic disruptions at critical underpasses and key roads.',
    rainfallStations: [
      { station: 'Safdarjung', rainfallMm: 27.0, timeframe: '24h' },
      { station: 'Ayanagar', rainfallMm: 14.2, timeframe: '24h' },
      { station: 'Ridge', rainfallMm: 26.6, timeframe: '24h' },
      { station: 'Lodhi Road', rainfallMm: 24.2, timeframe: '24h' },
      { station: 'Palam', rainfallMm: 17.8, timeframe: '24h' }
    ],
    waterloggingLocations: [
      {
        name: 'Zakhira Underpass',
        latitude: null,
        longitude: null,
        severity: 'high',
        source: 'Hindustan Times',
        coordinateSource: null
      },
      {
        name: 'Nigambodh Ghat',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Hindustan Times',
        coordinateSource: null
      },
      {
        name: 'Anand Parbat',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Hindustan Times',
        coordinateSource: null
      }
    ],
    source: 'https://www.hindustantimes.com/india-news/heavy-rain-triggers-waterlogging-impacts-traffic-in-parts-of-ncr-101721795757124-amp.html'
  },
  {
    id: 'delhi-july-2025',
    date: '2025-07',
    city: 'Delhi',
    title: 'Delhi Monsoon Downpour (July 2025)',
    description: 'Severe precipitation impacting south and west Delhi traffic arteries.',
    rainfallStations: [],
    waterloggingLocations: [
      {
        name: 'Rohtak Road',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Hindustan Times',
        coordinateSource: null
      },
      {
        name: 'Press Enclave Road',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Hindustan Times',
        coordinateSource: null
      },
      {
        name: 'Anuvrat Marg near Qutub Minar',
        latitude: null,
        longitude: null,
        severity: 'medium',
        source: 'Hindustan Times',
        coordinateSource: null
      }
    ],
    source: 'https://www.hindustantimes.com/cities/delhi-news/rain-brings-delhi-to-its-knees-101753210003366.html'
  }
];
