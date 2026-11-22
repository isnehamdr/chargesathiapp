import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { coords, distanceKm, formatDistance } from '../../lib/maps';
import { C, s } from '../../lib/ui';

function StationCard({ st, km, onPress }) {
    const free = st.connectors.filter((c) => c.status === 'available').length;

    return (
        <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink, flex: 1 }}>{st.station_name}</Text>
                {km !== null && (
                    <Text style={{ color: C.dark, fontWeight: '700', backgroundColor: C.soft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' }}>
                        {formatDistance(km)}
                    </Text>
                )}
            </View>

            <Text style={{ color: 'rgba(11,26,22,0.55)', marginTop: 2 }}>
                {st.address_line1}, {st.city}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Text style={{ color: C.dark, fontWeight: '700' }}>Rs {Number(st.price_per_hour).toLocaleString()} / hour</Text>
                <Text style={{ color: free > 0 ? C.dark : C.red, fontWeight: '600' }}>
                    {free}/{st.connectors.length} connectors free
                </Text>
            </View>

            <Text style={{ color: 'rgba(11,26,22,0.5)', marginTop: 6, fontSize: 12 }}>
                {[...new Set(st.connectors.map((c) => c.type))].join(' · ')}
            </Text>
        </TouchableOpacity>
    );
}

function SortChip({ label, active, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? C.green : '#fff',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.1)',
            }}
        >
            <Text style={{ color: active ? '#fff' : C.ink, fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function Stations() {
    const { token, user, logout } = useAuth();
    const router = useRouter();

    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const [me, setMe] = useState(null); // { lat, lng }
    const [locState, setLocState] = useState('loading'); // loading | granted | denied | unavailable
    const [sort, setSort] = useState('nearest'); // nearest | cheapest

    const load = useCallback(async () => {
        try {
            const res = await api('/stations', { token });
            setStations(res.data);
            setError('');
        } catch (e) {
            if (e.status === 401 || e.status === 403) return logout();
            setError(e.message);
        }
    }, [token]);

    const findMe = useCallback(async () => {
        try {
            const perm = await Location.requestForegroundPermissionsAsync();

            if (perm.status !== 'granted') {
                setLocState('denied');
                return;
            }

            // The last known position shows up instantly, then a fresh one replaces it
            const last = await Location.getLastKnownPositionAsync();
            if (last) {
                setMe({ lat: last.coords.latitude, lng: last.coords.longitude });
                setLocState('granted');
            }

            try {
                const now = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setMe({ lat: now.coords.latitude, lng: now.coords.longitude });
                setLocState('granted');
            } catch {
                if (!last) setLocState('unavailable');
            }
        } catch {
            setLocState('unavailable');
        }
    }, []);

    useEffect(() => {
        load().finally(() => setLoading(false));
        findMe();
    }, [load, findMe]);

    // Attach each station's distance, then sort
    const items = useMemo(() => {
        const list = stations.map((st) => {
            const p = coords(st);
            return { st, km: me && p ? distanceKm(me, p) : null };
        });

        if (sort === 'cheapest') {
            return list.sort((a, b) => Number(a.st.price_per_hour) - Number(b.st.price_per_hour));
        }

        // Nearest first. Stations without a known distance go to the end.
        return list.sort((a, b) => {
            if (a.km === null && b.km === null) return 0;
            if (a.km === null) return 1;
            if (b.km === null) return -1;
            return a.km - b.km;
        });
    }, [stations, me, sort]);

    if (loading) {
        return (
            <View style={[s.screen, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.green} />
            </View>
        );
    }

    return (
        <FlatList
            style={s.screen}
            contentContainerStyle={s.pad}
            data={items}
            keyExtractor={(it) => String(it.st.id)}
            renderItem={({ item }) => <StationCard st={item.st} km={item.km} onPress={() => router.push(`/station/${item.st.id}`)} />}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={async () => {
                        setRefreshing(true);
                        await Promise.all([load(), findMe()]);
                        setRefreshing(false);
                    }}
                />
            }
            ListHeaderComponent={
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>Hi, {user?.name?.split(' ')[0]}</Text>
                    {!!error && <Text style={s.error}>{error}</Text>}

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                        <SortChip label="Nearest" active={sort === 'nearest'} onPress={() => setSort('nearest')} />
                        <SortChip label="Cheapest" active={sort === 'cheapest'} onPress={() => setSort('cheapest')} />
                    </View>

                    {locState === 'denied' && (
                        <View style={[s.card, { marginTop: 12, marginBottom: 0 }]}>
                            <Text style={{ color: C.ink, fontWeight: '600' }}>Location is off</Text>
                            <Text style={{ color: 'rgba(11,26,22,0.6)', marginTop: 2 }}>Turn it on to see how far each station is and to sort the nearest first.</Text>
                            <TouchableOpacity onPress={() => Linking.openSettings()}>
                                <Text style={{ color: C.dark, fontWeight: '700', marginTop: 8 }}>Open settings</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {locState === 'unavailable' && (
                        <Text style={{ color: 'rgba(11,26,22,0.55)', marginTop: 10 }}>Could not get your location. Check that location services are on, then pull down to try again.</Text>
                    )}

                    {locState === 'granted' && sort === 'nearest' && (
                        <Text style={{ color: 'rgba(11,26,22,0.45)', fontSize: 12, marginTop: 10 }}>Distances are in a straight line, not by road.</Text>
                    )}
                </View>
            }
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: 'rgba(11,26,22,0.5)', marginTop: 40 }}>No stations available yet.</Text>}
            ListFooterComponent={
                <Text onPress={logout} style={[s.link, { marginTop: 24 }]}>
                    Log out
                </Text>
            }
        />
    );
}