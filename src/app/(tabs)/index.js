import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, s } from '../../lib/ui';

function StationCard({ st, onPress }) {
    const free = st.connectors.filter((c) => c.status === 'available').length;

    return (
        <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{st.station_name}</Text>
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

export default function Stations() {
    const { token, user, logout } = useAuth();
    const router = useRouter();
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

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

    useEffect(() => {
        load().finally(() => setLoading(false));
    }, [load]);

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
            data={stations}
            keyExtractor={(st) => String(st.id)}
            renderItem={({ item }) => <StationCard st={item} onPress={() => router.push(`/station/${item.id}`)} />}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={async () => {
                        setRefreshing(true);
                        await load();
                        setRefreshing(false);
                    }}
                />
            }
            ListHeaderComponent={
                <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: C.ink }}>Hi, {user?.name?.split(' ')[0]}</Text>
                    {!!error && <Text style={s.error}>{error}</Text>}
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