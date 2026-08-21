'use client';
import { useRef, useEffect, useState } from 'react';
import { Map, Marker } from 'react-map-gl/maplibre';

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

// Real extent of Tehran -- same box geocode_districts.py and
// school_scraper.py's fetch_real_coords() already validate against at the
// source. Re-checked here too: a single bad coordinate slipping through
// (already happened once -- a school with lat/lng swapped at the source,
// which pulled the whole auto-fit-bounds view out toward the Turkey/Georgia
// border for every visitor) shouldn't be able to break the view for
// everyone just because one upstream record was bad.
const TEHRAN_BBOX = { latMin: 35.55, latMax: 35.85, lngMin: 51.15, lngMax: 51.65 };
const inTehran = (s) =>
  s.lat >= TEHRAN_BBOX.latMin && s.lat <= TEHRAN_BBOX.latMax && s.lng >= TEHRAN_BBOX.lngMin && s.lng <= TEHRAN_BBOX.lngMax;

// Dedicated map for the schools-only tab -- deliberately lean (no houses,
// routes, or match logic) compared to FamilyFinderMap, since this view is
// just "browse every school", not the commute-matching flow.
const SchoolsMap = ({ schools = [], hoveredSchoolId = null, onSchoolHover, onSchoolClick }) => {
  const mapRef = useRef(null);
  const [tooltipSchool, setTooltipSchool] = useState(null);
  const validSchools = schools.filter(inTehran);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || validSchools.length === 0) return;
    const lngs = validSchools.map((s) => s.lng);
    const lats = validSchools.map((s) => s.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 50, duration: 0, maxZoom: 13 }
    );
    // Only on first load with data -- user's own pan/zoom afterward shouldn't
    // get fought on every hover-driven re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validSchools.length > 0]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: 51.404, latitude: 35.715, zoom: 11 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
    >
      {validSchools.map((s) => {
        const isHighlighted = hoveredSchoolId === s.id || tooltipSchool?.id === s.id;
        return (
          <Marker key={s.id} longitude={s.lng} latitude={s.lat} anchor='center'>
            <div
              onMouseEnter={() => {
                setTooltipSchool(s);
                onSchoolHover?.(s.id);
              }}
              onMouseLeave={() => {
                setTooltipSchool(null);
                onSchoolHover?.(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSchoolClick?.(s);
              }}
              style={{
                width: isHighlighted ? 16 : 10,
                height: isHighlighted ? 16 : 10,
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

      {tooltipSchool && (
        <Marker longitude={tooltipSchool.lng} latitude={tooltipSchool.lat} anchor='bottom' offset={[0, -14]}>
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
            {(tooltipSchool.district_num != null || tooltipSchool.gender) && (
              <div style={{ color: '#6b7280', fontSize: '11px' }}>
                {[
                  tooltipSchool.district_num != null ? `منطقه ${tooltipSchool.district_num}` : null,
                  tooltipSchool.gender,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>
        </Marker>
      )}
    </Map>
  );
};

export default SchoolsMap;
