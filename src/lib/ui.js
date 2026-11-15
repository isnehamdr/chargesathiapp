import { StyleSheet } from 'react-native';

export const C = { green: '#02C468', dark: '#019654', ink: '#0B1A16', soft: '#F4FAF7', red: '#B91C1C' };

export const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: C.soft },
    pad: { padding: 20 },
    title: { fontSize: 26, fontWeight: '700', color: C.ink },
    sub: { color: 'rgba(11,26,22,0.6)', marginTop: 4, marginBottom: 20 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
    btn: { backgroundColor: C.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    error: { color: C.red, marginBottom: 10 },
    link: { color: C.dark, fontWeight: '600', textAlign: 'center', marginTop: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
});