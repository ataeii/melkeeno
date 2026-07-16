export async function geocodeAddress(address) {
  const params = new URLSearchParams({ format: 'json', q: address, limit: '1' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'melkeeno.ir property geocoder (contact: ataeii@gmail.com)' },
  });

  if (!res.ok) throw new Error('Geocoding request failed');

  const results = await res.json();
  if (!results.length) return null;

  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}
