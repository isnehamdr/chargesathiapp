import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { api } from '../lib/api';
import { s } from '../lib/ui';

export default function Forgot() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [info, setInfo] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const sendCode = async () => {
        setError('');
        setBusy(true);
        try {
            const res = await api('/forgot-password', { method: 'POST', body: { email: email.trim() } });
            setInfo(res.message);
            setStep(2);
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    const reset = async () => {
        setError('');
        setBusy(true);
        try {
            const res = await api('/reset-password', { method: 'POST', body: { email: email.trim(), code: code.trim(), password } });
            Alert.alert('Done', res.message);
            router.replace('/login');
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[s.pad, { paddingTop: 90 }]} keyboardShouldPersistTaps="handled">
                <Text style={s.title}>Reset password</Text>
                <Text style={s.sub}>{step === 1 ? 'Enter your email and we will send you a 6 digit code.' : info}</Text>

                <TextInput
                    style={[s.input, step === 2 && { opacity: 0.6 }]}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={step === 1}
                />

                {step === 2 && (
                    <>
                        <TextInput style={s.input} placeholder="6 digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
                        <TextInput style={s.input} placeholder="New password (min 8 characters)" secureTextEntry value={password} onChangeText={setPassword} />
                    </>
                )}

                {!!error && <Text style={s.error}>{error}</Text>}

                <TouchableOpacity style={s.btn} onPress={step === 1 ? sendCode : reset} disabled={busy}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{step === 1 ? 'Send code' : 'Change password'}</Text>}
                </TouchableOpacity>

                {step === 2 && (
                    <TouchableOpacity onPress={() => { setStep(1); setCode(''); setPassword(''); setError(''); }}>
                        <Text style={s.link}>Use a different email, or send a new code</Text>
                    </TouchableOpacity>
                )}

                <Link href="/login" style={s.link}>Back to log in</Link>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}