import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import html from './htmlSource';

// Shift Hub runs unchanged inside a full-screen WebView. The page (index.html)
// is the single source of truth; `npm start` regenerates htmlSource.js from it.
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
});
