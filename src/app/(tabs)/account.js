import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { C, s } from '../../lib/ui';

const CONNECTORS = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];

function Section({ title, children }) {
    return (
        <View style={s.card}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink, marginBottom: 12 }}>{title}</Text>
            {children}
        </View>
    );
}

export default function Account() {
    const { token, user, setUser, logout } = useAuth();

    const [f, setF] = useState({
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        vehicle_model: user?.vehicle_model ?? '',
        vehicle_number: user?.vehicle_number ?? '',
        connector_type: user?.connector_type ?? 'CCS2',
    });
    const [profileError, setProfileError] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const [pw, setPw] = useState({ current: '', next: '', again: '' });
    const [pwError, setPwError] = useState('');
    const [savingPw, setSavingPw] = useState(false);

    const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

    const saveProfile = async () => {
        setProfileError('');
        setSavingProfile(true);
        try {
            const res = await api('/profile', { method: 'PUT', token, body: f });
            setUser(res.user);
            Alert.alert('Saved', 'Your details were updated.');
        } catch (e) {
            setProfileError(e.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const savePassword = async () => {
        setPwError('');

        if (pw.next !== pw.again) return setPwError('The new passwords do not match.');

        setSavingPw(true);
        try {
            await api('/password', { method: 'PUT', token, body: { current_password: pw.current, password: pw.next } });
            setPw({ current: '', next: '', again: '' });
            Alert.alert('Done', 'Your password was changed.');
        } catch (e) {
            setPwError(e.message);
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <ScrollView style={s.screen} contentContainerStyle={[s.pad, { paddingBottom: 50 }]} keyboardShouldPersistTaps="handled">
            <Text style={{ color: 'rgba(11,26,22,0.55)', marginBottom: 12 }}>{user?.email}</Text>

            <Section title="Your details">
                <TextInput style={s.input} placeholder="Full name" value={f.name} onChangeText={set('name')} />
                <TextInput style={s.input} placeholder="Phone" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
                <TextInput style={s.input} placeholder="Vehicle model" value={f.vehicle_model} onChangeText={set('vehicle_model')} />
                <TextInput style={s.input} placeholder="Vehicle number" autoCapitalize="characters" value={f.vehicle_number} onChangeText={set('vehicle_number')} />

                <Text style={{ marginBottom: 8, color: C.ink, fontWeight: '600' }}>Connector type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {CONNECTORS.map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => set('connector_type')(c)}
                            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: f.connector_type === c ? C.green : '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
                        >
                            <Text style={{ color: f.connector_type === c ? '#fff' : C.ink, fontWeight: '600' }}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {!!profileError && <Text style={s.error}>{profileError}</Text>}

                <TouchableOpacity style={s.btn} onPress={saveProfile} disabled={savingProfile}>
                    {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save details</Text>}
                </TouchableOpacity>
            </Section>

            <Section title="Change password">
                <TextInput style={s.input} placeholder="Current password" secureTextEntry value={pw.current} onChangeText={(v) => setPw((p) => ({ ...p, current: v }))} />
                <TextInput style={s.input} placeholder="New password (min 8 characters)" secureTextEntry value={pw.next} onChangeText={(v) => setPw((p) => ({ ...p, next: v }))} />
                <TextInput style={s.input} placeholder="Repeat new password" secureTextEntry value={pw.again} onChangeText={(v) => setPw((p) => ({ ...p, again: v }))} />

                {!!pwError && <Text style={s.error}>{pwError}</Text>}

                <TouchableOpacity style={s.btn} onPress={savePassword} disabled={savingPw}>
                    {savingPw ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Change password</Text>}
                </TouchableOpacity>
            </Section>

            <TouchableOpacity onPress={logout}>
                <Text style={[s.link, { color: C.red }]}>Log out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}