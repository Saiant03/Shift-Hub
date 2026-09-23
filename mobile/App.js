import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View, Share, AppState, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import html from './htmlSource';

// Messages from the web page:
//  - 'hap:<style>'            → native haptics (works on iOS, unlike web Vibration)
//  - 'backup:<name>\n<json>'  → writes <name> (shifthub-backup-YYYY-MM-DD.json) and opens the share
//    sheet with that real file (a plain <a download> blob is unreliable in iOS WKWebView);
//    only if that fails, the JSON is shared as text
//  - 'notif:{"req":1}'        → ask for notification permission (only after the user turns reminders on)
//  - 'notif:{"items":[...]}'  → replace all scheduled shift reminders ([] cancels them)
// The page computes the schedule; status goes back through window.shNotif({granted, canAsk, req}).

Notifications.setNotificationHandler({ // show a reminder that fires while the app is open
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let web = null;
let queue = Promise.resolve(); // one notification job at a time, so two schedule replacements never interleave
let channel = null;
const run = (job) => { queue = queue.then(job).catch(() => {}); };
const S = Notifications.IosAuthorizationStatus;

async function notifStatus(req) {
  if (Platform.OS === 'android') channel = channel || Notifications.setNotificationChannelAsync('shifts', { name: 'Shift reminders', importance: Notifications.AndroidImportance.HIGH });
  await channel; // Android 13+ shows the permission prompt only once a channel exists
  let p;
  try { p = req ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync(); }
  catch (_) { return { granted: false, canAsk: false, req: !!req }; }
  // iOS: the root status is coarser than ios.status (SDK 57 docs), so read ios.status there
  const ios = Platform.OS === 'ios' && p.ios ? p.ios.status : null;
  const granted = ios === null ? !!p.granted : ios === S.AUTHORIZED || ios === S.PROVISIONAL || ios === S.EPHEMERAL;
  const canAsk = ios === null ? p.canAskAgain !== false : ios === S.NOT_DETERMINED;
  return { granted, canAsk, req: !!req };
}
function sendStatus(req) {
  run(async () => { const st = await notifStatus(req);
    if (web) web.injectJavaScript('window.shNotif&&window.shNotif(' + JSON.stringify(st) + ');true;'); });
}
async function replaceSchedule(items) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  for (const it of items.slice(0, 30)) { // the page caps at 30; keep well below iOS's 64 pending
    if (!it || typeof it.at !== 'number' || !(it.at > now)) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: String(it.title || '').slice(0, 100), body: String(it.body || '').slice(0, 200), sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: it.at, channelId: 'shifts' },
    });
  }
}
async function shareBackup(name, json) {
  if (!/^shifthub-backup-\d{4}-\d{2}-\d{2}\.json$/.test(name)) { // the page always sends this form; never let it pick another path
    const t = new Date(); name = 'shifthub-backup-' + new Date(t - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) + '.json';
  }
  try {
    if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
    const file = new File(Paths.cache, name);
    file.create({ overwrite: true });
    file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: name });
  } catch (_) {
    try { Share.share({ message: json }); } catch (_) {}
  }
}
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
    shareBackup(nl >= 0 ? m.slice(7, nl) : '', nl >= 0 ? m.slice(nl + 1) : m.slice(7));
    return;
  }
  if (m.indexOf('notif:') === 0) {
    let o; try { o = JSON.parse(m.slice(6)); } catch (_) { return; }
    if (o && o.req) sendStatus(true);
    else if (o && Array.isArray(o.items)) run(() => replaceSchedule(o.items));
    return;
  }
}

// Edge-to-edge full-screen WebView: the page (index.html) handles the safe areas
// itself via CSS env(safe-area-inset-*), exactly like the installed PWA — so the
// app background reaches every edge and the tab bar clears the home indicator,
// with no dark inset strip. Shift Hub runs unchanged inside; index.html is the
// single source of truth (npm start regenerates htmlSource.js from it).
export default function App() {
  useEffect(() => { // permission may change in system Settings while the app is away
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') sendStatus(false); });
    return () => sub.remove();
  }, []);
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={(r) => { web = r; }}
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
        // tells the page that native reminders exist (the setting stays hidden on web/PWA and older builds)
        injectedJavaScriptBeforeContentLoaded="window.SH_NATIVE={notif:1};true;"
        onLoadEnd={() => sendStatus(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
});
