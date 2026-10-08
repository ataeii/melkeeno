'use client';
import { useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/maplibre';
import { houseSummary } from '@/lib/houseSummary';
import { advertiserBadge, BADGE_COLOR } from '@/lib/advertiser';

function formatPriceBubble(listing) {
  const price = listing.listing_type === 'rent' ? listing.rent : listing.price;
  if (!price) return '—';
  if (price >= 1e9) return (price / 1e9).toFixed(1) + 'B';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + 'M' + (listing.listing_type === 'rent' ? '/م' : '');
  return price.toLocaleString();
}

function formatPrice(price) {
  if (!price || price === 0) return null;
  if (price >= 1e9) return (price / 1e9).toFixed(1) + ' میلیارد';
  if (price >= 1e6) return (price / 1e6).toFixed(0) + ' میلیون';
  return price.toLocaleString();
}

function listingPrice(l) {
  const v = Number(l.listing_type === 'rent' ? l.rent : l.price);
  return v > 0 ? v : null;
}

// Dark green (cheapest) -> dark red (priciest), blended through hue so midpoints stay vivid.
function priceColor(t) {
  const hue = 135 * (1 - t);
  return `hsl(${hue.toFixed(0)}, 70%, 28%)`;
}

const NO_PRICE_COLOR = '#6b7280';

// "vs market" colouring: how far the asking price is from the typical price of comparable
// listings in the SAME neighbourhood (gap = (asking - typical) / typical). Same dark-green ->
// dark-red scale as the price mode, but centred on "in line with its neighbourhood" (gap 0),
// saturating at -30% / +30%. Rich areas are therefore not red just for being rich.
// Dots whose estimate rests on few comparables (low confidence) are drawn fainter, not hidden.
const GAP_SPAN = 0.3;
const marketColor = (l) => {
  if (l.gap == null) return NO_PRICE_COLOR;
  const t = Math.max(0, Math.min(1, (l.gap + GAP_SPAN) / (2 * GAP_SPAN)));
  return priceColor(t);
};
const dotOpacity = (l, mode) => (mode === 'market' && !['medium', 'high'].includes(l.confidence) ? 0.4 : 0.95);

// `points` are minimal map points (token, lat, lng, type, price, rent) for every
// match; `activeListing` is the full listing (a loaded card, or fetched on demand
// when a point is clicked) and drives the popup.
//
// All points are drawn as ONE WebGL circle layer (+ a price-label layer once
// zoomed in), not as HTML <Marker> elements: with ~5,000 listings, 5,000 DOM
// markers each get their own compositor layer and the browser stops painting
// reliably. Only the hovered and active listing get a bubble Marker.
const SearchMap = ({
  points = [],
  activeListing = null,
  activeToken,
  onMarkerClick,
  hoveredToken,
  onMarkerHover,
  colorMode = 'price', // 'price' (cheapest->priciest) | 'market' (below/near/above market)
}) => {
  const mapRef = useRef(null);

  const handleMarkerClick = useCallback(
    (listing) => {
      onMarkerClick && onMarkerClick(listing.token);
      if (mapRef.current && listing.lat && listing.lng) {
        mapRef.current.flyTo({
          center: [listing.lng, listing.lat],
          zoom: 14,
          duration: 800,
        });
      }
    },
    [onMarkerClick]
  );

  // When activeToken changes externally, fly to it
  const prevActiveToken = useRef(null);
  if (activeToken !== prevActiveToken.current) {
    prevActiveToken.current = activeToken;
    if (activeToken && mapRef.current) {
      const listing = points.find((l) => l.token === activeToken);
      if (listing && listing.lat && listing.lng) {
        mapRef.current.flyTo({
          center: [listing.lng, listing.lat],
          zoom: 14,
          duration: 800,
        });
      }
    }
  }

  const validListings = useMemo(
    () => points.filter((l) => l.lat && l.lng && !isNaN(parseFloat(l.lat)) && !isNaN(parseFloat(l.lng))),
    [points]
  );

  // Rank-based position (0 = cheapest, 1 = priciest) within each listing type,
  // so a few outliers don't wash every other marker to the same shade.
  const priceRank = useMemo(() => {
    const ranks = {};
    ['rent', 'sale'].forEach((type) => {
      const group = validListings.filter(
        (l) => (l.listing_type === 'rent' ? 'rent' : 'sale') === type && listingPrice(l)
      );
      const sorted = [...group].sort((a, b) => listingPrice(a) - listingPrice(b));
      sorted.forEach((l, i) => {
        ranks[l.token] = sorted.length > 1 ? i / (sorted.length - 1) : 0;
      });
    });
    return ranks;
  }, [validListings]);

  const colorFor = (l) =>
    colorMode === 'market'
      ? marketColor(l)
      : priceRank[l.token] != null
      ? priceColor(priceRank[l.token])
      : NO_PRICE_COLOR;

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: validListings.map((l) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [parseFloat(l.lng), parseFloat(l.lat)] },
        properties: {
          token: l.token,
          c: colorFor(l),
          o: dotOpacity(l, colorMode),
          label: formatPriceBubble(l),
        },
      })),
    }),
    [validListings, priceRank, colorMode]
  );

  const pointByToken = useMemo(() => {
    const m = {};
    validListings.forEach((l) => {
      m[l.token] = l;
    });
    return m;
  }, [validListings]);

  const [cursor, setCursor] = useState('');
  const hoverFromMap = useRef(null);

  const handleMapClick = (e) => {
    const f = e.features && e.features[0];
    if (!f) return;
    const [lng, lat] = f.geometry.coordinates;
    handleMarkerClick({ token: f.properties.token, lng, lat });
  };

  const handleMapMove = (e) => {
    const f = e.features && e.features[0];
    const token = f ? f.properties.token : null;
    setCursor(token ? 'pointer' : '');
    if (token !== hoverFromMap.current) {
      hoverFromMap.current = token;
      onMarkerHover && onMarkerHover(token);
    }
  };

  const handleMapLeave = () => {
    setCursor('');
    if (hoverFromMap.current !== null) {
      hoverFromMap.current = null;
      onMarkerHover && onMarkerHover(null);
    }
  };

  // Bubble (price pill) for the listing that is hovered/active. pointer-events:none
  // so it never steals the mouse from the dot underneath it (that caused a
  // pop-in/pop-out flicker once before).
  // Hover = an info card like the neighbourhood-suggestion page's:
  //   [فروش/اجاره]  ۱۳۵ متر در نیاوران  /  ۷۵ میلیارد تومان
  // with a ring on the dot. It flips below the dot near the top edge and slides inward
  // near the left/right edges so it is never cut off.
  const hoverCard = (listing, token) => {
    const sum = houseSummary(listing);
    const map = mapRef.current?.getMap?.();
    const pt = map?.project?.([parseFloat(listing.lng), parseFloat(listing.lat)]);
    const width = map?.getContainer?.()?.clientWidth;
    const flip = pt && pt.y < 130;
    const shiftX = pt && width ? (pt.x > width - 130 ? '-85%' : pt.x < 130 ? '-15%' : '-50%') : '-50%';
    const isRent = sum.kind === 'rent';
    return (
      <Marker
        key={`hover-${token}`}
        longitude={parseFloat(listing.lng)}
        latitude={parseFloat(listing.lat)}
        anchor='center'
        style={{ pointerEvents: 'none', zIndex: 11 }}
      >
        <div style={{ position: 'relative', width: 20, height: 20 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid #f59e0b',
              background: 'rgba(255,255,255,0.35)',
              boxShadow: '0 0 0 2px white, 0 2px 8px rgba(0,0,0,0.35)',
            }}
          />
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
            <span
              style={{
                display: 'inline-block',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                background: isRent ? '#16a34a' : '#1d4ed8',
                borderRadius: '999px',
                padding: '1px 8px',
                marginBottom: '3px',
              }}
            >
              {isRent ? 'اجاره' : 'فروش'}
            </span>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{sum.label}</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', marginTop: '2px' }}>{sum.price}</div>
            {(() => {
              const b = advertiserBadge(listing);
              if (!b) return null;
              const [bg, fg] = BADGE_COLOR[b.kind];
              return (
                <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 'bold', background: bg, color: fg, borderRadius: '999px', padding: '1px 8px', display: 'inline-block' }}>
                  {b.text}
                </div>
              );
            })()}
          </div>
        </div>
      </Marker>
    );
  };

  const bubbleFor = (token, isActive) => {
    const listing = pointByToken[token];
    if (!listing) return null;
    if (!isActive) return hoverCard(listing, token);
    const baseColor = colorFor(listing);
    return (
      <Marker
        key={`bubble-${isActive ? 'a' : 'h'}-${token}`}
        longitude={parseFloat(listing.lng)}
        latitude={parseFloat(listing.lat)}
        anchor='bottom'
        style={{ pointerEvents: 'none', zIndex: isActive ? 12 : 11 }}
      >
        <div
          style={{
            background: isActive ? '#f59e0b' : baseColor,
            color: 'white',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: isActive ? '0 4px 12px rgba(245,158,11,0.6)' : '0 4px 12px rgba(0,0,0,0.5)',
            border: '2px solid white',
            whiteSpace: 'nowrap',
            transform: isActive ? 'scale(1.15)' : 'scale(1.25)',
          }}
        >
          {formatPriceBubble(listing)}
        </div>
      </Marker>
    );
  };

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: 51.404,
        latitude: 35.715,
        zoom: 11,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      interactiveLayerIds={['pts-circles']}
      onClick={handleMapClick}
      onMouseMove={handleMapMove}
      onMouseLeave={handleMapLeave}
      cursor={cursor}
    >
      <Source id='pts' type='geojson' data={geojson}>
        <Layer
          id='pts-circles'
          type='circle'
          paint={{
            'circle-color': ['get', 'c'],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 12, 5, 15, 9],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': ['get', 'o'],
          }}
        />
        <Layer
          id='pts-labels'
          type='symbol'
          minzoom={13.5}
          layout={{
            'text-field': ['get', 'label'],
            'text-font': ['Montserrat Medium'],
            'text-size': 11,
            'text-anchor': 'bottom',
            'text-offset': [0, -0.9],
            'text-optional': true,
          }}
          paint={{ 'text-color': '#1f2937', 'text-halo-color': '#ffffff', 'text-halo-width': 2 }}
        />
      </Source>

      {hoveredToken && hoveredToken !== activeToken && bubbleFor(hoveredToken, false)}
      {activeToken && bubbleFor(activeToken, true)}

      {activeListing && activeListing.lat && activeListing.lng && (
        <Popup
          longitude={parseFloat(activeListing.lng)}
          latitude={parseFloat(activeListing.lat)}
          anchor='top'
          onClose={() => onMarkerClick && onMarkerClick(null)}
          closeOnClick={false}
          style={{ direction: 'rtl' }}
          maxWidth='240px'
        >
          <div style={{ direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
            {activeListing.image_url && (
              <img
                src={activeListing.image_url}
                alt={activeListing.title || 'ملک'}
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#1e3a5f' }}>
              {activeListing.listing_type === 'rent'
                ? (activeListing.rent ? formatPrice(activeListing.rent) + '/ماه' : 'تماس بگیرید')
                : (activeListing.price ? formatPrice(activeListing.price) : 'تماس بگیرید')}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
              {[
                activeListing.area_m2 && `${activeListing.area_m2} م²`,
                activeListing.rooms && `${activeListing.rooms} خواب`,
                activeListing.floor != null && `طبقه ${activeListing.floor}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {activeListing.district && (
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                📍 {activeListing.district}
              </div>
            )}
            {(() => {
              const b = advertiserBadge(activeListing);
              if (!b) return null;
              const [bg, fg] = BADGE_COLOR[b.kind];
              return (
                <div style={{ marginBottom: '6px', fontSize: '11px', fontWeight: 'bold', background: bg, color: fg, borderRadius: '999px', padding: '1px 8px', display: 'inline-block' }}>
                  {b.text}
                </div>
              );
            })()}
            {activeListing.url && activeListing.source !== 'user' && (
              <a
                href={activeListing.url}
                target='_blank'
                rel='nofollow noopener noreferrer'
                style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline' }}
              >
                مشاهده در دیوار ↗
              </a>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default SearchMap;
