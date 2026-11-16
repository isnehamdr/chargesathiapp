import { useRef } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { C } from '../lib/ui';

// Pages on our own server that the gateways send the driver back to
const DONE = /\/pay\/(khalti\/return|esewa\/(success|failure))/;

export default function PayModal({ url, onFinished, onClose }) {
    const fired = useRef(false);

    const check = (nav) => {
        if (!fired.current && !nav.loading && DONE.test(nav.url)) {
            fired.current = true;
            // Give our server a moment to finish confirming with the gateway
            setTimeout(onFinished, 800);
        }
    };

    return (
        <Modal animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: C.ink }}>Secure payment</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={{ color: C.red, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
                <WebView source={{ uri: url }} onNavigationStateChange={check} startInLoadingState />
            </View>
        </Modal>
    );
}