// Injected into the page after load (WebView injectedJavaScript). Reports tab / sheet visibility / labels / scroll to
// native (messages 'tab:' 'vis:' 'lbl:' 'ico:' 'thm:' 'scr:') and hides the page's own tab bar while the native island is shown.
// It wraps and modifies no page function. window.shIsl(0|1) switches the hiding.
export default String.raw`(function(){
  if (window.__shIsl) return; window.__shIsl = 1;
  try {
    var st = document.createElement('style'); document.head.appendChild(st);
    var lt = '', lv = '', ll = '', li = '', lh = '';
    var post = function(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(m); };
    var bar = document.getElementById('tabbar'), dlg = document.getElementById('dlgback'), scr = document.getElementById('screen');
    var sync = function(){
      try {
        var t = 'tab:' + state.tab; if (t !== lt) { lt = t; post(t); }
        var v = 'vis:' + (bar.inert || dlg.classList.contains('show') ? 0 : 1); if (v !== lv) { lv = v; post(v); }
        var b = bar.querySelectorAll('.tabbtn'), a = [];
        for (var i = 0; i < b.length && i < 3; i++) a.push(b[i].getAttribute('aria-label') || '');
        var l = a.length === 3 ? 'lbl:' + a.join('|') + '|' + (bar.dataset.hint || '') : ''; if (l && l !== ll) { ll = l; post(l); }
        var h = 'thm:' + (document.documentElement.style.colorScheme === 'dark' ? 'dark' : 'light'); if (h !== lh) { lh = h; post(h); } // the theme on screen (set by applyAppearance)
        var p = bar.querySelectorAll('path[data-ic]'), d = [];
        for (var j = 0; j < p.length; j++) d.push(p[j].getAttribute('d') || '');
        var ic = d.length === 4 ? 'ico:' + JSON.stringify(d) : ''; if (ic && ic !== li) { li = ic; post(ic); }
      } catch (_) {}
    };
    new MutationObserver(sync).observe(bar, { attributes: true, subtree: true, childList: true, attributeFilter: ['inert', 'class', 'd'] });
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    new MutationObserver(sync).observe(dlg, { attributes: true, attributeFilter: ['class'] });
    window.shIsl = function(on){ st.textContent = on ? '#tabbar{display:none!important}' : ''; if (on) { lt = lv = ll = li = lh = ''; sync(); } }; // re-enabling re-sends the state to a freshly mounted island
    window.shIsl(window.__shIslOn ? 1 : 0); sync();
    var raf = 0;
    scr.addEventListener('scroll', function(){
      if (raf) return;
      raf = requestAnimationFrame(function(){ raf = 0; post('scr:' + Math.round(scr.scrollTop)); });
    }, { passive: true });
  } catch (_) {}
})();
true;`;
