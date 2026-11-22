import { Alert, Linking, Platform } from 'react-native';

async function open(url, fallback) {
    try {
        await Linking.openURL(url);
    } catch {
        try {
            await Linking.openURL(fallback);
        } catch {
            Alert.alert('Could not open maps', 'Please open your maps app and search for the station.');
        }
    }
}

/** Opens turn-by-turn directions to the station in the phone's maps app. */
export function openDirections(lat, lng, name) {
    const label = encodeURIComponent(name || 'Charging station');
    const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const apple = `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}&dirflg=d`;

    if (Platform.OS === 'ios') {
        Alert.alert('Directions', 'Open in', [
            { text: 'Apple Maps', onPress: () => open(apple, google) },
            { text: 'Google Maps', onPress: () => open(google, apple) },
            { text: 'Cancel', style: 'cancel' },
        ]);
        return;
    }

    // Android: Google Maps navigation, with the web link as a fallback
    open(`google.navigation:q=${lat},${lng}`, google);
}

/** Coordinates come from the API as strings. Returns null when they are missing or invalid. */
export function coords(station) {
    const lat = Number(station?.latitude);
    const lng = Number(station?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;

    return { lat, lng };
}

/** Straight-line distance in km between two { lat, lng } points (haversine). */
export function distanceKm(a, b) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
    if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}