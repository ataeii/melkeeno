'use client';
import dynamic from 'next/dynamic';

// Client wrapper so server-rendered place pages can include the map
// (a server component can't use dynamic(..., { ssr: false }) directly).
const SchoolLocationMap = dynamic(() => import('@/components/SchoolLocationMap'), { ssr: false });

const PlaceLocationMap = (props) => <SchoolLocationMap {...props} />;

export default PlaceLocationMap;
