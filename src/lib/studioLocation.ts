import { BUSINESS_IDENTITY } from './businessIdentity';

export const STUDIO_ADDRESS = BUSINESS_IDENTITY.fullAddress;
export const STUDIO_SHORT_ADDRESS = BUSINESS_IDENTITY.shortAddress;

export const STUDIO_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADDRESS)}`;
