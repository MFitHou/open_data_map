export interface NearbyPlace {
  poi: string;
  amenity: string;
  name: string | null;
  access: string | null;
  fee: string | null;
  wkt: string;
  lon: number;
  lat: number;
  distanceKm: number;
}

export interface NearbyResponse {
  center: {
    lon: number;
    lat: number;
  };
  radiusKm: number;
  count: number;
  items: NearbyPlace[];
}

export const fetchNearbyPlaces = async (
  lon: number,
  lat: number,
  radiusKm: number = 1,
  amenityType: string = 'toilets'
): Promise<NearbyResponse | null> => {
  try {
    const url = `http://localhost:3000/fuseki/${amenityType}/nearby?lon=${lon}&lat=${lat}&radiusKm=${radiusKm}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch nearby places:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return null;
  }
};

export const getAmenityIcon = (amenity: string): string => {
  const icons: Record<string, string> = {
    toilets: '🚻',
    atm: '🏧',
    bank: '🏦',
    restaurant: '🍴',
    cafe: '☕',
    hospital: '🏥',
    pharmacy: '💊',
    school: '🏫',
    parking: '🅿️',
    fuel: '⛽',
    hotel: '🏨',
    library: '📚',
    post_office: '📮',
    police: '👮',
    fire_station: '🚒',
  };
  return icons[amenity] || '📍';
};