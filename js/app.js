(() => {
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  const rnd = n => {
    if (n <= 1) return 0;
    const lim = 0x100000000 - (0x100000000 % n), b = new Uint32Array(1);
    do crypto.getRandomValues(b); while (b[0] >= lim);
    return b[0] % n;
  };
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const int = (id, lo, hi, d) => {
    const el = $(id);
    let v = Math.round(Number(el.value));
    if (el.value.trim() === '' || !Number.isFinite(v)) v = d;
    v = Math.min(hi, Math.max(lo, v)) || 0;
    el.value = v;
    return v;
  };
  const pick = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const hex2 = n => n.toString(16).padStart(2, '0');
  const hsl = (h, s, l) => {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => { const k = (n + h / 30) % 12; return hex2(Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))); };
    return '#' + f(0) + f(8) + f(4);
  };

  const tools = {
    number: {
      label: 'Number',
      run() {
        let lo = int('nMin', -1e9, 1e9, 1), hi = int('nMax', -1e9, 1e9, 100);
        if (lo > hi) { [lo, hi] = [hi, lo]; $('nMin').value = lo; $('nMax').value = hi; }
        const span = hi - lo + 1, uniq = $('nUniq').checked;
        let n = int('nCount', 1, 1000, 1), r;
        if (uniq && n > span) { n = span; $('nCount').value = n; }
        if (!uniq) r = Array.from({ length: n }, () => lo + rnd(span));
        else if (span <= 5000) r = shuffle(Array.from({ length: span }, (_, i) => lo + i)).slice(0, n);
        else { const s = new Set(); while (s.size < n) s.add(lo + rnd(span)); r = [...s]; }
        if ($('nSort').checked) r.sort((a, b) => a - b);
        return { items: r.map(String), note: `${lo} to ${hi}` + (n > 1 ? ` · sum ${r.reduce((a, b) => a + b, 0)}` : '') };
      }
    },
    list: {
      label: 'List',
      run() {
        const el = $('lItems');
        let a = el.value.split('\n').map(s => s.trim()).filter(Boolean);
        if (a.length === 1 && a[0].includes(',')) a = a[0].split(',').map(s => s.trim()).filter(Boolean);
        if (!a.length) return { empty: 'Add items, one per line' };
        const mode = pick('lMode');
        if (mode === 'shuffle') return { items: shuffle(a), rows: true, sep: '\n', note: `${a.length} items` };
        if (mode === 'groups') {
          const g = Math.min(int('lGroups', 1, 100, 2), a.length), groups = Array.from({ length: g }, () => []);
          shuffle(a).forEach((x, i) => groups[i % g].push(x));
          return {
            items: groups.map(x => x.join(', ')), rows: true,
            copy: groups.map((x, i) => `Group ${i + 1}: ${x.join(', ')}`).join('\n'),
            note: `${a.length} items · ${g} groups`
          };
        }
        const n = Math.min(int('lCount', 1, 1000, 1), a.length);
        const idx = shuffle(a.map((_, i) => i)).slice(0, n);
        let note = `${n} of ${a.length}`;
        if ($('lRemove').checked) {
          const gone = new Set(idx), rest = a.filter((_, i) => !gone.has(i));
          el.value = rest.join('\n');
          note += ` · ${rest.length} left`;
        }
        return { items: idx.map(i => a[i]), rows: n > 1, sep: '\n', note };
      }
    },
    dice: {
      label: 'Dice',
      run() {
        const s = +pick('dSides'), n = int('dCount', 1, 100, 1);
        const r = Array.from({ length: n }, () => 1 + rnd(s));
        return { items: r.map(String), note: `${n}d${s}` + (n > 1 ? ` · total ${r.reduce((a, b) => a + b, 0)}` : '') };
      }
    },
    coin: {
      label: 'Coin',
      run() {
        const n = int('cCount', 1, 500, 1);
        const r = Array.from({ length: n }, () => rnd(2) ? 'H' : 'T');
        if (n === 1) return { items: [r[0] === 'H' ? 'Heads' : 'Tails'] };
        const h = r.filter(x => x === 'H').length;
        return { items: r, copy: r.join(''), note: `${h} heads · ${n - h} tails` };
      }
    },
    password: {
      label: 'Password',
      live: true,
      run() {
        const clear = $('pClear').checked;
        const sets = [
          ['pLower', 'abcdefghijklmnopqrstuvwxyz'], ['pUpper', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
          ['pDigits', '0123456789'], ['pSymbols', '!@#$%^&*()-_=+[]{};:,.?']
        ].filter(([id]) => $(id).checked).map(([, s]) => clear ? s.replace(/[Il1O0o]/g, '') : s);
        if (!sets.length) return { empty: 'Select at least one character set' };
        const len = int('pLen', 4, 64, 20), all = sets.join('');
        const c = sets.map(s => s[rnd(s.length)]);
        while (c.length < len) c.push(all[rnd(all.length)]);
        return { items: [shuffle(c).join('')], mono: true, secret: true, note: `${len} characters · ${Math.round(len * Math.log2(all.length))} bits` };
      }
    },
    passphrase: {
      label: 'Passphrase',
      live: true,
      run() {
        if (!words) { loadWords(); return { empty: 'Loading words', wait: true }; }
        const pool = pick('wPool') === 'common' ? Math.min(8192, words.length) : words.length;
        const n = int('wLen', 3, 12, 5), cap = $('wCap').checked;
        const a = Array.from({ length: n }, () => { const s = words[rnd(pool)]; return cap ? s[0].toUpperCase() + s.slice(1) : s; });
        let bits = n * Math.log2(pool);
        if ($('wNum').checked) { a[rnd(n)] += rnd(10); bits += Math.log2(10 * n); }
        return { items: [a.join(pick('wSep'))], mono: true, secret: true, note: `${n} words · ${Math.floor(bits)} bits · pool ${pool.toLocaleString('en')}` };
      }
    },
    color: {
      label: 'Color',
      run() {
        const n = int('kCount', 1, 8, 1), m = pick('kMood'), R = (a, b) => a + rnd(b - a + 1);
        const items = Array.from({ length: n }, () => {
          if (m === 'any') return '#' + hex2(rnd(256)) + hex2(rnd(256)) + hex2(rnd(256));
          const [s, l] = m === 'vivid' ? [R(80, 100), R(45, 60)] : m === 'pastel' ? [R(55, 85), R(78, 88)] : [R(40, 80), R(14, 28)];
          return hsl(rnd(360), s, l);
        }).map(x => x.toUpperCase());
        const v = parseInt(items[0].slice(1), 16);
        return { items, swatch: true, note: n === 1 ? `rgb(${v >> 16}, ${v >> 8 & 255}, ${v & 255})` : `${n} colors` };
      }
    },
    qr: {
      label: 'QR',
      quiet: true,
      live: true,
      run() {
        const t = $('qText').value;
        if (!t) return { empty: 'Enter text to encode' };
        if (typeof qrcode !== 'function') return { empty: 'QR library did not load' };
        const bytes = new TextEncoder().encode(t);
        if (bytes.length > 2953) return { empty: 'Too long for a QR code' };
        try {
          const q = qrcode(0, pick('qLevel'));
          q.addData(String.fromCharCode(...bytes));
          q.make();
          const n = q.getModuleCount(), cell = Math.max(4, Math.floor(1024 / (n + 8))), size = (n + 8) * cell;
          const c = document.createElement('canvas'), x = c.getContext('2d');
          c.width = c.height = size;
          x.fillStyle = '#fff'; x.fillRect(0, 0, size, size);
          x.fillStyle = '#000';
          for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + 4) * cell, (r + 4) * cell, cell, cell);
          return { node: c, copy: t, note: `${bytes.length} bytes · ${n}×${n}` };
        } catch {
          return { empty: 'Too long for this error correction level' };
        }
      }
    }
  };

  const out = $('out'), nav = $('nav'), results = {};
  const fields = [...document.querySelectorAll('#controls input, #controls textarea')];
  const order = [...nav.querySelectorAll('button')].map(b => b.dataset.tool);
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const toggled = e => e.type === 'checkbox' || e.type === 'radio';
  let cur = 'number', timer, saving = 0, frame = 0, ptr = false;
  let words, loading = false;
  let hist = store.get('rz:history', []);
  if (!Array.isArray(hist)) hist = [];

  const text = r => r.copy ?? r.items.join(r.sep || ', ');
  const pulse = (el, frames, ms) => { if (el && el.animate && !calm.matches) el.animate(frames, { duration: ms, easing: 'ease-out' }); };

  function flush() {
    clearTimeout(saving);
    saving = 0;
    const o = {};
    fields.forEach(e => { o[e.id] = toggled(e) ? e.checked : e.value; });
    store.set('rz:settings', o);
  }

  function persist() {
    if (!saving) saving = setTimeout(flush, 200);
  }

  function restore() {
    const o = store.get('rz:settings', {});
    if (typeof o !== 'object') return;
    fields.forEach(e => {
      if (!(e.id in o)) return;
      if (toggled(e)) e.checked = !!o[e.id]; else e.value = o[e.id];
    });
  }

  function sync() {
    const m = pick('lMode');
    $('lCountF').hidden = $('lRemoveF').hidden = m !== 'pick';
    $('lGroupsF').hidden = m !== 'groups';
    $('pLenOut').textContent = $('pLen').value;
    $('wLenOut').textContent = $('wLen').value;
  }

  function loadWords() {
    if (loading || words) return;
    loading = true;
    let w;
    const done = a => {
      loading = false;
      if (w) w.terminate();
      if (a && a.length > 1) words = a;
      const r = results.passphrase;
      if (cur !== 'passphrase' || !r || !r.wait) return;
      if (words) run(); else show({ empty: 'Word list did not load' });
    };
    try {
      w = new Worker('js/words.js');
      w.onmessage = e => done(e.data);
      w.onerror = () => done();
      w.postMessage(0);
    } catch { setTimeout(done); }
  }

  function show(r, still) {
    results[cur] = r;
    $('note').textContent = r.note || '';
    const box = document.createElement('div');
    box.className = 'items';
    if (still) box.classList.add('still');
    if (r.empty) { box.classList.add('empty'); box.textContent = r.empty; }
    else if (r.node) box.append(r.node);
    else {
      const total = r.items.join(' ').length, long = Math.max(...r.items.map(t => t.length)), count = r.items.length;
      let s = total <= 3 ? 1 : total <= 8 ? 2 : total <= 28 ? 3 : total <= 120 ? 4 : 5;
      if (r.rows) s = Math.max(s, count <= 4 && long <= 18 ? 3 : count <= 10 && long <= 40 ? 4 : 5);
      box.classList.add('s' + s);
      for (const k of ['rows', 'mono', 'swatch']) if (r[k]) box.classList.add(k);
      const bulk = count > 40;
      if (bulk) box.classList.add('bulk');
      r.items.forEach((t, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t;
        b.title = 'Copy';
        if (!bulk) b.style.setProperty('--i', Math.min(i, 24));
        if (r.swatch) {
          const v = parseInt(t.slice(1), 16);
          b.style.background = t;
          b.style.color = .299 * (v >> 16) + .587 * (v >> 8 & 255) + .114 * (v & 255) > 150 ? '#0c0b0a' : '#fff';
        }
        box.append(b);
      });
    }
    out.replaceChildren(box);
    out.scrollTop = 0;
  }

  function run(log = true, still = false) {
    const t = tools[cur], r = t.run();
    show(r, still);
    persist();
    if (log && !r.empty && !r.secret && !t.quiet) {
      hist.unshift({ t: t.label, v: text(r).slice(0, 600) });
      hist = hist.slice(0, 30);
      store.set('rz:history', hist);
      drawHist(true);
    }
  }

  function live() {
    if (frame) return;
    const id = cur;
    frame = requestAnimationFrame(() => { frame = 0; if (cur === id) run(false, true); });
  }

  function fire() {
    pulse($('go'), [{ scale: 1 }, { scale: .95 }, { scale: 1 }], 240);
    run();
  }

  function drawHist(fresh) {
    $('hist').replaceChildren(...hist.map((h, i) => {
      const li = document.createElement('li'), b = document.createElement('button'), a = document.createElement('span'), v = document.createElement('span');
      if (fresh && !i) li.className = 'new';
      b.type = 'button';
      a.textContent = h.t;
      v.textContent = String(h.v).replace(/\n/g, ' · ');
      b.append(a, v);
      li.append(b);
      return li;
    }));
    $('histWrap').hidden = !hist.length;
  }

  function toast(m) {
    const el = $('toast');
    el.textContent = m;
    el.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('on'), 1100);
  }

  async function copy(t, el) {
    pulse(el, [{ opacity: 1 }, { opacity: .4 }, { opacity: 1 }], 320);
    try { await navigator.clipboard.writeText(t); }
    catch {
      const a = document.createElement('textarea');
      a.value = t;
      a.style.cssText = 'position:fixed;opacity:0';
      document.body.append(a);
      a.select();
      try { document.execCommand('copy'); } catch {}
      a.remove();
    }
    toast('Copied');
  }

  function openTool(id) {
    if (!tools[id]) id = 'number';
    cur = id;
    nav.querySelectorAll('button').forEach(b => {
      const on = b.dataset.tool === id;
      b.setAttribute('aria-current', on);
      if (on) nav.scrollTo({ left: b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2 });
    });
    document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
    $('label').textContent = tools[id].label;
    $('copy').hidden = $('toqr').hidden = id === 'qr';
    $('png').hidden = id !== 'qr';
    store.set('rz:tool', id);
    try { history.replaceState(null, '', '#' + id); } catch {}
    sync();
    if (id === 'passphrase') loadWords();
    if (id === 'qr') run(false);
    else show(results[id] || { empty: 'Press Generate', idle: true });
  }

  nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openTool(b.dataset.tool); });
  $('go').addEventListener('click', () => run());
  $('copy').addEventListener('click', () => { const r = results[cur]; if (r && !r.empty) copy(text(r), out.firstChild); });
  $('toqr').addEventListener('click', () => {
    const r = results[cur];
    if (!r || r.empty) return;
    $('qText').value = text(r);
    openTool('qr');
  });
  $('png').addEventListener('click', () => {
    const c = out.querySelector('canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.download = 'qr.png';
    a.href = c.toDataURL('image/png');
    a.click();
  });
  $('clear').addEventListener('click', () => { hist = []; store.set('rz:history', hist); drawHist(); });
  $('hist').addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) copy(String(hist[[...li.parentNode.children].indexOf(li)].v), li);
  });
  out.addEventListener('click', e => { const b = e.target.closest('button'); if (b) copy(b.textContent, b); });

  $('controls').addEventListener('submit', e => e.preventDefault());
  $('controls').addEventListener('input', () => {
    sync();
    persist();
    const r = results[cur];
    if (tools[cur].live && r && !r.idle) live();
  });

  document.addEventListener('pointerdown', () => { ptr = true; }, true);
  document.addEventListener('click', () => {
    const a = document.activeElement;
    if (ptr && a && (a.tagName === 'BUTTON' || (a.tagName === 'INPUT' && toggled(a)))) a.blur();
  });
  document.addEventListener('keydown', e => {
    ptr = false;
    const el = e.target, tag = el.tagName, mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Enter' && mod && tag === 'TEXTAREA') { e.preventDefault(); fire(); return; }
    if (mod || e.altKey) return;
    if (e.key === 'Enter' && tag === 'INPUT' && /number|range/.test(el.type)) { e.preventDefault(); fire(); }
    else if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    else if (e.code === 'Space' && tag !== 'BUTTON') { e.preventDefault(); fire(); }
    else if (order[e.key - 1]) openTool(order[e.key - 1]);
  });
  window.addEventListener('hashchange', () => openTool(location.hash.slice(1)));
  window.addEventListener('pagehide', () => { if (saving) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && saving) flush(); });

  restore();
  drawHist();
  openTool(location.hash.slice(1) || store.get('rz:tool', 'number'));
})();
