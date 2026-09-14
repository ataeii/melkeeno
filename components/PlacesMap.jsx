'use client';
import { useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';

// Generic marker map for the /places/[category] directory pages -- same
// pattern as OfficesMap.jsx, kept separate since "office" naming would be
// confusing for parks/pharmacies/etc, and the popup here shows phone
// instead of an external listing link.
const PlacesMap = ({ places = [], activeId, onMarkerClick }) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const handleMarkerClick = (place) => {
    setPopupInfo(place);
    onMarkerClick && onMarkerClick(place.id);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 15, duration: 800 });
    }
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 51.404, latitude: 35.715, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    >
      {places.map((place) => {
        const isActive = activeId === place.id;
        return (
          <Marker
            key={place.id}
            longitude={place.lng}
            latitude={place.lat}
            anchor='bottom'
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(place);
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: isActive ? '#f59e0b' : '#1e3a5f',
                border: '2px solid white',
                boxShadow: isActive ? '0 4px 12px rgba(245,158,11,0.6)' : '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                transform: isActive ? 'scale(1.3)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            />
          </Marker>
        );
      })}

      {popupInfo && (
        <Popup
          longitude={popupInfo.lng}
          latitude={popupInfo.lat}
          anchor='top'
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          style={{ direction: 'rtl' }}
          maxWidth='240px'
        >
          <div style={{ direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#1e3a5f' }}>
              {popupInfo.name}
            </div>
            {popupInfo.address && (
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>{popupInfo.address}</div>
            )}
            {popupInfo.phone && (
              <div style={{ fontSize: '11px', color: '#2563eb' }}>📞 {popupInfo.phone}</div>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default PlacesMap;
