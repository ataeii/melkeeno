'use client';
import { useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';

const OfficesMap = ({ offices = [], activeId, onMarkerClick }) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const handleMarkerClick = (office) => {
    setPopupInfo(office);
    onMarkerClick && onMarkerClick(office.id);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [office.lng, office.lat], zoom: 14, duration: 800 });
    }
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 51.404, latitude: 35.715, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    >
      {offices.map((office) => {
        const isActive = activeId === office.id;
        return (
          <Marker
            key={office.id}
            longitude={office.lng}
            latitude={office.lat}
            anchor='bottom'
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(office);
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
            {popupInfo.geocode_confidence === 'low' && (
              <div style={{ fontSize: '10px', color: '#b45309', marginBottom: '4px' }}>
                📍 موقعیت تقریبی است
              </div>
            )}
            {popupInfo.url && (
              <a
                href={popupInfo.url}
                target='_blank'
                rel='noopener noreferrer'
                style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline' }}
              >
                مشاهده در کیلید ↗
              </a>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default OfficesMap;
