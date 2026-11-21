import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Share, AppState, Platform, Appearance, Animated, PanResponder, Pressable, Text, AccessibilityInfo, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getCalendars } from 'expo-localization';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import islandBridge from './islandBridge';
import html from './htmlSource';

// The page is loaded from source.html with baseUrl https://shifthub.local/; navigation to any other http(s) host is blocked and messages from a foreign page are ignored.
const ownUrl = (u) => !/^https?:/i.test(u || '') || /^https:\/\/shifthub\.local(\/|$)/i.test(u);

// Messages from the web page:
//  - 'hap:<style>'            → native haptics (works on iOS, unlike web Vibration)
//  - 'backup:<name>\n<json>'  → writes <name> (shifthub-backup-YYYY-MM-DD.json) and opens the share
//    sheet with that real file (a plain <a download> blob is unreliable in iOS WKWebView);
//    only if that fails, the JSON is shared as text
//  - 'notif:{"req":1}'        → ask for notification permission (only after the user turns reminders on)
//  - 'notif:{"items":[...]}'  → replace all scheduled shift reminders ([] cancels them)
//  Clock format: the page gets the phone's 12/24-hour setting (expo-localization uses24hourClock; on iOS it reads the
//  explicit "24-Hour Time" toggle) as SH_NATIVE.h24 before load, and window.shClock(h24) when the app returns to the foreground.
//  - 'bar:light' / 'bar:dark'  → the theme the page shows; the native status-bar icons take the contrasting color
//  - 'tab:<id>' 'vis:0|1' 'lbl:a|b|c' 'scr:<y>' (from islandBridge.js) → state for the native glass island that replaces the page's tab bar
// The page computes the schedule; status goes back through window.shNotif({granted, canAsk, req}).

Notifications.setNotificationHandler({ // show a reminder that fires while the app is open
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let web = null;
let setBarTheme = null; // set by App: the page's theme drives the native status bar
let islandMsg = null; // set by App: tab/vis/lbl/scr messages drive the native glass island
let queue = Promise.resolve(); // one notification job at a time, so two schedule replacements never interleave
let channel = null;
const run = (job) => { queue = queue.then(job).catch(() => {}); };
const S = Notifications.IosAuthorizationStatus;
const glassApi = Platform.OS === 'ios' && (() => { try { return isGlassEffectAPIAvailable(); } catch (_) { return false; } })(); // native Liquid Glass usable (iOS 26+)
const uses24h = () => { try { const v = getCalendars()[0].uses24hourClock; return typeof v === 'boolean' ? v : null; } catch (_) { return null; } }; // null = unknown → the page falls back to the browser's guess

async function notifStatus(req) {
  if (Platform.OS === 'android') channel = channel || Notifications.setNotificationChannelAsync('shifts', { name: 'Shift reminders', importance: Notifications.AndroidImportance.HIGH });
  await channel; // Android 13+ shows the permission prompt only once a channel exists
  let p;
  try { p = req ? await Notifications.requestPermissionsAsync() : await Notifications.getPermissionsAsync(); }
  catch (_) { return { granted: false, canAsk: false, req: !!req }; }
  // iOS: the root status is coarser than ios.status (expo-notifications docs), so read ios.status there
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
    if (!it || !Number.isFinite(it.at) || !(it.at > now && it.at < now + 40 * 864e5)) continue; // the page schedules at most 31 days ahead
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: String(it.title || '').slice(0, 100), body: String(it.body || '').slice(0, 200), sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: it.at, channelId: 'shifts' },
      });
    } catch (_) {} // one bad item must not abort the rest
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
  if (!ownUrl(e.nativeEvent.url)) return;
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
  const k = m.slice(0, 4), v = m.slice(4);
  if (k === 'tab:' || k === 'vis:' || k === 'lbl:' || k === 'scr:') {
    if (!islandMsg) return;
    if (k === 'tab:') { if (v === 'hub' || v === 'calendar' || v === 'shifts') islandMsg(k, v); }
    else if (k === 'scr:') { if (Number.isFinite(Number(v))) islandMsg(k, Number(v)); }
    else islandMsg(k, v);
    return;
  }
  if (m === 'bar:light' || m === 'bar:dark') { if (setBarTheme) setBarTheme(m.slice(4)); return; }
  if (m.indexOf('notif:') === 0) {
    let o; try { o = JSON.parse(m.slice(6)); } catch (_) { return; }
    if (o && o.req) sendStatus(true);
    else if (o && Array.isArray(o.items)) run(() => replaceSchedule(o.items));
    return;
  }
}

const IDS = ['hub', 'calendar', 'shifts'], SYM = { hub: 'chart.bar.fill', calendar: 'calendar', shifts: 'moon.fill' };
const AGlass = Animated.createAnimatedComponent(GlassView);
const IW = 320, SW = (IW - 12) / 3; // full island width; section width (6px padding each side)
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const tick = () => { try { Haptics.selectionAsync(); } catch (_) {} };

// Native Liquid Glass tab island drawn over the WebView; the page's own tab bar is hidden while it shows (islandBridge.js).
function Island({ theme, bind }) {
  const [tab, setTab] = useState('hub'), [seen, setSeen] = useState(false), [vis, setVis] = useState(false), [mini, setMini] = useState(false);
  const [labels, setLabels] = useState(['HUB', 'Calendar', 'Shifts']), [hover, setHover] = useState(-1);
  const p = useRef(new Animated.Value(0)).current, px = useRef(new Animated.Value(0)).current;
  const lastY = useRef(null), gl = useRef(-1);
  const spring = (v, to, c, native) => Animated.spring(v, { toValue: to, useNativeDriver: native, ...c }).start();
  bind.current = (k, v) => {
    if (k === 'tab:') { setTab(v); setSeen(true); lastY.current = null; setMini(false); spring(px, IDS.indexOf(v) * SW, { stiffness: 420, damping: 32 }, true); }
    else if (k === 'vis:') setVis(v === '1');
    else if (k === 'lbl:') { const a = v.split('|'); if (a.length === 3) setLabels(a); }
    else { const l = lastY.current; lastY.current = v;
      if (l === null) return;
      if (v > l + 4 && v > 24) setMini(true); else if (v < l - 4 || v <= 24) setMini(false); }
  };
  useEffect(() => { spring(p, mini ? 1 : 0, { stiffness: 380, damping: 34, mass: 1 }, false); }, [mini]);
  const select = (i) => {
    const id = IDS[i];
    if (id === tab) { spring(px, i * SW, { stiffness: 420, damping: 32 }, true); return; }
    setTab(id); spring(px, i * SW, { stiffness: 420, damping: 32 }, true); tick();
    if (web) web.injectJavaScript("window.switchTab&&switchTab('" + id + "');true;");
  };
  const at = (g) => { const x = g.moveX - (Dimensions.get('window').width - IW) / 2 - 6, // the full island is always centred: row left edge = (screen - IW)/2 + 6 padding
    i = clamp(Math.floor(x / SW), 0, 2);
    px.setValue(clamp(x - SW / 2, 0, 2 * SW)); if (i !== gl.current) { gl.current = i; setHover(i); tick(); } return i; };
  const cur = useRef({}); cur.current = { select, tab }; // the pan responder is created once; it must see the current tab
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6,
    onPanResponderGrant: (_, g) => { gl.current = -1; at(g); },
    onPanResponderMove: (_, g) => { at(g); },
    onPanResponderRelease: (_, g) => { const i = at(g); setHover(-1); cur.current.select(i); },
    onPanResponderTerminate: () => { setHover(-1); cur.current.select(IDS.indexOf(cur.current.tab)); },
  })).current;
  if (!(seen && vis)) return null;
  const fg = theme === 'light' ? '#0A0A0A' : '#FFFFFF', dim = theme === 'light' ? 'rgba(10,10,10,.62)' : 'rgba(255,255,255,.72)', pill = theme === 'light' ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.14)'; // active section: the icon takes the text colour over a faint pill
  const ti = IDS.indexOf(tab), lit = hover >= 0 ? hover : ti;
  const W = (a, b) => p.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  return (
    <View pointerEvents="box-none" style={styles.islandWrap}>
      <AGlass glassEffectStyle="clear" colorScheme={theme} isInteractive
        style={{ width: W(IW, 64), height: W(64, 52), borderRadius: W(32, 26), padding: W(6, 0), overflow: 'hidden' }}>
        {mini ? (
          <Pressable accessibilityRole="button" accessibilityLabel={labels[ti]} onPress={() => setMini(false)} style={styles.mini}>
            <SymbolView name={SYM[tab]} size={22} tintColor={fg} />
          </Pressable>
        ) : (
          <View accessibilityRole="tablist" style={styles.row} {...pan.panHandlers}>
            <Animated.View style={[styles.pill, { backgroundColor: pill, transform: [{ translateX: px }] }]} />
            {IDS.map((id, i) => (
              <Pressable key={id} accessibilityRole="tab" accessibilityLabel={labels[i]} accessibilityState={{ selected: i === ti }} onPress={() => select(i)} style={styles.sec}>
                <SymbolView name={SYM[id]} size={22} tintColor={i === lit ? fg : dim} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: i === lit ? fg : dim }}>{labels[i]}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </AGlass>
    </View>
  );
}

// Edge-to-edge full-screen WebView: the page (index.html) handles the safe areas
// itself via CSS env(safe-area-inset-*), exactly like the installed PWA — so the
// app background reaches every edge and the tab bar clears the home indicator,
// with no dark inset strip. Shift Hub runs unchanged inside; index.html is the
// single source of truth (npm start regenerates htmlSource.js from it).
export default function App() {
  const [barTheme, setTheme] = useState(Appearance.getColorScheme() === 'light' ? 'light' : 'dark'); // until the page reports: the system scheme, which the page's own 'system' appearance follows
  setBarTheme = setTheme;
  const [h24, setH24] = useState(uses24h); // read before the first page load, so the page never paints the wrong format
  useEffect(() => { // permission and the 12/24-hour setting may change in system Settings while the app is away
    const sub = AppState.addEventListener('change', (s) => { if (s !== 'active') return; sendStatus(false);
      const v = uses24h(); setH24(v); if (web) web.injectJavaScript('window.shClock&&window.shClock(' + v + ');true;'); });
    return () => sub.remove();
  }, []);
  const [rt, setRt] = useState(null); // Reduce Transparency: glass would not render, keep the page's own tab bar
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => setRt(!!v)).catch(() => setRt(false));
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', (v) => setRt(!!v));
    return () => sub.remove();
  }, []);
  const glass = glassApi && rt !== true;
  useEffect(() => { if (web) web.injectJavaScript('window.shIsl&&window.shIsl(' + (glass ? 1 : 0) + ');true;'); }, [glass]);
  const islandBind = useRef(null);
  islandMsg = (k, v) => { if (islandBind.current) islandBind.current(k, v); };
  const bg = barTheme === 'light' ? '#F5F4F1' : '#0F0F13'; // native background follows the page theme (no dark flash behind a light page)
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar style={barTheme === 'light' ? 'dark' : 'light'} />
      <WebView
        ref={(r) => { web = r; }}
        style={[styles.web, { backgroundColor: bg }]}
        originWhitelist={['*']}
        // A stable https origin keeps localStorage (your saved data) persistent.
        source={{ html, baseUrl: 'https://shifthub.local/' }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        onShouldStartLoadWithRequest={(r) => ownUrl(r.url)}
        onMessage={onWebMessage}
        // tells the page that native reminders exist (the setting stays hidden on web/PWA and older builds)
        injectedJavaScriptBeforeContentLoaded={'window.SH_NATIVE={notif:1,h24:' + h24 + '};true;'}
        injectedJavaScript={'window.__shIslOn=' + (glass ? 1 : 0) + ';' + islandBridge}
        onLoadEnd={() => sendStatus(false)}
      />
      {glass && <Island theme={barTheme} bind={islandBind} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F13' },
  web: { flex: 1, backgroundColor: '#0F0F13' },
  islandWrap: { position: 'absolute', left: 0, right: 0, bottom: 17, alignItems: 'center' },
  row: { width: IW - 12, height: 52, flexDirection: 'row' },
  pill: { position: 'absolute', width: SW, height: 52, borderRadius: 26 },
  sec: { width: SW, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 3 },
  mini: { width: 64, height: 52, alignItems: 'center', justifyContent: 'center' },
});
