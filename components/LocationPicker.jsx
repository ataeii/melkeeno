'use client';
import { Map, Marker } from 'react-map-gl/maplibre';

const LocationPicker = ({ lat, lng, onChange }) => {
  return (
    <Map
      initialViewState={{ longitude: lng || 51.404, latitude: lat || 35.715, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      onClick={(e) => onChange(e.lngLat.lat, e.lngLat.lng)}
      cursor='crosshair'
    >
      {lat != null && lng != null && (
        <Marker longitude={lng} latitude={lat} anchor='bottom'>
          <div
            style={{
              background: '#16a34a',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '20px',
              fontSize: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              border: '2px solid white',
            }}
          >
            🏠
          </div>
        </Marker>
      )}
    </Map>
  );
};

export default LocationPicker;
