import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import html from './htmlSource';

// The web page posts 'hap:<style>' when it wants haptic feedback; we map that to
// native expo-haptics (which works on iOS, unlike the web Vibration API).
function onHapticMessage(e) {
  const m = e && e.nativeEvent && e.nativeEvent.data;
  if (typeof m !== 'string' || m.indexOf('hap:') !== 0) return;
  const style = m.slice(4);
  try {
    if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (_) {}
}

// Shift Hub runs unchanged inside a full-screen WebView. The page (index.html)
// is the single source of truth; `npm start` regenerates htmlSource.js from it.
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          onMessage={onHapticMessage}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
});
