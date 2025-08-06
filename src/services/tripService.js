import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Save a trip to AsyncStorage (offline only)
 * @param {Object} trip - Trip data to store
 */
export const saveTripLocally = async (trip) => {
  try {
    const existing = await AsyncStorage.getItem('trips');
    const trips = existing ? JSON.parse(existing) : [];
    trips.push(trip);
    await AsyncStorage.setItem('trips', JSON.stringify(trips));
    // console.log('[TripService] Trip saved locally'); // Removed notification
  } catch (err) {
    console.error('[TripService] Failed to save trip locally:', err);
  }
};
