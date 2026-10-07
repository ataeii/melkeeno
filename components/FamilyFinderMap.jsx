'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre';
import { houseSummary } from '@/lib/houseSummary';

const ROUTE_COLORS = ['#0052ab', '#c2410c', '#0f766e', '#7c3aed', '#be123c', '#a16207'];

// Same Tehran extent used server-side (scraper's TEHRAN_BBOX) -- north
// Tehran (Darband/Niavaran/Velenjak, up toward the Alborz foothills) was
// getting cut off because the reactive fitBounds effect below was fitting
// to wherever the scraped house listings actually cluster, not the full
// city; this fixed bound is what the page shows by default before/without
// any real selection driving a tighter fit.
const TEHRAN_BOUNDS = [
  [51.15, 35.55],
  [51.65, 35.85],
];

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
  onHouseClick,
  activeMode,
  onMapClick,
  routes = [],
  house = null,
  hoveredHouse = null,
  // The "~10 nearby schools" view for a picked house -- plain dots + hover
  // tooltip instead of full driving routes (10 crossing route lines would
  // be unreadable clutter, and the point here is just "what's around here",
  // not turn-by-turn). hoveredNearbySchoolId/onNearbySchoolHover let the
  // list panel and the map dots highlight each other in sync, same pattern
  // as the house list already uses with hoveredHouse.
  nearbySchoolDots = [],
  hoveredNearbySchoolId = null,
  onNearbySchoolHover,
}) => {
  const mapRef = useRef(null);
  const [tooltipSchool, setTooltipSchool] = useState(null);

  // All browsable houses are drawn as ONE circle layer (not one HTML <Marker> each): with
  // thousands of houses, thousands of DOM markers make the page slow and the browser stops
  // painting reliably. Hover/click go through the map's own feature picking instead.
  const [houseCursor, setHouseCursor] = useState(false);
  const hoveredToken = useRef(null);
  const housesByToken = useMemo(() => {
    const m = {};
    allHouses.forEach((h) => {
      m[h.token] = h;
    });
    return m;
  }, [allHouses]);
  const housesGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: allHouses
        .filter((h) => h.lat && h.lng)
        .map((h) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
          properties: { token: h.token },
        })),
    }),
    [allHouses]
  );
  const pickHouse = (e) => {
    const f = e.features?.find((x) => x.layer?.id === 'house-dots');
    return f ? housesByToken[f.properties.token] : null;
  };

  // Fit the view to whatever is currently being shown (routes + pins) so
  // short urban routes are actually visible following streets, instead of
  // sitting inside the default city-wide zoom where a 1-3km route looks
  // almost like a straight line regardless of how accurate it really is.
  // While browsing all houses on the map, everything is already visible in
  // one wide shot — refitting on every hover would fight the user's own
  // zoom/pan (which is exactly what they're trying to do to pick a house).
  // So the hover preview only drives a refit when we're NOT already showing
  // that wide view.
  const trackHoverForBounds = allHouses.length === 0;

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;

    // Deliberately excludes `allHouses` -- fitting to wherever the scraped
    // listings happen to cluster is what cut off north Tehran by default.
    // Browsing mode keeps the fixed full-city view (set on load below);
    // this effect only tightens the view once there's an actual selection.
    const points = [];
    routes.forEach((r) => r.geometry?.forEach(([lng, lat]) => points.push([lng, lat])));
    if (house) points.push([house.lng, house.lat]);
    if (hoveredHouse && trackHoverForBounds) points.push([hoveredHouse.lng, hoveredHouse.lat]);
    schools.forEach((s) => points.push([s.lng, s.lat]));
    nearbySchoolDots.forEach((s) => points.push([s.lng, s.lat]));

    if (points.length < 2) return;

    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, { padding: 70, duration: 600, maxZoom: 16 });
  }, [
    routes,
    house?.lat,
    house?.lng,
    trackHoverForBounds ? hoveredHouse?.lat : undefined,
    trackHoverForBounds ? hoveredHouse?.lng : undefined,
    nearbySchoolDots,
    schools,
  ]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ bounds: TEHRAN_BOUNDS, fitBoundsOptions: { padding: 20 } }}
      onLoad={(e) => e.target.fitBounds(TEHRAN_BOUNDS, { padding: 20, duration: 0 })}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      interactiveLayerIds={allHouses.length > 0 ? ['house-dots'] : []}
      onClick={(e) => {
        const h = pickHouse(e);
        if (h) {
          onHouseClick?.(h);
          return;
        }
        onMapClick?.(e.lngLat.lat, e.lngLat.lng);
      }}
      onMouseMove={(e) => {
        const h = pickHouse(e);
        const token = h ? h.token : null;
        setHouseCursor(!!h);
        if (token !== hoveredToken.current) {
          hoveredToken.current = token;
          onHouseHover?.(h ? { lat: h.lat, lng: h.lng, ...houseSummary(h) } : null);
        }
      }}
      onMouseLeave={() => {
        setHouseCursor(false);
        if (hoveredToken.current !== null) {
          hoveredToken.current = null;
          onHouseHover?.(null);
        }
      }}
      cursor={houseCursor ? 'pointer' : activeMode ? 'crosshair' : 'grab'}
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

      {hoveredHouse && (() => {
        // A bubble with what the house is ("۱۳۵ متر در نیاوران" / price) sits above the pin; if the
        // house is near the top edge of the map it flips below instead so it isn't cut off.
        const map = mapRef.current?.getMap?.();
        const pt = map?.project?.([hoveredHouse.lng, hoveredHouse.lat]);
        const width = map?.getContainer?.()?.clientWidth;
        const flip = pt && pt.y < 110;
        // near the left/right edge, slide the bubble inward so it isn't cut off
        const shiftX = pt && width ? (pt.x > width - 120 ? '-85%' : pt.x < 120 ? '-15%' : '-50%') : '-50%';
        return (
          // pointerEvents:none on the Marker itself (not just its child): this pin is
          // drawn exactly over the hovered dot, so if it caught the mouse the dot
          // would get a mouseleave, the pin would vanish, the dot would get a
          // mouseenter again -- an endless pop-in/pop-out flicker.
          <Marker
            longitude={hoveredHouse.lng}
            latitude={hoveredHouse.lat}
            anchor='bottom'
            style={{ pointerEvents: 'none', zIndex: 30 }}
          >
            <div style={{ position: 'relative' }}>
              {hoveredHouse.label && (
                <div
                  dir='rtl'
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: `translateX(${shiftX})`,
                    ...(flip ? { top: 'calc(100% + 10px)' } : { bottom: 'calc(100% + 10px)' }),
                    background: 'white',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    padding: '7px 11px',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    fontFamily: 'Vazirmatn, sans-serif',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{hoveredHouse.label}</div>
                  {hoveredHouse.price && (
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginTop: '2px' }}>
                      {hoveredHouse.price}
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  ...pinStyle('#d97706'),
                  transform: 'scale(1.25)',
                  boxShadow: '0 4px 14px rgba(217,119,6,0.6)',
                }}
              >
                🏠
              </div>
            </div>
          </Marker>
        );
      })()}

      {house && (
        <Marker longitude={house.lng} latitude={house.lat} anchor='bottom'>
          <div style={pinStyle('#16a34a')}>🏠 خانه</div>
        </Marker>
      )}

      {allHouses.length > 0 && (
        <Source id='houses' type='geojson' data={housesGeoJson}>
          <Layer
            id='house-dots'
            type='circle'
            paint={{
              'circle-color': '#16a34a',
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 13, 6, 16, 9],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.95,
            }}
          />
        </Source>
      )}

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

      {nearbySchoolDots.map((s) => {
        const isHighlighted = hoveredNearbySchoolId === s.id || tooltipSchool?.id === s.id;
        return (
          <Marker key={`near-s-${s.id}`} longitude={s.lng} latitude={s.lat} anchor='center'>
            <div
              onMouseEnter={() => {
                setTooltipSchool(s);
                onNearbySchoolHover?.(s.id);
              }}
              onMouseLeave={() => {
                setTooltipSchool(null);
                onNearbySchoolHover?.(null);
              }}
              style={{
                width: isHighlighted ? 16 : 11,
                height: isHighlighted ? 16 : 11,
                borderRadius: '50%',
                background: '#dc2626',
                border: '2px solid white',
                boxShadow: isHighlighted ? '0 2px 8px rgba(220,38,38,0.7)' : '0 1px 3px rgba(0,0,0,0.4)',
                cursor: 'pointer',
                transition: 'width 0.12s, height 0.12s',
              }}
            />
          </Marker>
        );
      })}

      {/* Hover tooltip for nearby-school dots -- richer than a native title
          attribute, and shared between hovering the dot itself and hovering
          the matching row in the list panel (see hoveredNearbySchoolId). */}
      {tooltipSchool && (
        <Marker longitude={tooltipSchool.lng} latitude={tooltipSchool.lat} anchor='bottom' offset={[0, -14]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'white',
              color: '#1f2937',
              borderRadius: '10px',
              padding: '8px 10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>🏫 {tooltipSchool.name}</div>
            {shortSchoolLabel(tooltipSchool) && (
              <div style={{ color: '#6b7280', fontSize: '11px' }}>{shortSchoolLabel(tooltipSchool)}</div>
            )}
            {tooltipSchool.duration_min != null && (
              <div style={{ color: '#dc2626', fontSize: '11px', fontWeight: 'bold' }}>
                {tooltipSchool.duration_min} دقیقه با ماشین
              </div>
            )}
          </div>
        </Marker>
      )}
    </Map>
  );
};

export default FamilyFinderMap;
