import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import html from './htmlSource';

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
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
});
