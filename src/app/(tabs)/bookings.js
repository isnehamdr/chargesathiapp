import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import PayModal from '../../components/PayModal';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, s } from '../../lib/ui';

const STATUS_COLORS = { Upcoming: '#1D4ED8', Confirmed: '#7C3AED', Completed: C.dark, Cancelled: C.red };
const PAY_COLORS = { Paid: C.dark, Pending: '#B45309', Failed: C.red, Refunded: '#4B5563' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Pill({ text, color }) {
    return (
        <Text style={{ color, fontWeight: '700', fontSize: 12, borderWidth: 1, borderColor: color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' }}>
            {text}
        </Text>
    );
}

export default function Bookings() {
    const { token, logout } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [pay, setPay] = useState(null);

    const load = useCallback(async () => {
        try {
            const res = await api('/bookings', { token });
            setRows(res.data);
            setError('');
        } catch (e) {
            if (e.status === 401 || e.status === 403) return logout();
            setError(e.message);
        }
    }, [token]);

    // Reload every time this tab is opened
    useFocusEffect(
        useCallback(() => {
            load().finally(() => setLoading(false));
        }, [load])
    );

    const cancel = (b) => {
        const paid = b.payment_status === 'Paid';

        Alert.alert(
            'Cancel booking?',
            paid ? 'Free up to 1 hour before the start. After that a 20% fee applies.' : 'This booking has not been paid, so nothing is charged.',
            [
                { text: 'Keep it', style: 'cancel' },
                {
                    text: 'Cancel booking',
                    style: 'destructive',
                    onPress: async () => {
                        setBusyId(b.id);
                        try {
                            const r = await api(`/bookings/${b.id}/cancel`, { method: 'POST', token });
                            Alert.alert('Cancelled', r.message || 'Your booking was cancelled.');
                            await load();
                        } catch (e) {
                            Alert.alert('Could not cancel', e.message);
                        } finally {
                            setBusyId(null);
                        }
                    },
                },
            ]
        );
    };

    const payNow = async (b) => {
        const gateway = (b.payment_method || '').toLowerCase();
        if (gateway !== 'khalti' && gateway !== 'esewa') return;

        setBusyId(b.id);
        try {
            const p = await api(`/bookings/${b.id}/pay`, { method: 'POST', token, body: { gateway } });
            setPay({ url: p.payment_url, reference: p.reference });
        } catch (e) {
            Alert.alert('Could not start payment', e.message);
        } finally {
            setBusyId(null);
        }
    };

    const afterPayment = async (reference) => {
        setPay(null);
        let status = 'initiated';

        try {
            for (let i = 0; i < 8; i++) {
                const r = await api(`/payments/${reference}`, { token });
                status = r.data.status;
                if (status !== 'initiated') break;
                await sleep(1500);
            }
        } catch {}

        if (status === 'paid') Alert.alert('Payment received', 'Your booking is confirmed.');
        else if (status === 'failed') Alert.alert('Payment not completed', 'You can try again.');
        else Alert.alert('Still confirming', 'We are checking your payment. Pull down to refresh in a minute.');

        await load();
    };

    if (loading) {
        return (
            <View style={[s.screen, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.green} />
            </View>
        );
    }

    return (
        <>
            <FlatList
                style={s.screen}
                contentContainerStyle={s.pad}
                data={rows}
                keyExtractor={(b) => String(b.id)}
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
                ListHeaderComponent={!!error && <Text style={s.error}>{error}</Text>}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: 'rgba(11,26,22,0.5)', marginTop: 40 }}>No bookings yet. Pick a station to book a charger.</Text>}
                renderItem={({ item: b }) => {
                    const active = b.status === 'Upcoming' || b.status === 'Confirmed';
                    const online = ['khalti', 'esewa'].includes((b.payment_method || '').toLowerCase());
                    const canPay = active && b.payment_status === 'Pending' && online;

                    return (
                        <View style={s.card}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontWeight: '700', color: C.ink }}>{b.station?.station_name ?? 'Station'}</Text>
                                <Pill text={b.status} color={STATUS_COLORS[b.status] || C.ink} />
                            </View>

                            <Text style={{ color: 'rgba(11,26,22,0.6)', marginTop: 6 }}>
                                {String(b.booking_date).slice(0, 10)} · {String(b.start_time).slice(0, 5)} – {String(b.end_time).slice(0, 5)}
                            </Text>
                            <Text style={{ color: 'rgba(11,26,22,0.45)', fontSize: 12, marginTop: 2 }}>{b.booking_id}</Text>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                <Text style={{ fontWeight: '700', color: C.ink }}>
                                    Rs {Number(b.amount).toLocaleString()} <Text style={{ fontWeight: '400', color: 'rgba(11,26,22,0.5)' }}>· {b.payment_method}</Text>
                                </Text>
                                <Pill text={b.payment_status} color={PAY_COLORS[b.payment_status] || C.ink} />
                            </View>

                            {(canPay || active) && (
                                <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                                    {canPay && (
                                        <TouchableOpacity onPress={() => payNow(b)} disabled={busyId === b.id}>
                                            <Text style={{ color: C.dark, fontWeight: '700' }}>Pay now</Text>
                                        </TouchableOpacity>
                                    )}
                                    {active && (
                                        <TouchableOpacity onPress={() => cancel(b)} disabled={busyId === b.id}>
                                            <Text style={{ color: C.red, fontWeight: '700' }}>Cancel</Text>
                                        </TouchableOpacity>
                                    )}
                                    {busyId === b.id && <ActivityIndicator size="small" color={C.green} />}
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            {pay && <PayModal url={pay.url} onFinished={() => afterPayment(pay.reference)} onClose={() => afterPayment(pay.reference)} />}
        </>
    );
}