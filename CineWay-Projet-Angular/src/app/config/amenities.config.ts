export const AMENITY_ICONS: Record<string, string> = {
  'IMAX': 'bi-aspect-ratio',
  '3D': 'bi-badge-3d',
  '4DX': 'bi-lightning',
  'Dolby Atmos': 'bi-soundwave',
  'Dolby Surround': 'bi-speaker',
  'Laser Projection': 'bi-lightbulb',
  'Digital Projection': 'bi-projector',

  'VIP Seats': 'bi-star-fill',
  'Premium Seats': 'bi-gem',
  'Recliner Seats': 'bi-person-arms-up',
  'Comfortable Seats': 'bi-person-square',
  'Standard Seats': 'bi-person',
  'Multiple Screens': 'bi-grid-3x3-gap',

  'Wheelchair Accessible': 'bi-universal-access',
  'Hearing Assistance': 'bi-ear',

  'Snack Bar': 'bi-cup-straw',
  'Food Court': 'bi-shop',
  'Cafe': 'bi-cup-hot',
  'Restaurant': 'bi-egg-fried',
  'Concession Stand': 'bi-basket',
  'Alcohol Served': 'bi-cup-fill',

  'Online Booking': 'bi-phone',
  'Online Tickets': 'bi-ticket-perforated',
  'Parking': 'bi-p-square',
  'Air Conditioning': 'bi-snow',
  'Premium Sound': 'bi-volume-up',
  'VIP Lounge': 'bi-door-open',
};

export const DEFAULT_AMENITY_ICON = 'bi-info-circle';

  export function getIconAmenity(amenity: string): string {
    return AMENITY_ICONS[amenity] ?? DEFAULT_AMENITY_ICON;
  }

  export function formatName(amenity: string): string {
    return amenity.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
