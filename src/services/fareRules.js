import fixedFareData from "../../data/fixedFareDestinations.json";
import { getDistance } from "geolib";

export const FIXED_FARE_DESTINATIONS = fixedFareData;

/**
 * Check if a given coordinate matches any fixed fare destination.
 * Returns the fare if matched, otherwise null.
 */
export const getFixedFare = (coord) => {
  for (let place of FIXED_FARE_DESTINATIONS) {
    const distanceMeters = getDistance(coord, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
    const distanceKm = distanceMeters / 1000;
    if (distanceKm <= place.radius) {
      return place.fare;
    }
  }
  return null;
};
