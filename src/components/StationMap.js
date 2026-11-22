import { useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function StationMap({ lat, lng, name, height = 220 }) {
    const html = useMemo(() => {
        // "<" is escaped so a station name can never close the script tag
        const safeName = JSON.stringify(name || 'Station').replace(/</g, '\\u003c');

        return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#F4FAF7}</style>
</head>
<body>
<div id="map"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
<script>
  L.Icon.Default.imagePath = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/';
  var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${lat}, ${lng}], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.marker([${lat}, ${lng}]).addTo(map).bindPopup(${safeName});
</script>
</body>
</html>`;
    }, [lat, lng, name]);

    return (
        <View style={{ height, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#F4FAF7' }}>
            <WebView
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                startInLoadingState
            />
        </View>
    );
}