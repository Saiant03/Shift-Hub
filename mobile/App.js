import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Share } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import html from './htmlSource';

// Messages from the web page:
//  - 'hap:<style>'            → native haptics (works on iOS, unlike web Vibration)
//  - 'backup:<name>\n<json>'  → native share sheet with the backup JSON (a plain
//    <a download> blob is unreliable in iOS WKWebView, so the page hands it here)
function onWebMessage(e) {
  const m = e && e.nativeEvent && e.nativeEvent.data;
  if (typeof m !== 'string') return;
  if (m.indexOf('hap:') === 0) {
    const style = m.slice(4);
    try {
      if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    return;
  }
  if (m.indexOf('backup:') === 0) {
    const nl = m.indexOf('\n');
    const body = nl >= 0 ? m.slice(nl + 1) : m.slice(7);
    try { Share.share({ message: body }); } catch (_) {}
    return;
  }
}

// Edge-to-edge full-screen WebView: the page (index.html) handles the safe areas
// itself via CSS env(safe-area-inset-*), exactly like the installed PWA — so the
// app background reaches every edge and the tab bar clears the home indicator,
// with no dark inset strip. Shift Hub runs unchanged inside; index.html is the
// single source of truth (npm start regenerates htmlSource.js from it).
export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WebView
        style={styles.web}
        originWhitelist={['*']}
        // A stable https origin keeps localStorage (your saved data) persistent.
        source={{ html, baseUrl: 'https://shifthub.local/' }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        onMessage={onWebMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
});
