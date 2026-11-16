import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, s } from '../../lib/ui';
import PayModal from '../../PayModal';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LABELS = { khalti: 'Khalti', esewa: 'eSewa', cash: 'Pay at station' };

function Chip({ label, active, disabled, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 20,
                backgroundColor: active ? C.green : '#fff',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.1)',
                opacity: disabled ? 0.35 : 1,
            }}
        >
            <Text style={{ color: active ? '#fff' : C.ink, fontWeight: '600' }}>{label}</Text>
        </TouchableOpacity>
    );
}

function Label({ children }) {
    return <Text style={{ fontWeight: '700', color: C.ink, marginTop: 18, marginBottom: 8 }}>{children}</Text>;
}

export default function StationDetail() {
    const { id } = useLocalSearchParams();
    const { token } = useAuth();
    const router = useRouter();

    const [st, setSt] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [date, setDate] = useState(ymd(new Date()));
    const [startHour, setStartHour] = useState(null);
    const [hours, setHours] = useState(1);
    const [method, setMethod] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [pay, setPay] = useState(null); // { url, reference }

    useEffect(() => {
        api(`/stations/${id}`, { token })
            .then((res) => {
                setSt(res.data);
                setMethod(res.data.payment_methods?.[0] ?? 'cash');
            })
            .catch((e) => setLoadError(e.message));
    }, [id]);

    const days = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                return { value: ymd(d), label: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) };
            }),
        []
    );

    const isPast = (h) => new Date(`${date}T${pad(h)}:00:00`) <= new Date();
    const startHours = Array.from({ length: 17 }, (_, i) => i + 6).filter((h) => h + hours <= 23);

    if (loadError) {
        return (
            <View style={[s.screen, s.pad]}>
                <Text style={s.error}>{loadError}</Text>
            </View>
        );
    }

    if (!st) {
        return (
            <View style={[s.screen, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={C.green} />
            </View>
        );
    }

    const options = [...(st.payment_methods ?? []), 'cash'];
    const total = Number(st.price_per_hour) * hours;

    const confirmPayment = async (reference) => {
        setPay(null);
        setBusy(true);
        let status = 'initiated';

        try {
            for (let i = 0; i < 8; i++) {
                const r = await api(`/payments/${reference}`, { token });
                status = r.data.status;
                if (status !== 'initiated') break;
                await sleep(1500);
            }
        } catch {}

        setBusy(false);

        if (status === 'paid') {
            Alert.alert('Payment received', 'Your charger is booked.');
        } else if (status === 'failed') {
            Alert.alert('Payment not completed', 'You can pay again from My bookings.');
        } else {
            Alert.alert('Still confirming', 'We are checking your payment. Look at My bookings in a minute.');
        }
        router.replace('/bookings');
    };

    const book = async () => {
        setError('');

        if (startHour === null) return setError('Pick a start time.');
        if (isPast(startHour)) return setError('That time has already passed.');

        setBusy(true);
        try {
            const res = await api('/bookings', {
                method: 'POST',
                token,
                body: {
                    station_id: st.id,
                    booking_date: date,
                    start_time: `${pad(startHour)}:00`,
                    end_time: `${pad(startHour + hours)}:00`,
                    payment_method: method === 'khalti' ? 'Khalti' : method === 'esewa' ? 'eSewa' : 'Cash',
                },
            });

            if (method === 'cash') {
                Alert.alert('Booked', 'Pay at the station when you arrive.');
                return router.replace('/bookings');
            }

            const p = await api(`/bookings/${res.data.id}/pay`, { method: 'POST', token, body: { gateway: method } });
            setPay({ url: p.payment_url, reference: p.reference });
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <ScrollView style={s.screen} contentContainerStyle={[s.pad, { paddingBottom: 60 }]}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: C.ink }}>{st.station_name}</Text>
                <Text style={{ color: 'rgba(11,26,22,0.55)', marginTop: 4 }}>
                    {st.address_line1}, {st.city}
                </Text>
                {!!st.location_notes && <Text style={{ color: 'rgba(11,26,22,0.55)', marginTop: 4 }}>{st.location_notes}</Text>}
                <Text style={{ color: C.dark, fontWeight: '700', marginTop: 10 }}>Rs {Number(st.price_per_hour).toLocaleString()} / hour</Text>
                <Text style={{ color: 'rgba(11,26,22,0.5)', marginTop: 6, fontSize: 12 }}>
                    {st.connectors.map((c) => `${c.label}: ${c.type}${Number(c.power_kw) ? ` ${Number(c.power_kw)}kW` : ''}`).join('  ·  ')}
                </Text>

                <Label>Date</Label>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {days.map((d) => (
                        <Chip key={d.value} label={d.label} active={date === d.value} onPress={() => { setDate(d.value); setStartHour(null); }} />
                    ))}
                </ScrollView>

                <Label>How long</Label>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[1, 2, 3].map((h) => (
                        <Chip key={h} label={`${h} hour${h > 1 ? 's' : ''}`} active={hours === h} onPress={() => { setHours(h); setStartHour(null); }} />
                    ))}
                </View>

                <Label>Start time</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {startHours.map((h) => (
                        <Chip key={h} label={`${pad(h)}:00`} active={startHour === h} disabled={isPast(h)} onPress={() => setStartHour(h)} />
                    ))}
                </View>

                <Label>Pay with</Label>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {options.map((m) => (
                        <Chip key={m} label={LABELS[m]} active={method === m} onPress={() => setMethod(m)} />
                    ))}
                </View>

                <View style={[s.card, { marginTop: 22 }]}>
                    <Text style={{ color: 'rgba(11,26,22,0.55)' }}>Total</Text>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: C.ink }}>Rs {total.toLocaleString()}</Text>
                    {startHour !== null && (
                        <Text style={{ color: 'rgba(11,26,22,0.55)', marginTop: 2 }}>
                            {date} · {pad(startHour)}:00 – {pad(startHour + hours)}:00
                        </Text>
                    )}
                </View>

                {!!error && <Text style={s.error}>{error}</Text>}

                <TouchableOpacity style={s.btn} onPress={book} disabled={busy}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{method === 'cash' ? 'Book' : 'Book and pay'}</Text>}
                </TouchableOpacity>

                <Text style={{ color: 'rgba(11,26,22,0.45)', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
                    Free cancellation up to 1 hour before. After that, a 20% fee applies to paid bookings.
                </Text>
            </ScrollView>

            {pay && <PayModal url={pay.url} onFinished={() => confirmPayment(pay.reference)} onClose={() => confirmPayment(pay.reference)} />}
        </>
    );
}