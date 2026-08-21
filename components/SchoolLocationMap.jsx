'use client';
import { Map, Marker } from 'react-map-gl/maplibre';

// Single-marker map for one school's detail page -- deliberately simpler
// than SchoolsMap.jsx (no hover tooltip, no list-sync, no fit-bounds over
// many points), since there's only ever one point to show here.
const SchoolLocationMap = ({ lat, lng, name }) => {
  if (lat == null || lng == null) return null;

  return (
    <Map
      initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    >
      <Marker longitude={lng} latitude={lat} anchor='center'>
        <div
          title={name}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#dc2626',
            border: '2px solid white',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </Marker>
    </Map>
  );
};

export default SchoolLocationMap;
