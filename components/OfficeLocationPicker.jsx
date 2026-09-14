'use client';
import { Map, Marker } from 'react-map-gl/maplibre';

// Click-anywhere-to-place-marker map for the office registration form.
// Deliberately simple (single marker, no search) -- the address text field
// covers the "find it" step; this is just for pinning the exact point.
const OfficeLocationPicker = ({ lat, lng, onChange }) => {
  const hasPoint = lat != null && lng != null;

  return (
    <Map
      initialViewState={{ longitude: lng ?? 51.404, latitude: lat ?? 35.715, zoom: hasPoint ? 15 : 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      onClick={(e) => onChange(e.lngLat.lat, e.lngLat.lng)}
      cursor='crosshair'
    >
      {hasPoint && (
        <Marker longitude={lng} latitude={lat} anchor='center'>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#2563eb',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          />
        </Marker>
      )}
    </Map>
  );
};

export default OfficeLocationPicker;
