'use client';
import { useRef, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';

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

const SearchMap = ({ listings = [], activeToken, onMarkerClick, hoveredToken, onMarkerHover }) => {
  const mapRef = useRef(null);
  const [popupInfo, setPopupInfo] = useState(null);

  const handleMarkerClick = useCallback(
    (listing) => {
      setPopupInfo(listing);
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
      const listing = listings.find((l) => l.token === activeToken);
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
    () =>
      listings.filter(
        (l) => l.lat && l.lng && !isNaN(parseFloat(l.lat)) && !isNaN(parseFloat(l.lng))
      ),
    [listings]
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
    >
      {validListings.map((listing) => {
        const isActive = activeToken === listing.token;
        const isHovered = hoveredToken === listing.token;
        const baseColor =
          priceRank[listing.token] != null ? priceColor(priceRank[listing.token]) : NO_PRICE_COLOR;
        return (
          <Marker
            key={listing.token}
            longitude={parseFloat(listing.lng)}
            latitude={parseFloat(listing.lat)}
            anchor='bottom'
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(listing);
            }}
          >
            <div
              onMouseEnter={() => onMarkerHover && onMarkerHover(listing.token)}
              onMouseLeave={() => onMarkerHover && onMarkerHover(null)}
              style={{
                background: isActive ? '#f59e0b' : baseColor,
                color: 'white',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: isActive
                  ? '0 4px 12px rgba(245,158,11,0.6)'
                  : isHovered
                  ? '0 4px 12px rgba(0,0,0,0.5)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid white',
                whiteSpace: 'nowrap',
                transform: isHovered ? 'scale(1.25)' : isActive ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s ease',
                zIndex: isActive || isHovered ? 10 : 1,
              }}
            >
              {formatPriceBubble(listing)}
            </div>
          </Marker>
        );
      })}

      {popupInfo && popupInfo.lat && popupInfo.lng && (
        <Popup
          longitude={parseFloat(popupInfo.lng)}
          latitude={parseFloat(popupInfo.lat)}
          anchor='top'
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
          style={{ direction: 'rtl' }}
          maxWidth='240px'
        >
          <div style={{ direction: 'rtl', fontFamily: 'Vazirmatn, sans-serif' }}>
            {popupInfo.image_url && (
              <img
                src={popupInfo.image_url}
                alt={popupInfo.title || 'ملک'}
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px', color: '#1e3a5f' }}>
              {popupInfo.listing_type === 'rent'
                ? (popupInfo.rent ? formatPrice(popupInfo.rent) + '/ماه' : 'تماس بگیرید')
                : (popupInfo.price ? formatPrice(popupInfo.price) : 'تماس بگیرید')}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
              {[
                popupInfo.area_m2 && `${popupInfo.area_m2} م²`,
                popupInfo.rooms && `${popupInfo.rooms} خواب`,
                popupInfo.floor != null && `طبقه ${popupInfo.floor}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
            {popupInfo.district && (
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                📍 {popupInfo.district}
              </div>
            )}
            {popupInfo.url && (
              <a
                href={popupInfo.url}
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
