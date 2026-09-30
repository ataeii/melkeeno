// URLs for the per-neighborhood rental pages (/properties/rent/[district]).
// Neighborhood names are used as-is (Persian) in the path.
export const rentPagePath = (district) => `/properties/rent/${encodeURIComponent(district)}`;

export function decodeDistrict(param) {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

// Rent under 1M toman is a placeholder on full-deposit (رهن کامل) ads.
export const realRent = (rent) => (rent && rent >= 1_000_000 ? rent : 0);
