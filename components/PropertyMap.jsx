'use client';
import { useEffect, useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import { geocodeAddress } from '@/lib/geocode';
import Spinner from './Spinner';
import Image from 'next/image';
import pin from '@/assets/images/pin.svg';

const PropertyMap = ({ property }) => {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 12,
    width: '100%',
    height: '500px',
  });
  const [loading, setLoading] = useState(true);
  const [geocodeError, setGeocodeError] = useState(false);

  useEffect(() => {
    const fetchCoords = async () => {
      try {
        const coords = await geocodeAddress(
          `${property.location.street} ${property.location.city} ${property.location.state} ${property.location.zipcode}`
        );

        if (!coords) {
          setGeocodeError(true);
          setLoading(false);
          return;
        }

        const { lat, lng } = coords;

        setLat(lat);
        setLng(lng);
        setViewport({
          ...viewport,
          latitude: lat,
          longitude: lng,
        });

        setLoading(false);
      } catch (error) {
        console.log(error);
        setGeocodeError(true);
        setLoading(false);
      }
    };

    fetchCoords();
  }, []);

  if (loading) return <Spinner loading={loading} />;

  // Handle case where geocoding failed
  if (geocodeError) {
    return <div className='text-xl'>No location data found</div>;
  }

  return (
    !loading && (
      <Map
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 15,
        }}
        style={{ width: '100%', height: 500 }}
        mapStyle='https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
      >
        <Marker longitude={lng} latitude={lat} anchor='bottom'>
          <Image src={pin} alt='location' width={40} height={40} />
        </Marker>
      </Map>
    )
  );
};
export default PropertyMap;
