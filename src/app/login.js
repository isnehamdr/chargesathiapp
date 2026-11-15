import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../lib/auth';
import { s } from '../lib/ui';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async () => {
        setError('');
        setBusy(true);
        try {
            await login(email.trim(), password);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[s.pad, { paddingTop: 90 }]} keyboardShouldPersistTaps="handled">
                <Text style={s.title}>Welcome back</Text>
                <Text style={s.sub}>Log in to find and book a charger.</Text>

                <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

                {!!error && <Text style={s.error}>{error}</Text>}

                <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Log in</Text>}
                </TouchableOpacity>

                <Link href="/register" style={s.link}>New here? Create an account</Link>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}