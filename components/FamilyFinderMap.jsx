'use client';
import { useRef, useEffect } from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre';

const ROUTE_COLORS = ['#0052ab', '#c2410c', '#0f766e', '#7c3aed', '#be123c', '#a16207'];

const shortSchoolLabel = (s) => {
  const text = s.base_level || '';
  let level = null;
  if (text.includes('پیش دبستان')) level = 'پیش‌دبستان';
  else if (text.includes('ابتدایی') && text.includes('دوره اول')) level = 'ابتدایی ۱';
  else if (text.includes('ابتدایی') && text.includes('دوره دوم')) level = 'ابتدایی ۲';
  else if (text.includes('دبستان') || text.includes('ابتدایی')) level = 'ابتدایی';
  else if (text.includes('متوسطه دوره اول')) level = 'متوسطه ۱';
  else if (text.includes('متوسطه دوره دوم') || text.includes('دبیرستان')) level = 'متوسطه ۲';

  const type = s.school_type && s.school_type.includes('غیر دولتی') ? 'غیردولتی' : s.school_type;
  return [level, type].filter(Boolean).join(' · ');
};

const pinStyle = (bg) => ({
  background: bg,
  color: 'white',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  border: '2px solid white',
  whiteSpace: 'nowrap',
});

const FamilyFinderMap = ({
  schools = [],
  allSchools = [],
  onSchoolMarkerClick,
  allHouses = [],
  onHouseHover,
  activeMode,
  onMapClick,
  routes = [],
  house = null,
  hoveredHouse = null,
}) => {
  const mapRef = useRef(null);

  // Fit the view to whatever is currently being shown (routes + pins) so
  // short urban routes are actually visible following streets, instead of
  // sitting inside the default city-wide zoom where a 1-3km route looks
  // almost like a straight line regardless of how accurate it really is.
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    const points = [];
    routes.forEach((r) => r.geometry?.forEach(([lng, lat]) => points.push([lng, lat])));
    if (house) points.push([house.lng, house.lat]);
    if (hoveredHouse) points.push([hoveredHouse.lng, hoveredHouse.lat]);
    schools.forEach((s) => points.push([s.lng, s.lat]));
    allHouses.forEach((h) => points.push([h.lng, h.lat]));

    if (points.length < 2) return;

    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 70, duration: 600, maxZoom: 16 });
  }, [routes, house?.lat, house?.lng, hoveredHouse?.lat, hoveredHouse?.lng, schools, allHouses]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 51.404, latitude: 35.715, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      onClick={(e) => onMapClick(e.lngLat.lat, e.lngLat.lng)}
      cursor={activeMode ? 'crosshair' : 'grab'}
    >
      {routes.map((r, i) => {
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        const mid = r.geometry[Math.floor(r.geometry.length / 2)];
        return (
          <div key={i}>
            <Source
              id={`route-${i}`}
              type='geojson'
              data={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: r.geometry },
              }}
            >
              <Layer
                id={`route-line-${i}`}
                type='line'
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{ 'line-color': color, 'line-width': 4, 'line-opacity': 0.8 }}
              />
            </Source>
            {mid && (
              <Marker longitude={mid[0]} latitude={mid[1]} anchor='center'>
                <div
                  style={{
                    background: color,
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.label}: {r.duration_min} دقیقه{r.estimated ? '~' : ''}
                </div>
              </Marker>
            )}
          </div>
        );
      })}

      {hoveredHouse && (
        <Marker longitude={hoveredHouse.lng} latitude={hoveredHouse.lat} anchor='bottom'>
          <div
            style={{
              ...pinStyle('#d97706'),
              transform: 'scale(1.25)',
              boxShadow: '0 4px 14px rgba(217,119,6,0.6)',
            }}
          >
            🏠
          </div>
        </Marker>
      )}

      {house && (
        <Marker longitude={house.lng} latitude={house.lat} anchor='bottom'>
          <div style={pinStyle('#16a34a')}>🏠 خانه</div>
        </Marker>
      )}

      {allHouses.map((h) => (
        <Marker key={`all-h-${h.token}`} longitude={h.lng} latitude={h.lat} anchor='bottom'>
          <div
            title={h.title}
            onMouseEnter={() => onHouseHover?.({ lat: h.lat, lng: h.lng })}
            onMouseLeave={() => onHouseHover?.(null)}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#16a34a',
              border: '1.5px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          />
        </Marker>
      ))}

      {allSchools.map((s) => (
        <Marker
          key={`all-s-${s.id}`}
          longitude={s.lng}
          latitude={s.lat}
          anchor='bottom'
          onClick={(e) => {
            e.originalEvent?.stopPropagation();
            onSchoolMarkerClick?.(s);
          }}
        >
          <div
            title={s.name}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#fb923c',
              border: '1.5px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          />
        </Marker>
      ))}

      {schools.map((s, i) => {
        const meta = shortSchoolLabel(s);
        return (
          <Marker key={`s-${i}`} longitude={s.lng} latitude={s.lat} anchor='bottom'>
            <div style={{ ...pinStyle('#c2410c'), textAlign: 'center' }}>
              <div>🏫 {s.label || `مدرسه ${i + 1}`}</div>
              {meta && <div style={{ fontSize: '10px', fontWeight: 'normal', opacity: 0.9 }}>{meta}</div>}
            </div>
          </Marker>
        );
      })}
    </Map>
  );
};

export default FamilyFinderMap;
