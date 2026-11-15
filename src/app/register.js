import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { C, s } from '../lib/ui';

const CONNECTORS = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T'];

export default function Register() {
    const { register } = useAuth();
    const [f, setF] = useState({ name: '', email: '', phone: '', vehicle_model: '', vehicle_number: '', connector_type: 'CCS2', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

    const submit = async () => {
        setError('');
        setBusy(true);
        try {
            await register({ ...f, email: f.email.trim() });
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <ScrollView style={s.screen} contentContainerStyle={[s.pad, { paddingTop: 70 }]} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Create account</Text>
            <Text style={s.sub}>Tell us about you and your vehicle.</Text>

            <TextInput style={s.input} placeholder="Full name" value={f.name} onChangeText={set('name')} />
            <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={set('email')} />
            <TextInput style={s.input} placeholder="Phone" keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
            <TextInput style={s.input} placeholder="Vehicle model (e.g. Nissan Leaf)" value={f.vehicle_model} onChangeText={set('vehicle_model')} />
            <TextInput style={s.input} placeholder="Vehicle number" autoCapitalize="characters" value={f.vehicle_number} onChangeText={set('vehicle_number')} />

            <Text style={{ marginBottom: 8, color: C.ink, fontWeight: '600' }}>Connector type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
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

            <TextInput style={s.input} placeholder="Password (min 8 characters)" secureTextEntry value={f.password} onChangeText={set('password')} />

            {!!error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign up</Text>}
            </TouchableOpacity>

            <Link href="/login" style={s.link}>Already have an account? Log in</Link>
        </ScrollView>
    );
}