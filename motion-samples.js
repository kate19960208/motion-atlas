/* Motion Prompt · pack "motion" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('motion', function () {
  // @kit
  // モーショングラフィックスの演出の名前 24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // カードの中だけ共通パレット（濃紺の地＋青・コーラル・黄・ミント）。
  const CW = 539, CH = 208;
  const CYC = 4.7;                          // 各カードは4.7秒周期（ループの継ぎ目なし）
  const C = {
    navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
    blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6'
  };
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);   // 0→行き過ぎ→1
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function bez(x1, y1, x2, y2) {
    const cx_ = 3 * x1, bx = 3 * (x2 - x1) - cx_, ax = 1 - cx_ - bx;
    const cy_ = 3 * y1, by = 3 * (y2 - y1) - cy_, ay = 1 - cy_ - by;
    const sx = t => ((ax * t + bx) * t + cx_) * t, sy = t => ((ay * t + by) * t + cy_) * t;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, t = x; for (let i = 0; i < 40; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } return sy(t); };
  }
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  const G0 = mkCanvas(CW, CH), GK0 = G0.getContext('2d', { willReadFrequently: true });
  const G1 = mkCanvas(CW, CH), GK1 = G1.getContext('2d', { willReadFrequently: true });
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  // ぬるっとつながる形（描く→ぼかす→しきい値）。paint(ctx) で色を塗った結果のキャンバスを返す
  function goo(draw, blur, paint) {
    GK0.setTransform(1, 0, 0, 1, 0, 0); GK0.clearRect(0, 0, CW, CH); GK0.fillStyle = '#fff'; draw(GK0);
    GK1.setTransform(1, 0, 0, 1, 0, 0); GK1.globalCompositeOperation = 'source-over'; GK1.clearRect(0, 0, CW, CH);
    GK1.filter = `blur(${blur}px)`; GK1.drawImage(G0, 0, 0); GK1.filter = 'none';
    const im = GK1.getImageData(0, 0, CW, CH), d = im.data;
    for (let i = 3; i < d.length; i += 4) { const a = d[i]; d[i] = a < 112 ? 0 : a > 144 ? 255 : (a - 112) * 8; }
    GK1.putImageData(im, 0, 0);
    GK1.globalCompositeOperation = 'source-atop'; paint(GK1); GK1.globalCompositeOperation = 'source-over';
    return G1;
  }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; let x = -tot / 2; return [...s].map((ch, i) => { const o = { ch, x: x + (ws[i] - ls) / 2, w: ws[i] - ls }; x += ws[i]; return o; }); }
  const CELLS = [];

  // @element 01
  // 01 ポップイン（アプリのアイコンがポンと弾んで現れ、通知バッジが遅れてポン）
  CELLS[0] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, X = w / 2, Y = h / 2 + 4, S = 116;
    const col = n % 2 ? C.blue : C.coral;
    const out = backIn(P(lu, 1.86, 2.12), 2.2);
    const sc = spring(lu - 0.28, 15, 6.5) * (1 - out);
    const rot = (1 - spring(lu - 0.28, 11, 6)) * -0.35;
    // 床の影
    k.fillStyle = 'rgba(0,0,0,.28)'; k.beginPath(); k.ellipse(X, Y + 78, 62 * clamp(sc), 8 * clamp(sc), 0, 0, 7); k.fill();
    if (sc > 0.002) {
      k.save(); k.translate(X, Y); k.rotate(rot); k.scale(sc, sc);
      k.fillStyle = col; rr(k, -S / 2, -S / 2, S, S, 30); k.fill();
      k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, -S / 2, -S / 2, S, S / 2, [30, 30, 0, 0]); k.fill();
      k.fillStyle = '#fff';
      if (n % 2) { k.save(); k.translate(0, 2); heartPath(k, 30); k.fill(); k.restore(); }
      else { star(k, 0, 2, 36, 0, 0.48); k.lineJoin = 'round'; k.strokeStyle = '#fff'; k.lineWidth = 6; k.stroke(); k.fill(); }
      k.restore();
      // 通知バッジ
      const bs = spring(lu - 0.62, 17, 7) * (1 - out);
      if (bs > 0.002) { k.save(); k.translate(X + 52 * sc, Y - 52 * sc); k.scale(bs, bs); k.fillStyle = C.yel; k.beginPath(); k.arc(0, 0, 25, 0, 7); k.fill(); k.strokeStyle = C.navy; k.lineWidth = 5; k.stroke(); txt(k, '1', 0, 2, `800 30px ${DISP}`, C.navy, 'center', 'middle'); k.restore(); }
    }
  };

  // @element 02
  // 02 スタガー（グラフの棒が、少しずつ時間をずらして順に立ち上がる）
  CELLS[1] = (k, w, h, u) => {
    stage(k);
    const N = 7, BW = 44, G = 20, x0 = (w - (N * BW + (N - 1) * G)) / 2, base = h - 30;
    const HS = [52, 84, 68, 112, 92, 136, 158];
    k.fillStyle = C.navy3; rr(k, x0 - 18, base, N * BW + (N - 1) * G + 36, 5, 2.5); k.fill();
    const lu = mod(u, CYC / 2);
    for (let i = 0; i < N; i++) {
      const t0 = 0.15 + i * 0.12, g = backOut(P(lu, t0, t0 + 0.5), 2.6) * (1 - eIn(P(lu, 1.78 + i * 0.045, 2.04 + i * 0.045)));
      if (g <= 0.001) continue;
      const hh = HS[i] * g, x = x0 + i * (BW + G);
      k.fillStyle = PAL[i % 4]; rr(k, x, base - hh, BW, hh, [12, 12, 3, 3]); k.fill();
      // 棒の上の点（さらに遅れて出る）
      const d = spring(lu - t0 - 0.34, 16, 7) * (1 - eIn(P(lu, 1.7 + i * 0.045, 1.9 + i * 0.045)));
      if (d > 0.01) { k.fillStyle = '#fff'; k.beginPath(); k.arc(x + BW / 2, base - hh - 16, 6.5 * d, 0, 7); k.fill(); }
    }
  };

  // @element 03
  // 03 バースト（「いいね」のハートが点くと同時に、まわりに線と粒が弾ける）
  CELLS[2] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), X = w / 2, Y = h / 2 + 2, t0 = 0.5, tt = lu - t0;
    const ant = eIOs(P(lu, 0.3, t0)), off = P(lu, 1.92, 2.2);
    const sc = tt < 0 ? 1 - 0.3 * ant : 0.7 + 0.3 * spring(tt, 16, 6.5) + 0.0;
    if (tt > 0 && tt < 0.75) {
      const q = eOut5(tt / 0.6 > 1 ? 1 : tt / 0.6), fade = 1 - P(tt, 0.3, 0.72);
      // 輪
      k.strokeStyle = C.yel; k.lineWidth = Math.max(0.1, 16 * (1 - q)); k.beginPath(); k.arc(X, Y, 44 + 46 * q, 0, 7); if (q < 0.98) k.stroke();
      // 放射の線
      k.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 - Math.PI / 2, r1 = 64 + 66 * q, len = 36 * (1 - P(tt, 0.22, 0.7));
        if (len > 0.5) { k.strokeStyle = i % 2 ? C.mint : C.yel; k.lineWidth = 9; k.beginPath(); k.moveTo(X + Math.cos(a) * (r1 - len), Y + Math.sin(a) * (r1 - len) * 0.82); k.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1 * 0.82); k.stroke(); }
        const a2 = a + Math.PI / 10, r2 = 58 + 92 * q;
        k.fillStyle = i % 2 ? C.coral : C.blue; k.globalAlpha = fade; k.beginPath(); k.arc(X + Math.cos(a2) * r2 * 1.45, Y + Math.sin(a2) * r2 * 0.78, 8 * (1 - q * 0.4), 0, 7); k.fill(); k.globalAlpha = 1;
      }
    }
    k.save(); k.translate(X, Y - 2); k.scale(sc, sc);
    heartPath(k, 46); k.lineJoin = 'round'; k.lineWidth = 7; k.strokeStyle = C.navy3; k.stroke();
    const fa = tt < 0 ? 0 : 1 - off;
    if (fa > 0) { k.globalAlpha = fa; k.fillStyle = C.coral; k.strokeStyle = C.coral; k.fill(); k.stroke(); k.globalAlpha = 1; }
    k.restore();
  };

  // @element 04
  // 04 ラインドロー（グラフの線が、描かれるように伸びる。消えるときは後ろから追いかける）
  function smoothPath(pts, n = 16) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[pts.length - 1]); return out; }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  function trim(k, pts, cum, f0, f1) { if (f1 - f0 <= 0.0005) return; const L = cum[cum.length - 1], a = L * f0, b = L * f1; k.beginPath(); const s = ptAt(pts, cum, f0); k.moveTo(s[0], s[1]); for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) k.lineTo(pts[i][0], pts[i][1]); const e = ptAt(pts, cum, f1); k.lineTo(e[0], e[1]); k.stroke(); }
  const LD = (() => { const a = smoothPath([[84, 158], [150, 126], [212, 146], [284, 86], [346, 108], [410, 60], [468, 34]]); const ax = [[70, 26], [70, 178], [486, 178]]; return { a, ac: pathLen(a), ax, axc: pathLen(ax) }; })();
  CELLS[3] = (k, w, h, u) => {
    stage(k);
    k.lineCap = 'round'; k.lineJoin = 'round';
    const er = eIO(P(u, 3.85, 4.55));
    // 軸
    k.strokeStyle = C.navy3; k.lineWidth = 6; trim(k, LD.ax, LD.axc, er, eIO(P(u, 0.08, 0.7)));
    // 線
    const f1 = eIO(P(u, 0.4, 1.95)), f0 = eIO(P(u, 3.65, 4.45));
    k.strokeStyle = C.mint; k.lineWidth = 11; trim(k, LD.a, LD.ac, f0, f1);
    // 矢じり
    const ah = backOut(P(u, 1.9, 2.2), 2.5) * (1 - P(u, 4.3, 4.45));
    if (ah > 0.01) { const e = ptAt(LD.a, LD.ac, 1); k.save(); k.translate(e[0], e[1]); k.rotate(e[2]); k.beginPath(); k.moveTo(-26 * ah, -20 * ah); k.lineTo(4, 0); k.lineTo(-26 * ah, 20 * ah); k.stroke(); k.restore(); }
    // 描いている先端
    if (f1 > 0 && f1 < 1) { const e = ptAt(LD.a, LD.ac, f1); k.fillStyle = C.yel; k.beginPath(); k.arc(e[0], e[1], 12, 0, 7); k.fill(); k.fillStyle = '#fff'; k.beginPath(); k.arc(e[0], e[1], 5, 0, 7); k.fill(); }
    // 山の点に丸が描かれる
    const cf = eIO(P(u, 2.2, 2.8)), cb = eIO(P(u, 3.5, 4.0));
    if (cf > cb) { k.strokeStyle = C.coral; k.lineWidth = 7; k.beginPath(); k.arc(284, 86, 26, -Math.PI / 2 + cb * Math.PI * 2, -Math.PI / 2 + cf * Math.PI * 2); k.stroke(); }
  };

  // @element 05
  // 05 マスクリビール（見えない枠＝線の向こうから、見出しがせり上がる）
  CELLS[4] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), X = w / 2, LY = 124;
    const lg = eIO(P(lu, 0.1, 0.5)) * (1 - eIO(P(lu, 2.05, 2.3)));
    // 上の段：線の下から上へ
    const up = (1 - eOut5(P(lu, 0.35, 1.0))) * 120 + backIn(P(lu, 1.7, 2.05), 1.2) * -150;
    k.save(); k.beginPath(); k.rect(0, 8, w, LY - 8 - 5); k.clip();
    txt(k, 'Hello!', X, LY - 14 + up, `800 98px ${DISP}`, '#fff', 'center', 'alphabetic', '1px');
    k.restore();
    // 下の段：線の上から下へ
    const dn = (1 - eOut5(P(lu, 0.55, 1.15))) * -60 + eIn(P(lu, 1.75, 2.05)) * 70;
    k.save(); k.beginPath(); k.rect(0, LY + 5, w, 52); k.clip();
    txt(k, 'はじめまして', X, LY + 44 + dn, `700 32px ${JP}`, C.yel, 'center', 'alphabetic', '6px');
    k.restore();
    if (lg > 0.005) { k.fillStyle = C.coral; rr(k, X - 190 * lg, LY - 3, 380 * lg, 6, 3); k.fill(); }
  };

  // @element 06
  // 06 タイプライター（入力欄に1文字ずつ打たれ、打ち終わると送信ボタンが点く）
  CELLS[5] = (k, w, h, u) => {
    stage(k);
    const S = 'ねこの動画つくって', N = [...S].length, t0 = 0.3, dt = 0.24, done = t0 + N * dt;
    const BX = 34, BY = 58, BW = w - 68, BH = 92;
    const sendT = done + 0.55, clr = P(u, sendT + 0.12, sendT + 0.4);
    k.fillStyle = '#fff'; rr(k, BX, BY, BW, BH, 30); k.fill();
    const f = `600 36px ${JP}`; k.font = f;
    let n = clamp(Math.floor((u - t0) / dt) + 1, 0, N); if (u < t0) n = 0;
    let x = BX + 32; const y = BY + BH / 2 + 2;
    k.save(); rr(k, BX, BY, BW - 86, BH, 30); k.clip();
    [...S].slice(0, n).forEach((ch, i) => {
      const age = u - (t0 + i * dt), pop = 1 + 0.35 * Math.exp(-age * 16), cw = k.measureText(ch).width;
      k.save(); k.translate(x + cw / 2, y - clr * 70); k.scale(pop, pop); k.globalAlpha = 1 - clr;
      txt(k, ch, 0, 0, f, C.navy, 'center', 'middle'); k.restore(); k.font = f; x += cw + 1;
    });
    k.restore();
    if (clr > 0.5) x = BX + 32;
    // カーソル（打っている間は点灯。待ちの間は0.94秒周期でゆっくり明滅）
    const typing = u >= t0 - 0.05 && u < done + 0.1, blink = typing ? 1 : (mod(u, 0.94) < 0.5 ? 1 : 0);
    if (blink) { k.fillStyle = C.coral; rr(k, x + 4, y - 23, 5, 44, 2.5); k.fill(); }
    // 送信ボタン
    const on = spring(u - done - 0.12, 15, 6.5) * (1 - P(u, sendT + 0.5, sendT + 0.8)), press = 1 - 0.2 * Math.sin(Math.PI * P(u, sendT - 0.05, sendT + 0.2));
    const bx = BX + BW - 48, by = BY + BH / 2;
    k.fillStyle = '#DDE3F3'; k.beginPath(); k.arc(bx, by, 30, 0, 7); k.fill();
    if (on > 0.01) { k.fillStyle = C.blue; k.beginPath(); k.arc(bx, by, 30 * Math.min(on, 1.25) * press, 0, 7); k.fill(); }
    k.strokeStyle = '#fff'; k.lineWidth = 6; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(bx, by + 12); k.lineTo(bx, by - 12); k.moveTo(bx - 11, by - 2); k.lineTo(bx, by - 13); k.lineTo(bx + 11, by - 2); k.stroke();
  };

  // @element 07
  // 07 カウントアップ（数字が勢いよく増えて、最後にピタッと決まる）
  CELLS[6] = (k, w, h, u) => {
    stage(k);
    const TARGET = 2480, a = P(u, 0.1, 0.4) * (1 - P(u, 4.0, 4.4));
    const p = P(u, 0.45, 2.9), v = Math.round(TARGET * (1 - Math.pow(1 - p, 4)));
    const s = v.toLocaleString('en-US'), f = `800 104px ${DISP}`;
    k.font = f; const dw = k.measureText('0').width + 2, cw = k.measureText(',').width;
    const full = TARGET.toLocaleString('en-US'); let tot = 0; for (const ch of full) tot += ch === ',' ? cw : dw;
    const land = u - 2.9, pop = 1 + (land > 0 ? 0.07 * Math.exp(-7 * land) * Math.cos(15 * land) : 0);
    const X = w / 2 + 42, Y = 96;
    k.save(); k.globalAlpha = a; k.translate(X, Y); k.scale(pop, pop);
    let x = tot / 2;   // 右そろえ
    const speed = p < 1 ? Math.pow(1 - p, 3) : 0;
    for (const ch of [...s].reverse()) {
      const cwid = ch === ',' ? cw : dw; x -= cwid;
      txt(k, ch, x + cwid / 2, 0, f, land > 0 ? C.yel : '#fff', 'center', 'middle');
    }
    k.restore();
    // 上向きの矢印チップ
    const ar = spring(u - 0.35, 14, 7) * (1 - P(u, 4.0, 4.3)), bob = speed * 6 * Math.sin(u * 30);
    if (ar > 0.01) { k.save(); k.translate(X - tot / 2 - 58, Y - 2 + bob); k.scale(ar, ar); k.fillStyle = C.mint; k.beginPath(); k.arc(0, 0, 34, 0, 7); k.fill(); k.strokeStyle = C.navy; k.lineWidth = 8; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(0, 15); k.lineTo(0, -14); k.moveTo(-13, -1); k.lineTo(0, -15); k.lineTo(13, -1); k.stroke(); k.restore(); }
    // 下のバー
    const bw = 330, bx = w / 2 - bw / 2, by = 168;
    k.globalAlpha = a; k.fillStyle = C.navy3; rr(k, bx, by, bw, 12, 6); k.fill();
    const g = k.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.mint);
    k.fillStyle = g; rr(k, bx, by, Math.max(12, bw * (v / TARGET)), 12, 6); k.fill(); k.globalAlpha = 1;
  };

  // @element 08
  // 08 キネティックタイポグラフィ（言葉の意味に合わせて文字が動く：のびる／はねる／まわる／ドン！）
  CELLS[7] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, n = Math.min(3, Math.floor(u / T)), lu = u - n * T, X = w / 2, Y = h / 2 + 6;
    const out = P(lu, T - 0.2, T - 0.02), oa = 1 - out, oy = -46 * eIn(out);
    const f = `800 88px ${JP}`;
    k.save(); k.translate(X, Y + oy); k.globalAlpha = oa;
    if (n === 0) {
      const sp = spring(lu - 0.05, 12, 4.2), sx = 0.3 + 0.7 * sp, sy = 1 / Math.sqrt(Math.max(0.75, sx));
      k.globalAlpha = oa * P(lu, 0.03, 0.12); k.scale(sx, sy); txt(k, 'のびる', 0, 0, f, C.blue, 'center', 'middle', '4px');
    } else if (n === 1) {
      chars(k, 'はねる', f, 6).forEach((c, i) => {
        const tt = lu - 0.06 - i * 0.1; if (tt < 0) return;
        const y = -78 * Math.abs(Math.sin(Math.PI * tt / 0.4)) * Math.exp(-2.6 * tt), near = Math.abs(Math.sin(Math.PI * tt / 0.4)) < 0.25 ? 1 : 0;
        const sq = 1 - 0.16 * near * Math.exp(-2.6 * tt), a = P(tt, 0, 0.08);
        k.save(); k.globalAlpha = oa * a; k.translate(c.x, y + 44); k.scale(2 - sq, sq); txt(k, c.ch, 0, -44, f, C.yel, 'center', 'middle'); k.restore();
      });
    } else if (n === 2) {
      chars(k, 'まわる', f, 6).forEach((c, i) => {
        const tt = lu - 0.05 - i * 0.12; if (tt < 0) return;
        const q = backOut(P(tt, 0, 0.62), 1.3), sc = eOut(P(tt, 0, 0.25));
        k.save(); k.translate(c.x, 0); k.rotate((1 - q) * -Math.PI * 2); k.scale(sc, sc); txt(k, c.ch, 0, 0, f, C.mint, 'center', 'middle'); k.restore();
      });
    } else {
      const hit = 0.2, tt = lu - hit, sc = tt < 0 ? lerp(3.4, 1, eIn(P(lu, 0.02, hit))) : 1;
      const dx = tt > 0 ? 10 * Math.exp(-9 * tt) * Math.sin(38 * tt) : 0, sy = tt > 0 ? 1 - 0.2 * Math.exp(-11 * tt) : 1;
      k.globalAlpha = oa * P(lu, 0.02, 0.1);
      if (tt > 0 && tt < 0.4) { const q = eOut(tt / 0.4); k.strokeStyle = C.yel; k.lineWidth = 7 * (1 - q); k.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, r0 = 120 + 50 * q, r1 = r0 + 26; k.beginPath(); k.moveTo(Math.cos(a) * r0 * 1.35, Math.sin(a) * r0 * 0.5); k.lineTo(Math.cos(a) * r1 * 1.35, Math.sin(a) * r1 * 0.5); if (q < 0.97) k.stroke(); } }
      k.translate(dx, 44); k.scale(sc * (2 - sy), sc * sy); k.transform(1, 0, -0.14, 1, 0, 0); txt(k, 'ドン!', 0, -44, `800 100px ${JP}`, C.coral, 'center', 'middle');
    }
    k.restore();
  };

  // @element 09
  // 09 イージング（同じ距離・同じ時間。上は一定の速さ、下は緩急あり）
  const EZ = bez(.86, 0, .14, 1);
  const EZT = [0.2, 1.75, 2.55, 4.1];
  const ezPos = u => { if (u < EZT[0]) return 0; if (u < EZT[1]) return P(u, EZT[0], EZT[1]); if (u < EZT[2]) return 1; if (u < EZT[3]) return 1 - P(u, EZT[2], EZT[3]); return 0; };
  const ezE = u => { if (u < EZT[0]) return 0; if (u < EZT[1]) return EZ(P(u, EZT[0], EZT[1])); if (u < EZT[2]) return 1; if (u < EZT[3]) return 1 - EZ(P(u, EZT[2], EZT[3])); return 0; };
  CELLS[8] = (k, w, h, u) => {
    stage(k);
    const x0 = 162, x1 = 478, D = x1 - x0, y1 = 58, y2 = 150, S = 62;
    const lin = ezPos(u), mv = (u >= EZT[0] && u < EZT[1]) ? 1 : (u >= EZT[2] && u < EZT[3]) ? -1 : 0, pp = mv === 1 ? P(u, EZT[0], EZT[1]) : mv === -1 ? P(u, EZT[2], EZT[3]) : 0;
    const ez = mv === 1 ? EZ(pp) : mv === -1 ? 1 - EZ(pp) : lin;
    const vel = mv ? (EZ(Math.min(1, pp + 0.01)) - EZ(Math.max(0, pp - 0.01))) / 0.02 : 0, vn = clamp(vel / 3.6);
    // ラベル
    txt(k, '一定', 24, y1 + 1, `700 34px ${JP}`, C.dim, 'left', 'middle');
    txt(k, '緩急', 24, y2 + 1, `700 34px ${JP}`, C.yel, 'left', 'middle');
    // レール＋0.1秒ごとの位置
    [[y1, x => x, '#34489A'], [y2, EZ, '#34489A']].forEach(([y, f, col]) => {
      k.strokeStyle = C.navy2; k.lineWidth = 6; k.lineCap = 'round'; k.beginPath(); k.moveTo(x0, y); k.lineTo(x1, y); k.stroke();
      k.fillStyle = col; for (let i = 0; i <= 11; i++) { k.beginPath(); k.arc(x0 + f(i / 11) * D, y, 5, 0, 7); k.fill(); }
    });
    // 上：一定（形も色も動かない）
    k.fillStyle = '#6677AD'; rr(k, x0 + lin * D - S / 2, y1 - S / 2, S, S, 16); k.fill();
    // 下：緩急あり（速いところで伸び、尾を引く）
    const X = x0 + ez * D;
    if (vn > 0.05) {
      k.lineCap = 'round';
      [[-20, C.yel, 1], [0, C.coral, 1.25], [20, C.yel, 0.8]].forEach(([dy, col, m]) => { k.strokeStyle = col; k.globalAlpha = 0.9 * vn; k.lineWidth = 10; k.beginPath(); k.moveTo(X - mv * (S / 2), y2 + dy); k.lineTo(X - mv * (S / 2 + 150 * vn * m), y2 + dy); k.stroke(); });
      k.globalAlpha = 1;
    }
    // 残像（少し前の位置を薄く重ねる）
    for (let g = 4; g >= 1; g--) { const gx = x0 + ezE(u - g * 0.035) * D; if (Math.abs(gx - X) > 3) { k.globalAlpha = 0.16 * (5 - g) / 4 + 0.06; k.fillStyle = C.coral; rr(k, gx - S / 2, y2 - S / 2, S, S, 16); k.fill(); } } k.globalAlpha = 1;
    const sx = 1 + 0.5 * vn, sy = 1 - 0.2 * vn;
    k.save(); k.translate(X, y2); k.scale(sx, sy); k.fillStyle = C.coral; rr(k, -S / 2, -S / 2, S, S, 16); k.fill(); k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.arc(S / 2 - 18, -S / 2 + 18, 6, 0, 7); k.fill(); k.restore();
  };

  // @element 10
  // 10 オーバーシュート（メーターの針が、目標を行き過ぎてから戻って止まる）
  CELLS[9] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h - 26, R = 128, TG = 0.7;
    let v;
    if (u < 0.25) v = 0; else if (u < 3.7) { const t = u - 0.25; v = TG * (1 - Math.exp(-4.6 * t) * Math.cos(10.5 * t)); } else { const t = u - 3.7; v = TG * Math.exp(-7.5 * t) * Math.cos(8.5 * t); }
    const ang = x => Math.PI + x * Math.PI;
    k.lineCap = 'round';
    k.strokeStyle = C.navy2; k.lineWidth = 26; k.beginPath(); k.arc(X, Y, R, ang(0), ang(1)); k.stroke();
    if (v > 0.005) { const g = k.createLinearGradient(X - R, 0, X + R, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.mint); k.strokeStyle = g; k.beginPath(); k.arc(X, Y, R, ang(0), ang(v)); k.stroke(); }
    // 行き過ぎた分（目標より先）はコーラルで見せる
    if (v > TG + 0.004) { k.strokeStyle = C.coral; k.lineCap = 'butt'; k.beginPath(); k.arc(X, Y, R, ang(TG), ang(v)); k.stroke(); k.lineCap = 'round'; }
    // 目標の印
    const ta = ang(TG);
    k.strokeStyle = C.yel; k.lineWidth = 7; k.beginPath(); k.moveTo(X + Math.cos(ta) * (R - 22), Y + Math.sin(ta) * (R - 22)); k.lineTo(X + Math.cos(ta) * (R + 30), Y + Math.sin(ta) * (R + 30)); k.stroke();
    k.fillStyle = C.yel; k.beginPath(); k.arc(X + Math.cos(ta) * (R + 38), Y + Math.sin(ta) * (R + 38), 8, 0, 7); k.fill();
    // 針
    const a = ang(v);
    k.strokeStyle = '#fff'; k.lineWidth = 9; k.beginPath(); k.moveTo(X, Y); k.lineTo(X + Math.cos(a) * (R - 26), Y + Math.sin(a) * (R - 26)); k.stroke();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(X, Y, 17, 0, 7); k.fill(); k.fillStyle = C.coral; k.beginPath(); k.arc(X, Y, 8, 0, 7); k.fill();
  };

  // @element 11
  // 11 スクワッシュ＆ストレッチ（弾むキャラクターが、着地でつぶれ、飛ぶときに伸びる）
  CELLS[10] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, q = mod(u, T) / T, c = 0.1, floor = h - 28, R = 37, Hgt = 92;
    const X = w / 2 + 150 * Math.sin(u / CYC * Math.PI * 2);
    let sy, yb, grounded = false;
    if (q < c || q > 1 - c) { const d = (q < c ? q : 1 - q) / c; sy = lerp(0.52, 1.28, d * d); yb = floor; grounded = true; }
    else { const qq = (q - c) / (1 - 2 * c), sp = Math.abs(2 * qq - 1); yb = floor - Hgt * (1 - sp * sp); sy = 1 + 0.28 * Math.pow(sp, 3); }
    const sx = 1 / sy, hg = (floor - yb) / Hgt;
    k.fillStyle = C.navy3; rr(k, 40, floor, w - 80, 5, 2.5); k.fill();
    k.fillStyle = 'rgba(0,0,0,.32)'; k.beginPath(); k.ellipse(X, floor + 9, R * 1.2 * (1 - hg * 0.55) * Math.max(1, sx), 6 * (1 - hg * 0.5), 0, 0, 7); k.fill();
    // 着地の小さなしぶき
    const dq = q < 0.5 ? q : q - 1; if (Math.abs(dq) < 0.16 && dq > -0.02) { const t = (dq + 0.02) / 0.18; k.strokeStyle = C.yel; k.lineWidth = 5 * (1 - t); k.lineCap = 'round';[-1, 1].forEach(s => { k.beginPath(); k.moveTo(X + s * (50 + 28 * t), floor - 6 - 10 * t); k.lineTo(X + s * (62 + 40 * t), floor - 12 - 20 * t); if (t < 0.97) k.stroke(); }); }
    k.save(); k.translate(X, yb); k.scale(sx, sy);
    k.fillStyle = C.coral; k.beginPath(); k.arc(0, -R, R, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.ellipse(-12, -R - 4, 7, 9.5, 0, 0, 7); k.ellipse(12, -R - 4, 7, 9.5, 0, 0, 7); k.fill();
    k.fillStyle = C.navy; k.beginPath(); k.arc(-10.5, -R - 3, 3.8, 0, 7); k.arc(13.5, -R - 3, 3.8, 0, 7); k.fill();
    k.restore();
  };

  // @element 12
  // 12 モーフィング（● → ■ → ★ → ♥ と、形と色がなめらかに変わる）
  const MN = 240;
  const SHAPES = (() => {
    const R = 64, mk = fn => { const a = []; for (let i = 0; i < MN; i++) a.push(fn(i / MN)); return a; };
    const circle = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * R, Math.sin(a) * R]; });
    const sq = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; let r = R * 0.88 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); r = Math.min(r, R * 1.13); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const st = mk(t => { const seg = 1 / 10, j = Math.floor(t / seg), f = (t - j * seg) / seg, ro = R * 1.2, ri = R * 0.56; const a0 = j * Math.PI / 5 - Math.PI / 2, a1 = (j + 1) * Math.PI / 5 - Math.PI / 2, r0 = j % 2 ? ri : ro, r1 = j % 2 ? ro : ri; return [lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, f), lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, f)]; });
    const hp = mk(t => { const a = t * Math.PI * 2, s = R / 15.5; return [16 * Math.pow(Math.sin(a), 3) * s, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s - 4]; });
    return [circle, sq, st, hp];
  })();
  const MCOL = [C.blue, C.coral, C.yel, C.mint];
  CELLS[11] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, i = Math.min(3, Math.floor(u / T)), lu = u - i * T;
    const pr = P(lu, T - 0.62, T - 0.04), p = backOut(pr, 1.6), pc = eIOs(pr);
    const A = SHAPES[i], B = SHAPES[(i + 1) % 4], X = w / 2, Y = h / 2 + 3;
    // 次の形の予告（左右の小さな点）
    for (let j = 0; j < 4; j++) { const on = j === i ? 1 - pc : j === (i + 1) % 4 ? pc : 0; k.fillStyle = mix(C.navy3, MCOL[j], on); k.beginPath(); k.arc(X - 39 + j * 26, h - 16, 5 + 2 * on, 0, 7); k.fill(); }
    const pulse = 1 + 0.07 * Math.sin(Math.PI * pr);
    k.save(); k.translate(X, Y - 8); k.scale(pulse, pulse);
    k.fillStyle = mix(MCOL[i], MCOL[(i + 1) % 4], pc); k.beginPath();
    for (let j = 0; j < MN; j++) { const x = lerp(A[j][0], B[j][0], p), y = lerp(A[j][1], B[j][1], p); j ? k.lineTo(x, y) : k.moveTo(x, y); }
    k.closePath(); k.lineJoin = 'round'; k.strokeStyle = k.fillStyle; k.lineWidth = 8; k.stroke(); k.fill(); k.restore();
  };

  // @element 13
  // 13 リキッドモーション（しずくが伸びて、ちぎれて、ぬるっと1つにまとまる）
  const LQ = bez(.7, 0, .2, 1);
  const lqPos = uu => { const u = mod(uu, CYC); let p; if (u < 0.35) p = 0; else if (u < 1.45) p = LQ(P(u, 0.35, 1.45)); else if (u < 2.7) p = 1; else if (u < 3.8) p = 1 - LQ(P(u, 2.7, 3.8)); else p = 0; const mvp = (u >= 0.35 && u < 1.45) ? P(u, 0.35, 1.45) : (u >= 2.7 && u < 3.8) ? P(u, 2.7, 3.8) : 0; return [lerp(120, 420, p), 104 - 34 * Math.sin(Math.PI * mvp)]; };
  CELLS[12] = (k, w, h, u) => {
    stage(k);
    const blobs = [];
    for (let i = 0; i < 8; i++) { const [x, y] = lqPos(u - i * 0.065); blobs.push([x, y + (i ? 6 * Math.sin(u * 2.67 + i) : 0), lerp(44, 15, i / 7)]); }
    // 止まっている間、まわりで小さなしずくが出入りする
    for (let j = 0; j < 3; j++) { const [x, y] = lqPos(u - 0.1), a = j * 2.2 + 0.6, d = 34 + 30 * (0.5 - 0.5 * Math.cos(u / CYC * Math.PI * 4 + j * 2.1)); blobs.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 15 - j * 2]); }
    const L = goo(g => { for (const b of blobs) { g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); } }, 9, g => { const gr = g.createLinearGradient(60, 30, 480, 180); gr.addColorStop(0, C.mint); gr.addColorStop(0.55, C.blue); gr.addColorStop(1, '#7C5CFF'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    k.drawImage(L, 0, 0);
    const [hx, hy] = lqPos(u); k.fillStyle = 'rgba(255,255,255,.75)'; k.beginPath(); k.ellipse(hx - 14, hy - 17, 10, 6, -0.6, 0, 7); k.fill();
  };

  // @element 14
  // 14 モーショントレイル（動いた跡に、残像が尾を引く）
  CELLS[13] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h / 2 + 2, A = 196, B = 62, th = u / CYC * Math.PI * 2;
    const pt = a => [X + A * Math.sin(a), Y + B * Math.sin(2 * a)];
    const N = 15;
    for (let i = N; i >= 1; i--) {
      const [x, y] = pt(th - i * 0.105), f = i / N;
      k.globalAlpha = 0.9 * (1 - f) + 0.05; k.fillStyle = f < 0.5 ? mix(C.coral, C.yel, f * 2) : mix(C.yel, C.blue, (f - 0.5) * 2);
      k.beginPath(); k.arc(x, y, lerp(22, 6, f), 0, 7); k.fill();
    }
    k.globalAlpha = 1; const [x, y] = pt(th);
    k.fillStyle = C.coral; k.beginPath(); k.arc(x, y, 25, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x, y, 11, 0, 7); k.fill();
  };

  // @element 15
  // 15 パーティクル（粒が次々と噴き出して、飛び散って落ちる）
  const PARTS = (() => { const R = rand(15), a = []; for (let i = 0; i < 84; i++) { const n = R() < 0.5 ? 2 : 3; a.push({ T: CYC / n, ph: R() * CYC, vx: (R() - 0.5) * 2 * 190, vy: -(250 + R() * 150), sz: 5 + R() * 6, col: PAL[i % 4], kind: i % 3, spin: (R() - 0.5) * 9 }); } return a; })();
  CELLS[14] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h - 20, G = 470;
    for (const p of PARTS) {
      const t = mod(u + p.ph, p.T), life = Math.min(p.T, 1.5); if (t > life) continue;
      const x = X + p.vx * t, y = Y + p.vy * t + 0.5 * G * t * t, a = Math.min(1, t / 0.06) * (1 - smooth(P(t, life * 0.7, life))), sc = lerp(1.15, 0.7, t / life);
      k.globalAlpha = a; k.fillStyle = p.col; k.save(); k.translate(x, y); k.rotate(t * p.spin); k.scale(sc, sc);
      if (p.kind === 0) { k.beginPath(); k.arc(0, 0, p.sz, 0, 7); k.fill(); }
      else if (p.kind === 1) { k.fillRect(-p.sz, -p.sz, p.sz * 2, p.sz * 2); }
      else { k.beginPath(); k.moveTo(0, -p.sz * 1.3); k.lineTo(p.sz * 1.2, p.sz); k.lineTo(-p.sz * 1.2, p.sz); k.closePath(); k.fill(); }
      k.restore();
    }
    k.globalAlpha = 1;
    k.fillStyle = C.navy3; rr(k, X - 70, h - 12, 140, 30, 10); k.fill();
    k.fillStyle = '#fff'; rr(k, X - 30, h - 22, 60, 30, 10); k.fill();
  };

  // @element 16
  // 16 パララックス（手前ほど大きく、奥ほど小さく動いて、奥行きが出る）
  const PLX = (() => {
    const R = rand(16), ridge = (base, amp, step, seed) => { const r = rand(seed), pts = []; for (let x = -220; x <= CW + 220; x += step) pts.push([x, base - amp * (0.35 + 0.65 * r())], [x + step / 2, base + amp * 0.1 * r()]); return pts; };
    const stars = []; for (let i = 0; i < 16; i++) stars.push([R() * (CW + 80) - 40, 12 + R() * 80, 1.5 + R() * 2]);
    const trees = []; for (let i = 0; i < 9; i++) trees.push([-160 + i * 108 + R() * 30, 34 + R() * 24, i % 3]);
    return { far: ridge(150, 78, 120, 3), mid: ridge(172, 74, 92, 8), stars, trees };
  })();
  CELLS[15] = (k, w, h, u) => {
    const pan = 108 * Math.sin(u / CYC * Math.PI * 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0F1A3D'); g.addColorStop(1, '#27408F'); k.fillStyle = g; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff'; for (const s of PLX.stars) { k.globalAlpha = 0.8; k.beginPath(); k.arc(s[0] - pan * 0.05, s[1], s[2], 0, 7); k.fill(); } k.globalAlpha = 1;
    // 月（いちばん奥・ほぼ動かない）
    k.fillStyle = C.yel; k.beginPath(); k.arc(390 - pan * 0.1, 56, 30, 0, 7); k.fill();
    const poly = (pts, m, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(-260, h + 10); pts.forEach(p => k.lineTo(p[0] - pan * m, p[1])); k.lineTo(w + 260, h + 10); k.closePath(); k.fill(); };
    poly(PLX.far, 0.28, '#31499C');
    poly(PLX.mid, 0.6, C.blue);
    // 手前の丘と木
    k.fillStyle = C.mint; k.beginPath(); k.moveTo(-300, h + 10); for (let x = -300; x <= w + 300; x += 20) k.lineTo(x - pan * 1.25, 176 + 12 * Math.sin(x * 0.012)); k.lineTo(w + 300, h + 10); k.closePath(); k.fill();
    for (const t of PLX.trees) { const x = t[0] - pan * 1.25, by = 180 + 12 * Math.sin(t[0] * 0.012), hh = t[1] * 1.45; k.fillStyle = C.navy; k.fillRect(x - 4, by - 16, 8, 22); k.fillStyle = t[2] === 0 ? C.coral : '#12A57B'; k.beginPath(); k.moveTo(x, by - hh); k.lineTo(x + 20, by - 12); k.lineTo(x - 20, by - 12); k.closePath(); k.fill(); }
    // いちばん手前（ボケた葉影のように大きく速く動く）
    k.fillStyle = '#0A1230';[[-40, 60], [300, 44], [620, 66]].forEach(([x, r]) => { k.beginPath(); k.arc(x - pan * 2.1, h + 18, r, 0, 7); k.fill(); });
  };

  // @shared
  // 画面A＝昼（クリーム・コーラルの太陽）／画面B＝夜（濃紺・黄色の月）。A→B→A で1周期
  const SUN = [112, 104], MOON = [CW - 112, 104];
  function scrA(k, w, h) {
    k.fillStyle = C.cream; k.fillRect(0, 0, w, h);
    k.fillStyle = '#FFD9A8'; k.beginPath(); k.arc(SUN[0], SUN[1], 66, 0, 7); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.arc(SUN[0], SUN[1], 44, 0, 7); k.fill();
    txt(k, 'DAY', 214, h / 2 + 4, `800 96px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.fillStyle = '#fff'; rr(k, 400, 34, 96, 26, 13); k.fill(); rr(k, 430, 20, 50, 26, 13); k.fill();
  }
  function scrB(k, w, h) {
    k.fillStyle = '#16255A'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff';[[40, 30, 3], [150, 170, 2.5], [250, 24, 2.5], [330, 180, 3], [500, 30, 2.5], [20, 150, 2], [300, 100, 0]].forEach(s => { k.beginPath(); k.arc(s[0], s[1], s[2], 0, 7); k.fill(); });
    k.fillStyle = C.yel; k.beginPath(); k.arc(MOON[0], MOON[1], 46, 0, 7); k.fill();
    k.fillStyle = '#16255A'; k.beginPath(); k.arc(MOON[0] + 22, MOON[1] - 14, 38, 0, 7); k.fill();
    txt(k, 'NIGHT', 40, h / 2 + 4, `800 88px ${DISP}`, '#fff', 'left', 'middle', '1px');
  }
  const SCR = [scrA, scrB];
  const SEG3 = CYC / 2;
  function abCell(trans) { return (k, w, h, u) => { const sgi = Math.min(1, Math.floor(u / SEG3)), uu = u - sgi * SEG3; trans(k, w, h, uu, sgi, 1 - sgi); }; }
  const TA = 0.5, TB = 1.5;

  // @element 17
  // 17 マスクトランジション（丸や星の形の「窓」が広がり、その中に次の画面が見える）
  CELLS[16] = abCell((k, w, h, u, a, b) => {
    const p = eIO(P(u, TA - 0.05, TB + 0.1));
    SCR[a](k, w, h);
    if (p > 0) {
      const c = a === 0 ? SUN : MOON, shape = () => { if (a === 0) { k.beginPath(); k.arc(c[0], c[1], lerp(0, 470, p), 0, 7); } else star(k, c[0], c[1], lerp(0, 1150, p), p * 1.2, 0.5); };
      k.save(); shape(); k.clip(); SCR[b](k, w, h); k.restore();
      if (p < 1) { k.strokeStyle = '#fff'; k.lineWidth = 7; k.lineJoin = 'round'; shape(); k.stroke(); }
    }
  });

  // @element 18
  // 18 シェイプトランジション（色のついた帯が画面を覆い隠し、抜けると次の画面になっている）
  CELLS[17] = abCell((k, w, h, u, a, b) => {
    const p1 = P(u, TA - 0.12, TA + 0.5), p2 = P(u, TA + 0.62, TA + 1.25), N = 4, sk = 80;
    SCR[p1 >= 1 ? b : a](k, w, h);
    const cols = [C.blue, C.coral, C.yel, C.mint];
    for (let i = 0; i < N; i++) {
      const d = i * 0.14, e1 = eIO(clamp((p1 - d) / (1 - 0.42))), e2 = eIO(clamp((p2 - d) / (1 - 0.42)));
      if (e1 <= 0 || e2 >= 1) continue;
      const bh = h / N + 1, y = i * h / N, span = w + sk + 20, dir = a === 0 ? 1 : -1;
      let xa = -sk - 10 + e2 * span, xb = -sk - 10 + e1 * span;
      k.save(); if (dir < 0) { k.translate(w, 0); k.scale(-1, 1); }
      k.fillStyle = cols[i]; k.beginPath(); k.moveTo(xa + sk, y); k.lineTo(xb + sk, y); k.lineTo(xb, y + bh); k.lineTo(xa, y + bh); k.closePath(); k.fill(); k.restore();
    }
  });

  // @element 19
  // 19 リキッドトランジション（ペンキのような液体が上から垂れて流れ込み、次の画面になる）
  const DRIPS = [0, 1].map(s => { const R = rand(190 + s * 7), a = []; for (let i = 0; i < 7; i++) a.push({ x: 36 + i * 78 + (R() - 0.5) * 30, len: 30 + R() * 80, wd: 15 + R() * 12, ph: R() * 6 }); return a; });
  function liquidShape(g, w, h, p, set, u) {
    const base = lerp(-110, h + 130, p), amp = Math.sin(Math.PI * clamp(p * 1.1));
    g.beginPath(); g.moveTo(-20, -40);
    for (let x = -20; x <= w + 20; x += 10) g.lineTo(x, base + amp * (13 * Math.sin(x * 0.021 + u * 3 + set) + 8 * Math.sin(x * 0.05 + u * 4.3)));
    g.lineTo(w + 20, -40); g.closePath(); g.fill();
    for (const d of DRIPS[set]) { const L = d.len * (0.25 + amp * 0.9), y0 = base - 20; g.beginPath(); g.roundRect(d.x - d.wd, y0, d.wd * 2, L + 20, d.wd); g.fill(); g.beginPath(); g.arc(d.x, y0 + L + 18, d.wd * 1.25, 0, 7); g.fill(); }
  }
  CELLS[18] = abCell((k, w, h, u, a, b) => {
    const p1 = eIOs(P(u, TA - 0.15, TB)), p2 = eIOs(P(u, TA + 0.2, TB + 0.3));
    SCR[a](k, w, h);
    if (p1 > 0 && p2 < 1) k.drawImage(goo(g => liquidShape(g, w, h, p1, 0, u), 7, g => { g.fillStyle = a === 0 ? C.blue : C.coral; g.fillRect(0, 0, w, h); }), 0, 0);
    if (p2 >= 1) SCR[b](k, w, h);
    else if (p2 > 0) k.drawImage(goo(g => liquidShape(g, w, h, p2, 1, u + 1), 7, g => SCR[b](g, w, h)), 0, 0);
  });

  // @element 20
  // 20 ズームスルー（文字の「O」の穴へ突っ込んで、その先の画面へ抜ける）
  function ring(k, x, y, col) { k.strokeStyle = col; k.lineWidth = 21; k.beginPath(); k.arc(x, y, 35, 0, 7); k.stroke(); }
  const ZP = [{ x: 228, y: 106, r: 24.5 }, { x: 300, y: 106, r: 24.5 }];
  function scrX(k, w, h) { k.fillStyle = C.yel; k.fillRect(0, 0, w, h); const f = `800 118px ${DISP}`; txt(k, 'Z', 128, 110, f, C.navy, 'center', 'middle'); ring(k, 228, 106, C.navy); ring(k, 324, 106, C.navy); txt(k, 'M', 432, 110, f, C.navy, 'center', 'middle'); }
  function scrY(k, w, h) { k.fillStyle = C.blue; k.fillRect(0, 0, w, h); const f = `800 118px ${DISP}`; txt(k, 'G', 208, 110, f, '#fff', 'center', 'middle'); ring(k, 300, 106, '#fff'); txt(k, '!', 372, 110, f, C.yel, 'center', 'middle'); }
  const SCZ = [scrX, scrY], ZBG = [C.yel, C.blue];
  CELLS[19] = abCell((k, w, h, u, a, b) => {
    const po = ZP[a], Smax = Math.hypot(Math.max(po.x, w - po.x), Math.max(po.y, h - po.y)) / po.r * 1.08;
    const p = eIn(P(u, TA - 0.25, TB - 0.3)) * 0.8 + eOut(P(u, TB - 0.3, TB + 0.15)) * 0.2;
    if (p >= 1) return SCZ[b](k, w, h);
    const s = Math.pow(Smax, p), Z = (kk, sc) => { kk.translate(po.x, po.y); kk.scale(sc, sc); kk.translate(-po.x, -po.y); };
    k.save(); Z(k, s); SCZ[a](k, w, h);
    k.save(); k.beginPath(); k.arc(po.x, po.y, po.r, 0, 7); k.clip(); k.fillStyle = ZBG[b]; k.fillRect(0, 0, w, h); Z(k, 1 / Smax); SCZ[b](k, w, h); k.restore();
    k.restore();
  });

  // @element 21
  // 21 フリップ（カードが軸で回って裏返り、裏の面が出る）
  const FW = 300, FH = 156, FC = mkCanvas(FW, FH), FK = FC.getContext('2d');
  function flipFace(i) {
    FK.setTransform(1, 0, 0, 1, 0, 0); FK.clearRect(0, 0, FW, FH);
    FK.fillStyle = i ? C.yel : C.blue; rr(FK, 0, 0, FW, FH, 22); FK.fill();
    FK.strokeStyle = i ? 'rgba(15,26,61,.18)' : 'rgba(255,255,255,.3)'; FK.lineWidth = 4; rr(FK, 12, 12, FW - 24, FH - 24, 13); FK.stroke();
    txt(FK, i ? 'A' : 'Q', 92, FH / 2 + 4, `800 112px ${DISP}`, i ? C.navy : '#fff', 'center', 'middle');
    FK.fillStyle = i ? C.navy : '#fff'; FK.globalAlpha = i ? 0.85 : 0.9; rr(FK, 164, 50, 100, 14, 7); FK.fill(); FK.globalAlpha = i ? 0.4 : 0.5; rr(FK, 164, 76, 76, 12, 6); FK.fill(); rr(FK, 164, 98, 90, 12, 6); FK.fill(); FK.globalAlpha = 1;
  }
  CELLS[20] = abCell((k, w, h, u, a, b) => {
    stage(k);
    const pr = P(u, TA - 0.05, TB), th = Math.PI * backOut(pr, 1.5), c = Math.cos(th), s = Math.sin(th), front = c >= 0;
    flipFace(front ? a : b);
    const X = w / 2, Y = h / 2 - 2, lift = Math.sin(Math.PI * pr), sc = 1 + 0.08 * lift, ww = FW * Math.abs(c) * sc, per = 0.2 * s * (front ? 1 : -1);
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, h - 13, Math.max(8, ww / 2 * 0.9), 6, 0, 0, 7); k.fill();
    const STEP = 2;
    for (let sx = 0; sx < FW; sx += STEP) { const f = sx / FW, dx = X - ww / 2 + f * ww, hh = FH * sc * (1 + per * (f - 0.5) * 2); k.drawImage(FC, sx, 0, STEP, FH, dx, Y - hh / 2 - 6 * lift, ww / FW * STEP + 0.6, hh); }
    if (Math.abs(s) > 0.02) { k.fillStyle = `rgba(8,14,40,${0.34 * Math.abs(s)})`; k.beginPath(); const hl = FH * sc * (1 - per), hr = FH * sc * (1 + per), yy = Y - 6 * lift; k.moveTo(X - ww / 2, yy - hl / 2); k.lineTo(X + ww / 2, yy - hr / 2); k.lineTo(X + ww / 2, yy + hr / 2); k.lineTo(X - ww / 2, yy + hl / 2); k.closePath(); k.fill(); }
  });

  // @element 22
  // 22 ライトスイープ（ロゴの表面を、光の帯が斜めに横切る）
  CELLS[21] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), p = eIOs(P(lu, 0.45, 1.5));
    const BW = 400, BH = 112, X = w / 2 - BW / 2, Y = h / 2 - BH / 2;
    k.fillStyle = 'rgba(0,0,0,.3)'; rr(k, X + 3, Y + 9, BW, BH, 28); k.fill();
    const g = k.createLinearGradient(X, Y, X + BW, Y + BH); g.addColorStop(0, '#2B62E0'); g.addColorStop(1, '#4E8BFF'); k.fillStyle = g; rr(k, X, Y, BW, BH, 28); k.fill();
    k.fillStyle = C.yel; star(k, X + 64, Y + BH / 2, 30, 0, 0.5); k.lineJoin = 'round'; k.strokeStyle = C.yel; k.lineWidth = 5; k.stroke(); k.fill();
    txt(k, 'PREMIUM', X + 112, Y + BH / 2 + 3, `800 50px ${DISP}`, '#fff', 'left', 'middle', '3px');
    if (p > 0 && p < 1) {
      k.save(); rr(k, X, Y, BW, BH, 28); k.clip();
      k.translate(lerp(X - 130, X + BW + 130, p), Y + BH / 2); k.rotate(0.42);
      const gr = k.createLinearGradient(-58, 0, 58, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.72)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = gr; k.fillRect(-58, -160, 116, 320); k.fillStyle = 'rgba(255,255,255,.5)'; k.fillRect(78, -160, 12, 320);
      k.restore();
    }
    // 抜けぎわのきらめき
    const tt = lu - 1.38; if (tt > 0 && tt < 0.6) { const q = tt / 0.6, sc = Math.sin(Math.PI * q) * (1 + 0.2 * (1 - q)); k.save(); k.translate(X + BW - 8, Y + 6); k.rotate(q * 0.9); k.fillStyle = '#fff'; star(k, 0, 0, 30 * sc, 0, 0.22, 4); k.fill(); k.restore(); }
  };

  // @element 23
  // 23 グリッチ（文字が横にずれ、色がずれ、帯が走る。明るさの点滅はさせない）
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const GL = (() => { const R = rand(231), st = []; for (let s = 0; s < 12; s++) { const sl = [], n = 2 + Math.floor(R() * 3); for (let i = 0; i < n; i++) sl.push({ y: Math.floor(40 + R() * 110), h: 10 + Math.floor(R() * 26), dx: Math.round((R() < .5 ? -1 : 1) * (18 + R() * 46)) }); const bars = []; for (let i = 0; i < 3; i++) bars.push({ x: 30 + R() * 420, y: 30 + R() * 150, w: 30 + R() * 90, h: 5 + R() * 7, c: i }); st.push({ sl, bars, rgb: 7 + Math.round(R() * 9) }); } return st; })();
  const GLC = mkCanvas(CW, CH), GK = GLC.getContext('2d'), GLT = mkCanvas(CW, CH), GT = GLT.getContext('2d');
  CELLS[22] = (k, w, h, u) => {
    const content = kk => { txt(kk, 'GLITCH', w / 2, h / 2 + 4, `800 104px ${DISP}`, '#fff', 'center', 'middle', '2px'); };
    const step = 0.14; let si = -1;
    if (u >= 0.55 && u < 0.55 + step * 5) si = Math.floor((u - 0.55) / step);
    else if (u >= 2.9 && u < 2.9 + step * 6) si = 5 + Math.floor((u - 2.9) / step);
    stage(k);
    if (si < 0) { content(k); return; }
    const S = GL[si];
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.clearRect(0, 0, w, h); content(TK);
    const tint = col => { GT.setTransform(1, 0, 0, 1, 0, 0); GT.globalCompositeOperation = 'source-over'; GT.clearRect(0, 0, w, h); GT.drawImage(TMP, 0, 0); GT.globalCompositeOperation = 'source-in'; GT.fillStyle = col; GT.fillRect(0, 0, w, h); GT.globalCompositeOperation = 'source-over'; return GLT; };
    GK.setTransform(1, 0, 0, 1, 0, 0); GK.fillStyle = C.navy; GK.fillRect(0, 0, w, h);
    GK.drawImage(tint(C.coral), -S.rgb, 2); GK.drawImage(tint('#22D3EE'), S.rgb, -2); GK.drawImage(TMP, 0, 0);
    k.drawImage(GLC, 0, 0);
    for (const sl of S.sl) { k.fillStyle = C.navy; k.fillRect(0, sl.y, w, sl.h); k.drawImage(GLC, 0, sl.y, w, sl.h, sl.dx, sl.y, w, sl.h); }
    for (const b of S.bars) { k.fillStyle = [C.coral, '#22D3EE', C.yel][b.c]; k.fillRect(b.x, b.y, b.w, b.h); }
  };

  // @element 24
  // 24 インパクトシェイク（重い見出しの板がドンと落ち、その衝撃で画面ごと揺れる）
  CELLS[23] = (k, w, h, u) => {
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T;
    const floor = h - 30, SW = 250, SH = 100, tI = 0.62, tau = lu - tI;
    let y = lu < 0.3 ? -SH - 20 : lu < tI ? lerp(-SH - 20, floor - SH, eIn(P(lu, 0.3, tI))) : floor - SH;
    y -= 300 * backIn(P(lu, 1.85, 2.2), 1.6);
    let dx = 0, dy = 0, rot = 0;
    if (tau > 0 && tau < 1.1) { const e = Math.exp(-5 * tau), ph = 2 * Math.PI * 5 * tau; dx = 15 * e * Math.sin(ph); dy = 11 * e * Math.cos(ph * 1.3); rot = 0.02 * e * Math.sin(ph + 0.6); }
    k.fillStyle = C.navy; k.fillRect(0, 0, w, h);
    k.save(); k.translate(w / 2 + dx, h / 2 + dy); k.rotate(rot); k.translate(-w / 2, -h / 2);
    k.fillStyle = C.navy; k.fillRect(-40, -40, w + 80, h + 80);
    // 背景の小物（衝撃で少し跳ねる）
    [[34, 62, 86, C.navy2, 0.06], [104, 46, 54, C.navy3, 0.03], [w - 150, 50, 66, C.navy3, 0.03], [w - 90, 62, 104, C.navy2, 0.06]].forEach(([x, bw, bh, col, dl]) => { const t = tau - dl, hop = t > 0 && t < 0.5 ? -24 * Math.sin(Math.PI * t / 0.5) * (1 - t) : 0; k.fillStyle = col; rr(k, x, floor - bh + hop, bw, bh, [10, 10, 0, 0]); k.fill(); k.fillStyle = C.blue; k.globalAlpha = 0.55; rr(k, x + 10, floor - bh + 12 + hop, bw - 20, 8, 4); k.fill(); k.globalAlpha = 1; });
    k.fillStyle = C.navy3; k.fillRect(-40, floor, w + 80, 5);
    // 衝撃の線とほこり
    if (tau > 0 && tau < 0.55) {
      const q = eOut(tau / 0.55); k.strokeStyle = '#fff'; k.lineCap = 'round'; k.lineWidth = 7 * (1 - q);
      for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, j = Math.floor(i / 2), a = -0.12 - j * 0.34, r0 = 140 + 46 * q, r1 = r0 + 32; k.beginPath(); k.moveTo(w / 2 + s * Math.cos(a) * r0, floor - 4 + Math.sin(a) * r0); k.lineTo(w / 2 + s * Math.cos(a) * r1, floor - 4 + Math.sin(a) * r1); if (q < 0.97) k.stroke(); }
      k.fillStyle = C.dim; k.globalAlpha = 0.8 * (1 - q); for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, d = 130 + q * (50 + i * 14); k.beginPath(); k.arc(w / 2 + s * d, floor - 8 - q * (6 + i * 4), 9 + q * 8 - i, 0, 7); k.fill(); } k.globalAlpha = 1;
    }
    const sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin(tau / 0.3 * Math.PI) : (lu < tI && lu > 0.3 ? 1.12 : 1);
    k.save(); k.translate(w / 2, y + SH); k.scale(2 - sq, sq);
    k.fillStyle = n ? C.coral : C.yel; rr(k, -SW / 2, -SH, SW, SH, 18); k.fill();
    k.fillStyle = 'rgba(15,26,61,.14)'; rr(k, -SW / 2, -16, SW, 16, [0, 0, 18, 18]); k.fill();
    txt(k, n ? 'SALE' : 'NEW!', 0, -SH / 2 + 4, `800 74px ${DISP}`, n ? '#fff' : C.navy, 'center', 'middle', '2px');
    k.restore();
    k.restore();
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "camera" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('camera', function () {
  // @kit
  // カメラワーク＆切り替え 24（カード 539x208）。各コマは時間 u の純関数。
  // 1つの動きは CYC=4.7秒。切り替え（19〜21）は A→B の次に B→A と戻るので、パックの周期は CYC×2=9.4秒。
  const CW = 539, CH = 208, FPS = 30;
  const HOLD = 9.4, CYC = HOLD / 2;
  const C = {
    bg: '#F4F3F0', card: '#FFFFFF', border: '#E3E1DC', ink: '#1E1E21', sub: '#8E8E93', faint: '#C9C9CC',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', blueXL: '#E4ECFE', blueBg: '#F1F5FF',
    grid: '#ECECEC', g1: '#F1F0EE', g2: '#E2E1DE', g3: '#CFCECB', g4: '#A9A8A5'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const EN = '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif';
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const mod = (a, n) => ((a % n) + n) % n;
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

  // ============================== 3D SCENE ==============================
  // 世界座標: Y上・カメラは +Z を向く（yaw=0）。単位はメートル。焦点距離 f はピクセル。
  const F0 = 330;  // = 24mm 表示
  const mm = f => Math.round(f / F0 * 24) + 'mm';
  function cam(o) { return Object.assign({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: 0, roll: 0, f: F0 }, o); }
  function proj(c, X, Y, Z) {
    const dx = X - c.x, dy = Y - c.y, dz = Z - c.z;
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    return { x: c.f * x1 / z2, y: -c.f * y2 / z2, z: z2, s: c.f / z2, cx: x1, cy: y2 };
  }
  function camZ(c, X, Y, Z) { return proj(c, X, Y, Z).z; }
  const NEAR = 0.25;
  function seg(ctx, c, a, b) {   // 3D line with near clipping
    let za = camZ(c, ...a), zb = camZ(c, ...b);
    if (za < NEAR && zb < NEAR) return;
    if (za < NEAR) { const t = (NEAR - za) / (zb - za); a = a.map((v, i) => lerp(v, b[i], t)); }
    else if (zb < NEAR) { const t = (NEAR - zb) / (za - zb); b = b.map((v, i) => lerp(v, a[i], t)); }
    const p = proj(c, ...a), q = proj(c, ...b);
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
  }
  function poly(ctx, c, pts) { ctx.beginPath(); pts.forEach((p, i) => { const q = proj(c, ...p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); }

  // sprite = local drawing (meters, y up) anchored at a world point, always facing camera (billboard)
  function sprite(ctx, c, X, Y, Z, fn) {
    const p = proj(c, X, Y, Z); if (p.z < NEAR) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, -p.s); fn(ctx, p.s); ctx.restore();
  }
  function person(ctx, s, o = {}) {
    const col = o.col || C.blue, walk = o.walk || 0, face = o.face;
    ctx.fillStyle = col;
    const sw = Math.sin(walk) * 0.42;
    // legs
    [[-0.08, sw], [0.08, -sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 0.86); ctx.rotate(a); rr(ctx, -0.075, -0.86, 0.15, 0.88, 0.07); ctx.fill(); ctx.restore(); });
    // arms
    [[-0.25, -sw], [0.25, sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 1.38); ctx.rotate(a * (o.armUp ? 0 : 1) + (o.armUp ? (x < 0 ? -2.6 : 2.6) : 0)); rr(ctx, -0.06, -0.58, 0.12, 0.6, 0.06); ctx.fill(); ctx.restore(); });
    rr(ctx, -0.23, 0.82, 0.46, 0.64, 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 1.63, 0.16, 0, 7); ctx.fill();
    if (face !== undefined && Math.cos(face) > 0) {   // 顔の向き（オービット用）
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.sin(face) * -0.09, 1.65, 0.035, 0, 7); ctx.fill();
    }
  }
  function tree(ctx, s, h = 4, col = C.g2) {
    ctx.fillStyle = C.g3; ctx.fillRect(-0.09 * h / 4, 0, 0.18 * h / 4, h * 0.55);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, h * 0.68, h * 0.3, 0, 7); ctx.fill();
  }
  function building(ctx, s, w, h, col = C.g1) {
    ctx.fillStyle = col; ctx.fillRect(-w / 2, 0, w, h);
    ctx.strokeStyle = C.g3; ctx.lineWidth = 1.4 / s; ctx.strokeRect(-w / 2, 0, w, h);
    ctx.fillStyle = C.g2;
    for (let y = h - 1.6; y > 1; y -= 1.8) for (let x = -w / 2 + 0.6; x < w / 2 - 0.7; x += 1.3) ctx.fillRect(x, y, 0.6, 0.8);
  }
  function post(ctx, s, h = 1.2) { ctx.fillStyle = C.g4; ctx.fillRect(-0.07, 0, 0.14, h); ctx.fillRect(-0.12, h - 0.06, 0.24, 0.1); }

  // scene presets
  const MTN_FAR = [[-420, 0], [-300, 22], [-230, 8], [-150, 30], [-80, 12], [-20, 34], [50, 14], [120, 28], [190, 6], [260, 26], [340, 10], [420, 0]];
  const MTN_NEAR = [[-260, 0], [-190, 12], [-140, 4], [-70, 18], [-20, 6], [30, 15], [95, 3], [160, 16], [230, 5], [300, 0]];
  const BLD = [[-17, 4, 9], [-12, 3.2, 13], [-8, 2.6, 7], [11, 3.4, 11], [15.5, 4, 8], [20, 3, 15], [-24, 3.5, 10], [26, 4, 7]];
  const CITY = [[-9, 3.4, 12], [-5.5, 3, 18], [-2, 3.6, 9], [1.8, 3, 22], [5.4, 3.6, 14], [9, 3, 10], [-13, 3.4, 15], [12.8, 3.6, 19]];

  function world(ctx, w, h, c, o = {}) {
    ctx.save();
    ctx.translate(w / 2, h / 2); ctx.rotate(c.roll || 0);
    const blurBg = o.blurBg || 0, blurFg = o.blurFg || 0;
    const setBlur = b => { ctx.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'; };
    // sky tint
    if (o.sky) { ctx.fillStyle = o.sky; ctx.fillRect(-w * 2, -h * 3, w * 4, h * 6); }
    setBlur(blurBg);
    // sun / moon
    const sun = o.sun === undefined ? [30, 30, 170] : o.sun;
    if (sun) { const p = proj(c, ...sun); if (p.z > NEAR) { ctx.fillStyle = o.sunCol || C.blueL; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, 5.5 * p.s * (o.sunScale || 1)), 0, 7); ctx.fill(); } }
    if (o.clouds) o.clouds.forEach(([X, Y, Z, r]) => { const p = proj(c, X, Y, Z); if (p.z < NEAR) return; ctx.fillStyle = C.g1; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 2.2 * p.s, r * p.s, 0, 0, 7); ctx.ellipse(p.x + r * 1.2 * p.s, p.y + r * .2 * p.s, r * 1.4 * p.s, r * .8 * p.s, 0, 0, 7); ctx.fill(); });
    // mountains (far planes)
    if (o.mountains !== false) {
      const off = o.mtnZ || 0;
      ctx.fillStyle = C.blueXL; poly(ctx, c, [...MTN_FAR.map(([x, y]) => [x, y, 175 + off])]); ctx.fill();
      ctx.fillStyle = C.blueL; poly(ctx, c, [...MTN_NEAR.map(([x, y]) => [x, y, 120 + off])]); ctx.fill();
    }
    // ground + grid
    if (o.grid !== false) {
      ctx.save(); setBlur(blurBg * 0.6);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1.3; ctx.beginPath();
      const z0 = Math.floor(c.z / 2) * 2, xs = o.gridX || 40;
      for (let z = z0 + 2; z <= z0 + 90; z += (z - z0 < 30 ? 2 : 6)) seg(ctx, c, [-xs + c.x, 0, z], [xs + c.x, 0, z]);
      for (let x = Math.floor(c.x / 2) * 2 - xs; x <= c.x + xs; x += 2) seg(ctx, c, [x, 0, z0 + 0.5], [x, 0, z0 + 90]);
      ctx.stroke();
      // horizon
      ctx.strokeStyle = C.g2; ctx.lineWidth = 1.5; ctx.beginPath(); seg(ctx, c, [c.x - 400, 0, c.z + 300], [c.x + 400, 0, c.z + 300]); ctx.stroke();
      ctx.restore();
    }
    // sprites sorted by depth
    const list = [];
    const add = (X, Y, Z, fn, fg) => list.push({ z: camZ(c, X, Y, Z), X, Y, Z, fn, fg });
    if (o.buildings !== false) (o.city ? CITY.map(([x, bw, bh]) => [x, bw, bh, 30]) : BLD.map(([x, bw, bh]) => [x, bw, bh, 48])).forEach(([x, bw, bh, z]) => add(x, 0, z, (k, s) => building(k, s, bw, bh)));
    if (o.trees !== false) [[-7, 22], [6.5, 19], [9.5, 24], [-11, 26], [3, 30]].forEach(([x, z]) => add(x, 0, z, (k, s) => tree(k, s, 4)));
    if (o.tower) add(o.tower[0], 0, o.tower[1], (k, s) => { building(k, s, 6, 9.5, C.g1); k.fillStyle = C.g4; k.fillRect(-0.08, 9.5, 0.16, 2.2); k.fillStyle = C.blue; k.beginPath(); k.arc(0, 11.8, 0.3, 0, 7); k.fill(); });
    if (o.ring) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(o.ring[0] + Math.sin(a) * o.ring[2], 0, o.ring[1] + Math.cos(a) * o.ring[2], (k, s) => tree(k, s, 3.2, i % 3 ? C.g2 : C.blueXL)); }
    if (o.extra) o.extra.forEach(e => add(e[0], e[1], e[2], e[3], e[4]));
    if (o.person) { const pp = o.person; add(pp.x || 0, pp.y || 0, pp.z === undefined ? 8 : pp.z, (k, s) => person(k, s, pp), pp.fg); }
    if (o.fg) o.fg.forEach(([X, Z, kind]) => add(X, 0, Z, (k, s) => kind === 'rock' ? (k.fillStyle = C.g3, k.beginPath(), k.ellipse(0, 0.1, 0.55, 0.38, 0, 0, 7), k.fill()) : post(k, s), true));
    list.sort((a, b) => b.z - a.z);
    for (const it of list) { setBlur(it.fg ? blurFg : blurBg); sprite(ctx, c, it.X, it.Y, it.Z, it.fn); }
    ctx.filter = 'none';
    if (o.after) o.after(ctx, c);
    ctx.restore();
  }

  // ============================== VIEWFINDER CARD ==============================
  const CARD = mkCanvas(CW, CH), CK = CARD.getContext('2d');
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const TMP2 = mkCanvas(CW, CH), TK2 = TMP2.getContext('2d');
  function clear(k, w = CW, h = CH) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.filter = 'none'; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h); }
  // draw fnA then blend fnB on top with alpha a (into k)
  function blend(k, fnA, fnB, a) {
    if (a <= 0.001) return fnA(k);
    if (a >= 0.999) return fnB(k);
    fnA(k);
    clear(TK2); fnB(TK2); k.save(); k.globalAlpha = a; k.drawImage(TMP2, 0, 0); k.restore();
  }
  // motion blur: average n renders of fn(k, s) with s spread over [s0, s1]
  function mblur(k, fn, s0, s1, n) {
    if (Math.abs(s1 - s0) < 1e-4 || n < 2) return fn(k, s0);
    const acc = mkCanvasCached(), ak = acc.getContext('2d');
    for (let i = 0; i < n; i++) {
      clear(TK); fn(TK, lerp(s0, s1, (i + .5) / n));
      ak.globalAlpha = 1 / (i + 1); ak.drawImage(TMP, 0, 0);
    }
    ak.globalAlpha = 1; k.save(); k.drawImage(acc, 0, 0); k.restore();
  }
  let _acc; function mkCanvasCached() { if (!_acc) _acc = mkCanvas(CW, CH); const k = _acc.getContext('2d'); k.globalAlpha = 1; k.fillStyle = '#fff'; k.fillRect(0, 0, CW, CH); return _acc; }

  function viewfinder(k, w, h, t, hud, hudCol) {
    k.save();
    const m = 13, L = 20;
    k.strokeStyle = '#8F8F94'; k.lineWidth = 2.6; k.lineCap = 'round';
    k.beginPath();
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => { k.moveTo(x, y + sy * L); k.lineTo(x, y); k.lineTo(x + sx * L, y); });
    k.stroke();
    // center mark
    k.strokeStyle = 'rgba(143,143,148,.55)'; k.lineWidth = 1.6; k.beginPath(); k.moveTo(w / 2 - 7, h / 2); k.lineTo(w / 2 + 7, h / 2); k.moveTo(w / 2, h / 2 - 7); k.lineTo(w / 2, h / 2 + 7); k.stroke();
    // REC (なめらかな明滅・9.4秒で9回＝ループの継ぎ目なし)
    const a = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 9 / HOLD);
    k.fillStyle = C.blue; k.globalAlpha = a; k.beginPath(); k.arc(m + 16, m + 17, 5, 0, 7); k.fill(); k.globalAlpha = 1;
    txt(k, 'REC', m + 27, m + 17, `600 14px ${MONO}`, '#7D7D82', 'left', 'middle');
    if (hud) {
      const f = `600 15px ${MONO}`, ww = tw(k, hud, f);
      k.fillStyle = 'rgba(255,255,255,.82)'; rr(k, w - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
      txt(k, hud, w - m - 14, m + 18, f, hudCol || '#6E6E73', 'right', 'middle');
    }
    k.restore();
  }

  // ============================== CELLS ==============================
  // each: (k, w, h, u) where u = time within the cycle (0..CYC), cyc = cycle index; returns HUD string
  const RESET = 0.5;  // 末尾のクロスフェードで開始状態へ戻す
  function camCell(stateAt, hudAt, t0 = 0.5, t1 = 3.4) {
    return (k, w, h, u) => {
      const p = eIO(P(u, t0, t1));
      const r = P(u, CYC - RESET, CYC);
      blend(k, kk => stateAt(kk, w, h, p, u), kk => stateAt(kk, w, h, 0, u - CYC), eIOs(r));
      return hudAt(r > 0.5 ? 0 : p, u);
    };
  }
  // 1コマぶんの枠: 白地 → 中身 → ファインダー（四隅・REC・右上の数値）。u はパック周期 0..CYC×2
  function shot(fn, vh) {
    return (k, w, h, u) => {
      const uu = mod(u, CYC), cyc = Math.floor(u / CYC);
      k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h);
      k.save(); const hud = fn(k, w, h, uu, cyc); k.restore();
      k.globalAlpha = 1; k.filter = 'none';
      viewfinder(k, w, vh || h, u, hud);
    };
  }
  const CELLS = [];

  // @element 01
  // 01 パン: 回転なので全ての層が同じだけ横に流れる
  CELLS[0] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ yaw: lerp(-0.32, 0.32, p) }), { person: { x: 0, z: 8 } }),
    p => `${Math.round(lerp(-0.32, 0.32, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 02
  // 02 ティルト
  CELLS[1] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ pitch: lerp(-0.06, 0.36, p), y: 1.4 }), { person: { z: 7 }, tower: [0, 26], buildings: false, sun: [7, 13, 40], sunScale: 0.4 }),
    p => `${Math.round(lerp(-0.06, 0.36, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 03
  // 03 ドリーイン: カメラ位置が前へ（手前は大きく、奥はほぼそのまま）
  CELLS[2] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ z: lerp(0, 5.8, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0)));

  // @element 04
  // 04 ズームイン: 位置は固定・焦点距離だけ伸びる（全体が同じ比率で拡大）
  CELLS[3] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ f: F0 * Math.pow(8 / 2.2, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0 * Math.pow(8 / 2.2, p))));

  // @element 05
  // 05 トラッキング: 人物と並んで横移動（手前ほど速く流れる）
  CELLS[4] = shot((k, w, h, u) => {
    const x = (u - CYC / 2) * 1.7;
    const fgp = []; for (let i = -12; i <= 12; i++) fgp.push([i * 1.6, 4]);
    world(k, w, h, cam({ x, y: 1.3 }), { person: { x, z: 7.5, walk: u * 7 }, fg: fgp });
    return '→ 1.7m/s';
  });

  // @element 06
  // 06 オービット: 被写体を中心に円を描いて回り込む
  CELLS[5] = shot(camCell((k, w, h, p) => {
    const a = lerp(-0.95, 0.95, p), R = 6, P0 = [0, 0, 9];
    const c = cam({ x: P0[0] + Math.sin(a) * R, z: P0[2] - Math.cos(a) * R, yaw: -a, y: 1.7, pitch: -0.07 });
    world(k, w, h, c, {
      person: { z: 9, face: a }, ring: [0, 9, 10], buildings: true, trees: false,
      after: (kk, cc) => { kk.strokeStyle = C.blueM; kk.lineWidth = 2; kk.setLineDash([5, 5]); kk.beginPath(); for (let i = 0; i <= 48; i++) { const b = i / 48 * Math.PI * 2; const q = proj(cc, Math.sin(b) * 1.3, 0, 9 + Math.cos(b) * 1.3); i ? kk.lineTo(q.x, q.y) : kk.moveTo(q.x, q.y); } kk.stroke(); kk.setLineDash([]); }
    });
  }, p => `${Math.round(lerp(-0.95, 0.95, p) * 57.3)}°`.replace(/^(\d)/, '+$1'), 0.5, 3.6));

  // @element 07
  // 07 クレーンアップ: カメラが上昇し、見下ろしになる
  CELLS[6] = shot(camCell((k, w, h, p) => {
    const y = lerp(1.4, 9, p), z = lerp(0, 1.5, p);
    world(k, w, h, cam({ y, z, pitch: -0.86 * Math.atan2(y - 1.0, 8 - z) }), { person: { z: 8 } });
  }, p => `↑ ${lerp(1.4, 9, p).toFixed(1)}m`));

  // @element 08
  // 08 ドリーズーム: 人物の大きさは一定、背景だけ伸び縮み
  CELLS[7] = shot(camCell((k, w, h, p) => {
    const d = lerp(3.2, 8, p), f = F0 * d / 8 * 1.0;
    const c = cam({ z: 8 - d, f, y: 1.3 });
    world(k, w, h, c, {
      person: { z: 8 }, trees: true,
      after: (kk, cc) => { const top = proj(cc, 0, 1.8, 8).y, bot = proj(cc, 0, 0, 8).y; kk.strokeStyle = C.blue; kk.lineWidth = 1.6; kk.setLineDash([6, 5]); kk.beginPath(); kk.moveTo(-80, top); kk.lineTo(80, top); kk.moveTo(-80, bot); kk.lineTo(80, bot); kk.stroke(); kk.setLineDash([]); }
    });
  }, p => mm(F0 * lerp(3.2, 8, p) / 8)));

  // @element 09
  // 09 ラックフォーカス
  CELLS[8] = shot(camCell((k, w, h, p) => {
    world(k, w, h, cam({ y: 1.1 }), {
      person: { x: 0.9, z: 9 }, blurFg: 7 * p, blurBg: 6 * (1 - p),
      extra: [[-0.75, 0, 2.0, (kk, s) => { kk.fillStyle = C.g3; kk.fillRect(-0.025, 0, 0.05, 0.75); kk.fillStyle = C.blueM; for (let i = 0; i < 6; i++) { kk.beginPath(); kk.ellipse(Math.cos(i) * 0.09, 0.8 + Math.sin(i) * 0.09, 0.08, 0.05, i, 0, 7); kk.fill(); } kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0.8, 0.05, 0, 7); kk.fill(); }, true]],
      after: (kk, cc) => {   // ピント位置の枠
        const a = proj(cc, -0.75, 0.8, 2.0), b = proj(cc, 0.9, 0.9, 9);
        const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p), r = lerp(46, 30, p);
        kk.strokeStyle = C.blue; kk.lineWidth = 2; kk.beginPath();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { kk.moveTo(x + sx * r, y + sy * r - sy * 9); kk.lineTo(x + sx * r, y + sy * r); kk.lineTo(x + sx * r - sx * 9, y + sy * r); });
        kk.stroke();
      }
    });
  }, p => `◎ ${lerp(2, 9, p).toFixed(0)}m`, 1.0, 2.6));

  // @element 10
  // 10 手持ち
  CELLS[9] = shot((k, w, h, u) => {
    const T = u * 2 * Math.PI / CYC;   // 周期をサイクルに合わせて継ぎ目なし
    const n = (a, b, c2) => Math.sin(T * a + b) * c2;
    const yaw = n(3, 0, .016) + n(7, 1, .008) + n(13, 2, .004), pitch = n(4, 2, .012) + n(9, .5, .006) + n(17, 1.2, .003), roll = n(5, 1, .02) + n(11, 3, .008);
    world(k, w, h, cam({ yaw, pitch, roll, y: 1.5 + n(6, 0, .03) }), { person: { z: 6.5 } });
    return 'HANDHELD';
  });

  // @element 11
  // 11 FPV
  CELLS[10] = shot((k, w, h, u) => {
    const sp = 14, z = u * sp, T = u * 2 * Math.PI / CYC;
    const c = cam({ z, y: 1.4 + 0.5 * Math.sin(T * 2), roll: 0.22 * Math.sin(T * 2 + 0.6), yaw: 0.05 * Math.sin(T * 2), x: 0.6 * Math.sin(T * 2 - 0.4), pitch: -0.05 });
    const ex = [];
    const L = 8, base = Math.floor(z / L) * L;
    for (let i = 0; i < 12; i++) { const zz = base + i * L; ex.push([-3.6, 0, zz, (kk, s) => tree(kk, s, 4.2)]); ex.push([3.6, 0, zz + L / 2, (kk, s) => tree(kk, s, 4.2, C.blueXL)]); }
    world(k, w, h, c, {
      buildings: false, trees: false, extra: ex, gridX: 20,
      after: (kk) => {   // スピード線
        kk.strokeStyle = 'rgba(150,150,155,.45)'; kk.lineWidth = 2;
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, ph = mod(u * 2.2 + i * 0.37, 1); const r0 = 120 + ph * 160; kk.beginPath(); kk.moveTo(Math.cos(a) * r0 * 1.9, Math.sin(a) * r0 * 0.8); kk.lineTo(Math.cos(a) * (r0 + 40) * 1.9, Math.sin(a) * (r0 + 40) * 0.8); kk.stroke(); }
      }
    });
    return `${Math.round(sp * 3.6)}km/h`;
  });

  // @element 12
  // 12 ダッチアングル
  CELLS[11] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ roll: lerp(0, 0.36, p) }), { person: { z: 7 } }), p => `∠ ${Math.round(lerp(0, 0.36, p) * 57.3)}°`, 0.6, 2.2));

  // @shared
  // 跳躍の高さと、舞い落ちる葉（13・14・16 で使う）
  function jumpY(q) { return q <= 0 || q >= 1 ? 0 : 4 * q * (1 - q) * 1.1; }
  function leaves(u, speed) { const ex = []; for (let i = 0; i < 9; i++) { const ph = mod(u * speed / 4.7 + i / 9, 1); ex.push([-3 + i * 0.75 + Math.sin(i * 3) * 0.3, 3.4 - ph * 3.4, 6 + (i % 3), (kk) => { kk.fillStyle = i % 2 ? C.blueM : C.g3; kk.save(); kk.rotate(ph * 6 + i); kk.beginPath(); kk.ellipse(0, 0, 0.09, 0.045, 0, 0, 7); kk.fill(); kk.restore(); }]); } return ex; }

  // @element 13
  // 13 スローモーション
  CELLS[12] = shot((k, w, h, u) => {
    const q = P(u, 0.5, 4.3);
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(u, 1) });
    return '120fps ×0.25';
  });

  // @element 14
  // 14 スピードランプ: 速い→遅い（グラフで速さを表示）
  function rampTime(u) {   // 再生速度 v(u): 2.4 → 0.25（u 1.2〜1.9 で切替）
    const v = x => lerp(2.4, 0.25, eIOs(P(x, 1.2, 1.9)));
    let s = 0; const N = 60; for (let i = 0; i < N; i++) { const x = u * (i + .5) / N; s += v(x) * u / N; } return { s, v: v(u) };
  }
  CELLS[13] = shot((k, w, h, u) => {
    const uu = Math.min(u, CYC - RESET);
    const draw = (kk, uu) => {
      const { s, v } = rampTime(uu);
      const x = -6 + s * 2.0, q = P(x, -1.5, 2.5);
      world(kk, w, h, cam({ y: 1.3 }), {
        person: { x, z: 8, walk: s * 9, y: jumpY(q) * 0.9, armUp: q > 0 && q < 1 },
        after: (k2) => {   // 速度グラフ
          const gx = -w / 2 + 26, gy = h / 2 - 22, gw = 120, gh = 40;
          k2.fillStyle = 'rgba(255,255,255,.85)'; rr(k2, gx - 8, gy - gh - 10, gw + 16, gh + 18, 6); k2.fill();
          k2.strokeStyle = C.faint; k2.lineWidth = 1.5; k2.beginPath(); k2.moveTo(gx, gy); k2.lineTo(gx + gw, gy); k2.stroke();
          k2.strokeStyle = C.blue; k2.lineWidth = 2.5; k2.beginPath();
          for (let i = 0; i <= 40; i++) { const xx = i / 40 * (CYC - RESET), vv = rampTime(xx).v; const X = gx + i / 40 * gw, Y = gy - vv / 2.4 * gh; i ? k2.lineTo(X, Y) : k2.moveTo(X, Y); }
          k2.stroke();
          const X = gx + uu / (CYC - RESET) * gw, Y = gy - v / 2.4 * gh; k2.fillStyle = C.blue; k2.beginPath(); k2.arc(X, Y, 5, 0, 7); k2.fill();
        }
      });
      return v;
    };
    const r = P(u, CYC - RESET, CYC); let v;
    blend(k, kk => { v = draw(kk, uu); }, kk => draw(kk, 0), eIOs(r));
    return `×${(r > .5 ? 2.4 : v).toFixed(1)}`;
  });

  // @element 15
  // 15 タイムラプス: 太陽が動き、雲と人が早送り
  CELLS[14] = shot(camCell((k, w, h, p, u) => {
    const a = lerp(-1.25, 1.25, p);
    const clouds = [[-20 + mod(p * 140 + 0, 80) - 10, 18, 90, 2.2], [-50 + mod(p * 140 + 40, 80), 24, 120, 3], [-10 + mod(p * 140 + 20, 80) - 30, 13, 70, 1.6]];
    const ex = [];
    for (let i = 0; i < 7; i++) { const ph = mod(p * 6 + i / 7, 1), dir = i % 2 ? 1 : -1; ex.push([dir * lerp(-9, 9, ph), 0, 10 + i * 1.3, (kk) => { kk.fillStyle = i % 3 ? C.g4 : C.blueM; kk.fillRect(-0.12, 0, 0.24, 0.9); kk.beginPath(); kk.arc(0, 1.05, 0.13, 0, 7); kk.fill(); }]); }
    world(k, w, h, cam({ y: 1.6, pitch: 0.08 }), {
      sun: [Math.sin(a) * 120, Math.cos(a) * 60 - 8, 170], sunCol: C.blueM, clouds, extra: ex,
      after: (kk, cc) => {   // 建物の影
        kk.fillStyle = 'rgba(160,160,165,.22)';
        BLD.slice(0, 6).forEach(([x, bw, bh]) => { const L = bh * 0.9; const q1 = proj(cc, x - bw / 2, 0, 48), q2 = proj(cc, x + bw / 2, 0, 48), q3 = proj(cc, x + bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1), q4 = proj(cc, x - bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1); kk.beginPath(); kk.moveTo(q1.x, q1.y); kk.lineTo(q2.x, q2.y); kk.lineTo(q3.x, q3.y); kk.lineTo(q4.x, q4.y); kk.fill(); });
      }
    });
  }, p => { const m = Math.round(lerp(6 * 60, 18 * 60, p) / 10) * 10; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }, 0.4, 4.1));

  // @element 16
  // 16 フリーズフレーム
  CELLS[15] = shot((k, w, h, u) => {
    // 跳躍の頂点で 1.4 秒止める
    const tj = u < 1.6 ? u : u < 3.0 ? 1.6 : u - 1.4;   // 実時間→映像時間
    const q = P(tj, 0.6, 2.6);
    const frozen = u >= 1.6 && u < 3.0;
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(tj, 1.5) });
    if (frozen) {
      const a = Math.min(1, (u - 1.6) / 0.12, (3.0 - u) / 0.12);
      k.save(); k.globalAlpha = a; k.strokeStyle = C.blue; k.lineWidth = 5; k.strokeRect(2.5, 2.5, w - 5, h - 5);
      k.fillStyle = 'rgba(255,255,255,.88)'; rr(k, w / 2 - 34, h - 58, 68, 40, 8); k.fill();
      k.fillStyle = C.blue; k.fillRect(w / 2 - 12, h - 49, 8, 22); k.fillRect(w / 2 + 4, h - 49, 8, 22); k.restore();
    }
    return frozen ? 'FREEZE' : '';
  });

  // @shared
  // ---- 切り替え: 奇数サイクルは B→A に戻る（リセット不要）
  const sceneA = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.4 }, extra.cam)), Object.assign({ person: { x: -0.6, z: 7 } }, extra));
  const CAR = [1.2, 0, 9, (kk) => { kk.fillStyle = C.blue; rr(kk, -1.9, 0.35, 3.8, 0.75, 0.25); kk.fill(); rr(kk, -1.1, 0.95, 2.1, 0.62, 0.28); kk.fill(); kk.fillStyle = '#fff'; kk.fillRect(-0.85, 1.08, 0.8, 0.36); kk.fillRect(0.12, 1.08, 0.7, 0.36); kk.fillStyle = C.ink; [-1.15, 1.15].forEach(x => { kk.beginPath(); kk.arc(x, 0.34, 0.34, 0, 7); kk.fill(); }); }];
  const SB = { city: true, mountains: false, trees: false, sun: [-26, 40, 150], extra: [CAR] };
  const sceneB = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.6, pitch: 0.1 }, extra.cam)), Object.assign({}, SB, extra));
  function abCell(trans, hudFn) {
    return (k, w, h, u, cyc) => {
      const S = cyc % 2 === 0 ? [sceneA, sceneB] : [sceneB, sceneA];
      trans(k, w, h, u, S[0], S[1], cyc);
      return hudFn ? hudFn(u, cyc) : (cyc % 2 === 0 ? 'A → B' : 'B → A');
    };
  }

  // @element 17
  // 17 ジャンプカット（同じ画角で人物の位置と時刻だけ飛ぶ）
  CELLS[16] = shot((k, w, h, u) => {
    const shots = [[-2.2, 0], [1.4, 1], [-0.4, 0], [2.4, 1], [0.6, 0]];
    const times = ['10:02', '10:17', '10:41', '11:06', '11:30'];
    const i = Math.min(4, Math.floor(u / (CYC / 5)));
    const [x, arm] = shots[i];
    world(k, w, h, cam({ y: 1.4 }), { person: { x, z: 7, armUp: !!arm } });
    return times[i];
  });

  // @element 18
  // 18 マッチカット（投げたボール → 同じ位置・大きさの太陽）
  CELLS[17] = shot((k, w, h, u) => {
    const cut = 2.3;
    const BX = 120, BY = -46, BR = 17;
    if (u < cut) {
      const q = eOut(P(u, 0.5, cut));
      world(k, w, h, cam({ y: 1.4 }), {
        person: { x: -1.2, z: 7, armUp: q > 0.05 }, sun: null,
        after: (kk, cc) => { const s = proj(cc, -1.2, 2.3, 7); const x = lerp(s.x, BX, q), y = lerp(s.y, BY, q) - Math.sin(q * Math.PI) * 30, r = lerp(5, BR, q); kk.fillStyle = C.blue; kk.beginPath(); kk.arc(x, y, r, 0, 7); kk.fill(); }
      });
    } else {
      const q = P(u, cut, CYC);
      world(k, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: null, trees: true,
        after: (kk) => { kk.fillStyle = C.blue; kk.beginPath(); kk.arc(BX, BY + q * 14, BR, 0, 7); kk.fill(); }
      });
    }
    // 形がそろっていることを示す点線の円
    const g = Math.max(0, 1 - Math.abs(u - cut) / 0.7);
    if (g > 0) { k.save(); k.translate(w / 2, h / 2); k.globalAlpha = g; k.strokeStyle = C.blue; k.lineWidth = 2; k.setLineDash([5, 4]); k.beginPath(); k.arc(BX, BY + (u > cut ? P(u, cut, CYC) * 14 : 0), BR + 9, 0, 7); k.stroke(); k.restore(); }
    return u < cut ? 'SHOT 1' : 'SHOT 2';
  });

  // @element 19
  // 19 ホイップパン（ブレで次の場面へ）
  CELLS[18] = shot(abCell((k, w, h, u, A, B) => {
    const t0 = 1.7, t1 = 2.5;
    const at = (kk, s) => {   // s: 0..1 の進み。前半 A を右へ振り、後半 B が左から止まる
      if (s < .5) world(kk, w, h, cam({ y: 1.4, yaw: eIOs(s * 2) * 0.45 }), A === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
      else world(kk, w, h, cam({ y: 1.4, yaw: -(1 - eIOs((s - .5) * 2)) * 0.45 }), B === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
    };
    if (u < t0) return A(k, w, h);
    if (u > t1) return B(k, w, h);
    const s = P(u, t0, t1), ds = 1 / FPS / (t1 - t0);
    mblur(k, at, clamp(s - ds * 1.6), clamp(s + ds * 1.6), 9);
  }));

  // @element 20
  // 20 クロスディゾルブ
  CELLS[19] = shot(abCell((k, w, h, u, A, B) => blend(k, kk => A(kk, w, h), kk => B(kk, w, h), eIOs(P(u, 1.5, 3.0)))));

  // @element 21
  // 21 ワイプ
  CELLS[20] = shot(abCell((k, w, h, u, A, B) => {
    const p = eIO(P(u, 1.7, 2.8)), ex = p * (w + 8) - 4;
    A(k, w, h);
    if (p > 0) { k.save(); k.beginPath(); k.rect(0, 0, ex, h); k.clip(); k.fillStyle = '#fff'; k.fillRect(0, 0, w, h); B(k, w, h); k.restore(); }
    if (p > 0 && p < 1) { k.fillStyle = C.blue; k.fillRect(ex - 2, 0, 4, h); }
  }));

  // @element 22
  // 22 スマッシュカット（静かな場面 → 急に激しい場面）
  function meter(k, w, h, lv) {   // 音量メーター（左下）
    const x = 24, y = h - 22, n = 8;
    for (let i = 0; i < n; i++) { k.fillStyle = (i + 0.5) / n < lv ? C.blue : C.g2; k.fillRect(x + i * 9, y - 6 - i * 2.2, 6, 6 + i * 2.2); }
  }
  CELLS[21] = shot((k, w, h, u) => {
    const cut = 2.4, r = P(u, CYC - RESET, CYC);
    const quiet = (kk, uu) => {
      world(kk, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: [24, 26, 170], sunCol: C.blueXL, extra: [[0.4, 0, 7, (k2) => { k2.fillStyle = C.blue; rr(k2, -0.8, 0, 1.6, 0.34, 0.15); k2.fill(); k2.beginPath(); k2.arc(-0.95, 0.24, 0.17, 0, 7); k2.fill(); }]],
        after: (k2, cc) => { const p0 = proj(cc, -0.6, 1.0, 7); for (let i = 0; i < 3; i++) { const ph = mod(uu * 0.35 + i / 3, 1); k2.globalAlpha = Math.sin(ph * Math.PI) * 0.8; txt(k2, 'z', p0.x - 10 - ph * 20 - i * 4, p0.y - ph * 50, `600 ${16 + i * 4}px ${EN}`, C.sub, 'center', 'middle'); } k2.globalAlpha = 1; }
      });
      meter(kk, w, h, 0.08 + 0.04 * Math.sin(uu * 5));
    };
    const loud = (kk, uu) => {
      const T = uu * 40;
      const c = cam({ y: 1.25, f: F0 * 2.6, roll: -0.12 + Math.sin(T) * 0.03, yaw: Math.sin(T * 1.3) * 0.006 });
      world(kk, w, h, c, {
        buildings: false, trees: false, mountains: false, grid: true, sun: null,
        person: { x: 0, z: 7, armUp: true, walk: 0.6 },
        after: (k2) => { k2.strokeStyle = C.blue; k2.lineWidth = 3.5; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.1; const r0 = 92 + (i % 3) * 14; k2.beginPath(); k2.moveTo(Math.cos(a) * r0 * 1.7, Math.sin(a) * r0); k2.lineTo(Math.cos(a) * 500, Math.sin(a) * 300); k2.stroke(); } }
      });
      meter(kk, w, h, 0.85 + 0.15 * Math.sin(uu * 31));
    };
    if (u < cut) quiet(k, u);
    else blend(k, kk => loud(kk, u), kk => quiet(kk, 0), eIOs(r));
    return u < cut || r > .5 ? '♪ 静か' : '♪ 大音量';
  });

  // @shared
  // 23/24 J・L カット: 上が映像、下に映像と音のタイムライン
  function splitCell(lead) {   // lead>0: 音が先（J） / lead<0: 音が後（L）
    return (k, w, h, u, cyc) => {
      const vh = 134;
      const p = clamp((u - 0.4) / 3.6);       // 再生ヘッド
      const r = P(u, CYC - RESET, CYC);
      const X0 = 70, X1 = w - 22, cutV = 0.55, cutA = cutV - lead;
      const draw = (kk, p) => {
        // 映像
        kk.save(); kk.beginPath(); kk.rect(0, 0, w, vh); kk.clip();
        (p < cutV ? sceneA : sceneB)(kk, w, vh, { cam: { pitch: p < cutV ? -0.13 : -0.06 } });
        // 今流れている音
        const aB = p >= cutA, lab = aB ? '♪ Bの音' : '♪ Aの音', f = `700 15px ${JP}`;
        const bw = tw(kk, lab, f) + 22;
        kk.fillStyle = aB ? C.blue : '#8E8E93'; rr(kk, w - 42 - bw, vh - 40, bw, 26, 13); kk.fill();
        txt(kk, lab, w - 42 - bw / 2, vh - 26.5, f, '#fff', 'center', 'middle');
        const sl = p < cutV ? 'A' : 'B';
        kk.fillStyle = 'rgba(255,255,255,.9)'; rr(kk, 42, vh - 40, 70, 26, 13); kk.fill();
        txt(kk, '映像' + sl, 77, vh - 26.5, `700 15px ${JP}`, C.ink, 'center', 'middle');
        kk.restore();
        kk.strokeStyle = C.border; kk.lineWidth = 1.5; kk.beginPath(); kk.moveTo(0, vh + .5); kk.lineTo(w, vh + .5); kk.stroke();
        // タイムライン
        const tracks = [['映像', vh + 14, cutV], ['音', vh + 44, cutA]];
        const xAt = q => lerp(X0, X1, q);
        tracks.forEach(([name, y, cut]) => {
          txt(kk, name, 18, y + 11, `600 15px ${JP}`, C.sub, 'left', 'middle');
          kk.fillStyle = C.g2; rr(kk, X0, y, xAt(cut) - X0 - 2, 22, 5); kk.fill();
          kk.fillStyle = C.blueL; rr(kk, xAt(cut) + 2, y, X1 - xAt(cut) - 2, 22, 5); kk.fill();
          txt(kk, 'A', X0 + 10, y + 11.5, `700 14px ${EN}`, C.g4, 'left', 'middle');
          txt(kk, 'B', xAt(cut) + 12, y + 11.5, `700 14px ${EN}`, C.blue, 'left', 'middle');
          if (name === '音') {   // 波形
            kk.strokeStyle = 'rgba(255,255,255,.95)'; kk.lineWidth = 1.6; kk.beginPath();
            for (let x = X0 + 26; x < X1 - 6; x += 5) { if (x < X0 + 24 || (x > xAt(cut) - 4 && x < xAt(cut) + 26)) continue; const a = 3 + 5 * Math.abs(Math.sin(x * 0.37) * Math.cos(x * 0.11)); kk.moveTo(x, y + 11 - a); kk.lineTo(x, y + 11 + a); }
            kk.stroke();
          }
        });
        // ずれている区間を強調
        const a1 = xAt(Math.min(cutA, cutV)), a2 = xAt(Math.max(cutA, cutV));
        kk.fillStyle = 'rgba(47,107,235,.12)'; kk.fillRect(a1, vh + 8, a2 - a1, 64);
        kk.strokeStyle = C.blue; kk.lineWidth = 1.5; kk.setLineDash([4, 3]); kk.beginPath(); kk.moveTo(a1, vh + 8); kk.lineTo(a1, vh + 72); kk.moveTo(a2, vh + 8); kk.lineTo(a2, vh + 72); kk.stroke(); kk.setLineDash([]);
        // 再生ヘッド
        const hx = xAt(p); kk.fillStyle = C.ink; kk.fillRect(hx - 1.5, vh + 6, 3, 68); kk.beginPath(); kk.moveTo(hx - 6, vh + 4); kk.lineTo(hx + 6, vh + 4); kk.lineTo(hx, vh + 11); kk.fill();
      };
      blend(k, kk => draw(kk, p), kk => draw(kk, 0), eIOs(r));
      return null;
    };
  }

  // @element 23
  // 23 Jカット: 音が先に次の場面（B）へ切り替わり、映像が後から追う
  CELLS[22] = shot(splitCell(0.2), 134);

  // @element 24
  // 24 Lカット: 映像が先に次の場面（B）へ切り替わり、前の場面（A）の音が残る
  CELLS[23] = shot(splitCell(-0.2), 134);

  // @end
  return { width: CW, height: CH, cycle: CYC * 2, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "ui" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('ui', function () {
  // @kit
  // UIパーツの名前 24（カード 542x191 = 元動画のカード窓 542x222 から窓の上枠 31px を除いた中身）。
  // 各コマは時間 u の純関数。1周期 CYC=4.5秒。カーソル（指）の動きがきっかけで部品が動く。
  const CW = 542, CH = 191, CYC = 4.5;

  // パックの色（地・文字・差し色）
  const C = {
    bg: '#f5f3f1', card: '#ffffff', border: '#dcdbdb', dot: '#dddddd', url: '#eeeeeb', sep: '#ecebe9',
    line: '#e6e4e3', line2: '#d6d4d2', block: '#f0efed', ink: '#111111', en: '#7b7975', hint: '#868482',
    blue: '#1f5ae8', lb: '#eef3fe', mb: '#cad9f9', sb: '#a3bef7', scroll: '#c9c7c5', dark: '#26282c'
  };
  const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
  const NUMF = 'system-ui,-apple-system,"Helvetica Neue",sans-serif';

  // 描画の補助関数は元のまま X（2D コンテキスト）に描く。ui() が毎回 X を渡された k に向け、白地を敷いてから描く
  let X = null;
  const ui = draw => (k, w, h, u) => { X = k; k.fillStyle = C.card; k.fillRect(0, 0, w, h); draw(w, h, u); };

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, k) => a + (b - a) * k;
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); X.fillStyle = c; X.fill(); }
  function strokeRR(x, y, w, h, r, c, lw = 1.5) { rr(x, y, w, h, r); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function bar(x, y, w, c = C.line, h = 9) { fillRR(x, y, w, h, h / 2, c); }
  function text(s, x, y, size, color, weight = 500, align = 'left', font = JP) { X.font = `${weight} ${size}px ${font}`; X.fillStyle = color; X.textAlign = align; X.textBaseline = 'middle'; X.fillText(s, x, y); }
  function tw(s, size, weight = 500, font = JP) { X.font = `${weight} ${size}px ${font}`; return X.measureText(s).width; }
  function circle(x, y, r, c) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.fillStyle = c; X.fill(); }
  function ring(x, y, r, c, lw = 2) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function shadowed(fn, blur = 18, oy = 6, a = .14) { X.save(); X.shadowColor = `rgba(20,24,40,${a})`; X.shadowBlur = blur; X.shadowOffsetY = oy; fn(); X.restore(); }
  function chevron(x, y, s, rot, c, lw = 2.2) { X.save(); X.translate(x, y); X.rotate(rot); X.beginPath(); X.moveTo(-s, -s / 2); X.lineTo(0, s / 2); X.lineTo(s, -s / 2); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); X.restore(); }
  function check(x, y, s, c, lw = 2.6) { X.beginPath(); X.moveTo(x - s, y); X.lineTo(x - s * .3, y + s * .7); X.lineTo(x + s, y - s * .7); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); }
  function mountains(x, y, w, h, tint = 0) {
    X.save(); rr(x, y, w, h, 8); X.clip();
    X.fillStyle = tint ? '#e3ebfd' : C.lb; X.fillRect(x, y, w, h);
    X.fillStyle = C.mb; X.beginPath(); X.moveTo(x, y + h); X.lineTo(x + w * .28, y + h * .42); X.lineTo(x + w * .5, y + h * .72); X.lineTo(x + w * .72, y + h * .35); X.lineTo(x + w, y + h * .8); X.lineTo(x + w, y + h); X.fill();
    X.fillStyle = C.sb; X.beginPath(); X.moveTo(x + w * .3, y + h); X.lineTo(x + w * .55, y + h * .62); X.lineTo(x + w * .8, y + h); X.fill();
    circle(x + w * .82, y + h * .26, Math.min(w, h) * .09, C.mb);
    X.restore();
  }
  // カーソル（矢印）。keys=[[t,x,y],...]、clicks=[t,...]
  function track(keys, t) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t <= b[0]) { const k = eio((t - a[0]) / (b[0] - a[0] || 1)); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; } }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function ripple(x, y, clicks, t) {
    for (const c of clicks) { const k = (t - c) / .45; if (k >= 0 && k <= 1) { ring(x, y, 7 + 22 * eo(k), `rgba(31,90,232,${.75 * (1 - k)})`, 3); } }
  }
  function pointer(keys, clicks, t) {
    const [x, y] = track(keys, t);
    ripple(x, y, clicks, t);
    const pressed = clicks.some(c => t >= c - .07 && t < c + .1);
    X.save(); X.translate(x, y); const s = pressed ? 1.0 : 1.18; X.scale(s, s);
    X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 22); X.lineTo(5.5, 17); X.lineTo(9.5, 26); X.lineTo(13, 24.5); X.lineTo(9, 15.8); X.lineTo(16, 15.8); X.closePath();
    X.lineJoin = 'round'; X.strokeStyle = '#fff'; X.lineWidth = 3; X.stroke(); X.fillStyle = '#111'; X.fill();
    X.restore();
  }
  function finger(keys, downs, t, visible) {
    if (!visible) return; const [x, y] = track(keys, t);
    ripple(x, y, downs, t);
    circle(x, y, 17, 'rgba(17,17,17,.24)'); ring(x, y, 17, 'rgba(255,255,255,.95)', 2.5);
  }
  // よく使う背景のワイヤーフレーム
  function pageLines(x, y, w) { bar(x, y, w * .45, C.line2, 11); bar(x, y + 24, w, C.line); bar(x, y + 42, w * .78, C.line); }
  const CELLS = [];

  // @element 01
  // 01 モーダル（Modal dialog）
  CELLS[0] = ui((w, h, t) => {
    pageLines(24, 18, 494);
    fillRR(24, 92, 120, 36, 8, C.blue); text('開く', 84, 110, 16, '#fff', 600, 'center');
    fillRR(170, 92, 348, 36, 8, C.block); fillRR(24, 142, 494, 38, 8, C.block);
    const a = eo(seg(t, 1.0, 1.32)) * (1 - eio(seg(t, 3.3, 3.58)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.42 * a})`; X.fillRect(0, 0, w, h);
      X.save(); X.globalAlpha = a; X.translate(271, 97); const s = .9 + .1 * a; X.scale(s, s);
      shadowed(() => fillRR(-140, -70, 280, 140, 12, '#fff'), 24, 8, .25);
      bar(-116, -48, 120, C.ink, 11); bar(-116, -20, 232); bar(-116, -2, 180);
      fillRR(28, 26, 88, 30, 7, C.blue);
      X.strokeStyle = '#9a9896'; X.lineWidth = 2.2; X.lineCap = 'round'; X.beginPath(); X.moveTo(110, -54); X.lineTo(120, -44); X.moveTo(120, -54); X.lineTo(110, -44); X.stroke();
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 86, 114], [1.5, 86, 114], [3.0, 389, 50], [3.5, 389, 50], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 02
  // 02 ドロワー（Drawer (Off-canvas)）
  CELLS[1] = ui((w, h, t) => {
    strokeRR(24, 14, 110, 34, 8, C.line2, 1.5); text('メニュー', 79, 31, 15, '#555', 600, 'center');
    bar(160, 26, 140, C.line2, 11); pageLines(24, 70, 494); fillRR(24, 138, 494, 42, 8, C.block);
    const a = eo(seg(t, 1.0, 1.38)) * (1 - eio(seg(t, 3.3, 3.65)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const pw = 210, px = -pw + pw * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(px, 0, pw, h); }, 22, 0, .25);
      circle(px + 34, 32, 14, C.mb); bar(px + 58, 27, 100, C.line2, 10);
      for (let i = 0; i < 4; i++) { const y = 62 + i * 32; if (i === 0) fillRR(px + 12, y - 2, pw - 24, 28, 6, C.lb); fillRR(px + 22, y + 5, 14, 14, 3, i === 0 ? C.blue : C.line2); bar(px + 46, y + 7, 90 + (i % 2) * 30, i === 0 ? C.sb : C.line); }
    }
    pointer([[.3, w + 30, h + 30], [.95, 70, 34], [1.6, 70, 34], [3.0, 420, 120], [3.6, 420, 120], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 03
  // 03 ボトムシート（Bottom sheet）
  CELLS[2] = ui((w, h, t) => {
    pageLines(24, 16, 494); fillRR(24, 76, 239, 54, 8, C.block); fillRR(279, 76, 239, 54, 8, C.block);
    fillRR(186, 144, 170, 36, 18, C.blue); text('詳細を見る', 271, 162, 15, '#fff', 600, 'center');
    const open = eo(seg(t, 1.05, 1.45));
    const drag = eio(seg(t, 3.0, 3.6));
    const a = open * (1 - drag);
    if (open > 0 && a > 0.001) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const sh = 136, sy = h - sh * a;
      shadowed(() => { rr(0, sy, w, sh + 20, 18); X.fillStyle = '#fff'; X.fill(); }, 22, -4, .2);
      fillRR(w / 2 - 26, sy + 10, 52, 6, 3, C.line2);
      bar(28, sy + 30, 160, C.ink, 11);
      for (let i = 0; i < 2; i++) { const y = sy + 56 + i * 36; fillRR(28, y, 26, 26, 6, i ? C.mb : C.blue); bar(66, y + 4, 220, C.line); bar(66, y + 17, 140, C.line, 7); }
    }
    const sy = h - 136 * a;
    finger([[.3, 271, 162], [1.6, 271, 162], [2.75, w / 2, h - 136 + 13], [3.0, w / 2, h - 136 + 13], [3.6, w / 2, h + 10]], [1.0, 3.0], t, (t > .6 && t < 1.6) || (t > 2.75 && t < 3.6));
  });

  // @element 04
  // 04 アコーディオン（Accordion）
  CELLS[3] = ui((w, h, t) => {
    const ex = eio(seg(t, 1.0, 1.35)) * (1 - eio(seg(t, 3.3, 3.62)));
    let y = 12; const H0 = 34, EX = 58;
    for (let i = 0; i < 3; i++) {
      const extra = i === 0 ? EX * ex : 0;
      strokeRR(24, y, 494, H0 + extra, 8, i === 0 && ex > .05 ? C.sb : C.line2, 1.5);
      bar(42, y + 12, [180, 220, 150][i], i === 0 && ex > .05 ? C.blue : C.line2, 10);
      chevron(494, y + 17, 6, i === 0 ? Math.PI * ex : 0, i === 0 && ex > .05 ? C.blue : '#9a9896');
      if (i === 0 && ex > 0) { X.save(); rr(24, y, 494, H0 + extra, 8); X.clip(); X.globalAlpha = ex; bar(42, y + H0 + 6, 420); bar(42, y + H0 + 24, 320); X.restore(); }
      y += H0 + extra + 6;
    }
    pointer([[.3, w + 30, h + 30], [.95, 300, 31], [1.6, 300, 31], [3.0, 300, 31], [3.55, 300, 31], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 05
  // 05 ドロップダウン（Dropdown menu）
  CELLS[4] = ui((w, h, t) => {
    bar(24, 14, 90, C.line2, 10);
    const open = eo(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.3, 2.45)));
    const chosen = seg(t, 2.32, 2.42) * (1 - seg(t, 3.9, 4.08));
    const ph = (1 - seg(t, 2.2, 2.3)) + seg(t, 4.1, 4.3); // プレースホルダーは先に消し、名前が消えてから戻す（重ねない）
    strokeRR(24, 34, 260, 38, 8, open > .1 || (chosen > 0 && t < 2.9) ? C.blue : C.line2, open > .1 ? 2 : 1.5);
    if (ph > 0) { X.globalAlpha = clamp(ph); text('選択してください', 40, 53, 15, '#9a9896', 500); X.globalAlpha = 1; }
    if (chosen > 0) { X.globalAlpha = chosen; text('名古屋', 40, 53, 16, C.ink, 600); X.globalAlpha = 1; }
    chevron(262, 52, 5, Math.PI * open, '#777');
    fillRR(310, 34, 208, 70, 8, C.block); bar(310, 120, 208); bar(310, 138, 160); bar(24, 150, 200); bar(24, 168, 150);
    if (open > 0) {
      X.save(); X.globalAlpha = open; const oy = 78 - 6 * (1 - open);
      shadowed(() => fillRR(24, oy, 260, 112, 8, '#fff'), 18, 6, .18); strokeRR(24, oy, 260, 112, 8, C.border, 1);
      const hi = seg(t, 1.55, 1.75) > 0 ? (t < 1.95 ? 1 : 2) : -1;
      ['東京', '大阪', '名古屋', '福岡'].forEach((s, i) => { const yy = oy + 4 + i * 26; if (i === hi + (hi === 1 ? 0 : 0) && hi >= 0) fillRR(28, yy, 252, 26, 5, C.lb); text(s, 40, yy + 13, 15, i === hi ? C.blue : '#444', i === hi ? 600 : 500); });
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 200, 56], [1.25, 200, 56], [1.6, 170, 121], [2.0, 170, 147], [2.45, 170, 147], [3.2, 170, 147], [4.2, w + 30, h + 30]], [1.0, 2.3], t);
  });

  // @element 06
  // 06 ツールチップ（Tooltip）
  CELLS[5] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    bar(24, 116, 150, C.line2, 11); ring(196, 121, 13, C.blue, 2.2); text('?', 196, 122, 16, C.blue, 700, 'center', NUMF);
    fillRR(24, 146, 494, 34, 8, C.block);
    const a = eo(seg(t, 1.15, 1.35)) * (1 - seg(t, 3.25, 3.45));
    if (a > 0) {
      X.save(); X.globalAlpha = a; const yy = 64 + 6 * (1 - a);
      fillRR(196 - 92, yy, 184, 36, 8, C.dark);
      X.beginPath(); X.moveTo(196 - 8, yy + 36); X.lineTo(196, yy + 44); X.lineTo(196 + 8, yy + 36); X.fillStyle = C.dark; X.fill();
      text('小さな説明が出る', 196, yy + 18, 15, '#fff', 600, 'center'); X.restore();
    }
    // 乗せるだけ（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.05, 200, 126], [3.15, 200, 126], [4.1, w + 30, h + 30]], [], t);
  });

  // @element 07
  // 07 ポップオーバー（Popover）
  CELLS[6] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    strokeRR(24, 112, 108, 36, 8, C.blue, 2); text('詳細', 78, 130, 15, C.blue, 600, 'center');
    fillRR(24, 160, 494, 22, 6, C.block);
    const a = eo(seg(t, 1.0, 1.28)) * (1 - eio(seg(t, 3.3, 3.5)));
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.translate(6 * (1 - a), 0);
      const px = 156, py = 62, pw = 300, ph = 120;
      shadowed(() => { fillRR(px, py, pw, ph, 10, '#fff'); }, 22, 6, .2); strokeRR(px, py, pw, ph, 10, C.border, 1);
      X.beginPath(); X.moveTo(px + 1, 122); X.lineTo(px - 10, 130); X.lineTo(px + 1, 138); X.fillStyle = '#fff'; X.fill();
      X.beginPath(); X.moveTo(px, 122); X.lineTo(px - 10, 130); X.lineTo(px, 138); X.strokeStyle = C.border; X.lineWidth = 1; X.stroke();
      bar(px + 18, py + 18, 130, C.ink, 11); bar(px + 18, py + 42, 250); bar(px + 18, py + 60, 200);
      strokeRR(px + 130, py + 82, 70, 26, 6, C.line2, 1.5); fillRR(px + 210, py + 82, 72, 26, 6, C.blue); text('OK', px + 246, py + 95, 14, '#fff', 700, 'center', NUMF);
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 84, 134], [1.6, 84, 134], [3.0, 402, 157], [3.5, 402, 157], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 08
  // 08 トースト（Toast notification）
  CELLS[7] = ui((w, h, t) => {
    bar(24, 16, 90, C.line2, 10); strokeRR(24, 34, 300, 34, 7, C.line2, 1.5); bar(24, 82, 90, C.line2, 10); strokeRR(24, 100, 300, 34, 7, C.line2, 1.5);
    fillRR(24, 146, 110, 36, 8, C.blue); text('保存', 79, 164, 16, '#fff', 600, 'center');
    const tin = eo(seg(t, 1.05, 1.4)), tout = eio(seg(t, 3.2, 3.55));
    if (tin > 0 && tout < 1) {
      const tw0 = 214, th = 52, tx = w - 18 - tw0 + (1 - tin) * 240 + tout * 240, ty = h - 16 - th;
      shadowed(() => fillRR(tx, ty, tw0, th, 10, C.dark), 18, 6, .25);
      circle(tx + 26, ty + 24, 11, C.blue); check(tx + 26, ty + 24, 5, '#fff', 2.4);
      text('保存しました', tx + 46, ty + 24, 15, '#fff', 600);
      const life = 1 - seg(t, 1.4, 3.2); fillRR(tx + 10, ty + th - 7, (tw0 - 20) * life, 3, 1.5, C.sb);
    }
    pointer([[.3, -30, h + 30], [.95, 84, 168], [1.5, 84, 168], [2.2, -40, h + 40]], [1.0], t);
  });

  // @element 09
  // 09 タブ（Tabs）
  CELLS[8] = ui((w, h, t) => {
    const labs = ['概要', '料金', 'レビュー'], xs = [24, 114, 204], ws = [70, 70, 100];
    const c1 = eio(seg(t, 1.0, 1.25)), c2 = eio(seg(t, 2.2, 2.45)), c3 = eio(seg(t, 3.4, 3.65));
    const pos = c1 + c2 - 2 * c3; // 0 -> 1 -> 2 -> 0
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    const ux = lerp(xs[fi], xs[gi], fr), uw = lerp(ws[fi], ws[gi], fr);
    const act = t < 1.1 ? 0 : t < 2.3 ? 1 : t < 3.5 ? 2 : 0;
    labs.forEach((s, i) => text(s, xs[i] + ws[i] / 2, 28, 17, i === act ? C.blue : '#8a8886', i === act ? 700 : 500, 'center'));
    X.fillStyle = C.line; X.fillRect(0, 50, w, 2); fillRR(ux, 48, uw, 4, 2, C.blue);
    // 中身（切替時にクロスフェード）
    const tabAlpha = [
      1 - seg(t, 1.0, 1.2) + seg(t, 3.45, 3.65),
      seg(t, 1.1, 1.3) - seg(t, 2.2, 2.4),
      seg(t, 2.3, 2.5) - seg(t, 3.4, 3.6)];
    tabAlpha.forEach((a, i) => {
      a = clamp(a); if (a <= 0) return; X.save(); X.globalAlpha = a; X.translate(0, 8 * (1 - a));
      if (i === 0) { bar(24, 70, 220, C.line2, 11); bar(24, 94, 494); bar(24, 112, 400); fillRR(24, 134, 494, 46, 8, C.block); }
      if (i === 1) { for (let k = 0; k < 3; k++) { const x = 24 + k * 168; fillRR(x, 68, 158, 112, 10, k === 1 ? C.lb : '#f6f5f3'); strokeRR(x, 68, 158, 112, 10, k === 1 ? C.sb : C.line, 1.5); bar(x + 16, 84, 60, k === 1 ? C.blue : C.line2, 10); text(['¥0', '¥980', '¥1,980'][k], x + 16, 118, 22, k === 1 ? C.blue : '#555', 700, 'left', NUMF); bar(x + 16, 148, 110); } }
      if (i === 2) { for (let k = 0; k < 3; k++) { const y = 70 + k * 38; circle(40, y + 14, 14, k === 0 ? C.mb : C.line); bar(64, y + 4, 120, C.line2, 10); bar(64, y + 20, 360); } }
      X.restore();
    });
    pointer([[.3, w + 30, h + 30], [.95, 152, 34], [1.6, 152, 34], [2.15, 256, 34], [2.8, 256, 34], [3.35, 62, 34], [3.7, 62, 34], [4.25, w + 30, h + 30]], [1.0, 2.2, 3.4], t);
  });

  // @element 10
  // 10 カルーセル（Carousel）
  CELLS[9] = ui((w, h, t) => {
    const p = eio(seg(t, 1.0, 1.4)) + eio(seg(t, 2.1, 2.5)) + eio(seg(t, 3.2, 3.6));
    const sw = 330, gap = 18, cx = w / 2;
    X.save(); X.beginPath(); X.rect(0, 0, w, 160); X.clip();
    for (let j = Math.floor(p) - 2; j <= Math.floor(p) + 2; j++) {
      const x = cx - sw / 2 + (j - p) * (sw + gap), idx = ((j % 3) + 3) % 3;
      if (idx === 0) mountains(x, 14, sw, 138);
      if (idx === 1) { fillRR(x, 14, sw, 138, 8, '#e3ebfd'); circle(x + 90, 83, 34, C.mb); circle(x + 165, 83, 34, C.sb); circle(x + 240, 83, 34, C.mb); }
      if (idx === 2) { fillRR(x, 14, sw, 138, 8, C.lb); for (let k = 0; k < 5; k++) { const bh = [40, 70, 55, 95, 80][k]; fillRR(x + 60 + k * 46, 132 - bh, 30, bh, 4, k === 3 ? C.blue : C.mb); } }
    }
    X.restore();
    [[30, 83, Math.PI / 2], [w - 30, 83, -Math.PI / 2]].forEach(([x, y, r]) => { shadowed(() => circle(x, y, 18, '#fff'), 10, 3, .2); chevron(x, y, 5, r, '#555'); });
    const act = Math.round(p) % 3;
    for (let k = 0; k < 3; k++) { const on = k === act; fillRR(w / 2 - 30 + k * 22 - (on ? 4 : 0), 172, on ? 16 : 8, 8, 4, on ? C.blue : C.line2); }
    pointer([[.3, w + 30, h + 30], [.95, w - 28, 88], [3.4, w - 28, 88], [4.2, w + 30, h + 30]], [1.0, 2.1, 3.2], t);
  });

  // @element 11
  // 11 トグルスイッチ（Toggle switch）
  CELLS[10] = ui((w, h, t) => {
    const st = [eo(seg(t, 1.0, 1.2)) * (1 - eo(seg(t, 3.0, 3.2))), eo(seg(t, 1.8, 2.0)) * (1 - eo(seg(t, 3.6, 3.8))), 0];
    for (let i = 0; i < 3; i++) {
      const y = 14 + i * 60; bar(24, y + 10, [170, 140, 190][i], C.line2, 11); bar(24, y + 30, [260, 220, 240][i], C.line, 8);
      if (i < 2) { X.fillStyle = C.line; X.fillRect(24, y + 52, 494, 1.5); }
      const k = st[i], tx = 450, ty = y + 10;
      fillRR(tx, ty, 64, 34, 17, k > .5 ? C.blue : '#d9d7d5'); if (k > 0 && k < 1) { X.globalAlpha = k; fillRR(tx, ty, 64, 34, 17, C.blue); X.globalAlpha = 1; }
      shadowed(() => circle(tx + 17 + 30 * k, ty + 17, 13, '#fff'), 4, 1, .25);
    }
    pointer([[.3, w + 30, h + 30], [.95, 486, 30], [1.35, 486, 30], [1.75, 486, 90], [2.5, 486, 90], [2.95, 486, 30], [3.25, 486, 30], [3.55, 486, 90], [3.85, 486, 90], [4.3, w + 30, h + 30]], [1.0, 1.8, 3.0, 3.6], t);
  });

  // @element 12
  // 12 セグメントコントロール（Segmented control）
  CELLS[11] = ui((w, h, t) => {
    const pos = eio(seg(t, 1.0, 1.25)) + eio(seg(t, 2.1, 2.35)) - 2 * eio(seg(t, 3.3, 3.55));
    const sx = 121, sy = 12, sw = 300, sh = 40, cw = sw / 3;
    fillRR(sx, sy, sw, sh, 10, '#efedeb');
    shadowed(() => fillRR(sx + 4 + pos * cw, sy + 4, cw - 8, sh - 8, 8, C.blue), 6, 2, .2);
    ['日', '週', '月'].forEach((s, i) => { const near = 1 - clamp(Math.abs(pos - i)); text(s, sx + cw * i + cw / 2, sy + sh / 2 + 1, 17, near > .5 ? '#fff' : '#6d6b69', 700, 'center'); });
    const sets = [[30, 55, 40, 70, 50, 85, 60], [60, 40, 90, 75, 100, 55, 80], [95, 70, 110, 60, 85, 115, 100]];
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    X.fillStyle = C.line; X.fillRect(60, 182, 422, 1.5);
    for (let k = 0; k < 7; k++) { const bh = lerp(sets[fi][k], sets[gi][k], eio(fr)); fillRR(72 + k * 58, 180 - bh, 34, bh, 5, k === 5 ? C.blue : C.mb); }
    pointer([[.3, w + 30, h + 30], [.95, 276, 36], [1.6, 276, 36], [2.05, 376, 36], [2.8, 376, 36], [3.25, 176, 36], [3.7, 176, 36], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 13
  // 13 チップ（Filter chips）
  CELLS[12] = ui((w, h, t) => {
    const chips = ['すべて', '新着', '人気', '無料']; let x = 24; const pos = [];
    const on = [0, eo(seg(t, 0.95, 1.1)) * (1 - eo(seg(t, 3.0, 3.15))), 0, eo(seg(t, 1.75, 1.9)) * (1 - eo(seg(t, 3.6, 3.75)))];
    chips.forEach((s, i) => {
      const k = on[i], cw0 = tw(s, 15, 600) + 32 + (k > 0 ? 18 * k : 0);
      fillRR(x, 12, cw0, 34, 17, k > .5 ? C.lb : '#fff'); strokeRR(x, 12, cw0, 34, 17, k > .5 ? C.blue : C.line2, 1.5);
      if (k > 0) { X.globalAlpha = k; check(x + 18, 29, 5, C.blue, 2.4); X.globalAlpha = 1; }
      text(s, x + 16 + 18 * k, 30, 15, k > .5 ? C.blue : '#555', 600);
      pos.push(x + cw0 / 2); x += cw0 + 10;
    });
    // 一覧：条件に合わないカードが消える
    const vis = [1, 1 - Math.max(on[1], on[3]), 1 - on[3], 1];
    for (let i = 0; i < 4; i++) {
      const cx = 24 + (i % 2) * 252, cy = 60 + Math.floor(i / 2) * 64, a = clamp(.12 + .88 * vis[i]);
      X.save(); X.globalAlpha = a; strokeRR(cx, cy, 242, 54, 8, C.line2, 1.5); fillRR(cx + 10, cy + 10, 34, 34, 6, i === 0 ? C.mb : C.line); bar(cx + 54, cy + 14, 120, C.line2, 10); bar(cx + 54, cy + 32, 150, C.line, 7); X.restore();
    }
    const p1 = pos[1] || 120, p3 = pos[3] || 300;
    pointer([[.3, w + 30, h + 30], [.9, 130, 32], [1.3, 130, 32], [1.7, 300, 32], [2.5, 300, 32], [2.95, 130, 32], [3.2, 130, 32], [3.55, 296, 32], [3.85, 296, 32], [4.3, w + 30, h + 30]], [0.95, 1.75, 3.0, 3.6], t);
  });

  // @element 14
  // 14 レンジスライダー（Range slider）
  CELLS[13] = ui((w, h, t) => {
    // つまみ2つで範囲を選ぶ：下限 ¥1,000→¥3,000、上限 ¥10,000→¥8,000、のち元へ戻す
    const LO = tt => .1 + .2 * eio(seg(tt, 1.0, 1.6)) - .2 * eio(seg(tt, 3.55, 3.9));
    const HI = tt => 1.0 - .2 * eio(seg(tt, 2.1, 2.6)) + .2 * eio(seg(tt, 2.95, 3.3));
    const x0 = 54, x1 = 488, ty = 120, X_ = v => lerp(x0, x1, v);
    const lo = LO(t), hi = HI(t), lx = X_(lo), hx = X_(hi);
    const yen = v => '¥' + (Math.round(v * 100) * 100).toLocaleString('en-US');
    text('価格', 24, 26, 16, '#555', 700);
    text(yen(lo) + ' 〜 ' + yen(hi), w - 24, 26, 17, C.blue, 700, 'right', NUMF);
    fillRR(x0, ty - 4, x1 - x0, 8, 4, '#e3e1df'); fillRR(lx, ty - 4, hx - lx, 8, 4, C.blue);
    const loAct = (t > 1.0 && t < 1.7) || (t > 3.55 && t < 3.95), hiAct = t > 2.1 && t < 3.3;
    [[lx, lo, loAct], [hx, hi, hiAct]].forEach(([kx, v, act]) => {
      if (act) circle(kx, ty, 24, 'rgba(31,90,232,.14)');
      shadowed(() => circle(kx, ty, act ? 15 : 13, '#fff'), 6, 2, .25); ring(kx, ty, act ? 15 : 13, C.blue, 3);
      const val = yen(v), bw = tw(val, 15, 700, NUMF) + 18, bx = clamp(kx - bw / 2, 4, w - 4 - bw);
      fillRR(bx, ty - 60, bw, 28, 7, act ? C.blue : C.lb);
      X.beginPath(); X.moveTo(kx - 6, ty - 32); X.lineTo(kx, ty - 26); X.lineTo(kx + 6, ty - 32); X.fillStyle = act ? C.blue : C.lb; X.fill();
      text(val, bx + bw / 2, ty - 46, 15, act ? '#fff' : C.blue, 700, 'center', NUMF);
    });
    text('¥0', x0, 154, 14, '#9a9896', 500, 'center', NUMF); text('¥10,000', x1 - 10, 154, 14, '#9a9896', 500, 'center', NUMF);
    bar(24, 174, 220, C.line, 8);
    const off = [w + 30, h + 30], L = tt => [X_(LO(tt)), ty + 4], Hh = tt => [X_(HI(tt)), ty + 4];
    const mv = (a, b, ta, tb) => track([[ta, a[0], a[1]], [tb, b[0], b[1]]], t);
    let pos;
    if (t < 1.0) pos = mv(off, L(1.0), .3, .95);
    else if (t < 1.7) pos = L(t);
    else if (t < 2.1) pos = mv(L(1.7), Hh(2.1), 1.7, 2.05);
    else if (t < 3.3) pos = Hh(t);
    else if (t < 3.55) pos = mv(Hh(3.3), L(3.55), 3.3, 3.52);
    else if (t < 3.95) pos = L(t);
    else pos = mv(L(3.95), off, 3.95, 4.3);
    pointer([[0, pos[0], pos[1]]], [1.0, 2.1, 2.95, 3.55], t);
  });

  // @element 15
  // 15 ステッパー（Stepper (+/−)）
  CELLS[14] = ui((w, h, t) => {
    bar(171, 24, 90, C.line2, 10);
    const plus = [.9, 1.35, 1.8], minus = [2.8, 3.25, 3.7];
    let n = 1; plus.forEach(c => { if (t >= c) n++; }); minus.forEach(c => { if (t >= c) n--; });
    const last = [...plus, ...minus].filter(c => t >= c).pop();
    const pop = last !== undefined ? 1 - seg(t, last, last + .25) : 0;
    const bx = 171, by = 52, bw = 200, bh = 60;
    strokeRR(bx, by, bw, bh, 12, C.line2, 1.8);
    const pressP = plus.some(c => t >= c - .05 && t < c + .15), pressM = minus.some(c => t >= c - .05 && t < c + .15);
    if (pressM) fillRR(bx + 2, by + 2, 58, bh - 4, 10, C.lb); if (pressP) fillRR(bx + bw - 60, by + 2, 58, bh - 4, 10, C.lb);
    X.fillStyle = C.line2; X.fillRect(bx + 60, by + 10, 1.5, bh - 20); X.fillRect(bx + bw - 61, by + 10, 1.5, bh - 20);
    text('−', bx + 30, by + bh / 2, 30, '#555', 500, 'center', NUMF); text('+', bx + bw - 30, by + bh / 2, 30, C.blue, 500, 'center', NUMF);
    X.save(); X.translate(bx + bw / 2, by + bh / 2 + 1); X.scale(1 + .18 * pop, 1 + .18 * pop); text(String(n), 0, 0, 30, pop > .05 ? C.blue : C.ink, 700, 'center', NUMF); X.restore();
    bar(171, 136, 200, C.line); bar(171, 154, 140, C.line);
    pointer([[.3, w + 30, h + 30], [.85, 342, 86], [2.3, 342, 86], [2.75, 202, 86], [3.75, 202, 86], [4.3, w + 30, h + 30]], [...plus, ...minus], t);
  });

  // @element 16
  // 16 ページネーション（Pagination）
  CELLS[15] = ui((w, h, t) => {
    const page = t < 1.05 ? 0 : t < 2.15 ? 1 : t < 3.35 ? 2 : 0;
    const fade = Math.min(...[1.05, 2.15, 3.35].map(c => Math.abs(t - c) < .2 ? Math.abs(t - c) / .2 : 1));
    X.save(); X.globalAlpha = fade;
    for (let k = 0; k < 3; k++) { const y = 10 + k * 40; fillRR(24, y, 52, 32, 6, (k + page) % 3 === 0 ? C.mb : C.line); bar(90, y + 4, [200, 160, 240, 180][(k + page) % 4], C.line2, 10); bar(90, y + 20, [320, 280, 360][(k + 2 * page) % 3], C.line, 7); }
    X.restore();
    const items = ['‹', '1', '2', '3', '4', '5', '›'], d = 36, g = 8, total = items.length * d + (items.length - 1) * g, x0 = (w - total) / 2;
    const pos = eio(seg(t, 1.0, 1.2)) + eio(seg(t, 2.1, 2.3)) - 2 * eio(seg(t, 3.3, 3.5));
    circle(x0 + (1 + pos) * (d + g) + d / 2, 160, d / 2, C.blue);
    items.forEach((s, i) => { const cx = x0 + i * (d + g) + d / 2; const on = i >= 1 && i <= 5 && Math.abs(pos - (i - 1)) < .5; text(s, cx, 161, i === 0 || i === 6 ? 22 : 16, on ? '#fff' : '#666', 700, 'center', NUMF); });
    const px = i => x0 + i * (d + g) + d / 2 + 4;
    pointer([[.3, w + 30, h + 30], [.95, px(2), 166], [1.6, px(2), 166], [2.05, px(3), 166], [2.8, px(3), 166], [3.25, px(1), 166], [3.65, px(1), 166], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 17
  // 17 ハンバーガーメニュー（Hamburger menu）
  CELLS[16] = ui((w, h, t) => {
    const a = eio(seg(t, 1.0, 1.3)) * (1 - eio(seg(t, 3.3, 3.6)));
    pageLines(24, 66, 494); fillRR(24, 134, 494, 46, 8, C.block);
    if (a > 0) {
      X.save(); X.beginPath(); X.rect(0, 44, w, h); X.clip();
      const mh = 140, my = 44 - mh + mh * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, my, w, mh); }, 16, 6, .16);
      for (let k = 0; k < 4; k++) { const y = my + 14 + k * 32; bar(24, y + 6, [110, 150, 90, 130][k], k === 0 ? C.blue : C.line2, 11); if (k < 3) { X.fillStyle = C.line; X.fillRect(24, y + 26, w - 48, 1); } }
      X.restore();
    }
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 44); X.fillStyle = C.line; X.fillRect(0, 44, w, 1.5);
    fillRR(24, 15, 76, 16, 4, C.mb);
    // 三本線 → ×
    const hx = w - 42, hy = 22; X.save(); X.translate(hx, hy); X.strokeStyle = a > .02 ? C.blue : '#333'; X.lineWidth = 3; X.lineCap = 'round';
    X.save(); X.translate(0, -8 * (1 - a)); X.rotate(Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.globalAlpha = 1 - a; X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.globalAlpha = 1;
    X.save(); X.translate(0, 8 * (1 - a)); X.rotate(-Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.restore();
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 26], [3.5, w - 38, 26], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 18
  // 18 パンくずリスト（Breadcrumbs）
  CELLS[17] = ui((w, h, t) => {
    const up = eio(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.7, 2.95))); // 1=「講座」の階層にいる
    let x = 24; const y = 24;
    text('ホーム', x, y, 17, C.blue, 600); x += tw('ホーム', 17, 600) + 10; text('›', x, y, 17, '#aaa', 500); x += 18;
    const kx = x, kw = tw('講座', 17, 700);
    const hoverK = t > .9 && t < 1.2;
    text('講座', x, y, 17, up > .5 ? C.ink : C.blue, up > .5 ? 700 : 600); if (hoverK) { X.fillStyle = C.blue; X.fillRect(x, y + 12, kw, 2); }
    x += kw + 10;
    X.globalAlpha = 1 - up; text('›', x, y, 17, '#aaa', 500); text('Web制作', x + 18, y, 17, C.ink, 700); X.globalAlpha = 1;
    X.fillStyle = C.line; X.fillRect(24, 46, 494, 1.5);
    // 中身：詳細ページ ⇄ 一覧ページ
    if (up < 1) { X.save(); X.globalAlpha = 1 - up; bar(24, 64, 200, C.ink, 13); bar(24, 92, 494); bar(24, 110, 420); fillRR(24, 132, 494, 48, 8, C.block); X.restore(); }
    if (up > 0) { X.save(); X.globalAlpha = up; for (let k = 0; k < 3; k++) { const cx = 24 + k * 168, hov = k === 0 && t > 2.45 && t < 2.8; strokeRR(cx, 62, 158, 118, 8, hov ? C.blue : C.line2, hov ? 2 : 1.5); mountains(cx + 10, 72, 138, 58, k % 2); bar(cx + 10, 142, 90, k === 0 ? C.sb : C.line2, 10); bar(cx + 10, 160, 120, C.line, 7); } X.restore(); }
    pointer([[.3, w + 30, h + 30], [.95, kx + kw / 2, 30], [1.6, kx + kw / 2, 30], [2.4, 104, 120], [3.1, 104, 120], [3.9, w + 30, h + 30]], [1.0, 2.7], t);
  });

  // @element 19
  // 19 メガメニュー（Mega menu）
  CELLS[18] = ui((w, h, t) => {
    const a = eo(seg(t, 1.05, 1.3)) * (1 - eio(seg(t, 3.15, 3.4)));
    pageLines(24, 62, 494); fillRR(24, 130, 494, 50, 8, C.block);
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 42); X.fillStyle = C.line; X.fillRect(0, 42, w, 1.5);
    fillRR(24, 14, 70, 16, 4, C.mb);
    const nav = [['製品', 190], ['料金', 262], ['サポート', 334]];
    nav.forEach(([s, x], i) => { const on = i === 0 && a > .3; text(s, x, 22, 16, on ? C.blue : '#555', on ? 700 : 600); if (on) fillRR(x, 36, tw(s, 16, 700), 3, 1.5, C.blue); chevron(x + tw(s, 16, 700) + 10, 22, 3.5, 0, on ? C.blue : '#999', 1.8); });
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.beginPath(); X.rect(0, 43, w, h); X.clip(); const py = 43 - 12 * (1 - a);
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, py, w, 146); }, 18, 8, .16);
      for (let c = 0; c < 3; c++) { const cx = 24 + c * 130; bar(cx, py + 16, 80, C.blue, 10); for (let k = 0; k < 3; k++) { const hov = c === 1 && k === 1 && t > 1.75 && t < 2.9; if (hov) fillRR(cx - 6, py + 34 + k * 26, 112, 22, 5, C.lb); bar(cx, py + 40 + k * 26, [90, 70, 100][(k + c) % 3], hov ? C.sb : C.line2, 9); } }
      mountains(414, py + 14, 104, 112);
      X.restore();
    }
    // 乗せるだけで開く（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.0, 205, 26], [1.4, 205, 26], [1.8, 196, 98], [2.9, 196, 98], [3.2, 300, 200], [3.9, w + 30, h + 30]], [], t);
  });

  // @element 20
  // 20 ステップインジケーター（Step indicator）
  CELLS[19] = ui((w, h, t) => {
    const clicks = [.9, 1.7, 2.5]; let step = 0; clicks.forEach(c => { if (t >= c) step++; });
    const reset = seg(t, 3.75, 4.05), back = seg(t, 4.05, 4.3);
    const showStep = reset >= 1 ? 0 : step;
    const xs = [80, 207, 334, 461], labs = ['入力', '確認', '支払い', '完了'];
    const prog = clicks.reduce((s, c) => s + eio(seg(t, c, c + .3)), 0);
    X.save(); X.globalAlpha = reset < 1 ? 1 - reset : back;
    const pr = reset >= 1 ? 0 : prog;
    fillRR(xs[0], 33, xs[3] - xs[0], 4, 2, '#e3e1df'); fillRR(xs[0], 33, (xs[1] - xs[0]) * pr, 4, 2, C.blue);
    xs.forEach((x, i) => {
      const done = i < showStep || (showStep === 3 && i === 3), cur = i === showStep && showStep < 3;
      circle(x, 35, 17, done || cur ? C.blue : '#fff'); if (!(done || cur)) ring(x, 35, 16, C.line2, 2);
      if (done) check(x, 35, 7, '#fff', 2.6); else text(String(i + 1), x, 36, 16, cur ? '#fff' : '#9a9896', 700, 'center', NUMF);
      text(labs[i], x, 70, 14, done || cur ? C.blue : '#9a9896', 600, 'center');
    });
    X.restore();
    strokeRR(24, 96, 494, 30, 7, C.line2, 1.5); bar(36, 106, 160, C.line); bar(24, 148, 200, C.line);
    fillRR(w - 24 - 110, 142, 110, 38, 8, C.blue); text('次へ', w - 24 - 55, 161, 16, '#fff', 600, 'center');
    pointer([[.3, w + 30, h + 30], [.85, w - 74, 166], [2.6, w - 74, 166], [3.3, w + 30, h + 30]], clicks, t);
  });

  // @element 21
  // 21 スケルトン（Skeleton screen）
  CELLS[20] = ui((w, h, t) => {
    const sk = seg(t, 1.05, 1.2) * (1 - seg(t, 3.0, 3.3));
    ring(w - 40, 26, 14, C.line2, 1.8); X.beginPath(); X.arc(w - 40, 26, 7, -Math.PI * .1, Math.PI * 1.4); X.strokeStyle = '#666'; X.lineWidth = 2.2; X.stroke();
    bar(24, 20, 160, C.line2, 12);
    for (let k = 0; k < 2; k++) {
      const y = 56 + k * 66;
      X.save(); X.globalAlpha = 1 - sk; mountains(24, y, 96, 56, k); bar(136, y + 6, 200, C.ink, 11); bar(136, y + 26, 340); bar(136, y + 42, 260); X.restore();
      if (sk > 0) {
        X.save(); X.globalAlpha = sk; const g = '#e9e7e5';
        fillRR(24, y, 96, 56, 8, g); fillRR(136, y + 4, 200, 14, 7, g); fillRR(136, y + 26, 340, 10, 5, g); fillRR(136, y + 42, 260, 10, 5, g);
        // 光が横に流れる
        const sx = -200 + ((t - 1.1) % 0.9) / 0.9 * (w + 400);
        X.globalCompositeOperation = 'source-atop';
        const gr = X.createLinearGradient(sx - 80, 0, sx + 80, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        X.fillStyle = gr; X.fillRect(0, y - 2, w, 64);
        X.restore();
      }
    }
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 30], [1.4, w - 38, 30], [2.1, w + 30, h + 30]], [1.0], t);
  });

  // @element 22
  // 22 スピナー（Spinner）
  CELLS[21] = ui((w, h, t) => {
    const load = seg(t, 1.05, 1.2) * (1 - seg(t, 2.95, 3.05));
    const done = seg(t, 2.95, 3.15) * (1 - seg(t, 3.75, 4.0));
    pageLines(24, 18, 494); strokeRR(24, 90, 494, 34, 7, C.line2, 1.5);
    fillRR(w / 2 - 60, 140, 120, 40, 8, C.blue); text('送信', w / 2, 160, 16, '#fff', 600, 'center');
    const ov = Math.max(load, done);
    if (ov > 0) {
      X.fillStyle = `rgba(255,255,255,${.78 * ov})`; X.fillRect(0, 0, w, h);
      if (load > 0) { X.save(); X.globalAlpha = load; ring(w / 2, 92, 26, '#e3e8f5', 6); X.beginPath(); const a0 = t * Math.PI * 2 * 1.3; X.arc(w / 2, 92, 26, a0, a0 + Math.PI * 1.35); X.strokeStyle = C.blue; X.lineWidth = 6; X.lineCap = 'round'; X.stroke(); X.restore(); }
      if (done > 0) { X.save(); X.globalAlpha = done; const s = .7 + .3 * eo(seg(t, 2.95, 3.2)); X.translate(w / 2, 92); X.scale(s, s); circle(0, 0, 28, C.blue); check(0, 0, 11, '#fff', 4); X.restore(); }
    }
    pointer([[.3, w + 30, h + 30], [.95, w / 2 + 6, 166], [1.5, w / 2 + 6, 166], [2.2, w + 30, h + 30]], [1.0], t);
  });

  // @element 23
  // 23 バッジ（Badge）
  CELLS[22] = ui((w, h, t) => {
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 54); X.fillStyle = C.line; X.fillRect(0, 54, w, 1.5);
    fillRR(24, 19, 76, 16, 4, C.mb);
    // ベル
    const bx = w - 60, by = 27; X.save(); X.translate(bx, by);
    X.beginPath(); X.moveTo(-12, 8); X.quadraticCurveTo(-11, -12, 0, -13); X.quadraticCurveTo(11, -12, 12, 8); X.lineTo(15, 11); X.lineTo(-15, 11); X.closePath();
    X.strokeStyle = '#333'; X.lineWidth = 2.4; X.lineJoin = 'round'; X.stroke(); X.beginPath(); X.arc(0, 14, 4, 0, Math.PI); X.stroke(); X.restore();
    const arr = [.7, 1.3, 1.9]; let n = 0; arr.forEach(c => { if (t >= c) n++; });
    const clear = eio(seg(t, 3.0, 3.25));
    if (n > 0 && clear < 1) {
      const last = arr.filter(c => t >= c).pop(), pop = 1 - seg(t, last, last + .3);
      const s = (n === 1 ? eo(seg(t, .7, .9)) : 1) * (1 + .3 * pop) * (1 - clear);
      // 届いた合図の波紋
      const k = seg(t, last, last + .5); if (k > 0 && k < 1) ring(bx + 12, by - 12, 12 + 16 * k, `rgba(31,90,232,${.5 * (1 - k)})`, 2.5);
      X.save(); X.translate(bx + 12, by - 12); X.scale(s, s); circle(0, 0, 12, C.blue); ring(0, 0, 12, '#fff', 2.5); text(String(n), 0, 1, 14, '#fff', 800, 'center', NUMF); X.restore();
    }
    bar(24, 76, 220, C.line2, 12); bar(24, 102, 494); bar(24, 120, 400); fillRR(24, 140, 494, 40, 8, C.block);
    pointer([[.3, w + 30, h + 30], [2.3, w + 30, h + 30], [2.95, bx + 2, by + 4], [3.4, bx + 2, by + 4], [4.1, w + 30, h + 30]], [3.0], t);
  });

  // @element 24
  // 24 エンプティステート（Empty state）
  CELLS[23] = ui((w, h, t) => {
    const r1 = eio(seg(t, 0.95, 1.25)), r2 = eio(seg(t, 1.65, 1.95));
    const back = eo(seg(t, 3.35, 3.7));
    const empty = seg(t, 1.95, 2.3) * (1 - seg(t, 3.25, 3.45));
    bar(24, 14, 130, C.line2, 11);
    const rows = [[r1, 0], [r2, 1]];
    rows.forEach(([g, i]) => {
      const gone = back > 0 ? 1 - back : g; if (gone >= 1) return;
      const y = 40 + i * 58 - (i === 1 ? 58 * (back > 0 ? 0 : r1) : 0);
      X.save(); X.globalAlpha = 1 - gone; X.translate(-60 * gone, 0);
      strokeRR(24, y, 494, 48, 8, C.line2, 1.5); ring(48, y + 24, 9, C.line2, 2); bar(70, y + 12, 200, C.line2, 10); bar(70, y + 28, 140, C.line, 7);
      // ゴミ箱
      X.strokeStyle = '#888'; X.lineWidth = 2; X.lineJoin = 'round'; X.strokeRect(476, y + 18, 16, 18); X.beginPath(); X.moveTo(472, y + 17); X.lineTo(496, y + 17); X.moveTo(480, y + 13); X.lineTo(488, y + 13); X.stroke();
      X.restore();
    });
    if (empty > 0) {
      X.save(); X.globalAlpha = empty; const cy = 70 + 8 * (1 - empty);
      X.strokeStyle = C.blue; X.lineWidth = 2.6; X.lineJoin = 'round';
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 18, cy - 22); X.lineTo(w / 2 + 18, cy - 22); X.lineTo(w / 2 + 26, cy - 4); X.lineTo(w / 2 + 26, cy + 16); X.lineTo(w / 2 - 26, cy + 16); X.closePath(); X.stroke();
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 9, cy - 4); X.lineTo(w / 2 - 6, cy + 3); X.lineTo(w / 2 + 6, cy + 3); X.lineTo(w / 2 + 9, cy - 4); X.lineTo(w / 2 + 26, cy - 4); X.stroke();
      text('まだ何もありません', w / 2, cy + 40, 16, '#555', 600, 'center');
      fillRR(w / 2 - 56, cy + 62, 112, 34, 8, C.blue); text('追加する', w / 2, cy + 79, 15, '#fff', 600, 'center');
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.9, 486, 67], [1.25, 486, 67], [1.6, 486, 67], [2.4, 486, 67], [3.2, w / 2 + 4, 156], [3.5, w / 2 + 4, 156], [4.2, w + 30, h + 30]], [0.95, 1.65, 3.3], t);
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "lp" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('lp', function () {
  // @kit
  // LP・Webサイトの演出の名前 24（各カード 539x208・4.8秒周期。各コマは時間 u の純関数）
  // カードの中にブラウザの窓を1つ描き、その中の簡略化したページで演出を見せる。
  // きっかけ（スクロールバー・カーソル・クリック）も一緒に描く。色は 地・文字・差し色（朱）＋写真用の青。
  const CW = 539, CH = 208;
  const CYC = 4.8;                                   // 各カードは4.8秒周期（ループの継ぎ目なし）
  const C = {
    desk: '#E7EAF0', win: '#FFFFFF', bar: '#F3F5F8', rule: '#E2E6ED', ink: '#1C2333', sub: '#7D879B',
    faint: '#DCE1EA', soft: '#F3F5F9', skel: '#E4E8EF', acc: '#FF5A2C', accL: '#FFE5DB', blue: '#3B64E8', blueL: '#E1E8FF'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif';
  const EN = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOut（3乗）
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;      // easeInOut（2乗）
  const eOut = x => 1 - Math.pow(1 - x, 3);                                      // easeOut（3乗）
  const eIn = x => x * x * x;
  const mod = (a, n) => ((a % n) + n) % n;
  // GSAP の elastic.out(1, 0.3) と同じ式
  const eEl = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x - 0.075) * 2 * Math.PI / 0.3) + 1;
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.letterSpacing = ls; k.fillText(s, x, y); k.letterSpacing = '0px';
  }
  // キーフレーム [[秒, 値], …] を easeInOut（3乗）でつなぐ。u は周期で折り返す
  function steps(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, eIO((u - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // カーソルの通り道 [[秒, x, y], …]（easeInOut 3乗でつなぐ）
  function path(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const a = keys[i - 1], b = keys[i], f = eIO((u - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  // on(t) が最後に切り替わった時刻から dur 秒の遷移（CSS の transition と同じ考え方）。過去へさかのぼって調べる
  function trans(on, u, dur, ease = eOut) {
    const s = on(u);
    for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) { const q = ease(P(u, t, t + dur)); return s ? q : 1 - q; }
    return s ? 1 : 0;
  }
  // ブラウザの窓。中のページは V（511x168）の座標で描く
  const WIN = { x: 14, y: 8, w: 511, h: 192, r: 10, bar: 24 };
  const VW = WIN.w, VH = WIN.h - WIN.bar;
  function frame(k, url = 'example.com') {
    k.fillStyle = C.desk; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
    k.fillStyle = C.win; rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.fill(); k.restore();
    k.save(); rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.clip();
    k.fillStyle = C.bar; k.fillRect(WIN.x, WIN.y, WIN.w, WIN.bar); k.fillStyle = C.rule; k.fillRect(WIN.x, WIN.y + WIN.bar - 1, WIN.w, 1); k.restore();
    for (let i = 0; i < 3; i++) { k.fillStyle = '#CDD3DD'; k.beginPath(); k.arc(WIN.x + 15 + i * 12, WIN.y + 12, 3.6, 0, 7); k.fill(); }
    k.fillStyle = '#E6E9EF'; rr(k, WIN.x + WIN.w / 2 - 110, WIN.y + 5, 220, 14, 7); k.fill();
    txt(k, url, WIN.x + WIN.w / 2, WIN.y + 12.5, `500 9.5px ${EN}`, C.sub, 'center', 'middle');
  }
  function view(k, fn) {
    k.save(); rr(k, WIN.x, WIN.y + WIN.bar, VW, VH, [0, 0, WIN.r, WIN.r]); k.clip(); k.translate(WIN.x, WIN.y + WIN.bar);
    k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH); fn(); k.restore();
  }
  // スクロールバー（つまみだけ。pos 0〜1、ratio＝見えている割合）
  function sbar(k, pos, ratio = 0.42) { const th = (VH - 8) * ratio; k.fillStyle = 'rgba(28,35,51,.38)'; rr(k, VW - 9, 4 + (VH - 8 - th) * clamp(pos), 5, th, 2.5); k.fill(); }
  // 文字の代わりの棒（n 行。最後の行は短い）
  function bars(k, x, y, w, n, col = C.faint, hh = 6, gap = 11, last = 0.62) {
    k.fillStyle = col; for (let i = 0; i < n; i++) { rr(k, x, y + i * gap, i === n - 1 && n > 1 ? w * last : w, hh, hh / 2); k.fill(); }
  }
  // 写真の代わりの絵（空・太陽・山）。v で色ちがい、z で中身だけ拡大（枠は固定）
  const PICS = [
    { sky: ['#A9C0FF', '#E4EBFF'], sun: '#FF5A2C', sx: .74, sy: .32, m1: '#7D9AF4', m2: '#4B6BDB' },
    { sky: ['#FFC7B2', '#FFEDE5'], sun: '#FFFFFF', sx: .28, sy: .34, m1: '#F4977A', m2: '#DD5F3B' },
    { sky: ['#3A4884', '#7484CC'], sun: '#FFE5DB', sx: .6, sy: .3, m1: '#2B3770', m2: '#1C2349' }
  ];
  const M1 = [[0, .62], [.22, .4], [.42, .56], [.66, .3], [.86, .5], [1, .42]], M2 = [[0, .8], [.28, .6], [.5, .76], [.76, .58], [1, .74]];
  function mount(k, w, h, pts, col, flip) { k.fillStyle = col; k.beginPath(); k.moveTo(flip ? w : 0, h + 1); pts.forEach(([a, b]) => k.lineTo((flip ? 1 - a : a) * w, b * h)); k.lineTo(flip ? 0 : w, h + 1); k.closePath(); k.fill(); }
  function pic(k, x, y, w, h, v = 0, r = 6, z = 1) {
    const p = PICS[v % PICS.length];
    k.save(); rr(k, x, y, w, h, r); k.clip();
    k.translate(x + w / 2, y + h / 2); k.scale(z, z); k.translate(-w / 2, -h / 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, p.sky[0]); g.addColorStop(1, p.sky[1]); k.fillStyle = g; k.fillRect(-1, -1, w + 2, h + 2);
    k.fillStyle = p.sun; k.beginPath(); k.arc(w * p.sx, h * p.sy, Math.min(w, h) * 0.13, 0, 7); k.fill();
    mount(k, w, h, M1, p.m1, v % 2); mount(k, w, h, M2, p.m2, (v + 1) % 2);
    k.restore();
  }
  function btn(k, x, y, w, h, label, col = C.acc, tcol = '#fff', fs = 12) {
    k.fillStyle = col; rr(k, x, y, w, h, h / 2); k.fill(); txt(k, label, x + w / 2, y + h / 2 + 0.5, `700 ${fs}px ${JP}`, tcol, 'center', 'middle');
  }
  function logo(k, x, y, col = C.ink) { k.fillStyle = C.acc; rr(k, x, y - 7, 14, 14, 4); k.fill(); txt(k, 'SAMPLE', x + 20, y + 0.5, `800 12px ${EN}`, col, 'left', 'middle', '1px'); }
  // ページのヘッダー（高さ34）
  const NAVX = [300, 346, 392];
  function header(k, y, active = -1) {
    k.fillStyle = '#fff'; k.fillRect(0, y, VW, 34); k.fillStyle = C.rule; k.fillRect(0, y + 33, VW, 1);
    logo(k, 18, y + 17);
    ['特長', '料金', 'FAQ'].forEach((s, i) => txt(k, s, NAVX[i], y + 17.5, `600 12px ${JP}`, active === i ? C.acc : C.ink, 'left', 'middle'));
    btn(k, 428, y + 7, 70, 20, '無料で試す', C.acc, '#fff', 10.5);
  }
  // マウスのカーソル（矢印）。press で少し縮む
  function cursor(k, x, y, press = 0) {
    const s = 1.2 * (1 - 0.12 * press);
    k.save(); k.translate(x, y); k.scale(s, s); k.beginPath();
    [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b));
    k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = C.ink; k.fill(); k.stroke(); k.restore();
  }
  // クリックした所に出る小さな輪（0.35秒）と、押している間の縮み
  function click(k, x, y, u, times) {
    let press = 0;
    for (const tc of times) {
      const d = mod(u - tc + 0.1, CYC) - 0.1;
      if (d > -0.1 && d < 0.12) press = Math.max(press, 1 - Math.abs(d - 0.01) / 0.11);
      if (d >= 0 && d < 0.35) { const q = d / 0.35; k.strokeStyle = `rgba(28,35,51,${0.45 * (1 - q)})`; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 5 + 13 * eOut(q), 0, 7); k.stroke(); }
    }
    cursor(k, x, y, clamp(press));
  }
  // 回る読み込み表示（0.8秒で1回転）
  function spinner(k, x, y, r, u, col = C.acc) {
    const a = u / 0.8 * Math.PI * 2;
    k.lineCap = 'round'; k.lineWidth = r * 0.28; k.strokeStyle = C.faint; k.beginPath(); k.arc(x, y, r, 0, 7); k.stroke();
    k.strokeStyle = col; k.beginPath(); k.arc(x, y, r, a, a + Math.PI * 0.6); k.stroke(); k.lineCap = 'butt';
  }
  // ページ上の top にある要素が、判定線 line より上に入った時刻（画面の下へ出たらリセット）。過去 CYC 秒をさかのぼる
  function enteredAt(sy, top, line, u) {
    const dt = 1 / 120, y = t => top - sy(t);
    if (y(u) >= VH) return null;
    for (let t = u; t > u - CYC; t -= dt) {
      const a = y(t), b = y(t - dt);
      if (a >= VH) return null;
      if (a < line && b >= line) return t - dt + dt * (b - line) / (b - a);
    }
    return y(u) < line ? -1e9 : null;
  }
  const CELLS = [];

  // @element 01
  // 01 パララックススクロール（スクロールすると、空・山・見出しが違う速さで動く）
  CELLS[0] = (k, w, h, u) => {
    frame(k);
    const s = steps([[0.3, 0], [1.9, 1], [2.9, 1], [4.3, 0]], u), y = s * 120;
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#9DB6FB'); g.addColorStop(1, '#E6ECFF');
      k.save(); k.translate(0, -y * 0.15);                         // 空と太陽: 0.15倍
      k.fillStyle = g; k.fillRect(0, 0, VW, 260); k.fillStyle = C.acc; k.beginPath(); k.arc(392, 54, 25, 0, 7); k.fill(); k.restore();
      k.save(); k.translate(0, -y * 0.4); mount(k, VW, 190, M1, '#7D9AF4', 0); k.restore();   // 遠い山: 0.4倍
      k.save(); k.translate(0, -y * 0.7); mount(k, VW, 205, M2, '#4B6BDB', 1); k.restore();   // 近い山: 0.7倍
      k.save(); k.translate(0, -y);                                // 見出し・ボタン・次のセクション: 1倍
      txt(k, '山へ、行こう。', 34, 64, `800 28px ${JP}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 34, 78, 160, 2, 'rgba(255,255,255,.85)');
      btn(k, 34, 106, 92, 26, '予約する');
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200);
      txt(k, '人気のコース', 34, VH + 34, `800 16px ${JP}`, C.ink);
      for (let i = 0; i < 3; i++) { pic(k, 34 + i * 152, VH + 50, 136, 58, i, 6); bars(k, 34 + i * 152, VH + 116, 110, 1, C.faint); }
      k.restore();
      sbar(k, s * 0.35, 0.4);
    });
  };

  // @element 02
  // 02 スクロールでフェードイン（画面に入った要素が、下から浮かび上がって現れる）
  CELLS[1] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 95], [1.5, 95], [2.1, 200], [3.2, 200], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.85, DUR = 0.7, RISE = 28;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '暮らしを、軽く。', 34, 52, `800 24px ${JP}`, C.ink); bars(k, 34, 68, 190, 3); btn(k, 34, 108, 96, 26, '詳しく見る');
      pic(k, 286, 18, 196, 110, 0, 8);
      const items = [
        [172, () => txt(k, '選ばれる3つの理由', VW / 2, 172 + 20, `800 18px ${JP}`, C.ink, 'center')],
        [206, () => { for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = C.soft; rr(k, x, 206, 136, 106, 8); k.fill(); pic(k, x + 8, 214, 120, 56, i, 5); bars(k, x + 10, 280, 112, 2, '#CBD2DE'); } }],
        [334, () => bars(k, 110, 334, 290, 3, C.faint, 7, 13)]
      ];
      for (const [top, draw] of items) {
        const t0 = enteredAt(SY, top, LINE, u); if (t0 === null) continue;
        const q = eOut(P(u, t0, t0 + DUR));
        k.save(); k.globalAlpha = q; k.translate(0, RISE * (1 - q)); draw(); k.restore();
      }
      k.restore();
      sbar(k, y / 200, 0.5);
    });
  };

  // @element 03
  // 03 追従ヘッダー（スクロールすると、ヘッダーが画面の上で止まってついてくる）
  CELLS[2] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.4, 0], [1.3, 110], [1.9, 110], [2.8, 250], [3.4, 250], [4.4, 0]], u);
    const STRIP = 22;
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 70, 214, 112, 0, 8);
      txt(k, '新しい毎日を、', 262, 104, `800 22px ${JP}`, C.ink); bars(k, 262, 120, 210, 3); btn(k, 262, 160, 100, 26, '詳しく見る');
      k.fillStyle = C.soft; k.fillRect(0, 212, VW, 240);
      txt(k, '特長', VW / 2, 246, `800 18px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = '#fff'; rr(k, x, 262, 136, 120, 8); k.fill(); pic(k, x + 8, 270, 120, 58, i, 5); bars(k, x + 10, 340, 110, 3, C.faint, 6, 11); }
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, STRIP);
      txt(k, '期間限定キャンペーン実施中', VW / 2, STRIP / 2 + 0.5, `600 11px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const hy = Math.max(STRIP - y, 0), sh = clamp((y - STRIP) / 24);
      if (sh > 0) { const g = k.createLinearGradient(0, hy + 34, 0, hy + 46); g.addColorStop(0, `rgba(28,35,51,${0.16 * sh})`); g.addColorStop(1, 'rgba(28,35,51,0)'); k.fillStyle = g; k.fillRect(0, hy + 34, VW, 12); }
      header(k, hy);
      sbar(k, y / 250, 0.42);
    });
  };

  // @element 04
  // 04 ピン留め（セクションが画面に止まったまま、中身だけがスクロールで進む）
  CELLS[3] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 500], [3.5, 500], [4.5, 0]], u);
    const PIN0 = 110, PD = 300;
    const top = y < PIN0 ? PIN0 - y : y < PIN0 + PD ? 0 : PIN0 + PD - y, p = clamp((y - PIN0) / PD);
    // 中身は 1/3・2/3 の所で次のステップへ（前後 ±0.07 の範囲で easeInOut）
    const f = eIO(P(p, 1 / 3 - 0.07, 1 / 3 + 0.07)) + eIO(P(p, 2 / 3 - 0.07, 2 / 3 + 0.07));
    view(k, () => {
      txt(k, '3ステップで完成', 34, 56 - y, `800 22px ${JP}`, C.ink); bars(k, 34, 72 - y, 240, 2);
      k.save(); k.translate(0, top);
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
      // 左: STEP の番号（スクロール量に合わせて回る）
      txt(k, 'STEP', 34, 40, `700 12px ${EN}`, 'rgba(255,255,255,.6)', 'left', 'alphabetic', '2px');
      k.save(); k.beginPath(); k.rect(30, 46, 120, 52); k.clip();
      for (let i = 0; i < 3; i++) txt(k, '0' + (i + 1), 32, 90 + (i - f) * 52, `800 46px ${EN}`, '#fff');
      k.restore();
      bars(k, 34, 110, 150, 3, 'rgba(255,255,255,.28)');
      // 進み具合の線
      k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, 232, 22, 4, 124, 2); k.fill();
      k.fillStyle = C.acc; rr(k, 232, 22, 4, 124 * p, 2); k.fill();
      // 右: 写真が順に入れ替わる
      k.save(); rr(k, 256, 22, 226, 124, 8); k.clip();
      for (let i = 0; i < 3; i++) pic(k, 256, 22 + (i - f) * 124, 226, 124, i, 0);
      k.restore();
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200); bars(k, 34, VH + 30, 300, 3);
      k.restore();
      sbar(k, y / 500, 0.3);
    });
  };

  // @element 05
  // 05 横スクロール（縦にスクロールすると、カードの列が横へ流れる）
  CELLS[4] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 420], [3.5, 420], [4.5, 0]], u);
    const PIN0 = 40, PD = 380, N = 4, PWD = 200, GAP = 20;
    const top = y < PIN0 ? PIN0 - y : 0, p = clamp((y - PIN0) / PD);
    const travel = 34 * 2 + N * PWD + (N - 1) * GAP - VW;
    view(k, () => {
      txt(k, 'WORKS', 34, 30 - y, `800 20px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
      k.save(); k.translate(0, top);
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH + 40);
      for (let i = 0; i < N; i++) {
        const x = 34 + i * (PWD + GAP) - p * travel;
        pic(k, x, 18, PWD, 112, i % 3, 8);
        txt(k, '0' + (i + 1), x + 14, 118, `800 22px ${EN}`, '#fff');
        bars(k, x, 140, 120, 1, '#CBD2DE');
      }
      k.restore();
      sbar(k, y / 420, 0.36);
    });
  };

  // @element 06
  // 06 スクロールスナップ（少しスクロールすると、次のセクションの頭までピタッと送られる）
  CELLS[5] = (k, w, h, u) => {
    frame(k);
    const T = CYC / 2, lu = mod(u, T), dir = u < T ? 1 : -1, from = u < T ? 0 : VH, DRIFT = 34;
    const y = from + dir * (DRIFT * eOut(P(lu, 0.45, 0.85)) + (VH - DRIFT) * eOut(P(lu, 0.9, 1.5)));
    view(k, () => {
      k.save(); k.translate(0, -y);
      for (let i = 0; i < 2; i++) {
        const y0 = i * VH, dark = i === 1;
        k.fillStyle = dark ? C.ink : C.blueL; k.fillRect(0, y0, VW, VH);
        txt(k, '0' + (i + 1), 34, y0 + 70, `800 46px ${EN}`, C.acc);
        txt(k, dark ? '使ってみる' : '知ってもらう', 34, y0 + 102, `800 18px ${JP}`, dark ? '#fff' : C.ink);
        bars(k, 34, y0 + 118, 170, 2, dark ? 'rgba(255,255,255,.3)' : '#C3CDEA');
        pic(k, 262, y0 + 24, 220, 120, dark ? 2 : 0, 8);
      }
      k.restore();
      sbar(k, y / VH, 0.5);
    });
  };

  // @element 07
  // 07 スクロールプログレスバー（読み進めた分だけ、画面上の線が伸びる）
  CELLS[6] = (k, w, h, u) => {
    frame(k);
    const MAX = 430;
    const y = steps([[0.3, 0], [0.75, 110], [1.15, 110], [1.6, 220], [2.0, 220], [2.45, 330], [2.85, 330], [3.3, MAX], [3.75, MAX], [4.55, 0]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'はじめてのWebデザイン', 70, 44, `800 20px ${JP}`, C.ink); bars(k, 70, 56, 120, 1, C.faint, 5);
      pic(k, 70, 74, 371, 112, 0, 8);
      for (let b = 0; b < 4; b++) { const y0 = 204 + b * 82; k.fillStyle = C.ink; rr(k, 70, y0, 140, 9, 4.5); k.fill(); bars(k, 70, y0 + 22, 371, 4, C.faint, 6, 12); }
      k.restore();
      k.fillStyle = C.faint; k.fillRect(0, 0, VW, 6);
      k.fillStyle = C.acc; k.fillRect(0, 0, VW * (y / MAX), 6);
      sbar(k, y / MAX, 0.3);
    });
  };

  // @element 08
  // 08 マーカーアニメーション（大事な言葉が画面に入ると、蛍光ペンの線が左から引かれる）
  CELLS[7] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 90], [1.6, 90], [2.2, 180], [3.3, 180], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.8, DUR = 0.8, MARK = '#FFE36B', F = `800 20px ${JP}`;
    const rows = [[190, ['毎日のごはんが', 'たった10分で', '作れる。']], [290, ['はじめてでも', '失敗しないレシピ', 'だけ。']]];
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '忙しい人のための', 70, 50, `700 14px ${JP}`, C.sub); txt(k, '台所の新しい相棒', 70, 80, `800 24px ${JP}`, C.ink);
      bars(k, 70, 96, 330, 4, C.faint, 6, 12, 0.8);
      for (const [base, parts] of rows) {
        k.font = F; const ws = parts.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0)) / 2;
        const t0 = enteredAt(SY, base - 20, LINE, u), q = t0 === null ? 0 : eOut(P(u, t0, t0 + DUR));
        if (q > 0) { k.fillStyle = MARK; k.fillRect(x + ws[0], base - 8, ws[1] * q, 11); }
        parts.forEach((s, i) => { txt(k, s, x, base, F, i === 1 ? C.ink : '#4A5368'); x += ws[i]; });
        bars(k, 110, base + 22, 291, 2, C.faint, 6, 12, 0.7);
      }
      k.restore();
      sbar(k, y / 180, 0.5);
    });
  };

  // @element 09
  // 09 ホバーで浮き上がる（カーソルが乗ったカードが、影をつけて少し持ち上がる）
  CELLS[8] = (k, w, h, u) => {
    frame(k);
    const CX = [26, 192, 358], CY = 18, CWD = 146, CHT = 128, LIFT = 10;
    const cur = t => path([[0, 70, 160], [0.45, 96, 78], [1.4, 110, 86], [1.62, 262, 80], [2.5, 276, 88], [2.72, 428, 80], [3.6, 440, 88], [4.0, 470, 160], [4.8, 70, 160]], t);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 3; i++) {
        const inside = t => { const [x, y] = cur(t); return x > CX[i] && x < CX[i] + CWD && y > CY && y < CY + CHT; };
        const q = trans(inside, u, 0.3), x = CX[i], y = CY - LIFT * q;
        k.save(); k.shadowColor = `rgba(28,35,51,${0.08 + 0.14 * q})`; k.shadowBlur = 6 + 16 * q; k.shadowOffsetY = 2 + 10 * q;
        k.fillStyle = '#fff'; rr(k, x, y, CWD, CHT, 10); k.fill(); k.restore();
        pic(k, x + 8, y + 8, CWD - 16, 66, i, 6);
        txt(k, ['山の宿', '海の宿', '星の宿'][i], x + 12, y + 96, `800 13px ${JP}`, C.ink); bars(k, x + 12, y + 106, 100, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 10
  // 10 ホバーで画像ズーム（枠はそのままで、中の写真だけがゆっくり拡大する）
  CELLS[9] = (k, w, h, u) => {
    frame(k);
    const FX = [22, 267], FY = 16, FW = 222, FH = 118, ZOOM = 0.15;
    const cur = t => path([[0, 60, 160], [0.5, 120, 70], [1.8, 140, 84], [2.2, 370, 70], [3.4, 390, 84], [3.9, 470, 160], [4.8, 60, 160]], t);
    view(k, () => {
      for (let i = 0; i < 2; i++) {
        const inside = t => { const [x, y] = cur(t); return x > FX[i] && x < FX[i] + FW && y > FY && y < FY + FH; };
        const q = trans(inside, u, 0.5);
        pic(k, FX[i], FY, FW, FH, i, 8, 1 + ZOOM * q);
        txt(k, ['夏の山小屋', '海辺のカフェ'][i], FX[i], FY + FH + 20, `800 13px ${JP}`, C.ink); bars(k, FX[i], FY + FH + 28, 150, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 11
  // 11 マウスストーカー（カーソルのあとを、丸が少し遅れて追いかける）
  CELLS[10] = (k, w, h, u) => {
    frame(k);
    const cur = t => [255 + 175 * Math.sin(2 * Math.PI * t / CYC), 86 + 46 * Math.sin(4 * Math.PI * t / CYC)];
    // 毎フレーム（60fps）残りの距離の 12% ずつ近づく
    let t = u - 2, [fx, fy] = cur(t);
    for (let i = 0; i < 120; i++) { t += 1 / 60; const [tx, ty] = cur(t); fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12; }
    view(k, () => {
      txt(k, 'CREATIVE STUDIO', VW / 2, 74, `800 34px ${EN}`, C.ink, 'center', 'alphabetic', '3px');
      bars(k, VW / 2 - 120, 96, 240, 2, C.faint, 6, 12, 0.7);
      btn(k, VW / 2 - 50, 128, 100, 24, '作品を見る', C.ink);
      k.fillStyle = C.acc; k.globalAlpha = 0.88; k.beginPath(); k.arc(fx, fy, 17, 0, 7); k.fill(); k.globalAlpha = 1;
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 12
  // 12 マグネティックボタン（カーソルが近づくと、ボタンが吸い寄せられ、離れるとぷるんと戻る）
  CELLS[11] = (k, w, h, u) => {
    frame(k);
    const BX = VW / 2, BY = 84, R = 110, PULL = 0.35;
    const cur = t => path([[0, -20, 130], [0.9, 170, 104], [1.5, 300, 62], [2.1, 318, 110], [2.7, 205, 66], [3.1, 250, 92], [3.6, 545, 120], [4.8, 545, 120]], t);
    const inside = t => { const [x, y] = cur(t); return Math.hypot(x - BX, y - BY) < R; };
    // 範囲に入った時刻から 60fps で目標（カーソルとの差 × 0.35）へ毎フレーム 18% ずつ近づく
    const pull = t => {
      let t0 = t; for (let i = 0; i < 600 && inside(t0 - 1 / 120); i++) t0 -= 1 / 120;
      let ox = 0, oy = 0; for (let s = t0; s <= t; s += 1 / 60) { const [x, y] = cur(s); ox += ((x - BX) * PULL - ox) * 0.18; oy += ((y - BY) * PULL - oy) * 0.18; }
      return [ox, oy];
    };
    let ox = 0, oy = 0;
    if (inside(u)) [ox, oy] = pull(u);
    else {
      let t1 = u; for (let i = 0; i < 600 && !inside(t1); i++) t1 -= 1 / 120;
      if (inside(t1)) { const [lx, ly] = pull(t1), e = 1 - eEl(P(u, t1, t1 + 1.1)); ox = lx * e; oy = ly * e; }
    }
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(BX + ox, BY + oy);
      k.shadowColor = 'rgba(255,90,44,.35)'; k.shadowBlur = 16; k.shadowOffsetY = 6;
      k.fillStyle = C.acc; rr(k, -84, -26, 168, 52, 26); k.fill(); k.shadowColor = 'transparent';
      txt(k, 'お問い合わせ', 0, 1, `800 16px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 13
  // 13 リップルエフェクト（押した場所から、ボタンの中に波紋が広がる）
  CELLS[12] = (k, w, h, u) => {
    frame(k);
    const B = { x: 115, y: 78, w: 280, h: 56 }, TAPS = [[0.7, 165, 110], [2.9, 345, 100]], DUR = 0.6;
    const [cx, cy] = path([[0, 430, 160], [0.55, 165, 110], [1.6, 165, 110], [2.7, 345, 100], [3.6, 345, 100], [4.4, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, 'お申し込み', VW / 2, 38, `800 18px ${JP}`, C.ink, 'center'); bars(k, VW / 2 - 110, 50, 220, 1, C.faint, 6, 11, 1);
      k.save(); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 8; k.shadowOffsetY = 3; k.fillStyle = C.acc; rr(k, B.x, B.y, B.w, B.h, 10); k.fill(); k.restore();
      k.save(); rr(k, B.x, B.y, B.w, B.h, 10); k.clip();
      for (const [tc, px, py] of TAPS) {
        const d = u - tc; if (d < 0 || d > 0.8) continue;
        const Rm = Math.max(Math.hypot(px - B.x, py - B.y), Math.hypot(px - B.x - B.w, py - B.y), Math.hypot(px - B.x, py - B.y - B.h), Math.hypot(px - B.x - B.w, py - B.y - B.h));
        k.fillStyle = `rgba(255,255,255,${0.4 * (1 - P(d, 0.3, 0.8))})`; k.beginPath(); k.arc(px, py, Rm * eOut(P(d, 0, DUR)), 0, 7); k.fill();
      }
      k.restore();
      txt(k, '送信する', VW / 2, B.y + B.h / 2 + 1, `800 17px ${JP}`, '#fff', 'center', 'middle');
      click(k, cx, cy, u, TAPS.map(a => a[0]));
    });
  };

  // @element 14
  // 14 下線アニメーション（リンクにカーソルを乗せると下線が左から伸び、離れると右へ抜ける）
  CELLS[13] = (k, w, h, u) => {
    frame(k);
    const LINKS = ['サービス', '実績', '会社概要'], F = `800 20px ${JP}`, GAP = 56, LY = 84, DUR = 0.3;
    const cur = t => path([[0, 120, 150], [0.45, 170, 80], [1.3, 186, 84], [1.55, 268, 80], [2.4, 282, 84], [2.65, 372, 80], [3.5, 390, 84], [3.95, 430, 150], [4.8, 120, 150]], t);
    view(k, () => {
      logo(k, 22, 28); bars(k, 90, 132, 331, 2, C.faint, 6, 12, 0.6);
      k.font = F; const ws = LINKS.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0) - GAP * (LINKS.length - 1)) / 2;
      LINKS.forEach((s, i) => {
        const x0 = x, x1 = x + ws[i], inside = t => { const [a, b] = cur(t); return a > x0 - 6 && a < x1 + 6 && b > LY - 22 && b < LY + 14; };
        txt(k, s, x0, LY, F, C.ink);
        // 最後に乗った・離れた時刻から 0.3秒（乗る: 左端から伸びる / 離れる: 左端から縮んで右へ抜ける）
        const on = inside(u); let tc = null; for (let j = 0, t = u; j < 600; j++, t -= 1 / 120) if (inside(t - 1 / 120) !== on) { tc = t; break; }
        if (tc !== null) {
          const q = eOut(P(u, tc, tc + DUR)), a = on ? 0 : q, b = on ? q : 1;
          if (b > a) { k.fillStyle = C.acc; k.fillRect(x0 + ws[i] * a, LY + 8, ws[i] * (b - a), 3); }
        }
        x += ws[i] + GAP;
      });
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 15
  // 15 ビフォーアフタースライダー（真ん中の線をドラッグすると、加工前と加工後の写真の境目が動く）
  CELLS[14] = (k, w, h, u) => {
    frame(k);
    const F = { x: 76, y: 14, w: 359, h: 140 };
    const pos = steps([[0.75, 0.5], [1.55, 0.2], [2.65, 0.82], [3.55, 0.5]], u), hx = F.x + F.w * pos, hy = F.y + F.h / 2;
    const drag = u > 0.68 && u < 3.62;
    const [cx, cy] = u < 0.7 ? path([[0, 430, 160], [0.62, hx, hy + 4]], u) : drag ? [hx, hy + 4] : path([[3.6, hx, hy + 4], [4.3, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 後（色あり）
      k.save(); k.beginPath(); k.rect(F.x, F.y, hx - F.x, F.h); k.clip();
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 前（色を抜いて暗く）
      k.globalCompositeOperation = 'saturation'; k.fillStyle = '#888'; k.fillRect(F.x, F.y, F.w, F.h);
      k.globalCompositeOperation = 'source-over'; k.fillStyle = 'rgba(28,35,51,.18)'; k.fillRect(F.x, F.y, F.w, F.h);
      k.restore();
      const tag = (s, x, al) => { k.font = `800 11px ${EN}`; const tw = k.measureText(s).width + 16; const bx = al ? x - tw : x; k.fillStyle = 'rgba(28,35,51,.55)'; rr(k, bx, F.y + 10, tw, 20, 10); k.fill(); txt(k, s, bx + tw / 2, F.y + 20.5, `800 11px ${EN}`, '#fff', 'center', 'middle', '1px'); };
      k.save(); rr(k, F.x, F.y, F.w, F.h, 10); k.clip(); tag('BEFORE', F.x + 10, false); tag('AFTER', F.x + F.w - 10, true); k.restore();
      k.fillStyle = '#fff'; k.fillRect(hx - 1.5, F.y, 3, F.h);
      k.save(); k.shadowColor = 'rgba(28,35,51,.3)'; k.shadowBlur = 8; k.shadowOffsetY = 2; k.fillStyle = '#fff'; k.beginPath(); k.arc(hx, hy, 17, 0, 7); k.fill(); k.restore();
      k.fillStyle = C.ink; k.beginPath(); k.moveTo(hx - 4, hy - 6); k.lineTo(hx - 11, hy); k.lineTo(hx - 4, hy + 6); k.closePath(); k.moveTo(hx + 4, hy - 6); k.lineTo(hx + 11, hy); k.lineTo(hx + 4, hy + 6); k.closePath(); k.fill();
      cursor(k, cx, cy, drag ? 1 : 0);
    });
  };

  // @element 16
  // 16 離脱防止ポップアップ（カーソルがタブや閉じるボタンの方へ出ていくと、引き止める小窓が出る）
  CELLS[15] = (k, w, h, u) => {
    frame(k);
    const OX = WIN.x, OY = WIN.y + WIN.bar;               // カーソルは窓の外（タブ・アドレスバー）まで出るので、カードの座標で描く
    const [cx, cy] = path([[0, 440, 150], [0.7, 300, 120], [1.25, 360, -18], [1.9, 372, -20], [2.6, 366, 38], [3.3, 366, 38], [4.4, 440, 150], [4.8, 440, 150]], u);
    const CLOSE = 2.9;
    let TRIG = 0.7; while (TRIG < 1.3 && path([[0.7, 300, 120], [1.25, 360, -18]], TRIG)[1] >= 0) TRIG += 1 / 240;   // 表示域の上端（y = 0）を越えた時刻（約1.07秒）
    const m = eOut(P(u, TRIG + 0.05, TRIG + 0.45)) * (1 - P(u, CLOSE + 0.03, CLOSE + 0.25));
    const D = { x: 125.5, y: 18, w: 260, h: 132 };
    view(k, () => {
      header(k, 0);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, 'はじめての方へ', 264, 82, `800 19px ${JP}`, C.ink); bars(k, 264, 96, 210, 3); btn(k, 264, 132, 100, 24, '申し込む');
      if (m > 0) {
        k.fillStyle = `rgba(28,35,51,${0.5 * m})`; k.fillRect(0, 0, VW, VH);
        k.save(); k.globalAlpha = m; k.translate(D.x + D.w / 2, D.y + D.h / 2); const s = 0.9 + 0.1 * m; k.scale(s, s); k.translate(-D.w / 2, -D.h / 2);
        k.fillStyle = '#fff'; rr(k, 0, 0, D.w, D.h, 12); k.fill();
        txt(k, 'ちょっと待って！', D.w / 2, 34, `800 17px ${JP}`, C.ink, 'center');
        txt(k, '今なら初回 10%OFF', D.w / 2, 60, `800 15px ${JP}`, C.acc, 'center');
        btn(k, D.w / 2 - 75, 80, 150, 30, 'クーポンを受け取る', C.acc, '#fff', 12);
        k.strokeStyle = C.sub; k.lineWidth = 2; k.lineCap = 'round'; k.beginPath(); k.moveTo(D.w - 26, 14); k.lineTo(D.w - 14, 26); k.moveTo(D.w - 14, 14); k.lineTo(D.w - 26, 26); k.stroke();
        k.restore();
      }
    });
    // カーソルの × のクリック（窓の中）と、窓の外への移動
    k.save(); k.beginPath(); k.rect(0, 0, CW, CH); k.clip(); k.translate(OX, OY); click(k, cx, cy, u, [CLOSE]); k.restore();
  };

  // @element 17
  // 17 ローディング画面（数字が100%まで進むと、幕が上がってページが現れる）
  CELLS[16] = (k, w, h, u) => {
    frame(k);
    const n = Math.round(100 * eOut(P(u, 0.25, 2.1)));
    const cy = u < 4.25 ? -VH * eIO(P(u, 2.3, 2.85)) : -VH * (1 - eIO(P(u, 4.25, 4.75)));
    const show = eOut(P(u, 2.35, 2.95));
    view(k, () => {
      header(k, 0);
      k.save(); k.globalAlpha = show; k.translate(0, 14 * (1 - show));
      txt(k, 'ようこそ。', 34, 82, `800 26px ${JP}`, C.ink); bars(k, 34, 98, 200, 3); btn(k, 34, 136, 96, 24, '始める');
      pic(k, 270, 46, 214, 112, 0, 8); k.restore();
      if (cy > -VH) {
        k.save(); k.translate(0, cy); k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
        logo(k, VW / 2 - 40, 56, '#fff');
        txt(k, (u >= 4.25 ? 0 : n) + '%', VW / 2, 98, `800 28px ${EN}`, '#fff', 'center', 'middle');
        k.fillStyle = 'rgba(255,255,255,.15)'; rr(k, VW / 2 - 90, 122, 180, 4, 2); k.fill();
        k.fillStyle = C.acc; rr(k, VW / 2 - 90, 122, 180 * (u >= 4.25 ? 0 : n / 100), 4, 2); k.fill();
        k.restore();
      }
    });
  };

  // @element 18
  // 18 遅延読み込み（画面に入った画像だけ、その時点で読み込まれて表示される）
  CELLS[17] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.1, 110], [1.7, 110], [2.5, 225], [3.5, 225], [4.5, 0]], t), y = SY(u);
    const COLX = [15, 180, 345], IW = 151, IH = 92, ROWS = [12, 168, 276], WAIT = 0.45, FADE = 0.35;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'ギャラリー', 15, 140, `800 18px ${JP}`, C.ink); bars(k, 120, 128, 200, 1);
      ROWS.forEach((top, r) => COLX.forEach((x, c) => {
        const t0 = r === 0 ? -1e9 : enteredAt(SY, top, VH, u), age = t0 === null ? -1 : u - t0 - c * 0.12;
        k.fillStyle = C.skel; rr(k, x, top, IW, IH, 6); k.fill();
        if (age < WAIT + FADE) {   // まだの画像: 灰色の枠と画像の印
          k.save(); k.translate(x + IW / 2, top + IH / 2); k.strokeStyle = '#B9C1CF'; k.lineWidth = 2; k.lineJoin = 'round';
          if (age >= 0 && age < WAIT) spinner(k, 0, 0, 11, u, C.blue);
          else { rr(k, -15, -11, 30, 22, 3); k.stroke(); k.beginPath(); k.moveTo(-11, 7); k.lineTo(-3, -1); k.lineTo(3, 5); k.lineTo(7, 1); k.lineTo(11, 6); k.stroke(); }
          k.restore();
        }
        if (age >= WAIT) { k.save(); k.globalAlpha = eOut(P(age, WAIT, WAIT + FADE)); pic(k, x, top, IW, IH, (r + c) % 3, 6); k.restore(); }
      }));
      k.restore();
      sbar(k, y / 225, 0.45);
    });
  };

  // @element 19
  // 19 無限スクロール（いちばん下まで来ると読み込み表示が出て、続きが足される）
  CELLS[18] = (k, w, h, u) => {
    frame(k);
    // 1周期で 3件（156px）ぶん進む。周期の終わりは始まりと同じ見た目（内容は3件ごとにくり返す）
    const PITCH = 52, BATCH = 3, L0 = 6, TL = 2.6;
    const y = steps([[0.25, 38], [0.85, 116], [1.15, 116], [1.75, 194], [4.8, 194]], u);
    const n = u < TL ? L0 : L0 + BATCH, end = 10 + n * PITCH;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(0, -y);
      for (let i = 0; i < n; i++) {
        const top = 10 + i * PITCH, v = i % 3, fresh = i >= L0 ? eOut(P(u, TL, TL + 0.35)) : 1;
        if (top - y > VH || top + 44 - y < 0) continue;
        k.save(); k.globalAlpha = fresh; k.translate(0, 10 * (1 - fresh));
        k.fillStyle = '#fff'; rr(k, 90, top, 331, 44, 8); k.fill(); pic(k, 98, top + 6, 48, 32, v, 5);
        bars(k, 158, top + 12, [180, 140, 200][v], 1, C.ink, 7); bars(k, 158, top + 26, [120, 150, 100][v], 1, C.faint, 6);
        k.restore();
      }
      spinner(k, VW / 2, end + 18, 10, u);
      k.restore();
    });
  };

  // @element 20
  // 20 ページ遷移アニメーション（リンクを押すと、色の幕が横切って次のページに切り替わる）
  CELLS[19] = (k, w, h, u) => {
    frame(k, u >= 1.3 && u < 3.5 ? 'example.com/works/02' : 'example.com/works');
    const CLK = [0.8, 3.0];
    const cover = t0 => eIO(P(u, t0, t0 + 0.4)), uncover = t0 => eIO(P(u, t0, t0 + 0.45));
    // 幕の左端: 入る −VW→0、出る 0→VW
    const xs = u < 1.4 ? -VW * (1 - cover(0.9)) : u < 3.1 ? VW * uncover(1.4) : u < 3.6 ? -VW * (1 - cover(3.1)) : VW * uncover(3.6);
    const pageB = u >= 1.3 && u < 3.5;
    const [cx, cy] = path([[0, 420, 150], [0.65, 255, 100], [2.6, 255, 100], [2.85, 46, 50], [3.3, 46, 50], [4.6, 420, 150], [4.8, 420, 150]], u);
    view(k, () => {
      header(k, 0);
      if (!pageB) {
        txt(k, 'WORKS', 34, 62, `800 18px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
        for (let i = 0; i < 3; i++) { const x = 34 + i * 152; pic(k, x, 74, 136, 60, i, 6); bars(k, x, 142, 100, 1, C.ink, 7); }
      } else {
        txt(k, '← 一覧へ', 34, 55, `700 12px ${JP}`, C.sub, 'left', 'middle');
        pic(k, 34, 68, 240, 90, 1, 8);
        txt(k, 'Project 02', 296, 96, `800 22px ${EN}`, C.ink); bars(k, 296, 110, 180, 3);
      }
      if (xs > -VW && xs < VW) { k.fillStyle = C.acc; k.fillRect(xs, 0, VW, VH); logo(k, xs + VW / 2 - 40, VH / 2, '#fff'); }
      click(k, cx, cy, u, CLK);
    });
  };

  // @element 21
  // 21 スムーススクロール（メニューを押すと、ページがなめらかに目的の場所まで動く）
  CELLS[20] = (k, w, h, u) => {
    frame(k);
    const TO = 296;   // 「料金」セクションの頭（330）− ヘッダーの高さ（34）
    const y = TO * eIO(P(u, 0.95, 2.0)) * (1 - eIO(P(u, 3.15, 4.2)));
    const [cx, cy] = path([[0, 380, 132], [0.75, 360, 18], [1.0, 360, 18], [2.9, 478, 140], [3.25, 478, 140], [4.8, 380, 132]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, 'ちょうどいい道具を。', 264, 84, `800 19px ${JP}`, C.ink); bars(k, 264, 98, 210, 3);
      k.fillStyle = C.soft; k.fillRect(0, 170, VW, 160);
      txt(k, '特長', VW / 2, 206, `800 17px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 100 + i * 155; k.fillStyle = C.blueL; k.beginPath(); k.arc(x, 252, 24, 0, 7); k.fill(); bars(k, x - 46, 288, 92, 2); }
      txt(k, '料金', VW / 2, 370, `800 17px ${JP}`, C.ink, 'center');
      ['¥0', '¥980', '¥2,980'].forEach((s, i) => {
        const x = 50 + i * 143, hi = i === 1; k.fillStyle = '#fff'; rr(k, x, 388, 125, 96, 8); k.fill();
        k.lineWidth = hi ? 2.5 : 1.5; k.strokeStyle = hi ? C.acc : C.faint; k.stroke();
        txt(k, s, x + 62.5, 428, `800 20px ${EN}`, hi ? C.acc : C.ink, 'center'); bars(k, x + 22, 444, 81, 2);
      });
      k.restore();
      header(k, 0, y > 250 ? 1 : -1);
      const tb = clamp((y - 60) / 40);   // ページトップへ戻るボタン
      if (tb > 0) { k.globalAlpha = tb; k.fillStyle = C.ink; k.beginPath(); k.arc(478, 140, 15, 0, 7); k.fill(); k.strokeStyle = '#fff'; k.lineWidth = 2.4; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(472, 143); k.lineTo(478, 136.5); k.lineTo(484, 143); k.stroke(); k.globalAlpha = 1; }
      sbar(k, y / TO * 0.7, 0.36);
      click(k, cx, cy, u, [0.9, 3.1]);
    });
  };

  // @element 22
  // 22 マーキー（文字の帯が、途切れずに横へ流れ続ける）
  CELLS[21] = (k, w, h, u) => {
    frame(k);
    const WORDS = ['WEB DESIGN', 'BRANDING', 'MOTION', 'UI/UX'], F = `800 30px ${EN}`, GAPW = 64;
    view(k, () => {
      bars(k, 34, 20, 180, 1, C.ink, 10); bars(k, 34, 38, 300, 1);
      k.fillStyle = C.ink; k.fillRect(0, 58, VW, 58);
      k.font = F; k.letterSpacing = '1px'; const ws = WORDS.map(s => k.measureText(s).width); k.letterSpacing = '0px';
      const unit = ws.reduce((a, b) => a + b + GAPW, 0);
      let x = -mod(u / CYC, 1) * unit;                 // 1周期で1組ぶん左へ
      for (let rep = 0; x < VW; rep++) WORDS.forEach((s, i) => {
        txt(k, s, x, 88, F, '#fff', 'left', 'middle', '1px');
        k.fillStyle = C.acc; k.beginPath(); k.arc(x + ws[i] + GAPW / 2, 88, 6, 0, 7); k.fill();
        x += ws[i] + GAPW;
      });
      for (let i = 0; i < 3; i++) { k.fillStyle = C.soft; rr(k, 34 + i * 152, 130, 136, 30, 6); k.fill(); bars(k, 46 + i * 152, 142, 90, 1, C.faint); }
    });
  };

  // @element 23
  // 23 グラデーションアニメーション（背景のグラデーションの色が、ゆっくり流れるように動き続ける）
  CELLS[22] = (k, w, h, u) => {
    frame(k);
    const a = 2 * Math.PI * u / CYC;                        // 4.8秒で1周
    const BLOBS = [[C.acc, 150, 60, 230, 70, 30, 0], ['#FFB08F', 380, 40, 210, 60, 40, 2.1], [C.blue, 330, 150, 240, 80, 30, 4.2], ['#9DB6FB', 90, 170, 200, 50, 35, 1.0]];
    view(k, () => {
      k.fillStyle = '#FFF1EB'; k.fillRect(0, 0, VW, VH);
      for (const [col, x0, y0, r, ax, ay, ph] of BLOBS) {
        const x = x0 + ax * Math.cos(a + ph), y = y0 + ay * Math.sin(a + ph);
        const g = k.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        k.globalAlpha = 0.85; k.fillStyle = g; k.fillRect(0, 0, VW, VH); k.globalAlpha = 1;
      }
      txt(k, 'Hello, Future.', 40, 82, `800 34px ${EN}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 40, 100, 200, 2, 'rgba(255,255,255,.8)', 6, 12, 0.6);
      btn(k, 40, 128, 104, 26, 'はじめる', '#fff', C.ink);
    });
  };

  // @element 24
  // 24 ふわふわアニメーション（画面の飾りが、ゆっくり上下に浮き沈みし続ける）
  CELLS[23] = (k, w, h, u) => {
    frame(k);
    const bob = (T, A, ph) => -A * Math.sin(2 * Math.PI * u / T + ph);   // 上下（easeInOut に近いサイン波）
    const y1 = bob(2.4, 8, 0), y2 = bob(1.6, 6, 1.2), y3 = bob(2.4, 6, 2.4);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, 'アプリで、', 34, 62, `800 24px ${JP}`, C.ink); txt(k, 'もっと身軽に。', 34, 94, `800 24px ${JP}`, C.ink);
      bars(k, 34, 108, 170, 2); btn(k, 34, 134, 112, 24, 'ダウンロード');
      // 影（上がるほど小さく薄く）
      const sh = 1 + y1 / 40;
      k.fillStyle = `rgba(28,35,51,${0.16 * sh})`; k.beginPath(); k.ellipse(352, 160, 54 * sh, 6 * sh, 0, 0, 7); k.fill();
      // スマホ
      k.save(); k.translate(0, y1);
      k.fillStyle = C.ink; rr(k, 306, 18, 92, 132, 16); k.fill(); k.fillStyle = '#fff'; rr(k, 312, 24, 80, 120, 11); k.fill();
      pic(k, 318, 32, 68, 52, 0, 6); bars(k, 318, 92, 68, 3, C.faint, 5, 10);
      k.restore();
      // 飾り（ハートの丸と星のチップ）
      k.save(); k.translate(0, y2); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = C.acc; k.beginPath(); k.arc(268, 54, 20, 0, 7); k.fill(); k.shadowColor = 'transparent';
      k.fillStyle = '#fff'; k.beginPath(); k.moveTo(268, 62); k.bezierCurveTo(254, 53, 260, 41, 268, 48); k.bezierCurveTo(276, 41, 282, 53, 268, 62); k.fill(); k.restore();
      k.save(); k.translate(0, y3); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = '#fff'; rr(k, 410, 92, 76, 30, 15); k.fill(); k.shadowColor = 'transparent';
      txt(k, '★ 4.8', 448, 108, `800 13px ${EN}`, C.acc, 'center', 'middle'); k.restore();
    });
  };
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "photo" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('photo', function () {
  // @kit
  // 写真の表現・光と画風 24（カード 539x208、1周 5秒）。各コマは時間 u の純関数。
  // 絵は平らな図形だけで描く。場面は3つを全コマで使い回す: ①光＝地平線の前の胸像 ②レンズ＝街角 ③仕上げ＝胸像と風景。
  // 人物は顔・髪のない丸い頭のピクト。光はアンバー1色の面、影は一段濃い平らな面で表す。
  // 色が主役の効果（モノクロ・デュオトーンなど）は、同じ場面の色の割り当て（パレット）を差し替えて見せる。
  // 多くの見本は「効果なし → あり → なし」を env(u) で切り替える（0.4〜1.4秒で入り、4.0秒まで保ち、4.8秒までに戻る）。
  const CW = 539, CH = 208, CYC = 5;
  const TAU = Math.PI * 2;
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // 効果の量: 0（なし）→ 1（あり）→ 0。イージングは3次のイーズインアウト
  const IN0 = 0.4, IN1 = 1.4, OUT0 = 4.0, OUT1 = 4.8;
  const env = u => eIO(P(u, IN0, IN1)) * (1 - eIO(P(u, OUT0, OUT1)));
  // 固定シードの乱数（mulberry32）
  function rng(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 1回だけ作って使い回す物（中身は固定なので毎回同じ）
  const MEMO = {};
  const once = (name, fn) => MEMO[name] || (MEMO[name] = fn());

  // ---------- 色 ----------
  const HEX = {};
  const hx = s => HEX[s] || (HEX[s] = [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)));
  const toHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => t <= 0 ? a : t >= 1 ? b : toHex(hx(a).map((v, i) => lerp(v, hx(b)[i], t)));
  const lum = s => { const c = hx(s); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  // パレット同士を t で混ぜる（効果の入り・戻りはこれで色を移す）
  const pal = (a, b, t) => { if (t <= 0) return a; if (t >= 1) return b; const o = {}; for (const key in a) o[key] = mixc(a[key], b[key], t); return o; };
  const mapPal = (a, f) => { const o = {}; for (const key in a) o[key] = f(a[key]); return o; };

  // 基本の場面の色: 明るいニュートラル（camera パックと同じ灰色の段）＋人物の青みグレー＋光のアンバー
  const BASE = {
    sky: '#FAF9F7', sky2: '#FAF9F7', far: '#EAEDF1', mid: '#DEE3EA', ground: '#F1F0EE', ground2: '#E2E1DE', mark: '#FAF9F7', cast: '#E2E1DE',
    bld: '#F1F0EE', edge: '#CFCECB', win: '#E2E1DE', winOff: '#E2E1DE', tree: '#E2E1DE', trunk: '#CFCECB', post: '#A9A8A5', bulb: '#CFCECB',
    person: '#4D5A75', shade: '#33405A', lit: '#FFC75A', car: '#8D97AA', glass: '#EEF1F5', tire: '#3E4452',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 周りの明かりを落とした場面（ライティングの見本で、光の当たる所だけを見せる）
  const DIM = {
    sky: '#E7E5E1', sky2: '#E7E5E1', far: '#DADCDF', mid: '#CFD2D7', ground: '#DDDBD7', ground2: '#D0CECA', mark: '#E7E5E1', cast: '#D0CECA',
    bld: '#DDDBD7', edge: '#C0BEBA', win: '#D0CECA', winOff: '#D0CECA', tree: '#D0CECA', trunk: '#C0BEBA', post: '#9D9B97', bulb: '#C0BEBA',
    person: '#4D5A75', shade: '#2C3750', lit: '#FFC75A', car: '#7E889B', glass: '#DDE1E7', tire: '#353B48',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 夜（ブルーアワー・長時間露光）。窓と街灯はアンバーに灯る
  const NIGHT = {
    sky: '#2C3B5E', sky2: '#4A6191', far: '#34466D', mid: '#2C3C60', ground: '#283452', ground2: '#222C47', mark: '#3A4A70', cast: '#1F2840',
    bld: '#34446B', edge: '#283657', win: '#FFC75A', winOff: '#2A3859', tree: '#2F3F64', trunk: '#253252', post: '#1E2843', bulb: '#FFC75A',
    person: '#1C2439', shade: '#141B2D', lit: '#FFC75A', car: '#222C47', glass: '#3A4A70', tire: '#141B2D',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 暗い場面（リムライト・ローキー）
  const DARK = {
    sky: '#2B2D33', sky2: '#2B2D33', far: '#313339', mid: '#36383E', ground: '#24252A', ground2: '#202125', mark: '#2B2D33', cast: '#1D1E22',
    bld: '#2F3137', edge: '#27292E', win: '#34363C', winOff: '#34363C', tree: '#323439', trunk: '#2A2C31', post: '#3B3D43', bulb: '#3B3D43',
    person: '#1F2128', shade: '#18191E', lit: '#FFC75A', car: '#303238', glass: '#3B3D43', tire: '#18191E',
    sun: '#F5A524', glow: '#FFE3A3'
  };

  // ---------- 図形 ----------
  // 図形を描く道具。M（点の写像）を渡すと、輪郭を細かく刻んでから写す（魚眼用）。M がなければそのまま描く
  function arcPts(x, y, r, n = 40) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  function rrPts(x, y, w, h, r) {
    const R = (Array.isArray(r) ? r : [r, r, r, r]).map(v => Math.min(v, w / 2, h / 2)), o = [];
    const corner = (cx, cy, rad, a0) => { if (rad <= 0) { o.push([cx, cy]); return; } for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; o.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
    corner(x + w - R[1], y + R[1], R[1], -Math.PI / 2);
    corner(x + w - R[2], y + h - R[2], R[2], 0);
    corner(x + R[3], y + h - R[3], R[3], Math.PI / 2);
    corner(x + R[0], y + R[0], R[0], Math.PI);
    return o;
  }
  function pen(k, M) {
    const cut = (pts, closed) => {
      const o = [], n = pts.length;
      for (let i = 0; i < (closed ? n : n - 1); i++) {
        const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
        for (let j = 0; j < m; j++) o.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]);
      }
      if (!closed) o.push(pts[n - 1]);
      return o.map(q => M(q[0], q[1]));
    };
    const path = (pts, closed) => { const q = M ? cut(pts, closed) : pts; k.beginPath(); q.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); if (closed) k.closePath(); };
    const D = {
      k,
      poly(pts, col) { path(pts, true); k.fillStyle = col; k.fill(); },
      rect(x, y, w, h, col) { if (!M) { k.fillStyle = col; k.fillRect(x, y, w, h); } else D.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col); },
      rr(x, y, w, h, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.roundRect(x, y, w, h, r); k.fill(); } else D.poly(rrPts(x, y, w, h, r), col); },
      circ(x, y, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); } else D.poly(arcPts(x, y, r), col); },
      line(pts, lw, col, dash) { path(pts, false); k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; if (dash) k.setLineDash(dash); k.stroke(); if (dash) k.setLineDash([]); },
      frame(x, y, w, h, lw, col) { path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); k.strokeStyle = col; k.lineWidth = lw; k.stroke(); }
    };
    return D;
  }

  // 小物（3つの場面で共通）: 建物・木・街灯・太陽・車
  function building(D, x, base, w, h, p, seed = 0) {
    D.rect(x, base - h, w, h, p.bld); D.frame(x, base - h, w, h, 1.4, p.edge);
    let n = seed;
    for (let y = base - h + 8; y < base - 12; y += 13) for (let xx = x + 7; xx < x + w - 9; xx += 11) { n++; D.rect(xx, y, 5, 7, (n * 7 + seed) % 3 === 0 ? p.win : p.winOff); }
  }
  function tree(D, x, base, r, p) { D.rect(x - r * 0.15, base - r * 1.4, r * 0.3, r * 1.4, p.trunk); D.circ(x, base - r * 1.6, r, p.tree); }
  function lamp(D, x, base, h, p) { D.rect(x - 1.6, base - h, 3.2, h, p.post); D.rect(x - 1.6, base - h, 10, 3, p.post); D.circ(x + 9, base - h + 5, 4, p.bulb); }
  // 太陽: 平らな2段の光の輪＋円
  function sun(D, x, y, r, p, a = 1) {
    const k = D.k; k.save();
    k.globalAlpha = 0.35 * a; D.circ(x, y, r * 2.6, p.glow);
    k.globalAlpha = 0.6 * a; D.circ(x, y, r * 1.7, p.glow);
    k.globalAlpha = a; D.circ(x, y, r, p.sun);
    k.restore();
  }
  function car(D, x, p, o = {}) {   // x = 車の中心、道の奥の車線を走る
    D.rr(x - 22, 128, 42, 13, [6, 6, 0, 0], p.car);
    D.rr(x - 18, 131, 16, 8, 2, p.glass); D.rr(x + 1, 131, 15, 8, 2, p.glass);
    D.rr(x - 35, 140, 70, 15, 5, p.car);
    D.rr(x + 30, 143, 5, 4, 1.5, o.head || p.glass); D.rr(x - 35, 143, 4, 4, 1.5, o.tail || p.edge);
    D.circ(x - 21, 156, 6, p.tire); D.circ(x + 21, 156, 6, p.tire);
    D.circ(x - 21, 156, 2.2, p.glass); D.circ(x + 21, 156, 2.2, p.glass);
  }

  // 人のピクト（全身）。camera パックと同じ組み方（頭・胴・腕・脚の角丸）。x = 足元の中心、feet = 足元の y、s = 身長(px)
  function figure(D, x, feet, s, col) {
    const m = s / 1.79, X = v => x + v * m, Y = v => feet - v * m;
    D.rr(X(-0.155), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col); D.rr(X(0.005), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col);
    D.rr(X(-0.31), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col); D.rr(X(0.19), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col);
    D.rr(X(-0.23), Y(1.46), 0.46 * m, 0.64 * m, 0.12 * m, col);
    D.circ(x, Y(1.63), 0.16 * m, col);
  }
  // 胸から上のピクト（同じ組み方を頭の半径 R で切り出す）。cx,cy = 頭の中心
  function bustPath(k, cx, cy, R) {
    k.beginPath(); k.arc(cx, cy, R, 0, TAU);
    k.roundRect(cx - 1.4375 * R, cy + 1.0625 * R, 2.875 * R, CH, 0.75 * R);
    k.roundRect(cx - 1.9375 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
    k.roundRect(cx + 1.1875 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
  }
  // 胸像を色 col で塗り、paint(k) で光と影の面を胸像の形の中だけに塗る
  function bust(k, cx, cy, R, col, paint) {
    k.save(); bustPath(k, cx, cy, R); k.fillStyle = col; k.fill();
    if (paint) { k.clip(); paint(k); }
    k.restore();
  }
  // 頭の影の面: 光が横から角度 az（0 = 正面、90° = 真横）で当たるとき、明暗の境は x = cx ± cos(az)·√(R²−dy²)。side = +1 で右側が影
  function headShade(k, cx, cy, R, az, side, col) {
    const c = Math.cos(az), n = 28; k.beginPath();
    for (let i = 0; i <= n; i++) { const y = cy - R + 2 * R * i / n; k.lineTo(cx + side * c * Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), y); }
    k.lineTo(cx + side * (R + 4), cy + R); k.lineTo(cx + side * (R + 4), cy - R); k.closePath(); k.fillStyle = col; k.fill();
  }

  // ---------- 3つの場面 ----------
  // ① 光: 地平線（y150）の前の胸像。左に建物2棟、右に街灯と木
  const PX = 270, PY = 78, PR = 29, HZ = 150;
  function stagePortrait(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 92, CW, HZ - 92, p.sky2);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    D.poly([[0, HZ], [0, 134], [70, 124], [150, 136], [230, 126], [330, 134], [420, 122], [539, 132], [539, HZ]], p.far);
    building(D, 34, HZ, 38, 50, p, 1); building(D, 76, HZ, 30, 32, p, 2);
    D.rect(0, HZ, CW, CH - HZ, p.ground);
    if (o.cast) { const L = o.cast; D.poly([[402, HZ], [405, HZ], [405 + L, HZ + 9], [402 + L, HZ + 9]], p.cast); D.poly([[452, HZ], [460, HZ], [460 + L * 0.9, HZ + 16], [452 + L * 0.9, HZ + 16]], p.cast); }
    lamp(D, 404, HZ, 58, p); tree(D, 456, HZ, 17, p);
    if (o.after) o.after(D);
  }
  // ② レンズ: 街角。奥に建物の列・木・街灯、手前に道と歩道、人物は左手前
  const BLD = [[-8, 52, 66], [48, 40, 90], [92, 54, 58], [150, 44, 78], [208, 32, 52], [296, 52, 84], [352, 48, 60], [404, 42, 98], [470, 40, 70], [514, 40, 88]];
  const TREES = [[136, 17], [262, 17], [384, 15]], LAMPS = [114, 292, 494], ROAD = 132, WALK = 162;
  const FIG = [176, 200, 124];   // 人物: 足元の x・y、身長
  function stageStreet(k, p, o = {}) {
    const D = pen(k, o.M);
    D.rect(-40, -40, CW + 80, CH + 80, p.sky);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    BLD.forEach(([x, w, h], i) => building(D, x, ROAD, w, h, p, i));
    TREES.forEach(([x, r]) => tree(D, x, ROAD, r, p));
    LAMPS.forEach(x => lamp(D, x, ROAD, 58, p));
    D.rect(-40, ROAD, CW + 80, WALK - ROAD, p.ground2);
    D.line([[-40, 147], [CW + 40, 147]], 2, p.mark, [14, 12]);
    if (o.car !== undefined && o.car !== false) car(D, o.car, p, o.carLights || {});
    D.rect(-40, WALK, CW + 80, CH - WALK + 40, p.ground); D.line([[-40, WALK], [CW + 40, WALK]], 1.4, p.edge);
    if (o.person !== false) figure(D, FIG[0], FIG[1], FIG[2], p.person);
    D.circ(18, 206, 17, p.tree); D.circ(42, 210, 11, p.tree); D.circ(516, 204, 19, p.tree); D.circ(494, 211, 11, p.tree);
    if (o.after) o.after(D);
  }
  // ③ 仕上げ: 左に胸像、右に丘と家と木と太陽。日は右から当たり、胸像の右の縁が光る
  const QX = 140, QY = 82, QR = 28;
  function stageLand(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 100, CW, 60, p.sky2);
    if (o.sunOn !== false) sun(D, 432, 54, 15, p);
    if (o.land !== false) {
      D.poly([[150, 162], [150, 130], [210, 116], [262, 124], [318, 100], [372, 114], [430, 104], [490, 120], [539, 110], [539, 162]], p.far);
      building(D, 346, 134, 30, 24, p, 3);
      D.poly([[150, 162], [150, 146], [226, 136], [300, 144], [368, 130], [440, 140], [500, 132], [539, 136], [539, 162]], p.mid);
      D.rect(0, 160, CW, CH - 160, p.ground);
      tree(D, 486, 162, 19, p); tree(D, 452, 162, 12, p);
    } else D.rect(0, 160, CW, CH - 160, p.ground);
    if (o.person !== false) bust(k, QX, QY, QR, p.person, kk => { headShade(kk, QX, QY, QR, 0.86, 1, p.lit); kk.fillStyle = p.lit; kk.fillRect(QX + 1.55 * QR, QY + QR, QR, CH); });
    if (o.after) o.after(D);
  }

  // ---------- 表示 ----------
  // 右上の数値（camera パックと同じ控えめな札）
  function hud(k, s) {
    k.save(); k.globalAlpha = 1;
    const m = 13, f = `600 15px ${MONO}`; k.font = f; const ww = k.measureText(s).width;
    k.fillStyle = 'rgba(255,255,255,.82)'; k.beginPath(); k.roundRect(CW - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
    k.fillStyle = '#6E6E73'; k.textAlign = 'right'; k.textBaseline = 'middle'; k.fillText(s, CW - m - 14, m + 18);
    k.restore();
  }
  // 右下の、真上から見た配置図: 頭（下がカメラ側）と光の位置。lights = [[角度, 明るさ0..1]]、角度は 0 = カメラ側、+90° = 画面の左
  function plan(k, lights) {
    const w = 66, h = 66, x = CW - 13 - w, y = CH - 13 - h, cx = x + w / 2, cy = y + h / 2 - 3;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#CFCECB'; k.beginPath(); k.roundRect(cx - 6, y + h - 10, 12, 6, 2); k.fill();
    k.fillStyle = '#A9A8A5'; k.beginPath(); k.arc(cx, cy, 8, 0, TAU); k.fill();
    k.beginPath(); k.moveTo(cx - 3.5, cy + 7); k.lineTo(cx + 3.5, cy + 7); k.lineTo(cx, cy + 12); k.fill();
    for (const [az, a] of lights) {
      const lx = cx - Math.sin(az) * 22, ly = cy + Math.cos(az) * 22;
      k.globalAlpha = a;
      k.strokeStyle = '#F5A524'; k.lineWidth = 1.4; k.setLineDash([2.5, 2.5]); k.beginPath(); k.moveTo(lx, ly); k.lineTo(lerp(lx, cx, 0.55), lerp(ly, cy, 0.55)); k.stroke(); k.setLineDash([]);
      k.fillStyle = '#F5A524'; k.beginPath(); k.arc(lx, ly, 4.5, 0, TAU); k.fill();
    }
    k.restore();
  }
  // 作業用のオフスクリーン（名前ごとに1枚・使う前に空にする）
  const LAYERS = {};
  function layer(name) {
    const c = LAYERS[name] || (LAYERS[name] = (() => { const e = document.createElement('canvas'); e.width = CW; e.height = CH; return e; })());
    const kk = c.getContext('2d'); kk.globalAlpha = 1; kk.filter = 'none'; kk.globalCompositeOperation = 'source-over'; kk.clearRect(0, 0, CW, CH);
    return [c, kk];
  }
  const cell = fn => (k, w, h, u) => { k.save(); fn(k, u); k.restore(); };

  // 胴の光と影（胴は円柱とみなし、左右に分けて塗る）。W = 胴の外側までの半幅
  const torsoW = R => 1.9375 * R;
  function torso(k, cx, cy, R, x0, x1, col) { k.fillStyle = col; k.fillRect(x0, cy + R, x1 - x0, CH); }
  // 時刻の表示（分 → hh:mm）
  const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  // 右下の小さなヒストグラム（明るさの分布）。c = 山の中心 0..1、s = 山の幅
  function histo(k, c, s) {
    const w = 96, h = 46, x = CW - 13 - w, y = CH - 13 - h, n = 20;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#A9A8A5';
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, v = Math.exp(-((t - c) ** 2) / (2 * s * s)) * 0.92 + 0.06; const bh = v * (h - 16); k.fillRect(x + 8 + i * (w - 16) / n, y + h - 8 - bh, (w - 16) / n - 1.2, bh); }
    k.restore();
  }

  const CELLS = [];

  // @element 01
  // 逆光: 太陽が画面の外から頭の真後ろへ回り込み、輪郭が光って人物は暗くなる
  CELLS[0] = cell((k, u) => {
    const a = env(u);
    const BACK = Object.assign({}, BASE, { sky: '#FFF4DC', sky2: '#FFEBC4', far: '#F6E2BE', ground: '#F7EAD3', bld: '#F7E9D2', winOff: '#EEDCBF', win: '#EEDCBF', tree: '#EEDCBF', edge: '#E3CFAE', post: '#CDB894', trunk: '#E3CFAE', bulb: '#E3CFAE' });
    stagePortrait(k, pal(BASE, BACK, a), { sun: [lerp(40, PX, a), lerp(-40, PY - 22, a), 20, 1] });
    // 輪郭の光: 胸像の形を太い線でなぞってから中を塗り、縁だけを残す
    k.save(); k.globalAlpha = a; bustPath(k, PX, PY, PR); k.strokeStyle = BASE.lit; k.lineWidth = 7; k.lineJoin = 'round'; k.stroke(); k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, BASE.shade, a));
    // かすみ: 全体に光の色を薄く重ねる
    k.save(); k.globalAlpha = 0.22 * a; k.fillStyle = BASE.glow; k.fillRect(0, 0, CW, CH); k.restore();
  });

  // @element 02
  // リムライト: 周りが暗くなり、斜め後ろ左右の2灯で頭と肩の輪郭だけが細く光る
  CELLS[1] = cell((k, u) => {
    const a = env(u);
    stagePortrait(k, pal(BASE, DARK, a));
    k.save(); k.globalAlpha = a; k.fillStyle = BASE.lit;
    for (const dx of [-3.5, 3.5]) { k.save(); k.translate(dx, -2.5); bustPath(k, PX, PY, PR); k.fill(); k.restore(); }
    k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, DARK.person, a));
    plan(k, [[Math.PI * 0.75, a], [-Math.PI * 0.75, a]]);
    hud(k, '±135°');
  });

  // @element 03
  // シルエット: 露出を明るい空に合わせると、人物も建物も木も黒い形だけになる
  CELLS[2] = cell((k, u) => {
    const a = env(u), INK = '#2A2D36';
    const SILH = mapPal(BASE, () => INK);
    Object.assign(SILH, { sky: '#FFEDC4', sky2: '#FFCF73', far: '#4A4546', sun: BASE.sun, glow: BASE.glow });
    stagePortrait(k, pal(BASE, SILH, a), { sun: [404, lerp(60, 128, a), 20, a] });
    bust(k, PX, PY, PR, mixc(BASE.person, '#22252D', a));
    hud(k, `${(-2 * a).toFixed(1).replace('-0.0', '±0.0')} EV`);
  });

  // @element 04
  // スプリットライティング: 光が真横（90°）へ回り、顔の右半分が影に沈む
  CELLS[3] = cell((k, u) => {
    const a = env(u), az = lerp(0.35, Math.PI / 2, a);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a), W = torsoW(PR);
    bust(k, PX, PY, PR, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, PR, 0, TAU); kk.fill();
      headShade(kk, PX, PY, PR, az, 1, sh);
      torso(kk, PX, PY, PR, PX - W, PX - Math.cos(az) * 0.4 * W - 0.4 * W, lit);
      torso(kk, PX, PY, PR, PX + Math.cos(az) * W, PX + W, sh);
    });
    plan(k, [[az, a]]);
    hud(k, `${Math.round(az * 180 / Math.PI)}° · ↑0°`);
  });

  // @element 05
  // レンブラントライティング: 斜め45°・上からの光。影側の頬に三角形の光が残る
  CELLS[4] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      kk.fillStyle = sh; kk.fillRect(PX + 0.04 * R, PY - R - 2, R * 2, R * 2 + 4);       // 鼻筋から右は影
      kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.clip();
      kk.fillStyle = lit; kk.beginPath();                                                   // 影側の頬に残る光の三角形
      kk.moveTo(PX + 0.24 * R, PY - 0.12 * R); kk.lineTo(PX + 0.7 * R, PY - 0.12 * R); kk.lineTo(PX + 0.24 * R, PY + 0.5 * R); kk.closePath(); kk.fill();
    });
    bust(k, PX, PY, R, 'rgba(0,0,0,0)', kk => {
      kk.fillStyle = 'rgba(0,0,0,0)';
      torso(kk, PX, PY, R, PX - W, PX - 0.45 * W, lit);
      torso(kk, PX, PY, R, PX + 0.3 * W, PX + W, sh);
    });
    plan(k, [[Math.PI / 4, a]]);
    hud(k, '45° · ↑45°');
  });

  // @element 06
  // バタフライライティング: 顔の正面・高い位置からの光。顔は左右対称に明るく、あごの下にだけ小さな影
  CELLS[5] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      torso(kk, PX, PY, R, PX - 0.8 * W, PX + 0.8 * W, lit);
      kk.fillStyle = sh; kk.beginPath(); kk.ellipse(PX, PY + R * 1.06, R * 0.72, R * 0.38, 0, 0, TAU); kk.fill();    // あごの下の影（左右対称）
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
    });
    plan(k, [[0, a]]);
    hud(k, '0° · ↑45°');
  });

  // @element 07
  // ゴールデンアワー: 太陽が地平線近くまで下り、全体が橙に染まって影が長く伸びる
  CELLS[6] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    const GOLD = {
      sky: '#FFE8BC', sky2: '#FFCF80', far: '#F2C58C', mid: '#E8B27A', ground: '#F6DDB0', ground2: '#ECC892', mark: '#F6DDB0', cast: '#DDAA6E',
      bld: '#F7DCAE', edge: '#D9AE76', win: '#ECC892', winOff: '#ECC892', tree: '#E9C08A', trunk: '#C9965E', post: '#B98A58', bulb: '#C9965E',
      person: '#5C5470', shade: '#3E3650', lit: '#FFB547', car: '#A08E8E', glass: '#F6DDB0', tire: '#3E3650', sun: '#F59A24', glow: '#FFD48A'
    };
    const p = pal(BASE, GOLD, a);
    stagePortrait(k, p, { sun: [lerp(110, 96, a), lerp(-30, 136, a), 18, 1], cast: lerp(0, 150, a) });
    const lit = mixc(p.person, GOLD.lit, a), sh = mixc(p.person, GOLD.shade, a);
    bust(k, PX, PY, R, p.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      headShade(kk, PX, PY, R, 1.15, 1, sh);
      torso(kk, PX, PY, R, PX - W, PX - 0.5 * W, lit);
      torso(kk, PX, PY, R, PX + 0.4 * W, PX + W, sh);
    });
    hud(k, clock(lerp(720, 1060, a)));
  });

  // @element 08
  // ブルーアワー: 日が沈んだ後、空が深い青になり、窓と街灯の暖かい光が灯る
  CELLS[7] = cell((k, u) => {
    const a = env(u);
    const p = pal(BASE, NIGHT, a);
    stagePortrait(k, p, {
      sun: [120, lerp(40, 190, P(a, 0, 0.7)), 18, 1 - P(a, 0.4, 0.8)],
      after: D => { const k2 = D.k; k2.save(); k2.globalAlpha = 0.35 * a; D.circ(413, HZ - 53, 13, BASE.glow); k2.globalAlpha = 0.6 * a; D.circ(413, HZ - 53, 8, BASE.glow); k2.restore(); D.circ(413, HZ - 53, 4, p.bulb); }
    });
    bust(k, PX, PY, PR, p.person);
    hud(k, clock(lerp(720, 1115, a)));
  });

  // @element 09
  // ボケ: 絞りを開けると、人物はくっきりのまま、背景の灯りが大きな丸になってにじむ
  CELLS[8] = cell((k, u) => {
    const a = env(u), p = pal(BASE, DIM, a);
    const [B, kb] = layer('bokeh'); stageStreet(kb, p, { person: false });
    const [Bb, kbb] = layer('bokeh-b'); kbb.filter = `blur(${(6 * a).toFixed(2)}px)`; kbb.drawImage(B, 0, 0); kbb.filter = 'none';
    k.drawImage(B, 0, 0); k.drawImage(Bb, 0, 0);
    // 灯り: 街灯3つと、窓や遠くの灯り12個（横に45pxおき・高さと大きさは固定シード）。絞りを開くほど丸が大きく薄くなる
    const pts = once('bokeh-pts', () => {
      const o = LAMPS.map(x => [x + 9, ROAD - 53, 1.25, 0]), r = rng(9);
      for (let i = 0; i < 12; i++) o.push([22 + i * 45 + r() * 20, 44 + r() * 70, 0.6 + r() * 0.6, 1]);
      return o;
    });
    k.save();
    for (const [x, y, s, w] of pts) {
      const r = (2.4 + 15 * a) * s;
      k.globalAlpha = lerp(1, 0.55, a); k.fillStyle = w ? BASE.glow : BASE.lit; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
      k.globalAlpha = 0.7 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.2; k.stroke();
    }
    k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    const stops = ['f/16', 'f/11', 'f/8', 'f/5.6', 'f/4', 'f/2.8', 'f/2', 'f/1.4'];
    hud(k, stops[Math.round(a * 7)]);
  });

  // @element 10
  // ティルトシフト: 上下の帯がぼけて中央の帯だけピントが合い、街と小さな人と車が模型のように見える
  CELLS[9] = cell((k, u) => {
    const a = env(u), carX = lerp(-60, 600, u / CYC);
    const minis = D => { [[196, 26], [322, 26], [340, 23], [452, 25]].forEach(([x, h]) => figure(D, x, 172, h, BASE.person)); };
    const [S, ks] = layer('tilt'); stageStreet(ks, BASE, { car: carX, person: false, after: minis });
    const [B1, k1] = layer('tilt-1'); k1.filter = `blur(${(3 * a).toFixed(2)}px)`; k1.drawImage(S, 0, 0); k1.filter = 'none';
    const [B2, k2] = layer('tilt-2'); k2.filter = `blur(${(7 * a).toFixed(2)}px)`; k2.drawImage(S, 0, 0); k2.filter = 'none';
    k.drawImage(S, 0, 0);
    const band = (img, y0, y1) => { k.save(); k.beginPath(); k.rect(0, y0, CW, y1 - y0); k.clip(); k.drawImage(img, 0, 0); k.restore(); };
    band(B2, 0, 42); band(B1, 42, 66); band(B1, 176, 190); band(B2, 190, CH);
    // ピントの帯の目印（写真アプリの線）
    k.save(); k.globalAlpha = 0.75 * a; k.strokeStyle = '#8E8E93'; k.lineWidth = 1.4; k.setLineDash([6, 5]);
    k.beginPath(); k.moveTo(0, 66); k.lineTo(CW, 66); k.moveTo(0, 176); k.lineTo(CW, 176); k.stroke(); k.setLineDash([]);
    k.restore();
  });

  // @element 11
  // 長時間露光: シャッターを開け続けると、夜道の車は消え、ライトだけが光の線になる
  CELLS[10] = cell((k, u) => {
    const a = env(u), x = lerp(-60, 600, u / CYC);
    const p = pal(BASE, NIGHT, a);
    stageStreet(k, p, {
      car: false, person: false,
      after: D => {
        const kk = D.k;
        // 車の通った跡: 尾灯（赤）と前照灯（白〜アンバー）の線。車の後ろに伸びる
        kk.save(); kk.globalAlpha = a; kk.lineCap = 'round';
        const x0 = -60, x1 = Math.min(x, CW + 40);
        const ln = (ya, yb, c1, c2, w1, w2) => { kk.strokeStyle = c1; kk.lineWidth = w1; kk.beginPath(); kk.moveTo(x0, ya); kk.lineTo(x1, ya); kk.stroke(); kk.strokeStyle = c2; kk.lineWidth = w2; kk.beginPath(); kk.moveTo(x0, yb); kk.lineTo(x1, yb); kk.stroke(); };
        ln(145, 149, '#FF5B4D', '#FF8A6E', 2.6, 1.4);
        // 反対車線の車たちの跡（画面いっぱい）
        for (const [y, c, lw] of [[135, '#FFE9B8', 2.6], [138.5, BASE.lit, 1.6], [141.5, '#FFE9B8', 1.2]]) { kk.strokeStyle = c; kk.lineWidth = lw; kk.beginPath(); kk.moveTo(-10, y); kk.lineTo(CW + 10, y); kk.stroke(); }
        kk.restore();
      }
    });
    // 車の本体は露光が長いほど薄く写る
    k.save(); k.globalAlpha = 1 - 0.9 * a; const D = pen(k);
    car(D, x, p, { head: BASE.lit, tail: '#FF5B4D' }); k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    hud(k, a > 0.5 ? '8″' : '1/250');
  });

  // @element 12
  // 流し撮り: 走る車を追ってカメラを振ると、車はくっきり、背景だけ横に流れる
  CELLS[11] = cell((k, u) => {
    const a = env(u);
    const drive = lerp(-80, 620, u / CYC), x = lerp(drive, 270 + 10 * Math.sin(u / CYC * TAU), a);
    const S = 46 * a, n = S < 0.5 ? 1 : 12;
    for (let i = 0; i < n; i++) {   // 背景を横にずらして重ね、平均をとる（流れ）
      k.save(); k.globalAlpha = 1 / (i + 1); k.translate(n > 1 ? lerp(-S / 2, S / 2, i / (n - 1)) : 0, 0); stageStreet(k, BASE, { car: false, person: false }); k.restore();
    }
    const D = pen(k); car(D, x, BASE, { head: BASE.lit });
    // 車輪の回転（1周に12回転＝継ぎ目なし）
    k.save(); k.strokeStyle = BASE.tire; k.lineWidth = 1.6;
    for (const wx of [x - 21, x + 21]) { const t = u / CYC * TAU * 12; k.beginPath(); k.moveTo(wx - Math.cos(t) * 5, 156 - Math.sin(t) * 5); k.lineTo(wx + Math.cos(t) * 5, 156 + Math.sin(t) * 5); k.stroke(); }
    k.restore();
    hud(k, a > 0.5 ? '1/15' : '1/1000');
  });

  // @element 13
  // レンズフレア: 建物の陰から太陽が出ると、画面の中心をはさんで反対側へ光の玉が並ぶ
  CELLS[12] = cell((k, u) => {
    const a = env(u), sx = lerp(428, 474, a), sy = lerp(74, 30, a);
    stageStreet(k, BASE, { sun: [sx, sy, 13, 1] });
    const cx = CW / 2, cy = CH / 2, dx = cx - sx, dy = cy - sy;
    k.save();
    // 太陽の光の筋
    k.globalAlpha = 0.75 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.6; k.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU + 0.2, L = i % 2 ? 26 : 44; k.beginPath(); k.moveTo(sx + Math.cos(t) * 17, sy + Math.sin(t) * 17); k.lineTo(sx + Math.cos(t) * L, sy + Math.sin(t) * L); k.stroke(); }
    // 光の玉: 太陽から中心を通る線の上（t = 0.45〜2.0）
    const G = [[0.45, 7, 'c', 0.6], [0.8, 13, 'h', 0.55], [1.15, 5, 'c', 0.7], [1.45, 22, 'h', 0.4], [1.75, 9, 'c', 0.55], [2.0, 30, 'r', 0.55]];
    for (const [t, r, kind, al] of G) {
      const x = sx + dx * t, y = sy + dy * t;
      k.globalAlpha = al * a;
      if (kind === 'r') { k.strokeStyle = BASE.lit; k.lineWidth = 3; k.beginPath(); k.arc(x, y, r, 0, TAU); k.stroke(); continue; }
      k.fillStyle = kind === 'h' ? BASE.glow : BASE.lit; k.beginPath();
      if (kind === 'h') for (let i = 0; i < 6; i++) { const t2 = i / 6 * TAU; k.lineTo(x + Math.cos(t2) * r, y + Math.sin(t2) * r); } else k.arc(x, y, r, 0, TAU);
      k.closePath(); k.fill();
    }
    k.restore();
  });

  // @element 14
  // 魚眼レンズ: 中心がふくらみ、建物の縦の線が外側へ丸く曲がる
  CELLS[13] = cell((k, u) => {
    const a = env(u), kk = 1.25 * a, cx = CW / 2, cy = CH / 2, R2 = cx * cx + cy * cy;
    const M = kk < 0.002 ? null : (x, y) => { const dx = x - cx, dy = y - cy, g = (1 + kk) / (1 + kk * (dx * dx + dy * dy) / R2); return [cx + dx * g, cy + dy * g]; };
    stageStreet(k, BASE, { M });
    hud(k, `${Math.round(lerp(24, 8, a))}mm`);
  });

  // @element 15
  // 色収差: 赤・緑・青を少しずつ違う大きさで重ね、画面の端ほど縁に赤と青のずれが出る
  CELLS[14] = cell((k, u) => {
    const a = env(u), s = 0.02 * a, cx = CW / 2, cy = CH / 2;
    if (s < 0.0005) { stageStreet(k, BASE); return; }
    const [S, ks] = layer('ca'); stageStreet(ks, BASE);
    k.fillStyle = '#000000'; k.fillRect(0, 0, CW, CH);
    for (const [col, sc] of [['#FF0000', 1 + 2 * s], ['#00FF00', 1 + s], ['#0000FF', 1]]) {
      const [L, kl] = layer('ca-' + col); kl.drawImage(S, 0, 0); kl.globalCompositeOperation = 'multiply'; kl.fillStyle = col; kl.fillRect(0, 0, CW, CH); kl.globalCompositeOperation = 'source-over';
      k.save(); k.globalCompositeOperation = 'lighter'; k.translate(cx, cy); k.scale(sc, sc); k.translate(-cx, -cy); k.drawImage(L, 0, 0); k.restore();
    }
  });

  // @element 16
  // 周辺減光（ビネット）: 四隅だけがなだらかに暗くなり、中央の人物に目が集まる
  CELLS[15] = cell((k, u) => {
    const a = env(u);
    stageStreet(k, BASE);
    // 楕円の放射グラデーション: 半径の45%までは素通し、外へ向かって 0 → 70% の濃さ
    k.save(); k.translate(CW / 2, CH / 2); k.scale(1, CH / CW * 1.35);
    const g = k.createRadialGradient(0, 0, CW * 0.45 * 0.62, 0, 0, CW * 0.62);
    g.addColorStop(0, 'rgba(32,35,43,0)'); g.addColorStop(1, `rgba(32,35,43,${(0.7 * a).toFixed(3)})`);
    k.fillStyle = g; k.fillRect(-CW, -CW, CW * 2, CW * 2); k.restore();
  });

  // @element 17
  // ハイキー: 明るい色だけになり、影はごく薄く、明るさの山が右端へ寄る
  CELLS[16] = cell((k, u) => {
    const a = env(u);
    const HIGH = {
      sky: '#FFFFFF', sky2: '#FFFFFF', far: '#F5F6F8', mid: '#EEF0F3', ground: '#FBFBFA', ground2: '#F3F3F1', mark: '#FFFFFF', cast: '#F3F3F1',
      bld: '#FBFBFA', edge: '#E9E9E7', win: '#F2F2F0', winOff: '#F2F2F0', tree: '#F0F0EE', trunk: '#E5E5E3', post: '#DADAD8', bulb: '#E5E5E3',
      person: '#B9C0CE', shade: '#A6AEBF', lit: '#FFE6AE', car: '#E4E7EC', glass: '#FFFFFF', tire: '#C5CAD3', sun: '#FFD889', glow: '#FFF3D8'
    };
    stageLand(k, pal(BASE, HIGH, a));
    histo(k, lerp(0.56, 0.85, a), lerp(0.2, 0.09, a));
  });

  // @element 18
  // ローキー: 画面の大半が暗く沈み、横からの光が当たる縁だけが浮かぶ
  CELLS[17] = cell((k, u) => {
    const a = env(u);
    const LOW = Object.assign({}, DARK, { sun: DARK.sky, glow: DARK.sky, person: '#25272E', lit: '#FFB547' });
    stageLand(k, pal(BASE, LOW, a));
    histo(k, lerp(0.56, 0.14, a), lerp(0.2, 0.08, a));
  });

  // @element 19
  // モノクロ: 色を抜き、明るさだけで見せる（コントラストを少し強める）
  CELLS[18] = cell((k, u) => {
    const a = env(u);
    const GRAY = mapPal(BASE, c => { const g = clamp((lum(c) - 140) * 1.25 + 140, 0, 255); return toHex([g, g, g]); });
    stageLand(k, pal(BASE, GRAY, a));
  });

  // @element 20
  // デュオトーン: 暗い所を藍、明るい所をピンクの2色だけに置き換える
  CELLS[19] = cell((k, u) => {
    const a = env(u);
    const DUO = mapPal(BASE, c => mixc('#1F2A5C', '#FF9FB2', Math.pow(clamp((lum(c) - 70) / (250 - 70)), 2.4)));
    stageLand(k, pal(BASE, DUO, a));
  });

  // @element 21
  // ティール＆オレンジ: 空と影を青緑、日の当たる肌と太陽を橙に寄せる
  CELLS[20] = cell((k, u) => {
    const a = env(u);
    const TO = {
      sky: '#CFE6E3', sky2: '#B7DAD6', far: '#8CC1BE', mid: '#62A2A1', ground: '#3F8083', ground2: '#2F6A6E', mark: '#CFE6E3', cast: '#2F6A6E',
      bld: '#A8D1CE', edge: '#4E8E8F', win: '#62A2A1', winOff: '#62A2A1', tree: '#2F6A6E', trunk: '#1F5357', post: '#1F5357', bulb: '#1F5357',
      person: '#1D4E53', shade: '#143F43', lit: '#FF9248', car: '#2F6A6E', glass: '#CFE6E3', tire: '#143F43', sun: '#FF8236', glow: '#FFC48C'
    };
    stageLand(k, pal(BASE, TO, a));
  });

  // @element 22
  // フィルムグレイン: 細かい粒子が全体に乗り、全体が少し暖かい色に寄る
  CELLS[21] = cell((k, u) => {
    const a = env(u);
    const FILM = mapPal(BASE, c => mixc(c, '#F2DDBE', 0.16));
    const p = pal(BASE, FILM, a);
    const G = once('grain', () => { const r = rng(22), o = []; for (let i = 0; i < 2600; i++) o.push([r() * CW, r() * CH, 0.8 + r() * 0.9, r() < 0.55 ? 0 : 1, 0.16 + r() * 0.22]); return o; });
    const grain = kk => { kk.save(); for (const [x, y, s, d, al] of G) { kk.globalAlpha = al * a; kk.fillStyle = d ? '#FFFFFF' : '#3A3530'; kk.fillRect(x, y, s, s); } kk.restore(); };
    stageLand(k, p); grain(k);
  });

  // @element 23
  // ライトリーク: 右端から、フィルムに光がもれたような赤と橙のにじみが帯になって入る
  CELLS[22] = cell((k, u) => {
    const a = env(u), w = Math.sin(u / CYC * TAU);
    stageLand(k, BASE);
    k.save();
    // 縦長の楕円を右端の外に中心を置いて重ねる（外ほど淡い黄、端ほど赤）
    const band = (rx, col, al) => { k.globalAlpha = al * a; k.fillStyle = col; k.beginPath(); k.ellipse(CW + 30 + 6 * w, CH / 2, rx * a, CH * 1.1, 0, 0, TAU); k.fill(); };
    band(250, '#FFD089', 0.35); band(170, '#FF9A3D', 0.4); band(95, '#FF5A3A', 0.45); band(45, '#FF3B30', 0.5);
    k.restore();
  });

  // @element 24
  // 二重露光: 背景が白く飛び、胸像の形の中にだけ丘と家と木と太陽が写り込む
  CELLS[23] = cell((k, u) => {
    const a = env(u);
    const DX = Object.assign({}, BASE, { sky: '#D3DBE6', sky2: '#D3DBE6', far: '#9AA8BD', mid: '#76869F', ground: '#55647E', bld: '#E8ECF2', edge: '#55647E', win: '#9AA8BD', winOff: '#9AA8BD', tree: '#3F4C66', trunk: '#3F4C66' });
    const draw = kk => {
      kk.fillStyle = '#FFFFFF'; kk.fillRect(0, 0, CW, CH);
      kk.save(); bustPath(kk, QX, QY, QR); kk.clip();
      // 風景を0.7倍にして、太陽が頭の右上、丘の稜線が首のあたりに来るように置く
      kk.translate(QX, QY); kk.scale(0.7, 0.7); kk.translate(-415, -77);
      kk.fillStyle = DX.sky; kk.fillRect(0, -200, CW * 2, CH * 3);
      stageLand(kk, DX, { person: false });
      kk.fillStyle = DX.ground; kk.fillRect(-CW, 200, CW * 3, CH * 3);
      kk.restore();
    };
    if (a >= 0.999) { draw(k); return; }   // 効果が入りきったら直接描く（拡大表示でも輪郭がくっきり）
    stageLand(k, BASE);
    if (a < 0.002) return;
    const [L, kl] = layer('dx'); draw(kl);   // 入り・戻りの途中は、別の面に描いて重ねる
    k.save(); k.globalAlpha = a; k.drawImage(L, 0, 0); k.restore();
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "motion2" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('motion2', function () {
  // @kit
  // モーショングラフィックスの演出の名前 第2弾 24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // カードの中だけ共通パレット（濃紺の地＋青・コーラル・黄・ミント）。第1弾（motion）と同じ見た目。
  const CW = 539, CH = 208;
  const CYC = 4.7;                          // 各カードは4.7秒周期（ループの継ぎ目なし）
  const C = {
    navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
    blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6'
  };
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);   // 0→行き過ぎ→1
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  // 整数→0..1 の決まった乱数（コマ番号ごとの揺れ・入れ替わりに使う。描画時の Math.random は使わない）
  // 浮動小数の誤差で周期の終わり（4.6999…）と始まり（0）が別のコマ扱いになるのを防ぐ
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  function H01(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; let x = -tot / 2; return [...s].map((ch, i) => { const o = { ch, x: x + (ws[i] - ls) / 2, w: ws[i] - ls }; x += ws[i]; return o; }); }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  const CELLS = [];

  // @element 01
  // 01 アンティシペーション（進む向きと逆へ少し引いて、つぶれて溜めてから、勢いよく飛び出す）
  CELLS[0] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const XL = 108, XR = w - 108, xs = dir > 0 ? XL : XR, xe = dir > 0 ? XR : XL, floor = h - 30, S = 86, BACK = 44;
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    const wind = eIOs(P(lu, 0.2, 0.95)), go = P(lu, 0.95, 1.38);
    let x, sx = 1, sy = 1, rot = 0;
    if (go <= 0) { x = xs - dir * BACK * wind; sx = 1 + 0.22 * wind; sy = 1 - 0.24 * wind; rot = -dir * 0.18 * wind; }
    else {
      x = lerp(xs - dir * BACK, xe, backOut(go, 1.1));
      const st = go < 0.6 ? Math.sin(Math.PI * go / 0.6) : 0;
      sx = 1 + 0.55 * st; sy = 1 - 0.28 * st; rot = dir * 0.08 * st;
      const land = lu - 1.38; if (land > 0) { const wob = 0.13 * Math.exp(-7 * land) * Math.sin(17 * land); sy = 1 - wob; sx = 1 + wob; }
    }
    // 飛び出した地点の土けむり
    if (go > 0 && go < 0.7) { const q = go / 0.7; k.fillStyle = C.dim; k.globalAlpha = 0.8 * (1 - q); for (let i = 0; i < 3; i++) { k.beginPath(); k.arc(xs - dir * (BACK + 30 + i * 22 + q * 30), floor - 8 - i * 6 - q * 10, 7 + q * 12 - i * 2, 0, 7); k.fill(); } k.globalAlpha = 1; }
    // 影
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, S * 0.62 * sx, 6, 0, 0, 7); k.fill();
    // スピード線
    if (go > 0.02 && go < 0.8) { const a = 1 - go / 0.8; k.strokeStyle = C.yel; k.lineCap = 'round'; k.lineWidth = 8; k.globalAlpha = a;[0.28, 0.55, 0.8].forEach((f, i) => { const y = floor - S * sy * f, x0 = x - dir * (S * sx / 2 + 12), L = 120 * a + 20; k.beginPath(); k.moveTo(x0, y); k.lineTo(x0 - dir * L * (i === 1 ? 1 : 0.7), y); k.stroke(); }); k.globalAlpha = 1; }
    k.save(); k.translate(x, floor); k.rotate(rot); k.scale(sx, sy);
    k.fillStyle = C.coral; rr(k, -S / 2, -S, S, S, 24); k.fill();
    k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, -S / 2, -S, S, S / 2, [24, 24, 0, 0]); k.fill();
    k.strokeStyle = '#fff'; k.lineWidth = 10; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(-dir * 12, -S / 2 - 20); k.lineTo(dir * 12, -S / 2); k.lineTo(-dir * 12, -S / 2 + 20); k.stroke();
    k.restore();
  };

  // @element 02
  // 02 フォロースルー（体が止まった後も、旗としっぽだけが遅れて揺れて収まる）
  const FTAB = (() => {
    const T = CYC / 2, dt = 1 / 600, N = Math.ceil(T / dt) + 2, D = CW - 2 * 118;
    const pos = lu => { const q = P(lu, 0.15, 0.85), c = 1 / 0.85; return (q < 0.3 ? q * q / 0.6 : 0.15 + (q - 0.3)) * c; };
    const A = new Float32Array(N), B = new Float32Array(N);
    let a = 0, va = 0, b = 0, vb = 0, xp = 0, vp = 0;
    for (let i = 0; i < N; i++) {
      const lu = i * dt, x = pos(lu) * D, v = (x - xp) / dt, acc = i ? (v - vp) / dt : 0; xp = x; vp = v;
      va += (-121 * a - 5.5 * va - acc * 0.0175) * dt; a += va * dt;
      vb += (-56 * b - 2.8 * vb - acc * 0.012) * dt; b += vb * dt;
      const fade = 1 - smooth(P(lu, T - 0.3, T)); A[i] = a * fade; B[i] = b * fade;
    }
    return { A, B, pos, D };
  })();
  CELLS[1] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const i = Math.min(FTAB.A.length - 1, Math.round(lu * 600)), q = FTAB.pos(lu);
    const xs = dir > 0 ? 118 : w - 118, x = xs + dir * q * FTAB.D;
    const floor = h - 26, R = 38, cy = floor - R, a = dir * FTAB.A[i];
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, R * 1.1, 6, 0, 0, 7); k.fill();
    // 滑っている間のスピード線
    const moving = lu > 0.2 && lu < 0.85;
    if (moving) { k.strokeStyle = C.dim; k.lineCap = 'round'; k.lineWidth = 6; k.globalAlpha = 0.7;[[-18, 70], [6, 100], [26, 56]].forEach(([dy, L]) => { const x0 = x - dir * (R + 30); k.beginPath(); k.moveTo(x0, cy + dy); k.lineTo(x0 - dir * L, cy + dy); k.stroke(); }); k.globalAlpha = 1; }
    // しっぽ（体の後ろ）
    let px = x - dir * (R - 8), py = cy + 10; const pts = [[px, py]];
    for (let j = 1; j <= 7; j++) {
      const ij = Math.max(0, i - j * 22), d = FTAB.B[ij] * (0.55 + j * 0.16), ang0 = Math.PI + 0.25 + d;
      const ang = dir > 0 ? ang0 : Math.PI - ang0; px += Math.cos(ang) * 14; py += Math.sin(ang) * 14; pts.push([px, py]);
    }
    k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = C.coral;
    for (let j = 1; j < pts.length; j++) { k.lineWidth = lerp(14, 6, j / pts.length); k.beginPath(); k.moveTo(pts[j - 1][0], pts[j - 1][1]); k.lineTo(pts[j][0], pts[j][1]); k.stroke(); }
    k.fillStyle = C.coral; k.beginPath(); k.arc(px, py, 9, 0, 7); k.fill();
    // 体
    k.fillStyle = C.mint; k.beginPath(); k.arc(x, cy, R, 0, 7); k.fill();
    k.fillStyle = 'rgba(255,255,255,.18)'; k.beginPath(); k.arc(x - 10, cy - 12, R * 0.55, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + dir * 16, cy - 6, 9, 0, 7); k.fill();
    k.fillStyle = C.navy; k.beginPath(); k.arc(x + dir * 19, cy - 6, 4.5, 0, 7); k.fill();
    // アンテナの旗
    const L = 58, top = cy - R + 4;
    k.save(); k.translate(x, top); k.rotate(a);
    k.strokeStyle = '#fff'; k.lineWidth = 5; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -L); k.stroke();
    k.rotate(a * 0.6);
    k.fillStyle = C.yel; k.beginPath(); k.moveTo(0, -L); k.quadraticCurveTo(-dir * 22, -L + 4 + 8 * a * dir, -dir * 44, -L + 12); k.lineTo(0, -L + 28); k.closePath(); k.fill();
    k.restore();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + Math.sin(a) * L, top - Math.cos(a) * L, 6, 0, 7); k.fill();
  };

  // @element 03
  // 03 バウンス（ボールが落ちて、だんだん低く弾みながら止まる）
  const BNC = (() => { const g = 1900, e = 0.56, d = 190, t0 = Math.sqrt(2 * d / g), v0 = g * t0; const segs = []; let t = t0, v = v0 * e; while (v > 35) { segs.push({ t, v }); t += 2 * v / g; v *= e; } const imp = [{ t: t0, v: v0 }]; segs.forEach((s, i) => { if (i) imp.push({ t: s.t, v: segs[i - 1].v }); }); return { g, d, t0, segs, imp, end: t }; })();
  function bounceH(t) { const B = BNC; if (t < B.t0) return B.d - 0.5 * B.g * Math.max(0, t) * Math.max(0, t) * (t < 0 ? 0 : 1); for (const s of B.segs) { const tau = t - s.t; if (tau >= 0 && tau < 2 * s.v / B.g) return s.v * tau - 0.5 * B.g * tau * tau; } return 0; }
  CELLS[2] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, t = lu - 0.1;
    const floor = h - 26, R = 26, rest = floor - R, x = lerp(150, 390, eOut(P(lu, 0.1, 1.8)));
    const hg = t < 0 ? BNC.d : bounceH(t), out = 1 - backIn(P(lu, 1.95, 2.25), 2);
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    // 着地の印
    let sq = 0;
    for (const im of BNC.imp) {
      const dtI = t - im.t;
      if (Math.abs(dtI) < 0.045) sq = Math.max(sq, clamp(im.v / 850) * 0.4 * (1 - Math.abs(dtI) / 0.045));
      if (dtI > 0 && dtI < 0.3 && im.v > 200) { const q = dtI / 0.3, ix = lerp(150, 390, eOut(P(im.t + 0.1, 0.1, 1.8))); k.strokeStyle = '#fff'; k.globalAlpha = 1 - q; k.lineWidth = 5; k.lineCap = 'round';[-1, 1].forEach(s => { k.beginPath(); k.moveTo(ix + s * (34 + 14 * q), floor - 6 - 8 * q); k.lineTo(ix + s * (48 + 22 * q), floor - 16 - 14 * q); k.stroke(); }); k.globalAlpha = 1; }
    }
    const sh = clamp(1 - hg / BNC.d);
    k.fillStyle = 'rgba(0,0,0,.32)'; k.beginPath(); k.ellipse(x, floor + 7, R * (0.4 + 0.8 * sh) * out, 5 * (0.4 + 0.6 * sh) * out, 0, 0, 7); k.fill();
    if (out > 0.01) {
      k.save(); k.translate(x, rest - hg + R); k.scale((1 + sq) * out, (1 - sq) * out);
      k.fillStyle = n ? C.coral : C.yel; k.beginPath(); k.arc(0, -R, R, 0, 7); k.fill();
      k.fillStyle = 'rgba(255,255,255,.7)'; k.beginPath(); k.ellipse(-9, -R - 9, 8, 5, -0.6, 0, 7); k.fill();
      k.restore();
    }
  };

  // @element 04
  // 04 ウィグル（ベルが、小刻みに不規則に揺れ続ける。1回の衝撃ではなく、ずっと続く細かい揺れ）
  const WGF = 2 * Math.PI / CYC;
  const wsum = (u, arr) => arr.reduce((s, [kk, am, ph]) => s + am * Math.sin(WGF * kk * u + ph), 0);
  CELLS[3] = (k, w, h, u) => {
    stage(k);
    const rot = wsum(u, [[23, 0.085, 0.3], [31, 0.065, 1.9], [43, 0.05, 4.2], [59, 0.035, 2.6]]);
    const dx = wsum(u, [[29, 4, 0.7], [47, 3, 3.1], [61, 2, 5.0]]), dy = wsum(u, [[37, 2.4, 2.2], [53, 1.8, 0.4]]);
    const X = w / 2 + dx, Y = 34 + dy;
    // 両わきの振動の線（揺れているあいだ、ずっと出ている）
    k.strokeStyle = '#fff'; k.lineCap = 'round'; k.lineWidth = 6;
    [[86, 0.85], [110, 0.5]].forEach(([r, al], j) => { const fl = 0.55 + 0.45 * Math.abs(Math.sin(WGF * (41 + j * 12) * u)); k.globalAlpha = al * fl;[0, Math.PI].forEach(base => { k.beginPath(); k.arc(w / 2, 104, r, base - 0.42, base + 0.42); k.stroke(); }); });
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.rotate(rot);
    // 舌（ベルと逆にふれる）
    k.fillStyle = C.coral; k.beginPath(); k.arc(-rot * 70, 128, 13, 0, 7); k.fill();
    k.fillStyle = C.yel;
    k.beginPath(); k.arc(0, 8, 10, 0, 7); k.fill();
    k.beginPath(); k.moveTo(-50, 112); k.quadraticCurveTo(-42, 100, -42, 76); k.bezierCurveTo(-42, 36, -22, 18, 0, 18); k.bezierCurveTo(22, 18, 42, 36, 42, 76); k.quadraticCurveTo(42, 100, 50, 112); k.closePath(); k.fill();
    rr(k, -60, 106, 120, 16, 8); k.fill();
    k.fillStyle = 'rgba(255,255,255,.35)'; rr(k, -28, 40, 12, 50, 6); k.fill();
    k.restore();
  };

  // @element 05
  // 05 パルス（ハートが鼓動のように、ドクン・ドクンと大きさを脈打たせる）
  CELLS[4] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, lu = mod(u, T), X = w / 2, Y = h / 2 + 10;
    const g = (c, s) => Math.exp(-Math.pow((lu - c) / s, 2));
    const b = 0.26 * g(0.2, 0.065) + 0.15 * g(0.44, 0.07) + 0.26 * Math.exp(-Math.pow((lu - T - 0.2) / 0.065, 2));
    for (const [t0, s] of [[0.16, 1], [0.4, 0.6]]) {
      const q = P(lu, t0, t0 + 0.8); if (q <= 0 || q >= 1) continue;
      k.save(); k.translate(X, Y); const sc = 1.2 + 1.2 * eOut(q); k.scale(sc, sc); heartPath(k, 44);
      k.strokeStyle = C.coral; k.globalAlpha = (1 - q) * 0.75 * s; k.lineWidth = (7 * (1 - q) + 1.5) / sc; k.stroke(); k.restore();
    }
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.scale(1 + b, 1 + b); heartPath(k, 44); k.fillStyle = C.coral; k.fill();
    k.fillStyle = 'rgba(255,255,255,.75)'; k.beginPath(); k.ellipse(-30, -28, 9, 6, -0.7, 0, 7); k.fill(); k.restore();
  };

  // @element 06
  // 06 モーションパス（点線の道に沿って、紙飛行機が向きを変えながら進む）
  const MPX = th => 270 + 112 * th - 150 * Math.sin(th), MPY = th => 106 - 74 * Math.cos(th);
  const MP = (() => { const pts = []; for (let i = 0; i <= 400; i++) { const th = -Math.PI + 2 * Math.PI * i / 400; pts.push([MPX(th), MPY(th)]); } return pts; })();
  CELLS[5] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([2, 15]); k.lineCap = 'round'; k.strokeStyle = C.dim; k.lineWidth = 6; k.beginPath(); MP.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.stroke(); k.restore();
    const th = -Math.PI + 2 * Math.PI * (u / CYC);
    // 通ったあとの線
    k.lineCap = 'round';
    for (let j = 0; j < 24; j++) { const a = th - j * 0.03, b = th - (j + 1) * 0.03; k.strokeStyle = C.mint; k.globalAlpha = 0.9 * (1 - j / 24); k.lineWidth = 7 * (1 - j / 30); k.beginPath(); k.moveTo(MPX(a), MPY(a)); k.lineTo(MPX(b), MPY(b)); k.stroke(); }
    k.globalAlpha = 1;
    const x = MPX(th), y = MPY(th), ang = Math.atan2(74 * Math.sin(th), 112 - 150 * Math.cos(th));
    k.save(); k.translate(x, y); k.rotate(ang);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, -22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#C9D6FF'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, 22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#9FB3F0'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-12, 0); k.lineTo(-6, 9); k.closePath(); k.fill();
    k.restore();
  };

  // @element 07
  // 07 ピンポンループ（端まで行ったら、同じ道を逆再生のように戻ってくる。往復をくり返す）
  CELLS[6] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const q = u / CYC, fwd = q < 0.5, g = fwd ? 2 * q : 2 - 2 * q, X0 = 92, X1 = w - 92, base = 136, S = 48;
    const pos = gg => [lerp(X0, X1, gg), base - 62 * Math.abs(Math.sin(3 * Math.PI * gg))];
    k.save(); k.setLineDash([2, 12]); k.lineCap = 'round'; k.strokeStyle = C.navy3; k.lineWidth = 5; k.beginPath();
    for (let i = 0; i <= 150; i++) { const [px, py] = pos(i / 150); i ? k.lineTo(px, py - S / 2) : k.moveTo(px, py - S / 2); } k.stroke(); k.restore();
    k.fillStyle = C.navy3; rr(k, X0 - 40, base + 2, X1 - X0 + 80, 5, 2.5); k.fill();
    // 両端の折り返し点
    [X0, X1].forEach(xx => { k.fillStyle = C.navy3; rr(k, xx - 4, base - 70, 8, 72, 4); k.fill(); });
    // 残像
    for (let j = 4; j >= 1; j--) { const qq = mod(u - j * 0.045, CYC) / CYC, gg = qq < 0.5 ? 2 * qq : 2 - 2 * qq, [gx, gy] = pos(gg); k.globalAlpha = 0.1 * (5 - j); k.fillStyle = C.mint; k.save(); k.translate(gx, gy - S / 2); k.rotate(gg * Math.PI * 2); rr(k, -S / 2, -S / 2, S, S, 13); k.fill(); k.restore(); }
    k.globalAlpha = 1;
    const [x, y] = pos(g);
    k.save(); k.translate(x, y - S / 2); k.rotate(g * Math.PI * 2);
    k.fillStyle = C.mint; rr(k, -S / 2, -S / 2, S, S, 13); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(S / 2 - 13, -S / 2 + 13, 6.5, 0, 7); k.fill();
    k.restore();
    // 再生バー
    const ty = 184, tx0 = 196, tx1 = w - 34;
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, 22, ty - 20, 158, 40, 20); k.fill();
    txt(k, fwd ? '▶ 再生' : '◀ 逆再生', 101, ty + 1, `800 25px ${JP}`, '#fff', 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, tx0, ty - 5, tx1 - tx0, 10, 5); k.fill();
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, tx0, ty - 5, Math.max(10, (tx1 - tx0) * g), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(tx0 + (tx1 - tx0) * g, ty, 12, 0, 7); k.fill();
  };

  // @element 08
  // 08 ストップモーション風（1秒8コマのカクカクした動き。コマごとに位置が少しずつぶれる）
  CELLS[7] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    k.fillStyle = '#0A1230'; k.fillRect(0, 0, w, 26); k.fillRect(0, h - 26, w, 26);
    k.fillStyle = C.navy3; for (let x = 12; x < w; x += 34) { rr(k, x, 8, 18, 11, 3); k.fill(); rr(k, x, h - 19, 18, 11, 3); k.fill(); }
    const NS = 38, st = CYC / NS, fi = Math.floor(u / st), floor = h - 44;
    const pose = f => { const t = f / NS, j = i => H01(f * 7919 + i * 131 + 77) - 0.5; return { x: lerp(-44, w + 44, t) + j(1) * 10, y: floor - 36 - 54 * Math.abs(Math.sin(t * Math.PI * 3)) + j(2) * 9, r: t * Math.PI * 4 + j(3) * 0.3, s: 1 + j(4) * 0.1 }; };
    const draw = (p, a) => {
      k.globalAlpha = a;
      k.save(); k.translate(p.x + 5, p.y + 6); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = 'rgba(0,0,0,.35)'; star(k, 0, 0, 38, 0, 0.5); k.fill(); k.restore();
      k.save(); k.translate(p.x, p.y); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = C.yel; star(k, 0, 0, 38, 0, 0.5); k.fill();
      k.fillStyle = C.coral; k.beginPath(); k.arc(0, 2, 9, 0, 7); k.fill(); k.restore();
      k.globalAlpha = 1;
    };
    draw(pose(mod(fi - 2, NS)), 0.12); draw(pose(mod(fi - 1, NS)), 0.28);
    const p = pose(fi);
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(p.x, floor + 6, 30, 5, 0, 0, 7); k.fill();
    draw(p, 1);
    // 1秒あたりのコマ数
    txt(k, '8コマ/秒', w - 16, 50, `800 24px ${JP}`, C.dim, 'right', 'middle');
  };


  // @element 09
  // 09 テキストスクランブル（ランダムな文字が入れ替わり続け、左から順に正しい単語に決まる）
  const SCR_GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@?';
  CELLS[8] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, word = n ? 'WORLD' : 'HELLO', N = 5;
    const f = `700 92px Menlo, "SF Mono", monospace`; k.font = f;
    const cw = k.measureText('M').width + 16, x0 = w / 2 - cw * (N - 1) / 2, Y = h / 2 - 8;
    const step = Math.floor(u / (CYC / 76));
    for (let i = 0; i < N; i++) {
      const tl = 0.45 + i * 0.18, tu = 1.85 + (N - 1 - i) * 0.08, locked = lu >= tl && lu < tu;
      let ch, col, sc = 1;
      if (locked) { ch = word[i]; const age = lu - tl; col = age < 0.22 ? C.yel : '#fff'; sc = 1 + 0.2 * Math.exp(-age * 14); }
      else { ch = SCR_GL[Math.floor(H01(step * 131 + i * 977 + n * 31) * SCR_GL.length)]; col = C.mint; }
      k.save(); k.translate(x0 + i * cw, Y); k.scale(sc, sc); k.globalAlpha = locked ? 1 : 0.75; txt(k, ch, 0, 0, f, col, 'center', 'middle'); k.restore();
      const next = !locked && lu < tl && (i === 0 || lu >= 0.45 + (i - 1) * 0.18);
      k.fillStyle = locked ? C.blue : next ? C.yel : C.navy3; rr(k, x0 + i * cw - cw / 2 + 8, Y + 58, cw - 16, 8, 4); k.fill();
    }
  };

  // @element 10
  // 10 ウェーブテキスト（1文字ずつ、波のように順に上下する）
  CELLS[9] = (k, w, h, u) => {
    stage(k);
    const f = `800 70px ${DISP}`, cs = chars(k, 'WAVE TEXT', f, 4), Y = h / 2 + 2, ph = 2 * Math.PI * 3 * u / CYC;
    cs.forEach((c, i) => {
      if (c.ch === ' ') return;
      const s = Math.sin(ph - i * 0.62), y = -28 * s;
      k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(w / 2 + c.x, Y + 62, c.w * (0.42 - 0.12 * s), 4, 0, 0, 7); k.fill();
      k.save(); k.translate(w / 2 + c.x, Y + y); k.scale(1, 1 + 0.06 * s); txt(k, c.ch, 0, 0, f, mix('#FFFFFF', C.yel, clamp(s)), 'center', 'middle'); k.restore();
    });
  };

  // @element 11
  // 11 テキストオンパス（文字列が、波打つ線に沿って流れていく）
  const TOP = (() => { const pts = []; for (let x = -70; x <= CW + 70; x += 4) pts.push([x, 118 + 42 * Math.sin(x * 2 * Math.PI / 330 + 0.6)]); return { pts, cum: pathLen(pts) }; })();
  CELLS[10] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([14, 10]); k.strokeStyle = C.navy3; k.lineWidth = 5; k.lineCap = 'round'; k.beginPath(); TOP.pts.forEach((p, i) => i ? k.lineTo(p[0], p[1] + 6) : k.moveTo(p[0], p[1] + 6)); k.stroke(); k.restore();
    const f = `800 42px ${DISP}`, S = 'ALONG THE LINE • '; k.font = f;
    const ws = [...S].map(ch => k.measureText(ch).width + 2), run = ws.reduce((a, b) => a + b, 0), L = TOP.cum[TOP.cum.length - 1], shift = (u / CYC) * run;
    for (let r = -2; r * run + shift < L; r++) {
      let s = r * run + shift;
      [...S].forEach((ch, j) => {
        const c = s + ws[j] / 2; s += ws[j];
        if (c < 0 || c > L || ch === ' ') return;
        const p = ptAt(TOP.pts, TOP.cum, c / L);
        k.save(); k.translate(p[0], p[1]); k.rotate(p[2]); txt(k, ch, 0, 0, f, ch === '•' ? C.yel : '#fff', 'center', 'alphabetic'); k.restore();
      });
    }
  };

  // @element 12
  // 12 可変フォントアニメーション（同じ単語の太さが、細→極太→細となめらかに変わる）
  CELLS[11] = (k, w, h, u) => {
    stage(k);
    const v = 0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * u / CYC), wt = Math.round(100 + 800 * v);
    txt(k, 'MOTION', w / 2, 80, `${wt} 112px system-ui`, '#fff', 'center', 'middle', '2px');
    const x0 = 112, x1 = w - 112, y = 180, kx = x0 + (x1 - x0) * v;
    txt(k, '細', x0 - 34, y + 1, `300 30px ${JP}`, C.dim, 'center', 'middle');
    txt(k, '太', x1 + 34, y + 1, `900 30px ${JP}`, C.dim, 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, x0, y - 5, x1 - x0, 10, 5); k.fill();
    k.fillStyle = C.blue; rr(k, x0, y - 5, Math.max(10, kx - x0), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(kx, y, 14, 0, 7); k.fill();
    txt(k, String(wt), kx, y - 30, `800 24px ${DISP}`, C.yel, 'center', 'middle');
  };

  // @element 13
  // 13 テキストマスク（太い文字の形にくり抜いて、その中だけに動く景色が見える）
  const G0 = mkCanvas(CW, CH), GK0 = G0.getContext('2d', { willReadFrequently: true });
  function seaPattern(g, w, h, u) {
    g.fillStyle = C.coral; g.fillRect(0, 0, w, h);
    g.fillStyle = C.yel; g.beginPath(); g.arc(w * 0.6, 116 + 6 * Math.sin(2 * Math.PI * u / CYC), 60, 0, 7); g.fill();
    g.fillStyle = C.blue; g.fillRect(0, 116, w, h - 116);
    const off = (u / CYC) * 240; g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round';
    for (let j = 0; j < 4; j++) { const y = 128 + j * 22, d = j % 2 ? -1 : 1; g.beginPath(); for (let x = -20; x <= w + 20; x += 6) { const yy = y + 5 * Math.sin((x + off * d + j * 40) * 2 * Math.PI / 120); x === -20 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
    const bx = mod(u / CYC * (w + 160), w + 160) - 80;
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx, 46); g.lineTo(bx, 100); g.lineTo(bx + 40, 100); g.closePath(); g.fill();
    g.fillStyle = C.navy; g.beginPath(); g.moveTo(bx - 42, 104); g.lineTo(bx + 52, 104); g.lineTo(bx + 38, 122); g.lineTo(bx - 30, 122); g.closePath(); g.fill();
    g.fillStyle = '#fff';[[60, 40], [320, 30], [470, 56]].forEach(([x, y]) => { const xx = mod(x + u / CYC * 60, w + 80) - 40; g.beginPath(); g.ellipse(xx, y, 30, 11, 0, 0, 7); g.fill(); });
  }
  CELLS[12] = (k, w, h, u) => {
    stage(k);
    let fs = 172; while (fs > 90 && tw(k, 'OCEAN', `900 ${fs}px system-ui`, '2px') > 500) fs -= 2;
    const font = `900 ${fs}px system-ui`, Y = h / 2 + 6;
    const open = smooth(P(u, 3.45, 3.85)) * (1 - smooth(P(u, 4.25, 4.65)));
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h);
    txt(TK, 'OCEAN', w / 2, Y, font, '#fff', 'center', 'middle', '2px');
    GK0.setTransform(1, 0, 0, 1, 0, 0); GK0.globalCompositeOperation = 'source-over'; GK0.clearRect(0, 0, w, h); seaPattern(GK0, w, h, u);
    TK.globalCompositeOperation = 'source-in'; TK.drawImage(G0, 0, 0); TK.globalCompositeOperation = 'source-over';
    k.globalAlpha = 0.12 + 0.88 * open; seaPattern(k, w, h, u); k.globalAlpha = 1;
    k.drawImage(TMP, 0, 0);
    k.font = font; k.textAlign = 'center'; k.textBaseline = 'middle'; k.letterSpacing = '2px'; k.lineJoin = 'round';
    k.strokeStyle = '#fff'; k.lineWidth = 4; k.strokeText('OCEAN', w / 2, Y); k.letterSpacing = '0px';
  };

  // @element 14
  // 14 リピーター（1つの図形が複製されて円に並び、少しずつずれながら回る）
  CELLS[13] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const N = 12, X = w / 2, Y = h / 2, R = 58, spin = 2 * Math.PI * u / CYC;
    const cnt = 1 + (N - 1) * (eIOs(P(u, 0.35, 1.7)) - eIOs(P(u, 3.6, 4.45)));
    for (let i = N - 1; i >= 0; i--) {
      const vis = i === 0 ? 1 : clamp(cnt - i); if (vis <= 0) continue;
      const ang = spin + (i === 0 ? 0 : (i - 1 + eOut(vis))) * 2 * Math.PI / N;
      const pul = (1 + 0.22 * Math.sin(2 * Math.PI * 2 * u / CYC - i * 0.55)) * (0.55 + 0.45 * vis);
      k.save(); k.translate(X + Math.cos(ang) * R, Y + Math.sin(ang) * R); k.rotate(ang + Math.PI / 2); k.scale(pul, pul);
      k.fillStyle = PAL[i % 4]; rr(k, -12, -30, 24, 60, 12); k.fill();
      if (i === 0) { k.strokeStyle = '#fff'; k.lineWidth = 4; rr(k, -12, -30, 24, 60, 12); k.stroke(); }
      k.restore();
    }
    txt(k, '×' + Math.round(cnt), w - 34, 46, `800 40px ${DISP}`, C.yel, 'right', 'middle');
  };

  // @element 15
  // 15 カレイドスコープ（万華鏡のように、8分割の対称な模様が回りながら広がる）
  const KAL = (() => { const R = rand(1515), a = []; for (let i = 0; i < 13; i++) a.push({ r0: R() * 300, th: 0.06 + R() * 0.66, kind: i % 3, col: PAL[i % 4], sz: 0.7 + R() * 0.7, ph: R() * 6 }); return a; })();
  CELLS[14] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h / 2, RM = 300, rot = (Math.PI / 2) * u / CYC, W8 = Math.PI / 4;
    for (let s = 0; s < 8; s++) {
      k.save(); k.translate(X, Y);
      if (s % 2) { k.rotate(rot + (s + 1) * W8); k.scale(1, -1); } else k.rotate(rot + s * W8);
      k.beginPath(); k.moveTo(0, 0); k.arc(0, 0, RM + 60, -0.006, W8 + 0.006); k.closePath(); k.clip();
      for (const it of KAL) {
        const r = mod(it.r0 + (u / CYC) * RM, RM), th = it.th + 0.08 * Math.sin(2 * Math.PI * u / CYC + it.ph), sz = (5 + r * 0.1) * it.sz;
        const a = smooth(P(r, 0, 30)) * (1 - smooth(P(r, RM - 70, RM))); if (a <= 0) continue;
        k.globalAlpha = a; k.fillStyle = it.col; k.save(); k.translate(Math.cos(th) * r, Math.sin(th) * r); k.rotate(r * 0.02);
        if (it.kind === 0) { k.beginPath(); k.arc(0, 0, sz, 0, 7); k.fill(); }
        else if (it.kind === 1) { k.beginPath(); k.moveTo(0, -sz * 1.2); k.lineTo(sz * 0.8, 0); k.lineTo(0, sz * 1.2); k.lineTo(-sz * 0.8, 0); k.closePath(); k.fill(); }
        else { k.beginPath(); k.moveTo(0, -sz); k.lineTo(sz * 0.95, sz * 0.7); k.lineTo(-sz * 0.95, sz * 0.7); k.closePath(); k.fill(); }
        k.restore();
      }
      k.globalAlpha = 1; k.restore();
    }
    k.fillStyle = '#fff'; star(k, X, Y, 20 + 4 * Math.sin(2 * Math.PI * 2 * u / CYC), rot, 0.5, 8); k.fill();
  };

  // @element 16
  // 16 ラインボイル（手描き風の線の絵が、数コマごとに小刻みに揺らぐ。絵は動かない）
  function densify(pts, closed, step) { const out = [], n = pts.length, m = closed ? n : n - 1; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), c = Math.max(1, Math.round(d / step)); for (let j = 0; j < c; j++) out.push([lerp(a[0], b[0], j / c), lerp(a[1], b[1], j / c)]); } if (!closed) out.push(pts[n - 1]); return out; }
  const LB = (() => {
    const st = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 30 : 70, a = -Math.PI / 2 + i * Math.PI / 5; st.push([150 + Math.cos(a) * r, 112 + Math.sin(a) * r]); }
    const CIR = [[318, 132, 26], [354, 104, 36], [408, 94, 42], [456, 122, 30]], O = [388, 130], cl = [];
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let tm = 0;
      const tx = dx > 0 ? (470 - O[0]) / dx : dx < 0 ? (310 - O[0]) / dx : 1e9, ty = dy > 0 ? (150 - O[1]) / dy : dy < 0 ? (118 - O[1]) / dy : 1e9; tm = Math.min(tx, ty);
      for (const [ccx, ccy, r] of CIR) { const ox = O[0] - ccx, oy = O[1] - ccy, b = ox * dx + oy * dy, c2 = ox * ox + oy * oy - r * r, D = b * b - c2; if (D >= 0) { const t = -b + Math.sqrt(D); if (t > tm) tm = t; } }
      cl.push([O[0] + dx * tm, O[1] + dy * tm]);
    }
    return [
      { pts: densify(st, true, 13), col: C.yel, closed: true, w: 8 },
      { pts: cl, col: '#fff', closed: true, w: 8 },
      { pts: densify([[248, 44], [266, 62]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[254, 104], [280, 104]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[60, 34], [74, 52]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[318, 178], [460, 178]], false, 10), col: C.dim, closed: false, w: 6 },
    ];
  })();
  CELLS[15] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const fi = Math.floor(u / (CYC / 47));
    k.lineCap = 'round'; k.lineJoin = 'round';
    LB.forEach((sh, si) => {
      const q = sh.pts.map((p, j) => [p[0] + (H01(fi * 7919 + j * 131 + si * 17) - 0.5) * 7, p[1] + (H01(fi * 6007 + j * 97 + si * 29 + 5) - 0.5) * 7]);
      k.strokeStyle = sh.col; k.lineWidth = sh.w; k.beginPath();
      const n = q.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (sh.closed) { const m0 = mid(q[n - 1], q[0]); k.moveTo(m0[0], m0[1]); for (let j = 0; j < n; j++) { const m = mid(q[j], q[(j + 1) % n]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.closePath(); }
      else { k.moveTo(q[0][0], q[0][1]); for (let j = 1; j < n - 1; j++) { const m = mid(q[j], q[j + 1]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.lineTo(q[n - 1][0], q[n - 1][1]); }
      k.stroke();
    });
  };

  // @shared
  // 場面（昼・夜・海・山・街・野原）。同じ絵柄がそろわないよう、カードごとに組み合わせを変える
  const SUN = [112, 104], MOON = [CW - 112, 104];
  function scrA(k, w, h) {
    k.fillStyle = C.cream; k.fillRect(0, 0, w, h);
    k.fillStyle = '#FFD9A8'; k.beginPath(); k.arc(SUN[0], SUN[1], 66, 0, 7); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.arc(SUN[0], SUN[1], 44, 0, 7); k.fill();
    txt(k, 'DAY', 214, h / 2 + 4, `800 96px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.fillStyle = '#fff'; rr(k, 400, 34, 96, 26, 13); k.fill(); rr(k, 430, 20, 50, 26, 13); k.fill();
  }
  function scrB(k, w, h) {
    k.fillStyle = '#16255A'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff';[[40, 30, 3], [150, 170, 2.5], [250, 24, 2.5], [330, 180, 3], [500, 30, 2.5], [20, 150, 2]].forEach(s => { k.beginPath(); k.arc(s[0], s[1], s[2], 0, 7); k.fill(); });
    k.fillStyle = C.yel; k.beginPath(); k.arc(MOON[0], MOON[1], 46, 0, 7); k.fill();
    k.fillStyle = '#16255A'; k.beginPath(); k.arc(MOON[0] + 22, MOON[1] - 14, 38, 0, 7); k.fill();
    txt(k, 'NIGHT', 40, h / 2 + 4, `800 88px ${DISP}`, '#fff', 'left', 'middle', '1px');
  }
  function clipX(k, x0, x1, h) { k.beginPath(); k.rect(x0, 0, x1 - x0, h); k.clip(); }
  function pnSea(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#CFE0FF'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c + 120, 54, 30, 0, 7); k.fill();
    k.fillStyle = C.blue; k.fillRect(x0, 126, x1 - x0, h - 126);
    const off = (t / CYC) * 200; k.strokeStyle = '#fff'; k.lineWidth = 6; k.lineCap = 'round';
    for (let j = 0; j < 3; j++) { const y = 146 + j * 22; k.beginPath(); for (let x = x0 - 10; x <= x1 + 10; x += 6) { const yy = y + 4 * Math.sin((x + off * (j % 2 ? -1 : 1) + j * 30) * 2 * Math.PI / 100); x === x0 - 10 ? k.moveTo(x, yy) : k.lineTo(x, yy); } k.stroke(); }
    const bx = c + 26 * Math.sin(2 * Math.PI * t / CYC) + (label ? 110 : 0), by = 124 + 3 * Math.sin(2 * Math.PI * 3 * t / CYC);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(bx, by - 62); k.lineTo(bx, by - 8); k.lineTo(bx + 42, by - 8); k.closePath(); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.moveTo(bx - 40, by - 4); k.lineTo(bx + 50, by - 4); k.lineTo(bx + 36, by + 14); k.lineTo(bx - 28, by + 14); k.closePath(); k.fill();
    if (label) txt(k, 'SEA', x0 + 30, 82, `800 76px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  function pnMtn(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#FFE1DA'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c - 30, 112, 34, 0, 7); k.fill();
    const tri = (a, px, py, b, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(a, h); k.lineTo(px, py); k.lineTo(b, h); k.closePath(); k.fill(); };
    const snow = (a, px, py, b, f) => { const L = lerp(px, a, f), R = lerp(px, b, f), y = lerp(py, h, f); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(px, py); k.lineTo(R, y); k.lineTo(lerp(px, R, 0.5), y + 10); k.lineTo(px, y - 2); k.lineTo(lerp(L, px, 0.5), y + 10); k.lineTo(L, y); k.closePath(); k.fill(); };
    tri(c - 330, c - 230, 104, c - 110, C.mint);
    tri(c - 110, c + 50, 30, c + 210, C.navy3); snow(c - 110, c + 50, 30, c + 210, 0.22);
    tri(c + 80, c + 190, 86, c + 330, C.blue); snow(c + 80, c + 190, 86, c + 330, 0.2);
    k.fillStyle = C.mint; k.fillRect(x0, h - 20, x1 - x0, 20);
    if (label) txt(k, 'MOUNTAIN', x0 + 26, 54, `800 44px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.restore();
  }
  const BLD = [[-250, 70, 116, 0], [-175, 62, 150, 1], [-108, 80, 96, 0], [-22, 64, 172, 1], [48, 92, 122, 0], [146, 58, 150, 1], [210, 80, 108, 0]];
  function pnCity(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = C.navy2; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff'; k.beginPath(); k.arc(c + 150, 46, 22, 0, 7); k.fill();
    const stp = Math.floor(t / (CYC / 8));
    BLD.forEach(([dx, bw, bh, ci], bi) => {
      const bx = c + dx, by = h - bh; k.fillStyle = ci ? C.blue : C.navy3; k.fillRect(bx, by, bw, bh);
      let wi = 0; for (let y = by + 14; y < h - 16; y += 22) for (let x = bx + 10; x < bx + bw - 14; x += 18) { const on = H01(bi * 97 + wi * 13 + stp * 7) > 0.35; wi++; k.fillStyle = on ? C.yel : 'rgba(15,26,61,.45)'; k.fillRect(x, y, 9, 11); }
    });
    if (label) { k.fillStyle = 'rgba(15,26,61,.55)'; rr(k, x0 + 18, 28, 196, 70, 14); k.fill(); txt(k, 'CITY', x0 + 34, 64, `800 66px ${DISP}`, '#fff', 'left', 'middle', '2px'); }
    k.restore();
  }
  function pnField(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#DDF6EC'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff';[[-150, 40], [60, 30], [210, 52]].forEach(([dx, y]) => { const xx = c + dx + 14 * Math.sin(2 * Math.PI * t / CYC + dx); k.beginPath(); k.ellipse(xx, y, 34, 12, 0, 0, 7); k.ellipse(xx + 14, y - 8, 18, 12, 0, 0, 7); k.fill(); });
    k.fillStyle = C.mint; k.beginPath(); k.moveTo(x0, h); k.lineTo(x0, 150); for (let x = x0; x <= x1; x += 10) k.lineTo(x, 150 + 8 * Math.sin((x - c) * 0.02)); k.lineTo(x1, h); k.closePath(); k.fill();
    const mx = c + (label ? 120 : 0), my = 72;
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(mx - 10, my); k.lineTo(mx + 10, my); k.lineTo(mx + 18, 160); k.lineTo(mx - 18, 160); k.closePath(); k.fill();
    const ang = 2 * Math.PI * 2 * t / CYC + 0.3; k.fillStyle = C.coral;
    for (let i = 0; i < 4; i++) { k.save(); k.translate(mx, my); k.rotate(ang + i * Math.PI / 2); k.beginPath(); k.moveTo(0, -3); k.lineTo(58, -10); k.lineTo(58, 8); k.lineTo(0, 3); k.closePath(); k.fill(); k.restore(); }
    k.fillStyle = C.yel; k.beginPath(); k.arc(mx, my, 8, 0, 7); k.fill();
    [[-200, 176, 0], [-120, 186, 1], [-40, 172, 0], [40, 184, 1], [180, 178, 0], [230, 190, 1]].forEach(([dx, y, ci]) => { k.fillStyle = ci ? C.yel : C.coral; k.beginPath(); k.arc(c + dx, y, 7, 0, 7); k.fill(); });
    if (label) txt(k, 'FIELD', x0 + 28, 70, `800 70px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  const scSea = (k, w, h) => pnSea(k, 0, w, h, 0, true), scMtn = (k, w, h) => pnMtn(k, 0, w, h, 0, true);
  const scCity = (k, w, h) => pnCity(k, 0, w, h, 0, true), scField = (k, w, h) => pnField(k, 0, w, h, 0, true);
  const SEG3 = CYC / 2;
  function abCell(trans) { return (k, w, h, u) => { u = snapU(u); const sgi = Math.min(1, Math.floor(u / SEG3)), uu = u - sgi * SEG3; trans(k, w, h, uu, sgi, 1 - sgi); }; }
  const TA = 0.5, TB = 1.5;
  // 破片や紙の形（多角形）のパス。ページめくり（20）とガラス割れ（22）で使う
  function polyPath(k, pts) { k.beginPath(); pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); }

  // @element 17
  // 17 プッシュ（次の画面が横から入ってきて、前の画面を一緒に押し出す）
  const SC17 = [scSea, scMtn];
  CELLS[16] = abCell((k, w, h, u, a, b) => {
    const p = eIO(P(u, TA - 0.05, TB + 0.1)), dir = a === 0 ? -1 : 1;
    if (p <= 0) return SC17[a](k, w, h);
    if (p >= 1) return SC17[b](k, w, h);
    k.save(); k.translate(dir * p * w, 0); SC17[a](k, w, h); k.restore();
    k.save(); k.translate(dir * (p - 1) * w, 0); SC17[b](k, w, h); k.restore();
    const ex = dir < 0 ? w * (1 - p) : w * p;
    k.fillStyle = C.navy; k.fillRect(ex - 3, 0, 6, h);
  });

  // @element 18
  // 18 ブラインド（細い帯ごとのすき間がだんだん広がって、次の画面が開く）
  CELLS[17] = abCell((k, w, h, u, a, b) => {
    const p = eIOs(P(u, TA - 0.1, TB + 0.15)), N = 7, sh = h / N, S = [scrA, scrB];
    S[a](k, w, h);
    if (p <= 0) return;
    k.save(); k.beginPath(); for (let i = 0; i < N; i++) k.rect(0, i * sh, w, sh * p + (p > 0.999 ? 1 : 0)); k.clip(); S[b](k, w, h); k.restore();
  });

  // @element 19
  // 19 キューブ（立方体が回るように、前の面が奥へ倒れて次の面が現れる）
  const CFW = 250, CFH = 146, CF = [mkCanvas(CFW, CFH), mkCanvas(CFW, CFH)];
  function cubeFace(i) {
    const g = CF[i].getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CFW, CFH);
    g.fillStyle = i ? C.mint : C.coral; g.fillRect(0, 0, CFW, CFH);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.strokeRect(12, 12, CFW - 24, CFH - 24);
    txt(g, i ? 'B' : 'A', 78, CFH / 2 + 4, `800 104px ${DISP}`, i ? C.navy : '#fff', 'center', 'middle');
    g.fillStyle = i ? C.navy : '#fff'; g.globalAlpha = 0.8; rr(g, 140, 46, 78, 14, 7); g.fill(); g.globalAlpha = 0.45; rr(g, 140, 72, 60, 12, 6); g.fill(); rr(g, 140, 94, 70, 12, 6); g.fill(); g.globalAlpha = 1;
    return CF[i];
  }
  CELLS[18] = abCell((k, w, h, u, a, b) => {
    stage(k);
    const phi = (Math.PI / 2) * eIO(P(u, TA - 0.05, TB + 0.1)), c = Math.cos(phi), s = Math.sin(phi), HW = CFW / 2, D = 820, X = w / 2, Y = h / 2 - 4;
    const rot = (x, z) => [x * c - z * s, x * s + z * c];
    const FL = rot(-HW, HW), FR = rot(HW, HW), BR = rot(HW, -HW);
    const pj = p => { const f = D / (D - (p[1] - HW)); return [X + p[0] * f, f]; };
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, h - 16, HW * (c + s) * 0.95, 7, 0, 0, 7); k.fill();
    const face = (img, P0, P1, shade) => {
      const A0 = pj(P0), A1 = pj(P1); if (A1[0] - A0[0] < 1) return;
      const STEP = 2;
      for (let sx = 0; sx < CFW; sx += STEP) {
        const t0 = sx / CFW, t1 = Math.min(1, (sx + STEP) / CFW);
        const q0 = pj([lerp(P0[0], P1[0], t0), lerp(P0[1], P1[1], t0)]), q1 = pj([lerp(P0[0], P1[0], t1), lerp(P0[1], P1[1], t1)]);
        const hh = CFH * q0[1]; k.drawImage(img, sx, 0, STEP, CFH, q0[0], Y - hh / 2, q1[0] - q0[0] + 0.7, hh);
      }
      if (shade > 0.01) { k.fillStyle = `rgba(8,14,40,${shade})`; k.beginPath(); k.moveTo(A0[0], Y - CFH * A0[1] / 2); k.lineTo(A1[0], Y - CFH * A1[1] / 2); k.lineTo(A1[0], Y + CFH * A1[1] / 2); k.lineTo(A0[0], Y + CFH * A0[1] / 2); k.closePath(); k.fill(); }
    };
    face(cubeFace(a), FL, FR, 0.55 * s);
    face(cubeFace(b), FR, BR, 0.55 * c);
  });

  // @element 20
  // 20 ページめくり（角から紙がめくれて裏返り、下から次のページが現れる）
  function paper(k, w, h, i) {
    k.fillStyle = i ? C.cream : '#FFFFFF'; k.fillRect(0, 0, w, h);
    txt(k, i ? 'PAGE 2' : 'PAGE 1', 30, 58, `800 46px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.fillStyle = i ? '#EBD9B4' : '#D7DCEA';[[96, 230], [122, 250], [148, 200], [174, 236]].forEach(([y, ww]) => { rr(k, 30, y, ww, 12, 6); k.fill(); });
    k.fillStyle = i ? C.mint : C.coral; rr(k, 310, 26, 200, 156, 14); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(462, 66, 18, 0, 7); k.fill();
    k.beginPath(); k.moveTo(326, 168); k.lineTo(390, 92); k.lineTo(440, 150); k.lineTo(462, 126); k.lineTo(496, 168); k.closePath(); k.fill();
  }
  function clipHalf(poly, d, s0, keepLess) { const out = [], f = p => (p[0] - CW) * d[0] + (p[1] - CH) * d[1] - s0; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B), ia = keepLess ? fa <= 0 : fa >= 0, ib = keepLess ? fb <= 0 : fb >= 0; if (ia) out.push(A); if (ia !== ib) { const t = fa / (fa - fb); out.push([lerp(A[0], B[0], t), lerp(A[1], B[1], t)]); } } return out; }
  CELLS[19] = abCell((k, w, h, u, a, b) => {
    const dl = Math.hypot(1, 0.42), d = [-1 / dl, -0.42 / dl], sM = 600 * eIOs(P(u, TA - 0.15, TB + 0.25));
    paper(k, w, h, b);
    if (sM >= 599) return;
    const rect = [[0, 0], [w, 0], [w, h], [0, h]], rest = clipHalf(rect, d, sM, false), corner = clipHalf(rect, d, sM, true);
    if (rest.length > 2) { k.save(); polyPath(k, rest); k.clip(); paper(k, w, h, a); k.restore(); }
    if (corner.length > 2 && sM > 0.5) {
      // 折り目の影（下のページ側）
      k.save(); polyPath(k, corner); k.clip();
      const mx = w + d[0] * sM, my = h + d[1] * sM, gr = k.createLinearGradient(mx, my, mx - d[0] * 50, my - d[1] * 50);
      gr.addColorStop(0, 'rgba(15,26,61,.35)'); gr.addColorStop(1, 'rgba(15,26,61,0)'); k.fillStyle = gr; k.fillRect(0, 0, w, h); k.restore();
      const flap = corner.map(p => { const s = (p[0] - w) * d[0] + (p[1] - h) * d[1], m = 2 * (sM - s); return [p[0] + m * d[0], p[1] + m * d[1]]; });
      k.save(); k.shadowColor = 'rgba(0,0,0,.35)'; k.shadowBlur = 14; k.shadowOffsetX = 4; k.shadowOffsetY = 4;
      polyPath(k, flap); k.fillStyle = a ? '#EADBB8' : '#E3E6EF'; k.fill(); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.8)'; k.lineWidth = 2; polyPath(k, flap); k.stroke();
    }
  });

  // @element 21
  // 21 ピクセレート（画面がだんだん粗いモザイクになり、いちばん粗いところで切り替わって細かく戻る）
  const SMC = mkCanvas(CW, CH), SMK = SMC.getContext('2d');
  const BLV = [1, 2, 3, 4, 6, 8, 11, 15, 20, 27, 36];
  CELLS[20] = abCell((k, w, h, u, a, b) => {
    const S = [scField, scCity], p = P(u, TA - 0.3, TB + 0.4), tri = 1 - Math.abs(2 * p - 1), bs = BLV[Math.round(tri * (BLV.length - 1))];
    const scr = p < 0.5 ? a : b;
    if (bs <= 1) return S[scr](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[scr](TK, w, h);
    const sw = Math.ceil(w / bs), sh = Math.ceil(h / bs);
    SMK.setTransform(1, 0, 0, 1, 0, 0); SMK.clearRect(0, 0, CW, CH); SMK.imageSmoothingEnabled = true; SMK.imageSmoothingQuality = 'high'; SMK.drawImage(TMP, 0, 0, sw, sh);
    k.imageSmoothingEnabled = false; k.drawImage(SMC, 0, 0, sw, sh, 0, 0, sw * bs, sh * bs); k.imageSmoothingEnabled = true;
  });

  // @element 22
  // 22 ガラス割れ（画面がガラスのようにひび割れ、破片が飛び散って次の画面が現れる）
  const SHARDS = (() => {
    const R = rand(2222), I = [304, 92], NA = 13, RAD = [0, 40, 98, 175, 360], V = [];
    const angs = []; for (let i = 0; i < NA; i++) angs.push((i + (R() - 0.5) * 0.6) / NA * Math.PI * 2);
    for (let r = 0; r < RAD.length; r++) { V.push([]); for (let i = 0; i < NA; i++) { const rr_ = r ? RAD[r] * (0.85 + R() * 0.3) : 0, a = angs[i] + (r ? (R() - 0.5) * 0.12 : 0); V[r].push([I[0] + Math.cos(a) * rr_, I[1] + Math.sin(a) * rr_]); } }
    const sh = [];
    for (let r = 0; r < RAD.length - 1; r++) for (let i = 0; i < NA; i++) {
      const j = (i + 1) % NA, poly = r ? [V[r][i], V[r][j], V[r + 1][j], V[r + 1][i]] : [I, V[1][j], V[1][i]];
      const cxp = poly.reduce((s, p) => s + p[0], 0) / poly.length, cyp = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const dx = cxp - I[0], dy = cyp - I[1], dd = Math.hypot(dx, dy) || 1, sp = 220 + R() * 260;
      sh.push({ poly, c: [cxp, cyp], vx: dx / dd * sp, vy: dy / dd * sp * 0.7 - 120 * R(), spin: (R() - 0.5) * 8, dl: r * 0.035 + R() * 0.03 });
    }
    return { I, V, RAD, NA, sh };
  })();
  CELLS[21] = abCell((k, w, h, u, a, b) => {
    const S = [scMtn, scrA], crack = eOut(P(u, TA - 0.2, TA + 0.15)) * 420, tb = TA + 0.32;
    if (u < tb) {
      S[a](k, w, h);
      if (crack > 0) {
        const { I, V, RAD, NA } = SHARDS; k.strokeStyle = '#fff'; k.lineWidth = 3; k.lineCap = 'round'; k.lineJoin = 'round'; k.globalAlpha = 0.95;
        for (let i = 0; i < NA; i++) { k.beginPath(); k.moveTo(I[0], I[1]); for (let r = 1; r < RAD.length; r++) { if (RAD[r] * 0.85 > crack) break; k.lineTo(V[r][i][0], V[r][i][1]); } k.stroke(); }
        for (let r = 1; r < RAD.length - 1; r++) { if (RAD[r] * 1.4 > crack) break; k.beginPath(); for (let i = 0; i <= NA; i++) { const p = V[r][i % NA]; i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]); } k.stroke(); }
        k.globalAlpha = 1;
        const fl = 1 - P(u, TA - 0.2, TA + 0.1); if (fl > 0) { k.fillStyle = '#fff'; star(k, I[0], I[1], 26 * fl + 6, 0.3, 0.3, 6); k.fill(); }
      }
      return;
    }
    S[b](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[a](TK, w, h);
    for (const s of SHARDS.sh) {
      const t = u - tb - s.dl; let al = 1, x = 0, y = 0, rt = 0, sc = 1;
      if (t > 0) { x = s.vx * t; y = s.vy * t + 0.5 * 1300 * t * t; rt = s.spin * t; sc = 1 - 0.35 * Math.min(1, t); al = 1 - P(t, 0.55, 1.0); }
      if (al <= 0) continue;
      k.save(); k.globalAlpha = al; k.translate(s.c[0] + x, s.c[1] + y); k.rotate(rt); k.scale(sc, sc); k.translate(-s.c[0], -s.c[1]);
      polyPath(k, s.poly); k.save(); k.clip(); k.drawImage(TMP, 0, 0); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.85)'; k.lineWidth = 2.5; polyPath(k, s.poly); k.stroke();
      k.restore();
    }
  });

  // @element 23
  // 23 分解図（スマホの部品が層ごとにばらけて中の構造を見せ、また組み上がる）
  const XL = [
    { name: '背面', o: [-27, -50, 54, 100, 10], side: '#B8483D', draw: g => { g.fillStyle = C.coral; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy; g.beginPath(); g.arc(-12, -34, 7, 0, 7); g.fill(); g.beginPath(); g.arc(2, -34, 5, 0, 7); g.fill(); } },
    { name: '電池', o: [-21, -40, 42, 68, 6], side: '#17946F', draw: g => { g.fillStyle = C.mint; rr(g, -21, -40, 42, 68, 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(-3, -18, 6, 20); g.fillRect(-10, -11, 20, 6); } },
    { name: '基板', o: [-25, -48, 50, 96, 6], side: '#2550B5', draw: g => { g.fillStyle = C.blue; rr(g, -25, -48, 50, 96, 6); g.fill(); g.fillStyle = C.yel; g.fillRect(-16, -38, 16, 14); g.fillRect(4, -30, 12, 10); g.fillRect(-14, 8, 26, 14); g.fillStyle = C.mint; g.fillRect(-18, -14, 34, 3); g.fillRect(-4, 26, 3, 16); } },
    { name: '画面', o: [-27, -50, 54, 100, 10], side: '#AEB8D4', draw: g => { g.fillStyle = '#fff'; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy2; rr(g, -22, -44, 44, 88, 6); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = PAL[i % 4]; rr(g, -16 + (i % 2) * 18, -36 + Math.floor(i / 2) * 18, 13, 13, 3); g.fill(); } } },
  ];
  const ISO = (px, py) => [(px - py) * 0.866, (px + py) * 0.5];
  CELLS[22] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const X = 200, Y = 156, SP = 30, SC = 0.85;
    const ex = i => backOut(P(u, 0.45 + i * 0.08, 1.2 + i * 0.08), 1.3) * (1 - eIO(P(u, 3.25 + (3 - i) * 0.07, 3.95 + (3 - i) * 0.07)));
    const E = XL.map((_, i) => ex(i)), zs = E.map((e, i) => i * 7 + e * i * SP + 3 * Math.sin(2 * Math.PI * 2 * u / CYC + i) * clamp(e));
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, Y + 40, 64, 13, 0, 0, 7); k.fill();
    // 縦の補助線（ばらけたときだけ）
    const e3 = clamp(E[3]); if (e3 > 0.03) { k.save(); k.setLineDash([4, 7]); k.strokeStyle = C.dim; k.lineWidth = 2; k.globalAlpha = e3;[[-27, -50], [27, 50], [-27, 50]].forEach(([px, py]) => { const [ix, iy] = ISO(px * SC, py * SC); k.beginPath(); k.moveTo(X + ix, Y + iy - zs[0]); k.lineTo(X + ix, Y + iy - zs[3]); k.stroke(); }); k.restore(); }
    XL.forEach((L, i) => {
      const z = zs[i];
      for (let dz = 6; dz >= 1; dz--) { k.save(); k.translate(X, Y - z + dz); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); k.fillStyle = L.side; rr(k, ...L.o); k.fill(); k.restore(); }
      k.save(); k.translate(X, Y - z); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); L.draw(k); k.restore();
      // ラベル
      const a = clamp(E[i]); if (a > 0.03) {
        const [rx, ry] = ISO((L.o[0] + L.o[2]) * SC, L.o[1] * SC), sx = X + rx + 6, sy = Y + ry - z + 4, lx = 352, ly = Y + 8 - z - i * 2;
        k.globalAlpha = a; k.strokeStyle = C.dim; k.lineWidth = 2; k.beginPath(); k.moveTo(sx, sy); k.lineTo(lx - 10, ly); k.stroke();
        k.fillStyle = C.dim; k.beginPath(); k.arc(sx, sy, 4, 0, 7); k.fill();
        txt(k, L.name, lx, ly + 1, `800 26px ${JP}`, '#fff', 'left', 'middle'); k.globalAlpha = 1;
      }
    });
  };

  // @element 24
  // 24 スプリットスクリーン（1枚の画面が2つ、3つに分かれて、別々の場面が同時に動く）
  CELLS[23] = (k, w, h, u) => {
    u = snapU(u);
    const s2 = eIO(P(u, 0.45, 0.95)), s3 = eIO(P(u, 1.4, 1.9)), m = eIO(P(u, 3.75, 4.4));
    let b1 = lerp(lerp(w, w / 2, s2), w / 3, s3), b2 = lerp(w, 2 * w / 3, s3);
    b1 = lerp(b1, w, m); b2 = lerp(b2, w, m);
    pnSea(k, 0, b1, h, u, false);
    if (b1 < w - 0.5) pnCity(k, b1, Math.max(b1, b2), h, u, false);
    if (b2 < w - 0.5) pnField(k, b2, w, h, u, false);
    k.fillStyle = '#fff';[b1, b2].forEach(b => { if (b < w - 0.5) k.fillRect(b - 3, 0, 6, h); });
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "lp2" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('lp2', function () {
  // @kit
  // LP・Webサイトの演出の名前 第2弾 24（各カード 539x208・1つの動きは4.7秒、パックの周期は9.4秒。各コマは時間 u の純関数）
  // カードの中にブラウザの窓を1つ描き、その中の簡略化したページで演出を見せる。
  // きっかけ（スクロールバー・カーソル・クリック）も一緒に描く。色は 地・文字・差し色（朱）＋写真用の青。
  const CW = 539, CH = 208;
  const CYC = 4.7;                                   // 1つの動きは4.7秒
  const LOOP = CYC * 2;                              // パックの周期は9.4秒。各カードは4.7秒の動きを2回、カウントダウン（20）だけ9.4秒で1回（ループの継ぎ目なし）
  const C = {
    desk: '#E7EAF0', win: '#FFFFFF', bar: '#F3F5F8', rule: '#E2E6ED', ink: '#1C2333', sub: '#7D879B',
    faint: '#DCE1EA', soft: '#F3F5F9', skel: '#E4E8EF', acc: '#FF5A2C', accL: '#FFE5DB', blue: '#3B64E8', blueL: '#E1E8FF'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif';
  const EN = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOut（3乗）
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;      // easeInOut（2乗）
  const eOut = x => 1 - Math.pow(1 - x, 3);                                      // easeOut（3乗）
  const eIn = x => x * x * x;
  const mod = (a, n) => ((a % n) + n) % n;
  // 浮動小数の誤差で周期の終わり（4.6999…）と始まり（0）が別のコマ扱いになるのを防ぎ、u を 0〜4.7秒に折り返す
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  // GSAP の elastic.out(1, 0.3) と同じ式
  const eEl = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x - 0.075) * 2 * Math.PI / 0.3) + 1;
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.letterSpacing = ls; k.fillText(s, x, y); k.letterSpacing = '0px';
  }
  // キーフレーム [[秒, 値], …] を easeInOut（3乗）でつなぐ。u は周期で折り返す
  function steps(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, eIO((u - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // カーソルの通り道 [[秒, x, y], …]（easeInOut 3乗でつなぐ）
  function path(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const a = keys[i - 1], b = keys[i], f = eIO((u - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  // on(t) が最後に切り替わった時刻から dur 秒の遷移（CSS の transition と同じ考え方）。過去へさかのぼって調べる
  function trans(on, u, dur, ease = eOut) {
    const s = on(u);
    for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) { const q = ease(P(u, t, t + dur)); return s ? q : 1 - q; }
    return s ? 1 : 0;
  }
  // ブラウザの窓。中のページは V（511x168）の座標で描く
  const WIN = { x: 14, y: 8, w: 511, h: 192, r: 10, bar: 24 };
  const VW = WIN.w, VH = WIN.h - WIN.bar;
  function frame(k, url = 'example.com') {
    k.fillStyle = C.desk; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
    k.fillStyle = C.win; rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.fill(); k.restore();
    k.save(); rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.clip();
    k.fillStyle = C.bar; k.fillRect(WIN.x, WIN.y, WIN.w, WIN.bar); k.fillStyle = C.rule; k.fillRect(WIN.x, WIN.y + WIN.bar - 1, WIN.w, 1); k.restore();
    for (let i = 0; i < 3; i++) { k.fillStyle = '#CDD3DD'; k.beginPath(); k.arc(WIN.x + 15 + i * 12, WIN.y + 12, 3.6, 0, 7); k.fill(); }
    k.fillStyle = '#E6E9EF'; rr(k, WIN.x + WIN.w / 2 - 110, WIN.y + 5, 220, 14, 7); k.fill();
    txt(k, url, WIN.x + WIN.w / 2, WIN.y + 12.5, `500 9.5px ${EN}`, C.sub, 'center', 'middle');
  }
  function view(k, fn) {
    k.save(); rr(k, WIN.x, WIN.y + WIN.bar, VW, VH, [0, 0, WIN.r, WIN.r]); k.clip(); k.translate(WIN.x, WIN.y + WIN.bar);
    k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH); fn(); k.restore();
  }
  // スクロールバー（つまみだけ。pos 0〜1、ratio＝見えている割合）
  function sbar(k, pos, ratio = 0.42) { const th = (VH - 8) * ratio; k.fillStyle = 'rgba(28,35,51,.38)'; rr(k, VW - 9, 4 + (VH - 8 - th) * clamp(pos), 5, th, 2.5); k.fill(); }
  // 文字の代わりの棒（n 行。最後の行は短い）
  function bars(k, x, y, w, n, col = C.faint, hh = 6, gap = 11, last = 0.62) {
    k.fillStyle = col; for (let i = 0; i < n; i++) { rr(k, x, y + i * gap, i === n - 1 && n > 1 ? w * last : w, hh, hh / 2); k.fill(); }
  }
  // 写真の代わりの絵（空・太陽・山）。v で色ちがい、z で中身だけ拡大（枠は固定）
  const PICS = [
    { sky: ['#A9C0FF', '#E4EBFF'], sun: '#FF5A2C', sx: .74, sy: .32, m1: '#7D9AF4', m2: '#4B6BDB' },
    { sky: ['#FFC7B2', '#FFEDE5'], sun: '#FFFFFF', sx: .28, sy: .34, m1: '#F4977A', m2: '#DD5F3B' },
    { sky: ['#3A4884', '#7484CC'], sun: '#FFE5DB', sx: .6, sy: .3, m1: '#2B3770', m2: '#1C2349' }
  ];
  const M1 = [[0, .62], [.22, .4], [.42, .56], [.66, .3], [.86, .5], [1, .42]], M2 = [[0, .8], [.28, .6], [.5, .76], [.76, .58], [1, .74]];
  function mount(k, w, h, pts, col, flip) { k.fillStyle = col; k.beginPath(); k.moveTo(flip ? w : 0, h + 1); pts.forEach(([a, b]) => k.lineTo((flip ? 1 - a : a) * w, b * h)); k.lineTo(flip ? 0 : w, h + 1); k.closePath(); k.fill(); }
  function pic(k, x, y, w, h, v = 0, r = 6, z = 1) {
    const p = PICS[v % PICS.length];
    k.save(); rr(k, x, y, w, h, r); k.clip();
    k.translate(x + w / 2, y + h / 2); k.scale(z, z); k.translate(-w / 2, -h / 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, p.sky[0]); g.addColorStop(1, p.sky[1]); k.fillStyle = g; k.fillRect(-1, -1, w + 2, h + 2);
    k.fillStyle = p.sun; k.beginPath(); k.arc(w * p.sx, h * p.sy, Math.min(w, h) * 0.13, 0, 7); k.fill();
    mount(k, w, h, M1, p.m1, v % 2); mount(k, w, h, M2, p.m2, (v + 1) % 2);
    k.restore();
  }
  function btn(k, x, y, w, h, label, col = C.acc, tcol = '#fff', fs = 12) {
    k.fillStyle = col; rr(k, x, y, w, h, h / 2); k.fill(); txt(k, label, x + w / 2, y + h / 2 + 0.5, `700 ${fs}px ${JP}`, tcol, 'center', 'middle');
  }
  function logo(k, x, y, col = C.ink) { k.fillStyle = C.acc; rr(k, x, y - 7, 14, 14, 4); k.fill(); txt(k, 'SAMPLE', x + 20, y + 0.5, `800 12px ${EN}`, col, 'left', 'middle', '1px'); }
  // ページのヘッダー（高さ34）
  const NAVX = [300, 346, 392];
  function header(k, y, active = -1) {
    k.fillStyle = '#fff'; k.fillRect(0, y, VW, 34); k.fillStyle = C.rule; k.fillRect(0, y + 33, VW, 1);
    logo(k, 18, y + 17);
    ['特長', '料金', 'FAQ'].forEach((s, i) => txt(k, s, NAVX[i], y + 17.5, `600 12px ${JP}`, active === i ? C.acc : C.ink, 'left', 'middle'));
    btn(k, 428, y + 7, 70, 20, '無料で試す', C.acc, '#fff', 10.5);
  }
  // マウスのカーソル（矢印）。press で少し縮む
  function cursor(k, x, y, press = 0) {
    const s = 1.2 * (1 - 0.12 * press);
    k.save(); k.translate(x, y); k.scale(s, s); k.beginPath();
    [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b));
    k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = C.ink; k.fill(); k.stroke(); k.restore();
  }
  // クリックした所に出る小さな輪（0.35秒）と、押している間の縮み
  function click(k, x, y, u, times) {
    let press = 0;
    for (const tc of times) {
      const d = mod(u - tc + 0.1, CYC) - 0.1;
      if (d > -0.1 && d < 0.12) press = Math.max(press, 1 - Math.abs(d - 0.01) / 0.11);
      if (d >= 0 && d < 0.35) { const q = d / 0.35; k.strokeStyle = `rgba(28,35,51,${0.45 * (1 - q)})`; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 5 + 13 * eOut(q), 0, 7); k.stroke(); }
    }
    cursor(k, x, y, clamp(press));
  }
  // 回る読み込み表示（0.8秒で1回転）
  function spinner(k, x, y, r, u, col = C.acc) {
    const a = u / 0.8 * Math.PI * 2;
    k.lineCap = 'round'; k.lineWidth = r * 0.28; k.strokeStyle = C.faint; k.beginPath(); k.arc(x, y, r, 0, 7); k.stroke();
    k.strokeStyle = col; k.beginPath(); k.arc(x, y, r, a, a + Math.PI * 0.6); k.stroke(); k.lineCap = 'butt';
  }
  // ページ上の top にある要素が、判定線 line より上に入った時刻（画面の下へ出たらリセット）。過去 CYC 秒をさかのぼる
  function enteredAt(sy, top, line, u) {
    const dt = 1 / 120, y = t => top - sy(t);
    if (y(u) >= VH) return null;
    for (let t = u; t > u - CYC; t -= dt) {
      const a = y(t), b = y(t - dt);
      if (a >= VH) return null;
      if (a < line && b >= line) return t - dt + dt * (b - line) / (b - a);
    }
    return y(u) < line ? -1e9 : null;
  }
  // 第2弾で足した道具
  function hex(c) { if (c[0] === 'r') return c.match(/\d+/g).slice(0, 3).map(Number); return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  function check(k, x, y, s, col, lw, f = 1) {   // チェックの線（f で描く途中）
    const pts = [[-0.5, 0.02], [-0.14, 0.38], [0.52, -0.34]], L1 = Math.hypot(0.36, 0.36), L2 = Math.hypot(0.66, 0.72), L = (L1 + L2) * clamp(f);
    k.save(); k.translate(x, y); k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(pts[0][0] * s, pts[0][1] * s);
    if (L <= L1) { const q = L / L1; k.lineTo(lerp(pts[0][0], pts[1][0], q) * s, lerp(pts[0][1], pts[1][1], q) * s); }
    else { const q = (L - L1) / L2; k.lineTo(pts[1][0] * s, pts[1][1] * s); k.lineTo(lerp(pts[1][0], pts[2][0], q) * s, lerp(pts[1][1], pts[2][1], q) * s); }
    if (L > 0) k.stroke(); k.restore();
  }
  // 最後に on(t) が切り替わった時刻（なければ null）
  function lastSwitch(on, u) { const s = on(u); for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) return t; return null; }
  const GREEN = '#1E9E5A', RED = '#E5383B', HEART = '#F23D5C';
  const CELLS = [];

  // @element 01
  // 01 タイムラインアニメーション（スクロールに合わせて年表の線が上から伸び、線が届いた年が順に現れる）
  CELLS[0] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const y = steps([[0.3, 0], [2.3, 190], [3.0, 190], [4.3, 0]], u);
    const ROWS = [[72, '2018', '創業'], [126, '2020', '1号店オープン'], [180, '2022', '会員1万人'], [234, '2024', 'アプリ公開'], [288, '2026', '海外へ']];
    const LX = 168, L = y + 126;                         // 線の先（画面の下から 42px の所までページと一緒に伸びる）
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'HISTORY', 34, 34, `800 11px ${EN}`, C.acc, 'left', 'alphabetic', '2px');
      txt(k, 'あゆみ', 34, 60, `800 20px ${JP}`, C.ink);
      pic(k, 34, 76, 100, 62, 0, 6); bars(k, 34, 148, 90, 2);
      k.fillStyle = C.faint; rr(k, LX - 1.5, 52, 3, 248, 1.5); k.fill();
      k.fillStyle = C.acc; rr(k, LX - 1.5, 52, 3, clamp(L - 52, 0, 248), 1.5); k.fill();
      for (const [iy, yr, lab] of ROWS) {
        const q = eOut(clamp((L - iy) / 22));
        k.fillStyle = '#fff'; k.beginPath(); k.arc(LX, iy, 7.5, 0, 7); k.fill();
        k.lineWidth = 2.5; k.strokeStyle = q > 0 ? C.acc : C.faint; k.stroke();
        if (q > 0) { k.fillStyle = C.acc; k.beginPath(); k.arc(LX, iy, 4 * q, 0, 7); k.fill(); }
        k.save(); k.globalAlpha = q; k.translate(16 * (1 - q), 0);
        txt(k, yr, LX + 22, iy + 6, `800 18px ${EN}`, C.acc);
        txt(k, lab, LX + 82, iy + 5, `700 15px ${JP}`, C.ink);
        bars(k, LX + 82, iy + 15, 190, 1, C.faint, 5);
        k.restore();
      }
      k.restore();
      sbar(k, y / 190, 0.45);
    });
  };

  // @element 02
  // 02 スクロールテキストリビール（薄い見出しの文字が、スクロールに合わせて左から1文字ずつ濃くなる）
  CELLS[1] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const p = steps([[0.3, 0], [2.6, 1], [3.2, 1], [4.4, 0]], u), y = p * 40;
    const LINES = ['毎日の小さな工夫が、', '暮らしを少しずつ', '変えていく。'], F = `800 27px ${JP}`;
    const total = LINES.join('').length;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'ABOUT US', 40, 34, `800 11px ${EN}`, C.acc, 'left', 'alphabetic', '2px');
      let n = 0;
      LINES.forEach((s, li) => {
        let x = 40; k.font = F;
        for (const ch of s) {
          const f = clamp(p * (total + 2) - n);
          txt(k, ch, x, 72 + li * 38, F, mix('#D6DBE4', C.ink, f));
          k.font = F; x += k.measureText(ch).width; n++;
        }
      });
      bars(k, 40, 168, 300, 3, C.faint, 6, 12, 0.7);
      k.restore();
      sbar(k, p, 0.55);
    });
  };

  // @element 03
  // 03 スタッキングカード（スクロールすると、次のカードが下から来て前のカードに少しずらして重なる）
  CELLS[2] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const s = steps([[0.3, 0], [1.1, 1], [1.6, 1], [2.4, 2], [3.2, 2], [4.4, 0]], u);
    const CARDS = [[C.blueL, C.ink, C.acc, '01', '企画する', 0], [C.ink, '#fff', C.acc, '02', 'つくる', 2], [C.acc, '#fff', '#fff', '03', '届ける', 1]];
    const X = 70, CWD = 371, CHT = 124, STEP = 170;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      CARDS.forEach(([bg, fg, nc, no, ttl, pv], i) => {
        const top = Math.max(14 + i * 12, 16 + i * STEP - s * STEP);
        const cov = clamp(s - i), sc = 1 - 0.045 * cov - 0.045 * clamp(s - i - 1);
        k.save(); k.translate(VW / 2, top); k.scale(sc, sc); k.translate(-VW / 2, 0);
        k.save(); k.shadowColor = 'rgba(28,35,51,.22)'; k.shadowBlur = 14; k.shadowOffsetY = -2; k.fillStyle = bg; rr(k, X, 0, CWD, CHT, 12); k.fill(); k.restore();
        txt(k, no, X + 24, 44, `800 26px ${EN}`, nc);
        txt(k, ttl, X + 24, 78, `800 20px ${JP}`, fg);
        bars(k, X + 24, 92, 140, 2, i === 0 ? '#C3CDEA' : 'rgba(255,255,255,.35)');
        pic(k, X + CWD - 160, 14, 144, CHT - 28, pv, 8);
        if (cov > 0) { k.fillStyle = `rgba(28,35,51,${0.16 * cov})`; rr(k, X, 0, CWD, CHT, 12); k.fill(); }
        k.restore();
      });
      sbar(k, s / 2, 0.4);
    });
  };

  // @element 04
  // 04 背景色の切り替え（スクロールでセクションが変わるたび、ページ全体の背景色がなめらかに変わる）
  CELLS[3] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const y = steps([[0.3, 0], [1.2, VH], [1.8, VH], [2.7, 2 * VH], [3.3, 2 * VH], [4.4, 0]], u), s = y / VH;
    const BG = ['#FFEBD9', '#1E2A4A', '#DDE6FF'], DK = [0, 1, 0];
    const i0 = Math.min(1, Math.floor(s)), t = eIOs(clamp((s - i0 - 0.05) / 0.9));
    const bg = mix(BG[i0], BG[i0 + 1], t), dk = lerp(DK[i0], DK[i0 + 1], t);
    const fg = mix(C.ink, '#FFFFFF', dk), bc = mix('#E3C9B4', '#45507A', dk);
    view(k, () => {
      k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(0, -y);
      const S = [['01  MORNING', '朝のひととき'], ['02  NIGHT', '夜のくつろぎ'], ['03  HOLIDAY', '休日のおでかけ']];
      S.forEach(([no, ttl], i) => {
        const y0 = i * VH;
        txt(k, no, 40, y0 + 58, `800 12px ${EN}`, C.acc, 'left', 'alphabetic', '2px');
        txt(k, ttl, 40, y0 + 92, `800 24px ${JP}`, fg);
        k.fillStyle = bc; for (let j = 0; j < 2; j++) { rr(k, 40, y0 + 108 + j * 12, j ? 110 : 180, 6, 3); k.fill(); }
      });
      // 朝: 太陽 / 夜: 月と星 / 休日: 山の写真
      k.fillStyle = C.acc; k.beginPath(); k.arc(380, 84, 34, 0, 7); k.fill();
      k.strokeStyle = C.acc; k.lineWidth = 4; k.lineCap = 'round';
      for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; k.beginPath(); k.moveTo(380 + Math.cos(a) * 44, 84 + Math.sin(a) * 44); k.lineTo(380 + Math.cos(a) * 54, 84 + Math.sin(a) * 54); k.stroke(); }
      k.fillStyle = '#FFE5DB'; k.beginPath(); k.arc(380, VH + 84, 36, 0, 7); k.fill();
      k.fillStyle = bg; k.beginPath(); k.arc(396, VH + 72, 32, 0, 7); k.fill();
      k.fillStyle = '#FFE5DB';[[300, 50], [450, 40], [330, 130], [470, 120]].forEach(([a, b]) => { k.beginPath(); k.arc(a, VH + b, 2.5, 0, 7); k.fill(); });
      pic(k, 300, 2 * VH + 28, 180, 112, 0, 10);
      k.restore();
      sbar(k, s / 2, 0.34);
    });
  };

  // @element 05
  // 05 隠れるヘッダー（下へスクロールするとヘッダーが上へ引っ込み、上へ戻すとすっと出てくる）
  CELLS[4] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const SY = t => steps([[0.3, 0], [1.1, 170], [1.5, 170], [1.9, 100], [2.4, 100], [2.9, 230], [3.3, 230], [4.3, 0]], t), y = SY(u);
    // 最後に動いた向きが「下」なら隠す（ページの一番上にいるときは出す）
    const hidden = t => { const yt = SY(t); if (yt < 34) return false; for (let i = 0, tt = t; i < 600; i++, tt -= 1 / 120) { const d = SY(tt) - SY(tt - 1 / 120); if (Math.abs(d) > 1e-4) return d > 0; } return false; };
    const q = trans(hidden, u, 0.3, eIOs);
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 48, 214, 110, 1, 8);
      txt(k, '旅の準備を、', 262, 84, `800 22px ${JP}`, C.ink); txt(k, 'まとめて。', 262, 114, `800 22px ${JP}`, C.ink); bars(k, 262, 128, 200, 2); btn(k, 262, 152, 100, 24, '詳しく見る');
      k.fillStyle = C.soft; k.fillRect(0, 196, VW, 260);
      txt(k, '人気のプラン', VW / 2, 232, `800 17px ${JP}`, C.ink, 'center');
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = 34 + i * 152, y0 = 250 + r * 100; k.fillStyle = '#fff'; rr(k, x, y0, 136, 88, 8); k.fill(); pic(k, x + 8, y0 + 8, 120, 46, (i + r) % 3, 5); bars(k, x + 10, y0 + 64, 100, 2, C.faint, 5, 10); }
      k.restore();
      const hy = -36 * q;
      if (y > 0 && q < 1) { const g = k.createLinearGradient(0, hy + 34, 0, hy + 46); g.addColorStop(0, `rgba(28,35,51,${0.14 * clamp(y / 30)})`); g.addColorStop(1, 'rgba(28,35,51,0)'); k.fillStyle = g; k.fillRect(0, hy + 34, VW, 12); }
      header(k, hy);
      sbar(k, y / 230, 0.42);
    });
  };

  // @element 06
  // 06 スクロールスパイ（左の目次のうち、いま読んでいる見出しの項目が光る）
  CELLS[5] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const y = steps([[0.3, 0], [0.9, 100], [1.35, 100], [1.95, 200], [2.4, 200], [3.0, 300], [3.5, 300], [4.4, 0]], u);
    const NAMES = ['はじめに', '使い方', '料金', 'よくある質問'], TX = 160;
    const act = t => { const yy = steps([[0.3, 0], [0.9, 100], [1.35, 100], [1.95, 200], [2.4, 200], [3.0, 300], [3.5, 300], [4.4, 0]], t); let a = 0; for (let i = 0; i < 4; i++) if (i * 100 <= yy + 40) a = i; return a; };
    view(k, () => {
      k.save(); k.beginPath(); k.rect(TX - 10, 0, VW, VH); k.clip(); k.translate(0, -y);
      NAMES.forEach((s, i) => {
        const y0 = i * 100 + 14;
        txt(k, `${i + 1}. ${s}`, TX + 14, y0 + 22, `800 16px ${JP}`, C.ink);
        bars(k, TX + 14, y0 + 38, 300, 3, C.faint, 6, 12, 0.6);
      });
      k.restore();
      k.fillStyle = C.soft; k.fillRect(0, 0, TX - 10, VH);
      txt(k, '目次', 20, 30, `800 12px ${JP}`, C.sub);
      const a = act(u);
      NAMES.forEach((s, i) => {
        const q = trans(t => act(t) === i, u, 0.25), iy = 54 + i * 30;
        if (q > 0) { k.fillStyle = `rgba(255,229,219,${q})`; rr(k, 12, iy - 13, TX - 34, 26, 6); k.fill(); k.fillStyle = C.acc; k.globalAlpha = q; rr(k, 12, iy - 13, 4, 26, 2); k.fill(); k.globalAlpha = 1; }
        txt(k, s, 26, iy + 1, `${a === i ? 800 : 600} 13px ${JP}`, mix('#7D879B', C.acc, q), 'left', 'middle');
      });
      sbar(k, y / 300, 0.36);
    });
  };

  // @element 07
  // 07 トップへ戻るボタン（下までスクロールすると右下に丸いボタンが出て、押すと一気に先頭へ戻る）
  CELLS[6] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const CLK = 2.6, MAX = 300;
    const y = u < CLK + 0.02 ? steps([[0.2, 0], [1.7, MAX]], u) : MAX * (1 - eIO(P(u, CLK + 0.06, CLK + 0.66)));
    const cur = t => path([[0, 340, 205], [1.6, 340, 205], [2.35, 472, 138], [2.95, 472, 138], [3.6, 340, 205], [4.7, 340, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'BLOG', 70, 32, `800 11px ${EN}`, C.acc, 'left', 'alphabetic', '2px');
      txt(k, '週末にできる、小さな旅', 70, 58, `800 19px ${JP}`, C.ink);
      pic(k, 70, 72, 371, 100, 2, 8);
      for (let b = 0; b < 3; b++) { const y0 = 192 + b * 82; k.fillStyle = C.ink; rr(k, 70, y0, 150, 9, 4.5); k.fill(); bars(k, 70, y0 + 22, 371, 4, C.faint, 6, 12); }
      k.fillStyle = C.ink; k.fillRect(0, 438, VW, 80); logo(k, 70, 454, '#fff'); bars(k, 300, 451, 140, 1, 'rgba(255,255,255,.3)');
      k.restore();
      const tb = eOut(clamp((y - 80) / 60));
      if (tb > 0) {
        const hov = trans(t => { const [a, b] = cur(t); return Math.hypot(a - 472, b - 138) < 20; }, u, 0.2);
        k.save(); k.globalAlpha = tb; k.translate(0, 10 * (1 - tb));
        k.save(); k.shadowColor = 'rgba(28,35,51,.3)'; k.shadowBlur = 10; k.shadowOffsetY = 3; k.fillStyle = mix(C.acc, '#D9431C', hov); k.beginPath(); k.arc(472, 138, 19, 0, 7); k.fill(); k.restore();
        k.strokeStyle = '#fff'; k.lineWidth = 2.6; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(465, 142); k.lineTo(472, 134.5); k.lineTo(479, 142); k.stroke();
        k.restore();
      }
      sbar(k, y / MAX, 0.34);
      click(k, cx, cy, u, [CLK]);
    });
  };

  // @element 08
  // 08 スクロールで拡大（スクロールに合わせて、小さな写真が窓いっぱいまで広がる）
  CELLS[7] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const p = steps([[0.3, 0], [2.3, 1], [3.0, 1], [4.4, 0]], u);
    const x = lerp(178, 0, p), y = lerp(58, 0, p), ww = lerp(155, VW, p), hh = lerp(90, VH, p);
    view(k, () => {
      const a = 1 - clamp(p * 2.2);
      k.save(); k.globalAlpha = a;
      txt(k, '景色の中へ', VW / 2, 38, `800 19px ${JP}`, C.ink, 'center');
      bars(k, 34, 66, 120, 4, C.faint, 6, 14); bars(k, 357, 66, 120, 4, C.faint, 6, 14);
      k.restore();
      pic(k, x, y, ww, hh, 0, lerp(8, 0, p));
      const b = clamp((p - 0.7) / 0.3);
      if (b > 0) { k.save(); k.globalAlpha = b; txt(k, '絶景へようこそ', VW / 2, VH / 2 + 2, `800 26px ${JP}`, '#fff', 'center', 'middle', '2px'); k.restore(); }
      sbar(k, p * 0.6, 0.4);
    });
  };

  // @element 09
  // 09 3Dチルト（カーソルの動きに合わせて、カードが奥行きをもって傾く）
  // カードの面（TC）と縦に傾けた面（TD）を描く下書き用の canvas。拡大して描くときは、その倍率ぶん細かく描く
  const TC = document.createElement('canvas'); TC.width = 220; TC.height = 132; const TCK = TC.getContext('2d');
  const TD = document.createElement('canvas'); TD.width = 300; TD.height = 190; const TDK = TD.getContext('2d');
  const TDW = 300, TDH = 190;
  CELLS[8] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const BX = VW / 2, BY = 82, BW = 220, BH = 132, MAXA = 0.32, D = 520;
    const cur = t => path([[0, 80, 190], [0.6, 190, 40], [1.2, 335, 50], [1.8, 330, 125], [2.4, 180, 122], [3.0, 258, 80], [3.6, 470, 190], [4.7, 80, 190]], t);
    const inside = t => { const [x, y] = cur(t); return Math.abs(x - BX) < BW / 2 && Math.abs(y - BY) < BH / 2; };
    const q = trans(inside, u, 0.4, eOut), [cx, cy] = cur(u);
    const nx = clamp((cx - BX) / (BW / 2), -1, 1), ny = clamp((cy - BY) / (BH / 2), -1, 1);
    const ry = nx * MAXA * q, rx = ny * MAXA * q;
    // 呼び出し側の拡大率 S（詳細表示などで2倍・3倍に描かれるとき）。下書きの canvas を S 倍の細かさにする
    const m = k.getTransform(), S = Math.min(4, Math.max(1, Math.hypot(m.a, m.b)));
    const cw = Math.ceil(BW * S), ch = Math.ceil(BH * S), dw = Math.ceil(TDW * S), dh = Math.ceil(TDH * S);
    if (TC.width !== cw || TC.height !== ch) { TC.width = cw; TC.height = ch; }
    if (TD.width !== dw || TD.height !== dh) { TD.width = dw; TD.height = dh; }
    // カードの面
    const g = TCK; g.clearRect(0, 0, TC.width, TC.height);
    g.save(); g.scale(S, S); rr(g, 0, 0, BW, BH, 14); g.clip();
    const gr = g.createLinearGradient(0, 0, BW, BH); gr.addColorStop(0, '#2B4FD6'); gr.addColorStop(1, '#7D9AF4'); g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(BW - 30, 20, 70, 0, 7); g.fill();
    logo(g, 18, 26, '#fff');
    g.fillStyle = '#FFD9C9'; rr(g, 18, 52, 34, 26, 5); g.fill();
    txt(g, 'MEMBER CARD', 18, 104, `700 11px ${EN}`, 'rgba(255,255,255,.8)', 'left', 'alphabetic', '2px');
    txt(g, '0123  4567  8910', 18, 122, `700 13px ${EN}`, '#fff', 'left', 'alphabetic', '1px');
    const gx = (nx * 0.5 + 0.5) * BW, gy = (ny * 0.5 + 0.5) * BH, gl = g.createRadialGradient(gx, gy, 0, gx, gy, 130);
    gl.addColorStop(0, `rgba(255,255,255,${0.42 * q})`); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, BW, BH);
    g.restore();
    // 縦の傾き（横の帯で描く）→ 横の傾き（縦の帯で描く）
    const d = TDK; d.clearRect(0, 0, TD.width, TD.height);
    const N = 44;
    for (let i = 0; i < N; i++) {
      const v0 = i / N - 0.5, v1 = (i + 1) / N - 0.5, z0 = v0 * BH * Math.sin(rx), z1 = v1 * BH * Math.sin(rx), s0 = D / (D + z0), s1 = D / (D + z1);
      const y0 = TDH / 2 + v0 * BH * Math.cos(rx) * s0, y1 = TDH / 2 + v1 * BH * Math.cos(rx) * s1, sw = BW * (s0 + s1) / 2;
      d.drawImage(TC, 0, i * BH / N * S, BW * S, (BH / N + 0.6) * S, (TDW / 2 - sw / 2) * S, y0 * S, sw * S, (y1 - y0 + 0.6) * S);
    }
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.fillStyle = `rgba(28,35,51,${0.1 + 0.05 * q})`; k.beginPath(); k.ellipse(BX - nx * 10 * q, 158, 96, 7, 0, 0, 7); k.fill();
      for (let i = 0; i < N; i++) {
        const f0 = i / N - 0.5, f1 = (i + 1) / N - 0.5, z0 = f0 * TDW * Math.sin(ry), z1 = f1 * TDW * Math.sin(ry), s0 = D / (D + z0), s1 = D / (D + z1);
        const x0 = BX + f0 * TDW * Math.cos(ry) * s0, x1 = BX + f1 * TDW * Math.cos(ry) * s1, sh = TDH * (s0 + s1) / 2;
        k.drawImage(TD, i * TDW / N * S, 0, (TDW / N + 0.6) * S, TDH * S, x0, BY - sh / 2, x1 - x0 + 0.6, sh);
      }
      cursor(k, cx, cy);
    });
  };

  // @element 10
  // 10 スポットライトホバー（暗いカードの上で、カーソルの周りだけが丸く明るく光る）
  CELLS[9] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const cx = 255 + 190 * Math.sin(2 * Math.PI * u / CYC), cy = 92 + 40 * Math.sin(4 * Math.PI * u / CYC);
    view(k, () => {
      k.fillStyle = '#121828'; k.fillRect(0, 0, VW, VH);
      txt(k, 'FEATURES', VW / 2, 26, `800 11px ${EN}`, 'rgba(255,255,255,.45)', 'center', 'alphabetic', '3px');
      const LAB = ['かんたん', 'あんしん', 'はやい'];
      for (let i = 0; i < 3; i++) {
        const x = 22 + i * 160, y = 40, cw = 147, ch = 116;
        k.fillStyle = '#1C2335'; rr(k, x, y, cw, ch, 10); k.fill();
        k.save(); rr(k, x, y, cw, ch, 10); k.clip();
        const g = k.createRadialGradient(cx, cy, 0, cx, cy, 115); g.addColorStop(0, 'rgba(255,255,255,.34)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(x, y, cw, ch);
        k.restore();
        k.lineWidth = 1.5; k.strokeStyle = 'rgba(255,255,255,.08)'; rr(k, x + 0.75, y + 0.75, cw - 1.5, ch - 1.5, 10); k.stroke();
        const sg = k.createRadialGradient(cx, cy, 0, cx, cy, 120); sg.addColorStop(0, 'rgba(255,122,82,1)'); sg.addColorStop(1, 'rgba(255,122,82,0)');
        k.lineWidth = 2; k.strokeStyle = sg; rr(k, x + 1, y + 1, cw - 2, ch - 2, 10); k.stroke();
        k.strokeStyle = 'rgba(255,255,255,.75)'; k.lineWidth = 2; k.beginPath(); k.arc(x + 30, y + 32, 12, 0, 7); k.stroke();
        txt(k, LAB[i], x + 18, y + 72, `800 16px ${JP}`, 'rgba(255,255,255,.9)');
        bars(k, x + 18, y + 86, 110, 2, 'rgba(255,255,255,.16)', 5, 10);
      }
      cursor(k, cx, cy);
    });
  };

  // @element 11
  // 11 ホバーで画像切り替え（商品カードにカーソルを乗せると、写真が別の角度＝後ろ姿に切り替わる）
  function tee(k, x, y, s, col, back) {
    k.save(); k.translate(x, y); k.scale(s, s);
    k.fillStyle = col; k.beginPath();
    k.moveTo(-0.36, -0.5); k.quadraticCurveTo(0, back ? -0.44 : -0.3, 0.36, -0.5);
    [[0.66, -0.3], [0.52, -0.08], [0.38, -0.18], [0.38, 0.56], [-0.38, 0.56], [-0.38, -0.18], [-0.52, -0.08], [-0.66, -0.3]].forEach(([a, b]) => k.lineTo(a, b));
    k.closePath(); k.fill();
    k.strokeStyle = 'rgba(28,35,51,.18)'; k.lineWidth = 0.025; k.beginPath(); k.moveTo(-0.36, -0.5); k.quadraticCurveTo(0, back ? -0.44 : -0.3, 0.36, -0.5); k.stroke();
    k.restore();
  }
  CELLS[10] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const CX = [44, 271], CY = 10, CWD = 196, IH = 112;
    const PRODS = [['Tシャツ', '¥3,980', '#FFFFFF', C.blueL, C.blue], ['ロゴTシャツ', '¥4,280', C.acc, C.accL, '#fff']];
    const cur = t => path([[0, 60, 200], [0.4, 150, 70], [1.6, 160, 80], [2.0, 370, 70], [3.3, 380, 82], [3.8, 470, 200], [4.7, 60, 200]], t);
    view(k, () => {
      for (let i = 0; i < 2; i++) {
        const [nm, pr, col, bg, mark] = PRODS[i], x = CX[i];
        const inside = t => { const [a, b] = cur(t); return a > x && a < x + CWD && b > CY && b < CY + IH + 40; };
        const q = trans(inside, u, 0.3, eIOs);
        k.save(); rr(k, x, CY, CWD, IH, 8); k.clip(); k.fillStyle = bg; k.fillRect(x, CY, CWD, IH);
        // 正面（胸に小さな丸い印）→ 後ろ姿（背中に大きな星の柄）
        k.globalAlpha = 1 - q; tee(k, x + CWD / 2, CY + IH / 2 + 4, 108, col, false);
        k.fillStyle = mark; k.beginPath(); k.arc(x + CWD / 2 + 18, CY + IH / 2 - 16, 7, 0, 7); k.fill();
        k.globalAlpha = q; tee(k, x + CWD / 2, CY + IH / 2 + 4, 108, col, true);
        { const sx = x + CWD / 2, sy = CY + IH / 2 + 12; k.fillStyle = mark; k.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 8 : 19, a = -Math.PI / 2 + j * Math.PI / 5; j ? k.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r) : k.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } k.closePath(); k.fill(); }
        k.globalAlpha = 1; k.restore();
        for (let j = 0; j < 2; j++) { k.fillStyle = (j ? q : 1 - q) > 0.5 ? C.ink : C.faint; k.beginPath(); k.arc(x + CWD / 2 - 6 + j * 12, CY + IH - 10, 3, 0, 7); k.fill(); }
        txt(k, nm, x + 4, CY + IH + 22, `800 14px ${JP}`, C.ink);
        txt(k, pr, x + CWD - 4, CY + IH + 22, `800 14px ${EN}`, C.ink, 'right');
        bars(k, x + 4, CY + IH + 32, 90, 1, C.faint, 5);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 12
  // 12 テキストロール（メニューの文字にカーソルを乗せると、文字が上に回って同じ文字が下から出てくる）
  CELLS[11] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const LINKS = ['WORKS', 'ABOUT', 'CONTACT'], F = `800 30px ${EN}`, GAP = 44, LY = 100, LH = 40;
    const cur = t => path([[0, 110, 200], [0.4, 120, 92], [1.25, 140, 96], [1.5, 252, 92], [2.35, 268, 96], [2.6, 380, 92], [3.45, 400, 96], [3.9, 450, 200], [4.7, 110, 200]], t);
    view(k, () => {
      k.fillStyle = '#FFF3EA'; k.fillRect(0, 0, VW, VH);
      logo(k, 24, 28); txt(k, 'MENU', VW - 26, 28.5, `800 11px ${EN}`, C.sub, 'right', 'middle', '2px');
      k.font = F; k.letterSpacing = '1px'; const ws = LINKS.map(s => k.measureText(s).width); k.letterSpacing = '0px';
      let x = (VW - ws.reduce((a, b) => a + b, 0) - GAP * (LINKS.length - 1)) / 2;
      LINKS.forEach((s, i) => {
        const x0 = x, x1 = x + ws[i], inside = t => { const [a, b] = cur(t); return a > x0 - 6 && a < x1 + 6 && b > LY - 30 && b < LY + 10; };
        const on = inside(u), tc = lastSwitch(inside, u);
        k.save(); k.beginPath(); k.rect(x0 - 4, LY - 31, ws[i] + 8, 39); k.clip();
        let cxp = x0;
        [...s].forEach((ch, j) => {
          const f = tc === null ? (on ? 1 : 0) : eIO(P(u, tc + 0.035 * j, tc + 0.035 * j + 0.36)), q = on ? f : 1 - f;
          k.font = F; k.letterSpacing = '1px'; const cw = k.measureText(ch).width; k.letterSpacing = '0px';
          txt(k, ch, cxp, LY - LH * q, F, C.ink, 'left', 'alphabetic', '1px');
          txt(k, ch, cxp, LY + LH - LH * q, F, C.acc, 'left', 'alphabetic', '1px');
          cxp += cw;
        });
        k.restore();
        x += ws[i] + GAP;
      });
      bars(k, VW / 2 - 110, 132, 220, 1, '#F1D9C9', 6);
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 13
  // 13 ホバーで画像プレビュー（文字だけのリストの行にカーソルを乗せると、その行の写真がカーソルの横に出る）
  CELLS[12] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const NAMES = ['オーロラの丘', '湖のほとりの小屋', '海辺のヴィラ', '星空のテラス'], RT = 6, RH = 39;
    const cur = t => path([[0, 140, 200], [0.4, 150, 26], [1.15, 190, 28], [1.4, 205, 65], [2.15, 230, 67], [2.4, 245, 104], [3.15, 265, 106], [3.4, 280, 143], [3.9, 292, 144], [4.3, 150, 200], [4.7, 140, 200]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      NAMES.forEach((s, i) => {
        const top = RT + i * RH, inside = t => { const [a, b] = cur(t); return b > top && b < top + RH && a > 20 && a < 490; };
        const q = trans(inside, u, 0.25);
        txt(k, '0' + (i + 1), 30, top + 25, `800 12px ${EN}`, C.sub);
        txt(k, s, 64 + 8 * q, top + 26, `800 17px ${JP}`, mix(C.ink, C.acc, q));
        txt(k, '→', 476, top + 25, `700 15px ${EN}`, mix('#B7BFCC', C.acc, q), 'right');
        k.fillStyle = C.rule; k.fillRect(24, top + RH, VW - 48, 1);
      });
      NAMES.forEach((s, i) => {
        const top = RT + i * RH, q = trans(t => { const [a, b] = cur(t); return b > top && b < top + RH && a > 20 && a < 490; }, u, 0.25);
        if (q <= 0) return;
        const iw = 132, ih = 84, px = cx + 26, py = clamp(cy - 46, 4, VH - ih - 4), sc = 0.85 + 0.15 * q;
        k.save(); k.globalAlpha = q; k.translate(px + iw / 2, py + ih / 2); k.scale(sc, sc);
        k.shadowColor = 'rgba(28,35,51,.25)'; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = '#fff'; rr(k, -iw / 2, -ih / 2, iw, ih, 6); k.fill(); k.shadowColor = 'transparent';
        pic(k, -iw / 2, -ih / 2, iw, ih, [0, 2, 1, 2][i], 6);
        k.restore();
      });
      cursor(k, cx, cy);
    });
  };

  // @element 14
  // 14 フローティングラベル（入力欄の中のラベルが、入力を始めると小さくなって欄の上へ移る）
  CELLS[13] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const TEXT = 'hello@example.com', F = { x: 106, y: 58, w: 300, h: 46 };
    const len = t => { t = mod(t, CYC); return t < 1.0 ? 0 : t < 3.2 ? Math.min(TEXT.length, Math.floor((t - 1.0) / 0.075)) : Math.max(0, TEXT.length - Math.floor((t - 3.2) / 0.03)); };
    const focused = t => { t = mod(t, CYC); return t >= 0.65 && t < 3.95; };
    const q = trans(t => focused(t) || len(t) > 0, u, 0.24, eOut), fo = trans(focused, u, 0.15);
    const cur = t => path([[0, 445, 205], [0.45, 262, 82], [0.85, 262, 82], [1.4, 452, 142], [3.5, 452, 142], [3.85, 470, 26], [4.05, 470, 26], [4.6, 445, 205], [4.7, 445, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.shadowColor = 'rgba(28,35,51,.1)'; k.shadowBlur = 12; k.shadowOffsetY = 3; k.fillStyle = '#fff'; rr(k, 80, 12, 352, 148, 12); k.fill(); k.restore();
      txt(k, '会員登録', F.x, 40, `800 15px ${JP}`, C.ink);
      k.lineWidth = lerp(1.5, 2.2, fo); k.strokeStyle = mix('#C9D0DC', C.acc, fo); rr(k, F.x, F.y, F.w, F.h, 8); k.stroke();
      const s = TEXT.slice(0, len(u));
      txt(k, s, F.x + 14, F.y + 30, `600 15px ${EN}`, C.ink);
      if (focused(u) && (mod(u, 0.9) < 0.5 || (u > 1 && u < 2.4))) { k.font = `600 15px ${EN}`; const xw = k.measureText(s).width; k.fillStyle = C.ink; k.fillRect(F.x + 14 + xw + 1, F.y + 14, 1.6, 20); }
      const fs = lerp(15, 11.5, q), ly = lerp(F.y + F.h / 2, F.y, q), lx = F.x + lerp(14, 10, q), LAB = 'メールアドレス';
      k.font = `600 ${fs}px ${JP}`; const lw = k.measureText(LAB).width;
      if (q > 0) { k.fillStyle = '#fff'; k.fillRect(lx - 4, ly - 3, lw + 8, 6); }
      txt(k, LAB, lx, ly + 0.5, `600 ${fs}px ${JP}`, mix('#8B94A6', C.acc, fo), 'left', 'middle');
      btn(k, F.x, 118, F.w, 30, '次へ', C.ink, '#fff', 12);
      click(k, cx, cy, u, [0.65, 3.95]);
    });
  };

  // @element 15
  // 15 インラインバリデーション（打っている途中は赤で「形式が正しくありません」、正しく打ち終わると緑のチェックとOK）
  CELLS[14] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const TEXT = 'hana@example.com', F = { x: 106, y: 56, w: 300, h: 44 };
    const len = t => { t = mod(t, CYC); return t < 0.75 ? 0 : t < 3.6 ? Math.min(TEXT.length, Math.floor((t - 0.75) / 0.115)) : Math.max(0, TEXT.length - Math.floor((t - 3.6) / 0.03)); };
    const err = t => { const n = len(t); return mod(t, CYC) < 3.6 && n >= 2 && n < TEXT.length; };
    const ok = t => mod(t, CYC) < 3.6 && len(t) === TEXT.length;
    const focused = t => { t = mod(t, CYC); return t >= 0.45 && t < 4.2; };
    const qe = trans(err, u, 0.15), qo = trans(ok, u, 0.25), fo = trans(focused, u, 0.15);
    const cur = t => path([[0, 445, 205], [0.3, 262, 80], [0.6, 262, 80], [1.1, 455, 146], [3.8, 455, 146], [4.1, 470, 26], [4.3, 470, 26], [4.65, 445, 205], [4.7, 445, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      txt(k, 'お問い合わせ', F.x, 26, `800 15px ${JP}`, C.ink);
      txt(k, 'メールアドレス', F.x, 47, `700 12px ${JP}`, C.ink);
      k.fillStyle = mix('#FFFFFF', '#FFF1F1', qe); rr(k, F.x, F.y, F.w, F.h, 8); k.fill();
      const bc = mix(mix(mix('#C9D0DC', C.ink, fo), RED, qe), GREEN, qo);
      k.lineWidth = lerp(1.5, 2.2, Math.max(fo, qe, qo)); k.strokeStyle = bc; rr(k, F.x, F.y, F.w, F.h, 8); k.stroke();
      const s = TEXT.slice(0, len(u));
      txt(k, s, F.x + 14, F.y + 28, `600 15px ${EN}`, C.ink);
      if (focused(u) && !ok(u) && (mod(u, 0.9) < 0.5 || (u > 0.75 && u < 2.6))) { k.font = `600 15px ${EN}`; const xw = k.measureText(s).width; k.fillStyle = C.ink; k.fillRect(F.x + 14 + xw + 1, F.y + 12, 1.6, 20); }
      if (qe > 0) {
        k.save(); k.globalAlpha = qe;
        k.fillStyle = RED; k.beginPath(); k.arc(F.x + 7, F.y + F.h + 20, 7, 0, 7); k.fill(); txt(k, '!', F.x + 7, F.y + F.h + 20.5, `800 11px ${EN}`, '#fff', 'center', 'middle');
        txt(k, '形式が正しくありません', F.x + 20, F.y + F.h + 20.5, `700 13px ${JP}`, RED, 'left', 'middle');
        k.restore();
      }
      if (qo > 0) {
        k.save(); k.globalAlpha = qo;
        k.fillStyle = GREEN; k.beginPath(); k.arc(F.x + F.w - 22, F.y + F.h / 2, 11 * eEl(qo), 0, 7); k.fill(); check(k, F.x + F.w - 22, F.y + F.h / 2, 12, '#fff', 2.4);
        k.fillStyle = GREEN; k.beginPath(); k.arc(F.x + 7, F.y + F.h + 20, 7, 0, 7); k.fill(); check(k, F.x + 7, F.y + F.h + 20, 8, '#fff', 1.8);
        txt(k, 'OK', F.x + 20, F.y + F.h + 20.5, `800 13px ${EN}`, GREEN, 'left', 'middle');
        k.restore();
      }
      click(k, cx, cy, u, [0.45, 4.2]);
    });
  };

  // @element 16
  // 16 ローディングボタン（押すと丸い読み込み表示に縮んで回り、チェック付きの「完了」に変わる）
  CELLS[15] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const CLK = 0.8, BY = 124, BHT = 36;
    const shr = eIO(P(u, CLK + 0.05, CLK + 0.35)), done = eOut(P(u, 2.25, 2.45)), grow = eIO(P(u, 2.45, 2.8)), fade = P(u, 3.9, 4.1), back = eOut(P(u, 4.1, 4.4));
    const bw = fade >= 1 ? 220 : grow > 0 ? lerp(BHT, 150, grow) : lerp(220, BHT, shr);
    const cur = t => path([[0, 430, 205], [0.55, 290, 136], [1.1, 290, 136], [1.6, 440, 205], [4.7, 430, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      k.fillStyle = C.blueL; k.fillRect(0, 0, VW, VH);
      k.save(); k.shadowColor = 'rgba(28,35,51,.1)'; k.shadowBlur = 12; k.shadowOffsetY = 3; k.fillStyle = '#fff'; rr(k, 130, 10, 251, 150, 12); k.fill(); k.restore();
      txt(k, '資料請求', VW / 2, 36, `800 15px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 2; i++) { k.strokeStyle = '#D5DBE6'; k.lineWidth = 1.5; rr(k, 150, 50 + i * 32, 211, 24, 6); k.stroke(); bars(k, 160, 59 + i * 32, i ? 90 : 120, 1, '#AEB6C5', 6); }
      const col = fade >= 1 ? '#FF5A2C' : mix('#FF5A2C', GREEN, done), ba = fade >= 1 ? back : 1 - fade;
      k.save(); k.globalAlpha = ba; k.translate(0, fade >= 1 ? 6 * (1 - back) : 0); k.save(); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 8; k.shadowOffsetY = 3; k.fillStyle = col; rr(k, VW / 2 - bw / 2, BY, bw, BHT, BHT / 2); k.fill(); k.restore();
      const idleA = fade >= 1 ? 1 : 1 - clamp(shr * 3);
      if (idleA > 0) { k.save(); k.globalAlpha = idleA * ba; txt(k, '送信する', VW / 2, BY + BHT / 2 + 0.5, `800 14px ${JP}`, '#fff', 'center', 'middle'); k.restore(); }
      if (u > CLK + 0.3 && u < 2.3) { k.save(); k.globalAlpha = clamp((u - CLK - 0.3) / 0.1) * (1 - clamp((u - 2.2) / 0.08)); k.lineCap = 'round'; k.lineWidth = 3; k.strokeStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.arc(VW / 2, BY + BHT / 2, 10, 0, 7); k.stroke(); const a = u / 0.7 * Math.PI * 2; k.strokeStyle = '#fff'; k.beginPath(); k.arc(VW / 2, BY + BHT / 2, 10, a, a + Math.PI * 0.7); k.stroke(); k.restore(); }
      if (u >= 2.25 && fade < 1) {
        k.save();
        const ox = lerp(0, -26, grow);
        check(k, VW / 2 + ox, BY + BHT / 2, 16, '#fff', 3, P(u, 2.25, 2.5));
        if (grow > 0.5) { k.globalAlpha = ba * P(grow, 0.5, 1); txt(k, '完了', VW / 2 + 12, BY + BHT / 2 + 0.5, `800 14px ${JP}`, '#fff', 'center', 'middle'); }
        k.restore();
      }
      k.restore();
      click(k, cx, cy, u, [CLK]);
    });
  };

  // @element 17
  // 17 ビュートランジション（一覧の写真を押すと、その写真がそのまま大きくなって詳細ページの上部になる）
  CELLS[16] = (k, w, h, u) => {
    u = snapU(u);
    const e = u < 2.0 ? eIO(P(u, 0.85, 1.45)) : 1 - eIO(P(u, 3.15, 3.75));
    frame(k, e > 0.5 ? 'example.com/works/02' : 'example.com/works');
    const G = [24, 184, 344], GY = 44, GW = 143, GH = 80, NM = ['雪の山小屋', '海辺のカフェ', '夜の展望台'], PV = [0, 1, 2];
    const T = { x: 16, y: 10, w: VW - 32, h: 94 };
    const cur = t => path([[0, 420, 205], [0.5, 262, 88], [0.95, 262, 88], [1.6, 380, 150], [2.55, 380, 150], [2.9, 62, 30], [3.2, 62, 30], [3.9, 420, 205], [4.7, 420, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      const ga = 1 - clamp(e * 1.6);
      k.save(); k.globalAlpha = ga;
      txt(k, 'WORKS', 24, 30, `800 15px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
      for (let i = 0; i < 3; i++) { if (i !== 1) pic(k, G[i], GY, GW, GH, PV[i], 6); txt(k, NM[i], G[i], GY + GH + 20, `800 13px ${JP}`, C.ink); bars(k, G[i], GY + GH + 30, 90, 1, C.faint, 5); }
      k.restore();
      const x = lerp(G[1], T.x, e), y = lerp(GY, T.y, e), ww = lerp(GW, T.w, e), hh = lerp(GH, T.h, e);
      pic(k, x, y, ww, hh, 1, lerp(6, 8, e));
      const da = clamp((e - 0.6) / 0.4);
      if (da > 0) {
        k.save(); k.globalAlpha = da;
        k.fillStyle = 'rgba(255,255,255,.92)'; rr(k, 26, 19, 74, 22, 11); k.fill(); txt(k, '← 一覧へ', 63, 30.5, `700 11px ${JP}`, C.ink, 'center', 'middle');
        txt(k, '海辺のカフェ', 24, 134, `800 19px ${JP}`, C.ink); bars(k, 200, 122, 280, 3, C.faint, 6, 12, 0.7);
        k.restore();
      }
      click(k, cx, cy, u, [0.75, 3.05]);
    });
  };

  // @element 18
  // 18 ライトボックス（サムネを押すと周りが暗くなり、その上に写真が大きく表示される）
  CELLS[17] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const e = u < 2.0 ? eOut(P(u, 0.85, 1.3)) : 1 - eIO(P(u, 3.05, 3.4));
    const TX = [24, 142, 260, 378], TY = 72, TW = 108, THt = 72, PV = [2, 0, 1, 0];
    const B = { x: 125, y: 12, w: 261, h: 128 };
    const cur = t => path([[0, 430, 205], [0.5, 318, 110], [0.95, 318, 110], [1.6, 445, 120], [2.5, 445, 120], [2.85, 487, 19], [3.15, 487, 19], [3.8, 430, 205], [4.7, 430, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      header(k, 0);
      txt(k, 'ギャラリー', 24, 60, `800 15px ${JP}`, C.ink);
      for (let i = 0; i < 4; i++) pic(k, TX[i], TY, TW, THt, PV[i], 6);
      bars(k, 24, 154, 300, 1, C.faint, 6);
      if (e > 0) {
        k.fillStyle = `rgba(14,18,28,${0.82 * e})`; k.fillRect(0, 0, VW, VH);
        const x = lerp(TX[2], B.x, e), y = lerp(TY, B.y, e), ww = lerp(TW, B.w, e), hh = lerp(THt, B.h, e);
        pic(k, x, y, ww, hh, 1, 6);
        k.save(); k.globalAlpha = clamp((e - 0.5) / 0.5);
        txt(k, '3 / 4', VW / 2, 156, `700 12px ${EN}`, 'rgba(255,255,255,.85)', 'center', 'middle', '1px');
        k.strokeStyle = '#fff'; k.lineWidth = 2.4; k.lineCap = 'round'; k.lineJoin = 'round';
        k.beginPath(); k.moveTo(481, 13); k.lineTo(493, 25); k.moveTo(493, 13); k.lineTo(481, 25); k.stroke();
        k.beginPath(); k.moveTo(98, 66); k.lineTo(90, 76); k.lineTo(98, 86); k.stroke();
        k.beginPath(); k.moveTo(413, 66); k.lineTo(421, 76); k.lineTo(413, 86); k.stroke();
        k.restore();
      }
      click(k, cx, cy, u, [0.75, 3.0]);
    });
  };

  // @element 19
  // 19 ホットスポット（製品写真の上で点が脈打ち、押すと説明の吹き出しが出る）
  CELLS[18] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const D1 = [186, 52], D2 = [150, 122];
    const o1 = t => { t = mod(t, CYC); return t >= 0.9 && t < 2.4; }, o2 = t => { t = mod(t, CYC); return t >= 2.4 && t < 3.8; };
    const q1 = trans(o1, u, 0.25), q2 = trans(o2, u, 0.25);
    const cur = t => path([[0, 280, 205], [0.6, D1[0], D1[1]], [1.15, D1[0], D1[1]], [2.05, D2[0], D2[1]], [3.95, D2[0], D2[1]], [4.45, 280, 205], [4.7, 280, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      k.fillStyle = '#EEF1F6'; k.fillRect(0, 0, 300, VH);
      // リュック（平面の絵）
      k.strokeStyle = C.ink; k.lineWidth = 6; k.lineCap = 'round'; k.beginPath(); k.arc(150, 30, 16, Math.PI, 0); k.stroke();
      k.fillStyle = '#3B64E8'; rr(k, 92, 26, 116, 134, 28); k.fill();
      k.fillStyle = '#2E50C2'; rr(k, 108, 92, 84, 56, 14); k.fill();
      k.strokeStyle = '#FFD9C9'; k.lineWidth = 2.5; k.beginPath(); k.moveTo(116, 104); k.lineTo(184, 104); k.stroke();
      k.fillStyle = C.acc; rr(k, 140, 54, 20, 8, 4); k.fill();
      txt(k, 'トラベルリュック', 322, 58, `800 16px ${JP}`, C.ink);
      txt(k, '¥12,800', 322, 88, `800 19px ${EN}`, C.acc);
      bars(k, 322, 104, 160, 3);
      [D1, D2].forEach(([x, y], i) => {
        for (let r = 0; r < 2; r++) { const f = mod(u / (CYC / 3) + r * 0.5, 1); k.strokeStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 8 + 12 * f, 0, 7); k.stroke(); }
        k.save(); k.shadowColor = 'rgba(28,35,51,.3)'; k.shadowBlur = 6; k.shadowOffsetY = 2; k.fillStyle = '#fff'; k.beginPath(); k.arc(x, y, 8, 0, 7); k.fill(); k.restore();
        k.fillStyle = C.acc; k.beginPath(); k.arc(x, y, 4, 0, 7); k.fill();
      });
      const tip = (x, y, q, title, left) => {
        if (q <= 0) return;
        k.save(); k.globalAlpha = q; k.translate(x, y + 6 * (1 - q));
        const L = left ? 0 : 1;   // 吹き出しを点の左（left）か右に出す
        const bx = L ? 0 : -136;
        k.save(); k.shadowColor = 'rgba(28,35,51,.22)'; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = '#fff'; rr(k, bx, -24, 136, 48, 8); k.fill();
        k.beginPath(); if (L) { k.moveTo(0, -6); k.lineTo(-8, 0); k.lineTo(0, 6); } else { k.moveTo(0, -6); k.lineTo(8, 0); k.lineTo(0, 6); } k.fill(); k.restore();
        txt(k, title, bx + 12, -6, `800 13px ${JP}`, C.ink); bars(k, bx + 12, 6, 100, 1, C.faint, 5);
        k.restore();
      };
      tip(D1[0] - 16, D1[1], q1, '雨をはじく布', true);
      tip(D2[0] + 16, D2[1], q2, 'PCが入るポケット', false);
      click(k, cx, cy, u, [0.9, 2.4, 3.8]);
    });
  };

  // @element 20
  // 20 カウントダウンタイマー（「キャンペーン終了まで」の 時:分:秒 が1秒ごとに入れ替わって減っていく）
  // このカードだけ1回の動きが9.4秒（パックの周期と同じ）。tp（0〜9.4秒）で描く。1秒ごとに9回減り、途中で分が1回繰り下がる
  CELLS[19] = (k, w, h, u) => {
    const tp = mod(Math.round(u * 1e6) / 1e6, LOOP);
    frame(k);
    const T0 = 0.4, START = 2 * 3600 + 15 * 60 + 4;    // 02:15:04 → 02:14:55
    const n = clamp(Math.floor(tp - T0) + 1, 0, 9), fp = n === 0 ? 1 : clamp((tp - T0 - (n - 1)) / 0.32);
    const dg = v => { const hh = Math.floor(v / 3600), mm = Math.floor(v / 60) % 60, ss = v % 60; return [hh, mm, ss].map(x => String(x).padStart(2, '0')).join(''); };
    const now = dg(START - n), was = dg(START - Math.max(0, n - 1));
    const TW = 34, TH = 50, TY = 50, GW = 2 * TW + 4, SEP = 30, X0 = (VW - (3 * GW + 2 * SEP)) / 2;
    const tile = (x, d, clipHalf) => {
      k.save(); k.beginPath(); if (clipHalf === 0) k.rect(x, TY, TW, TH / 2); else if (clipHalf === 1) k.rect(x, TY + TH / 2, TW, TH / 2); else k.rect(x, TY, TW, TH); k.clip();
      k.fillStyle = C.ink; rr(k, x, TY, TW, TH, 6); k.fill();
      txt(k, String(d), x + TW / 2, TY + TH / 2 + 1.5, `800 32px ${EN}`, '#fff', 'center', 'middle');
      k.restore();
    };
    // 入れ替わり: 古い数字が上へ抜け、新しい数字が下から入る
    const flip = (x, a, b, f) => {
      k.fillStyle = C.ink; rr(k, x, TY, TW, TH, 6); k.fill();
      k.save(); rr(k, x, TY, TW, TH, 6); k.clip();
      const o = eIO(clamp(f)) * TH;
      txt(k, String(a), x + TW / 2, TY + TH / 2 + 1.5 - o, `800 32px ${EN}`, '#fff', 'center', 'middle');
      txt(k, String(b), x + TW / 2, TY + TH / 2 + 1.5 + TH - o, `800 32px ${EN}`, '#fff', 'center', 'middle');
      k.restore();
    };
    view(k, () => {
      const g = k.createLinearGradient(0, 0, VW, VH); g.addColorStop(0, '#FF6A3D'); g.addColorStop(1, '#FF4A2C'); k.fillStyle = g; k.fillRect(0, 0, VW, VH);
      txt(k, 'キャンペーン終了まで', VW / 2, 34, `800 15px ${JP}`, '#fff', 'center');
      ['時間', '分', '秒'].forEach((lab, gi) => {
        const x = X0 + gi * (GW + SEP);
        for (let j = 0; j < 2; j++) { const p = gi * 2 + j, xx = x + j * (TW + 4); if (was[p] !== now[p]) flip(xx, was[p], now[p], fp); else tile(xx, now[p], 2); }
        txt(k, lab, x + GW / 2, TY + TH + 16, `700 11px ${JP}`, 'rgba(255,255,255,.9)', 'center', 'middle');
        if (gi < 2) txt(k, ':', x + GW + SEP / 2, TY + TH / 2, `800 26px ${EN}`, '#fff', 'center', 'middle');
      });
      btn(k, VW / 2 - 75, 132, 150, 28, '今すぐ申し込む', '#fff', C.acc, 12);
    });
  };

  // @element 21
  // 21 シェイプディバイダー（セクションの境目の波の形が、ゆっくりゆれ続ける）
  CELLS[20] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const a = 2 * Math.PI * u / CYC;
    const wave = (base, A1, L1, p1, A2, L2, p2) => { k.beginPath(); k.moveTo(0, VH + 1); for (let x = 0; x <= VW + 4; x += 4) k.lineTo(x, base + A1 * Math.sin(2 * Math.PI * x / L1 + p1) + A2 * Math.sin(2 * Math.PI * x / L2 + p2)); k.lineTo(VW, VH + 1); k.closePath(); };
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#3B64E8'); g.addColorStop(1, '#8FA9F7'); k.fillStyle = g; k.fillRect(0, 0, VW, VH);
      k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.arc(430, 44, 22, 0, 7); k.fill();
      txt(k, '夏のキャンペーン', 34, 42, `800 22px ${JP}`, '#fff'); btn(k, 34, 56, 96, 24, '詳しく見る', '#fff', C.blue, 11);
      k.fillStyle = 'rgba(255,255,255,.45)'; wave(100, 8, 260, a + 1, 4, 130, -2 * a); k.fill();
      k.fillStyle = '#fff'; wave(110, 9, 300, -a, 3.5, 110, 2 * a + 0.5); k.fill();
      txt(k, 'おすすめプラン', 34, 146, `800 15px ${JP}`, C.ink); bars(k, 170, 140, 290, 1, C.faint, 6);
      bars(k, 34, 156, 200, 1, C.faint, 5);
    });
  };

  // @element 22
  // 22 いいねアニメーション（ハートを押すと赤く塗られてポンと弾み、小さな粒が散る。数字が1増える）
  CELLS[21] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const ON = 0.9, OFF = 3.3, HX = 266, HY = 118;
    const liked = u >= ON && u < OFF, d = u - ON, d2 = u - OFF;
    let sc = 1;
    if (d >= 0 && d < 1.2) sc = d < 0.12 ? lerp(0.78, 1.45, eOut(d / 0.12)) : 1 + 0.45 * Math.exp(-7 * (d - 0.12)) * Math.cos((d - 0.12) * 15);
    else if (d < 0 && d > -0.1) sc = 1 - 0.22 * (1 + d / 0.1);
    if (d2 >= -0.1 && d2 < 0.3) sc = 1 - 0.16 * Math.sin(Math.PI * clamp((d2 + 0.1) / 0.4));
    const cur = t => path([[0, 430, 205], [0.5, 276, 130], [1.25, 276, 130], [1.8, 430, 160], [2.75, 430, 160], [3.1, 276, 130], [3.55, 276, 130], [4.1, 430, 205], [4.7, 430, 205]], t);
    const [cx, cy] = cur(u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.fillStyle = '#fff'; rr(k, 16, 12, 479, 144, 12); k.fill();
      pic(k, 28, 24, 200, 120, 1, 8);
      k.fillStyle = C.blueL; k.beginPath(); k.arc(258, 40, 11, 0, 7); k.fill();
      txt(k, 'sample_trip', 276, 44.5, `700 13px ${EN}`, C.ink);
      bars(k, 248, 62, 220, 2, C.faint, 6, 12, 0.7);
      // 粒（小さく添える）とリング
      if (d >= 0.08 && d < 0.6) {
        const f = (d - 0.08) / 0.5;
        k.strokeStyle = `rgba(242,61,92,${0.5 * (1 - f)})`; k.lineWidth = 2; k.beginPath(); k.arc(HX, HY, 15 + 18 * eOut(f), 0, 7); k.stroke();
        for (let i = 0; i < 6; i++) { const an = -Math.PI / 2 + i * Math.PI / 3, r = 24 + 13 * eOut(f); k.fillStyle = [HEART, '#FFB020', C.acc][i % 3]; k.globalAlpha = 1 - f; k.beginPath(); k.arc(HX + Math.cos(an) * r, HY + Math.sin(an) * r, 2.4 * (1 - 0.5 * f), 0, 7); k.fill(); }
        k.globalAlpha = 1;
      }
      k.save(); k.translate(HX, HY + 2); k.scale(sc, sc); heartPath(k, 14.5);
      if (liked) { k.fillStyle = HEART; k.fill(); } else { k.lineWidth = 2.4; k.strokeStyle = C.ink; k.lineJoin = 'round'; k.stroke(); }
      k.restore();
      // 数字（128 ⇄ 129 が縦に入れ替わる）
      const nf = liked ? eOut(P(d, 0.05, 0.35)) : eOut(P(d2, 0.05, 0.35)), up = liked;
      k.save(); k.beginPath(); k.rect(292, HY - 13, 60, 26); k.clip();
      const A = up ? '128' : '129', Bn = up ? '129' : '128', dir = up ? -1 : 1, sh = 26 * nf * dir;
      const fA = `800 18px ${EN}`;
      if (u < ON || (d2 >= 0 && nf >= 1) || (liked && nf >= 1)) txt(k, liked ? '129' : '128', 294, HY + 1, fA, liked ? HEART : C.ink, 'left', 'middle');
      else { txt(k, A, 294, HY + 1 + sh, fA, up ? C.ink : HEART, 'left', 'middle'); txt(k, Bn, 294, HY + 1 + sh - 26 * dir, fA, up ? HEART : C.ink, 'left', 'middle'); }
      k.restore();
      click(k, cx, cy, u, [ON, OFF]);
    });
  };

  // @element 23
  // 23 スクロールダウンの合図（ファーストビューの下で「SCROLL」とマウスの形の中の点が、下へ促す動きをくり返す）
  CELLS[22] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const T = CYC / 3, f = mod(u, T) / T;
    view(k, () => {
      k.fillStyle = '#FFF4EA'; k.fillRect(0, 0, VW, VH);
      txt(k, 'ようこそ、', 40, 40, `800 22px ${JP}`, C.ink); txt(k, '山の上の宿へ。', 40, 70, `800 22px ${JP}`, C.ink);
      bars(k, 40, 84, 170, 2, '#EAD9CB');
      pic(k, 286, 10, 200, 92, 1, 10);
      // 合図
      const mx = VW / 2;
      txt(k, 'SCROLL', mx, 116, `800 11px ${EN}`, C.ink, 'center', 'middle', '3px');
      k.strokeStyle = C.ink; k.lineWidth = 2.2; rr(k, mx - 12, 126, 24, 38, 12); k.stroke();
      const dy = eIOs(clamp(f / 0.7)) * 14, da = 1 - clamp((f - 0.45) / 0.3);
      k.fillStyle = `rgba(255,90,44,${da})`; rr(k, mx - 2.5, 133 + dy, 5, 9, 2.5); k.fill();
      // 両わきの矢印も下へ流れる
      [mx - 40, mx + 40].forEach(x => { for (let j = 0; j < 2; j++) { const ff = mod(f + j * 0.5, 1), yy = 128 + ff * 24, al = Math.sin(Math.PI * ff); k.strokeStyle = `rgba(28,35,51,${0.8 * al})`; k.lineWidth = 2.5; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(x - 8, yy); k.lineTo(x, yy + 8); k.lineTo(x + 8, yy); k.stroke(); } });
    });
  };

  // @element 24
  // 24 背景動画（ファーストビューの背景で雲と波が流れ続け、その上に見出しとボタンが乗っている）
  function cloud(k, x, y, s, a) { k.fillStyle = `rgba(255,255,255,${a})`; k.beginPath(); k.ellipse(x, y, 30 * s, 10 * s, 0, 0, 7); k.ellipse(x - 12 * s, y - 6 * s, 14 * s, 11 * s, 0, 0, 7); k.ellipse(x + 8 * s, y - 10 * s, 17 * s, 14 * s, 0, 0, 7); k.fill(); }
  CELLS[23] = (k, w, h, u) => {
    u = snapU(u);
    frame(k);
    const f = u / CYC;
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#7C9EF4'); g.addColorStop(1, '#DCE5FF'); k.fillStyle = g; k.fillRect(0, 0, VW, VH);
      k.fillStyle = 'rgba(255,240,230,.95)'; k.beginPath(); k.arc(400, 66, 20, 0, 7); k.fill();
      // 遠い雲（170px ごとにくり返す柄が、1周期で1柄ぶん流れる）・近い雲（340px）
      for (let x = -170; x < VW + 170; x += 170) { const xx = x + mod(f * 170, 170); cloud(k, xx + 40, 30, 0.7, 0.75); cloud(k, xx + 120, 58, 0.55, 0.6); }
      for (let x = -340; x < VW + 340; x += 340) { const xx = x + mod(f * 340, 340); cloud(k, xx + 90, 44, 1.15, 0.95); cloud(k, xx + 260, 86, 0.9, 0.9); }
      mount(k, VW, 132, [[0, .78], [.18, .66], [.36, .76], [.6, .62], [.82, .74], [1, .68]], '#6E8CEB', 0);
      const sea = (y0, A, L, ph, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(0, VH + 1); for (let x = 0; x <= VW + 4; x += 4) k.lineTo(x, y0 + A * Math.sin(2 * Math.PI * x / L + ph)); k.lineTo(VW, VH + 1); k.closePath(); k.fill(); };
      sea(118, 2.5, 90, -2 * Math.PI * f, '#4B6BDB'); sea(130, 3, 60, 2 * Math.PI * f * 2, '#3B5CCF'); sea(146, 2.5, 120, -2 * Math.PI * f, '#2E4DB8');
      k.fillStyle = 'rgba(28,35,51,.12)'; k.fillRect(0, 0, VW, VH);
      { const sg = k.createLinearGradient(0, 0, 300, 0); sg.addColorStop(0, 'rgba(20,28,64,.45)'); sg.addColorStop(1, 'rgba(20,28,64,0)'); k.fillStyle = sg; k.fillRect(0, 0, 300, VH); }
      k.save(); k.shadowColor = 'rgba(16,24,60,.55)'; k.shadowBlur = 10; k.shadowOffsetY = 2; txt(k, '旅に出よう。', 34, 60, `800 28px ${JP}`, '#fff', 'left', 'alphabetic', '1px'); k.restore();
      bars(k, 34, 74, 160, 1, 'rgba(255,255,255,.85)');
      btn(k, 34, 92, 96, 26, '予約する');
      // 再生中の印（一時停止・音なし）
      k.fillStyle = 'rgba(14,18,28,.5)'; rr(k, 420, 134, 76, 24, 12); k.fill();
      k.fillStyle = '#fff'; k.fillRect(435, 140, 3.5, 12); k.fillRect(442, 140, 3.5, 12);
      k.beginPath(); k.moveTo(462, 143); k.lineTo(466, 143); k.lineTo(471, 139); k.lineTo(471, 153); k.lineTo(466, 149); k.lineTo(462, 149); k.closePath(); k.fill();
      k.strokeStyle = '#fff'; k.lineWidth = 1.6; k.lineCap = 'round'; k.beginPath(); k.moveTo(476, 143); k.lineTo(482, 149); k.moveTo(482, 143); k.lineTo(476, 149); k.stroke();
    });
  };

  // @end
  return { width: CW, height: CH, cycle: LOOP, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "camera2" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('camera2', function () {
  // @kit
  // カメラワーク＆切り替え 第2弾 24（カード 539x208）。各コマは時間 u の純関数。第1弾（camera）と同じ3Dの世界・ファインダー・色。
  // 1つの動きは CYC=4.7秒。切り替え（19・20）は A→B の次に B→A と戻るので、パックの周期は CYC×2=9.4秒。
  const CW = 539, CH = 208, FPS = 30;
  const HOLD = 9.4, CYC = HOLD / 2;
  const C = {
    bg: '#F4F3F0', card: '#FFFFFF', border: '#E3E1DC', ink: '#1E1E21', sub: '#8E8E93', faint: '#C9C9CC',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', blueXL: '#E4ECFE', blueBg: '#F1F5FF',
    grid: '#ECECEC', g1: '#F1F0EE', g2: '#E2E1DE', g3: '#CFCECB', g4: '#A9A8A5'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const EN = '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif';
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const mod = (a, n) => ((a % n) + n) % n;
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

  // ============================== 3D SCENE ==============================
  // 世界座標: Y上・カメラは +Z を向く（yaw=0）。単位はメートル。焦点距離 f はピクセル。
  const F0 = 330;  // = 24mm 表示
  const mm = f => Math.round(f / F0 * 24) + 'mm';
  function cam(o) { return Object.assign({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: 0, roll: 0, f: F0 }, o); }
  function proj(c, X, Y, Z) {
    const dx = X - c.x, dy = Y - c.y, dz = Z - c.z;
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    return { x: c.f * x1 / z2, y: -c.f * y2 / z2, z: z2, s: c.f / z2, cx: x1, cy: y2 };
  }
  function camZ(c, X, Y, Z) { return proj(c, X, Y, Z).z; }
  const NEAR = 0.25;
  function seg(ctx, c, a, b) {   // 3D line with near clipping
    let za = camZ(c, ...a), zb = camZ(c, ...b);
    if (za < NEAR && zb < NEAR) return;
    if (za < NEAR) { const t = (NEAR - za) / (zb - za); a = a.map((v, i) => lerp(v, b[i], t)); }
    else if (zb < NEAR) { const t = (NEAR - zb) / (za - zb); b = b.map((v, i) => lerp(v, a[i], t)); }
    const p = proj(c, ...a), q = proj(c, ...b);
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
  }
  function poly(ctx, c, pts) { ctx.beginPath(); pts.forEach((p, i) => { const q = proj(c, ...p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); }

  // sprite = local drawing (meters, y up) anchored at a world point, always facing camera (billboard)
  function sprite(ctx, c, X, Y, Z, fn) {
    const p = proj(c, X, Y, Z); if (p.z < NEAR) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, -p.s); fn(ctx, p.s); ctx.restore();
  }
  function person(ctx, s, o = {}) {
    const col = o.col || C.blue, walk = o.walk || 0, face = o.face;
    ctx.fillStyle = col;
    const sw = Math.sin(walk) * 0.42;
    // legs
    [[-0.08, sw], [0.08, -sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 0.86); ctx.rotate(a); rr(ctx, -0.075, -0.86, 0.15, 0.88, 0.07); ctx.fill(); ctx.restore(); });
    // arms
    [[-0.25, -sw], [0.25, sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 1.38); ctx.rotate(a * (o.armUp ? 0 : 1) + (o.armUp ? (x < 0 ? -2.6 : 2.6) : 0)); rr(ctx, -0.06, -0.58, 0.12, 0.6, 0.06); ctx.fill(); ctx.restore(); });
    rr(ctx, -0.23, 0.82, 0.46, 0.64, 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 1.63, 0.16, 0, 7); ctx.fill();
    if (face !== undefined && Math.cos(face) > 0) {   // 顔の向き（オービット・バレットタイム用）
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.sin(face) * -0.09, 1.65, 0.035, 0, 7); ctx.fill();
    }
  }
  function tree(ctx, s, h = 4, col = C.g2) {
    ctx.fillStyle = C.g3; ctx.fillRect(-0.09 * h / 4, 0, 0.18 * h / 4, h * 0.55);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, h * 0.68, h * 0.3, 0, 7); ctx.fill();
  }
  function building(ctx, s, w, h, col = C.g1) {
    ctx.fillStyle = col; ctx.fillRect(-w / 2, 0, w, h);
    ctx.strokeStyle = C.g3; ctx.lineWidth = 1.4 / s; ctx.strokeRect(-w / 2, 0, w, h);
    ctx.fillStyle = C.g2;
    for (let y = h - 1.6; y > 1; y -= 1.8) for (let x = -w / 2 + 0.6; x < w / 2 - 0.7; x += 1.3) ctx.fillRect(x, y, 0.6, 0.8);
  }
  function post(ctx, s, h = 1.2) { ctx.fillStyle = C.g4; ctx.fillRect(-0.07, 0, 0.14, h); ctx.fillRect(-0.12, h - 0.06, 0.24, 0.1); }

  // scene presets
  const MTN_FAR = [[-420, 0], [-300, 22], [-230, 8], [-150, 30], [-80, 12], [-20, 34], [50, 14], [120, 28], [190, 6], [260, 26], [340, 10], [420, 0]];
  const MTN_NEAR = [[-260, 0], [-190, 12], [-140, 4], [-70, 18], [-20, 6], [30, 15], [95, 3], [160, 16], [230, 5], [300, 0]];
  const BLD = [[-17, 4, 9], [-12, 3.2, 13], [-8, 2.6, 7], [11, 3.4, 11], [15.5, 4, 8], [20, 3, 15], [-24, 3.5, 10], [26, 4, 7]];
  const CITY = [[-9, 3.4, 12], [-5.5, 3, 18], [-2, 3.6, 9], [1.8, 3, 22], [5.4, 3.6, 14], [9, 3, 10], [-13, 3.4, 15], [12.8, 3.6, 19]];

  function world(ctx, w, h, c, o = {}) {
    ctx.save();
    ctx.translate(w / 2, h / 2); ctx.rotate(c.roll || 0);
    const blurBg = o.blurBg || 0, blurFg = o.blurFg || 0;
    const setBlur = b => { ctx.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'; };
    // sky tint
    if (o.sky) { ctx.fillStyle = o.sky; ctx.fillRect(-w * 2, -h * 3, w * 4, h * 6); }
    setBlur(blurBg);
    // sun / moon
    const sun = o.sun === undefined ? [30, 30, 170] : o.sun;
    if (sun) { const p = proj(c, ...sun); if (p.z > NEAR) { ctx.fillStyle = o.sunCol || C.blueL; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, 5.5 * p.s * (o.sunScale || 1)), 0, 7); ctx.fill(); } }
    if (o.clouds) o.clouds.forEach(([X, Y, Z, r]) => { const p = proj(c, X, Y, Z); if (p.z < NEAR) return; ctx.fillStyle = C.g1; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 2.2 * p.s, r * p.s, 0, 0, 7); ctx.ellipse(p.x + r * 1.2 * p.s, p.y + r * .2 * p.s, r * 1.4 * p.s, r * .8 * p.s, 0, 0, 7); ctx.fill(); });
    // mountains (far planes)
    if (o.mountains !== false) {
      const off = o.mtnZ || 0;
      ctx.fillStyle = C.blueXL; poly(ctx, c, [...MTN_FAR.map(([x, y]) => [x, y, 175 + off])]); ctx.fill();
      ctx.fillStyle = C.blueL; poly(ctx, c, [...MTN_NEAR.map(([x, y]) => [x, y, 120 + off])]); ctx.fill();
    }
    // ground + grid
    if (o.grid !== false) {
      ctx.save(); setBlur(blurBg * 0.6);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1.3; ctx.beginPath();
      const z0 = Math.floor(c.z / 2) * 2, xs = o.gridX || 40;
      for (let z = z0 + 2; z <= z0 + 90; z += (z - z0 < 30 ? 2 : 6)) seg(ctx, c, [-xs + c.x, 0, z], [xs + c.x, 0, z]);
      for (let x = Math.floor(c.x / 2) * 2 - xs; x <= c.x + xs; x += 2) seg(ctx, c, [x, 0, z0 + 0.5], [x, 0, z0 + 90]);
      ctx.stroke();
      // horizon
      ctx.strokeStyle = C.g2; ctx.lineWidth = 1.5; ctx.beginPath(); seg(ctx, c, [c.x - 400, 0, c.z + 300], [c.x + 400, 0, c.z + 300]); ctx.stroke();
      ctx.restore();
    }
    // sprites sorted by depth
    const list = [];
    const add = (X, Y, Z, fn, fg) => list.push({ z: camZ(c, X, Y, Z), X, Y, Z, fn, fg });
    if (o.buildings !== false) (o.city ? CITY.map(([x, bw, bh]) => [x, bw, bh, 30]) : BLD.map(([x, bw, bh]) => [x, bw, bh, 48])).forEach(([x, bw, bh, z]) => add(x, 0, z, (k, s) => building(k, s, bw, bh)));
    if (o.trees !== false) [[-7, 22], [6.5, 19], [9.5, 24], [-11, 26], [3, 30]].forEach(([x, z]) => add(x, 0, z, (k, s) => tree(k, s, 4)));
    if (o.tower) add(o.tower[0], 0, o.tower[1], (k, s) => { building(k, s, 6, 9.5, C.g1); k.fillStyle = C.g4; k.fillRect(-0.08, 9.5, 0.16, 2.2); k.fillStyle = C.blue; k.beginPath(); k.arc(0, 11.8, 0.3, 0, 7); k.fill(); });
    if (o.ring) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(o.ring[0] + Math.sin(a) * o.ring[2], 0, o.ring[1] + Math.cos(a) * o.ring[2], (k, s) => tree(k, s, 3.2, i % 3 ? C.g2 : C.blueXL)); }
    if (o.extra) o.extra.forEach(e => add(e[0], e[1], e[2], e[3], e[4]));
    if (o.person) { const pp = o.person; add(pp.x || 0, pp.y || 0, pp.z === undefined ? 8 : pp.z, (k, s) => person(k, s, pp), pp.fg); }
    if (o.fg) o.fg.forEach(([X, Z, kind]) => add(X, 0, Z, (k, s) => kind === 'rock' ? (k.fillStyle = C.g3, k.beginPath(), k.ellipse(0, 0.1, 0.55, 0.38, 0, 0, 7), k.fill()) : post(k, s), true));
    list.sort((a, b) => b.z - a.z);
    for (const it of list) { setBlur(it.fg ? blurFg : blurBg); sprite(ctx, c, it.X, it.Y, it.Z, it.fn); }
    ctx.filter = 'none';
    if (o.after) o.after(ctx, c);
    ctx.restore();
  }

  // ============================== VIEWFINDER CARD ==============================
  const CARD = mkCanvas(CW, CH), CK = CARD.getContext('2d');
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const TMP2 = mkCanvas(CW, CH), TK2 = TMP2.getContext('2d');
  function clear(k, w = CW, h = CH) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.filter = 'none'; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h); }
  // draw fnA then blend fnB on top with alpha a (into k)
  function blend(k, fnA, fnB, a) {
    if (a <= 0.001) return fnA(k);
    if (a >= 0.999) return fnB(k);
    fnA(k);
    clear(TK2); fnB(TK2); k.save(); k.globalAlpha = a; k.drawImage(TMP2, 0, 0); k.restore();
  }
  // motion blur: average n renders of fn(k, s) with s spread over [s0, s1]
  function mblur(k, fn, s0, s1, n) {
    if (Math.abs(s1 - s0) < 1e-4 || n < 2) return fn(k, s0);
    const acc = mkCanvasCached(), ak = acc.getContext('2d');
    for (let i = 0; i < n; i++) {
      clear(TK); fn(TK, lerp(s0, s1, (i + .5) / n));
      ak.globalAlpha = 1 / (i + 1); ak.drawImage(TMP, 0, 0);
    }
    ak.globalAlpha = 1; k.save(); k.drawImage(acc, 0, 0); k.restore();
  }
  let _acc; function mkCanvasCached() { if (!_acc) _acc = mkCanvas(CW, CH); const k = _acc.getContext('2d'); k.globalAlpha = 1; k.fillStyle = '#fff'; k.fillRect(0, 0, CW, CH); return _acc; }

  function viewfinder(k, w, h, t, hud, hudCol) {
    k.save();
    const m = 13, L = 20;
    k.strokeStyle = '#8F8F94'; k.lineWidth = 2.6; k.lineCap = 'round';
    k.beginPath();
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => { k.moveTo(x, y + sy * L); k.lineTo(x, y); k.lineTo(x + sx * L, y); });
    k.stroke();
    // center mark
    k.strokeStyle = 'rgba(143,143,148,.55)'; k.lineWidth = 1.6; k.beginPath(); k.moveTo(w / 2 - 7, h / 2); k.lineTo(w / 2 + 7, h / 2); k.moveTo(w / 2, h / 2 - 7); k.lineTo(w / 2, h / 2 + 7); k.stroke();
    // REC (なめらかな明滅・9.4秒で9回＝ループの継ぎ目なし)
    const a = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 9 / HOLD);
    k.fillStyle = C.blue; k.globalAlpha = a; k.beginPath(); k.arc(m + 16, m + 17, 5, 0, 7); k.fill(); k.globalAlpha = 1;
    txt(k, 'REC', m + 27, m + 17, `600 14px ${MONO}`, '#7D7D82', 'left', 'middle');
    if (hud) {
      const f = `600 15px ${MONO}`, ww = tw(k, hud, f);
      k.fillStyle = 'rgba(255,255,255,.82)'; rr(k, w - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
      txt(k, hud, w - m - 14, m + 18, f, hudCol || '#6E6E73', 'right', 'middle');
    }
    k.restore();
  }

  // ============================== CELLS ==============================
  // each: (k, w, h, u) where u = time within the cycle (0..CYC), cyc = cycle index; returns HUD string
  const RESET = 0.5;  // 末尾のクロスフェードで開始状態へ戻す
  function camCell(stateAt, hudAt, t0 = 0.5, t1 = 3.4) {
    return (k, w, h, u) => {
      const p = eIO(P(u, t0, t1));
      const r = P(u, CYC - RESET, CYC);
      blend(k, kk => stateAt(kk, w, h, p, u), kk => stateAt(kk, w, h, 0, u - CYC), eIOs(r));
      return hudAt(r > 0.5 ? 0 : p, u);
    };
  }
  // 1コマぶんの枠: 白地 → 中身 → ファインダー（四隅・REC・右上の数値）。u はパック周期 0..CYC×2
  function shot(fn, vh) {
    return (k, w, h, u) => {
      const uu = mod(u, CYC), cyc = Math.floor(u / CYC);
      k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h);
      k.save(); const hud = fn(k, w, h, uu, cyc); k.restore();
      k.globalAlpha = 1; k.filter = 'none';
      viewfinder(k, w, vh || h, u, hud);
    };
  }
  // 画面下の帯（カットの並びを示す）: segs = [[t0, t1, ラベル, 色], …]、pos = 再生位置（秒）
  function strip(k, w, h, segs, pos, lab) {
    const x0 = 44, x1 = w - 44, y = h - 36, hh = 24;
    const xAt = t => lerp(x0, x1, t / CYC);
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; rr(k, x0 - 6, y - 5, x1 - x0 + 12, hh + 10, 7); k.fill();
    segs.forEach(([a, b, s, col]) => {
      k.fillStyle = col; rr(k, xAt(a) + 1, y, Math.max(2, xAt(b) - xAt(a) - 2), hh, 4); k.fill();
      if (s) txt(k, s, (xAt(a) + xAt(b)) / 2, y + hh / 2 + .5, `700 12px ${JP}`, col === C.g2 ? C.g4 : '#fff', 'center', 'middle');
    });
    const hx = xAt(pos); k.fillStyle = C.ink; k.fillRect(hx - 1.5, y - 4, 3, hh + 8); k.beginPath(); k.moveTo(hx - 5, y - 6); k.lineTo(hx + 5, y - 6); k.lineTo(hx, y - 1); k.fill();
    if (lab) txt(k, lab, x0 - 6, y - 10, `600 11px ${MONO}`, C.sub, 'left', 'alphabetic');
    k.restore();
  }
  const CELLS = [];

  // @element 01
  // 01 ペデスタル: カメラごと真上へ平行移動。向き（ピッチ）は変えないので地平線は画面の中央のまま（#031 クレーンアップとの違い）
  CELLS[0] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ y: lerp(1.0, 3.2, p) }), { person: { z: 7 }, tower: [3.5, 26], buildings: true }),
    p => `↕ ${lerp(1.0, 3.2, p).toFixed(1)}m`));

  // @element 02
  // 02 バレルロール: レンズの軸（画面の中央）でカメラを1回転
  CELLS[1] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ roll: p * Math.PI * 2 }), { person: { z: 7 } }),
    p => `↻ ${Math.round(p * 360)}°`, 0.5, 3.6));

  // @element 03
  // 03 ハイパーラプス: 街路を前へ進みながらのタイムラプス（太陽・雲・人影が早送り）。#039 タイムラプスはカメラが動かない
  const HL_BLD = [[-7.5, 4, 9, 5], [7.5, 3.4, 12, 9], [-7.5, 3.6, 14, 13], [7.5, 4, 8, 18], [-7.5, 3.2, 11, 22], [7.5, 3.6, 15, 27], [-7.5, 4, 9, 31], [7.5, 3.2, 12, 36], [-7.5, 3.6, 13, 40], [7.5, 4, 10, 45], [-7.5, 3.4, 16, 50], [7.5, 3.6, 9, 55]];
  CELLS[2] = shot(camCell((k, w, h, p) => {
    const z = lerp(0, 22, p), a = lerp(-1.25, 1.25, p);
    const clouds = [[-20 + mod(p * 140, 80) - 10, 18, z + 90, 2.2], [-50 + mod(p * 140 + 40, 80), 24, z + 120, 3], [-10 + mod(p * 140 + 20, 80) - 30, 13, z + 70, 1.6]];
    const ex = HL_BLD.map(([x, bw, bh, zz]) => [x, 0, zz, (kk, s) => building(kk, s, bw, bh)]);
    for (let i = 0; i < 6; i++) { const ph = mod(p * 6 + i / 6, 1), dir = i % 2 ? 1 : -1; ex.push([dir * lerp(-5.5, 5.5, ph), 0, 7 + i * 7, (kk) => { kk.fillStyle = i % 3 ? C.g4 : C.blueM; kk.fillRect(-0.12, 0, 0.24, 0.9); kk.beginPath(); kk.arc(0, 1.05, 0.13, 0, 7); kk.fill(); }]); }
    world(k, w, h, cam({ z, y: 1.6, pitch: 0.05 }), {
      buildings: false, trees: false, mtnZ: z, sun: [Math.sin(a) * 120, Math.cos(a) * 60 - 8, z + 170], sunCol: C.blueM, clouds, extra: ex, gridX: 24,
      after: (kk, cc) => {   // 建物の影（太陽と反対側へ）
        kk.fillStyle = 'rgba(160,160,165,.22)';
        HL_BLD.forEach(([x, bw, bh, zz]) => { if (zz < cc.z + 1) return; const L = bh * 0.9; const q1 = proj(cc, x - bw / 2, 0, zz), q2 = proj(cc, x + bw / 2, 0, zz), q3 = proj(cc, x + bw / 2 - Math.sin(a) * L, 0, zz - Math.cos(a) * L * 0.4 - 1), q4 = proj(cc, x - bw / 2 - Math.sin(a) * L, 0, zz - Math.cos(a) * L * 0.4 - 1); if (q3.z < NEAR || q4.z < NEAR) return; kk.beginPath(); kk.moveTo(q1.x, q1.y); kk.lineTo(q2.x, q2.y); kk.lineTo(q3.x, q3.y); kk.lineTo(q4.x, q4.y); kk.fill(); });
      }
    });
  }, p => { const m = Math.round(lerp(6 * 60, 18 * 60, p) / 10) * 10; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} · ${Math.round(lerp(0, 22, p))}m`; }, 0.4, 4.1));

  // @element 04
  // 04 長回し: 歩く人物をカットなしで追い続ける1ショット。画面下の帯は1本のまま（#041 ジャンプカットのように割れない）
  CELLS[3] = shot((k, w, h, u) => {
    const uu = Math.min(u, CYC - RESET);
    const draw = (kk, t) => {
      const p = t / (CYC - RESET);
      const x = lerp(-3.4, 2.8, p), z = lerp(5.2, 9.6, p), cx = lerp(0, 1.4, p);
      world(kk, w, h, cam({ x: cx, y: 1.4, yaw: Math.atan2(x - cx, z) * 0.8 }), { person: { x, z, walk: t * 7 }, fg: [[-2.6, 3.4], [3.6, 4.6, 'rock']] });
      strip(kk, w, h, [[0, CYC, '1ショット・カットなし', C.blue]], t);
    };
    const r = P(u, CYC - RESET, CYC);
    blend(k, kk => draw(kk, uu), kk => draw(kk, 0), eIOs(r));
    return `NO CUT ${(r > .5 ? 0 : uu).toFixed(1)}s`;
  });

  // @element 05
  // 05 ステディカム: 低い周波数の小さなうねりだけで、なめらかに前進しながら人物を追う（#034 手持ちの細かい揺れとの違い）
  CELLS[4] = shot((k, w, h, u) => {
    const v = 8 / CYC, z = u * v, T = u * 2 * Math.PI / CYC;   // 1周で8m進む＝格子（2m）と木（8m）の並びが継ぎ目なく戻る
    const c = cam({ z, y: 1.45 + 0.035 * Math.sin(T * 2), x: 0.05 * Math.sin(T), yaw: 0.012 * Math.sin(T + 1), roll: 0.006 * Math.sin(T * 2 + 0.5), pitch: -0.02 });
    const ex = [], L = 8, base = Math.floor(z / L) * L;
    for (let i = 0; i < 10; i++) { const zz = base + i * L; ex.push([-5, 0, zz + 2, (kk, s) => tree(kk, s, 3.6)]); ex.push([5, 0, zz + 6, (kk, s) => tree(kk, s, 3.2, C.blueXL)]); }
    world(k, w, h, c, { buildings: false, trees: false, extra: ex, mtnZ: z, sun: [30, 30, z + 170], gridX: 20, person: { z: z + 5, walk: T * 5 } });
    return 'STEADICAM';
  });

  // @element 06
  // 06 フォローショット: 蛇行して歩く人物の後ろを、少し遅れて同じ道筋でついていく（#029 トラッキングは真横に並ぶ）
  CELLS[5] = shot(camCell((k, w, h, p) => {
    const path = s => [1.8 * Math.sin(s * 2.2), 4 + s * 9];
    const [px, pz] = path(p), [cx, cz] = path(p - 0.4);
    world(k, w, h, cam({ x: cx, z: cz, y: 1.5, yaw: Math.atan2(px - cx, pz - cz) }), { person: { x: px, z: pz, walk: p * 30 }, fg: [[-2.4, 7], [2.6, 9.5, 'rock'], [-1.5, 12]] });
  }, p => `FOLLOW ${Math.hypot(1.8 * Math.sin(p * 2.2) - 1.8 * Math.sin((p - 0.4) * 2.2), 3.6).toFixed(1)}m`, 0.3, 4.2));

  // @element 07
  // 07 ロックオフ: 三脚で固定したカメラの前を人物が横切り、奥を車が通る。カメラは1pxも動かない（#040 フリーズフレームは映像が止まる）
  CELLS[6] = shot((k, w, h, u) => {
    const q = u / CYC;
    world(k, w, h, cam({ y: 1.4 }), {
      person: { x: lerp(-6.2, 6.2, q), z: 6.5, walk: u * 7 },
      extra: [[lerp(16, -16, q), 0, 15, (kk) => { kk.fillStyle = C.g4; rr(kk, -1.9, 0.35, 3.8, 0.75, 0.25); kk.fill(); rr(kk, -1.1, 0.95, 2.1, 0.62, 0.28); kk.fill(); kk.fillStyle = C.ink; [-1.15, 1.15].forEach(x => { kk.beginPath(); kk.arc(x, 0.34, 0.34, 0, 7); kk.fill(); }); }]],
      after: (kk) => {   // 三脚の印（左下）
        kk.strokeStyle = C.g4; kk.lineWidth = 2.2; kk.lineCap = 'round'; const x = -w / 2 + 38, y = h / 2 - 20;
        kk.beginPath(); kk.moveTo(x, y - 30); kk.lineTo(x - 12, y); kk.moveTo(x, y - 30); kk.lineTo(x + 12, y); kk.moveTo(x, y - 30); kk.lineTo(x, y - 2); kk.stroke();
        kk.fillStyle = C.g4; rr(kk, x - 9, y - 42, 18, 12, 3); kk.fill();
      }
    });
    return 'LOCKED';
  });

  // @element 08
  // 08 フライスルー: 壁の窓へ向かって飛び、通り抜けて向こうの場所へ出る（#035 FPV は木の間を抜けていく）
  CELLS[7] = shot(camCell((k, w, h, p) => {
    const z = lerp(0, 12.5, p), WZ = 8;
    world(k, w, h, cam({ z, y: 1.3 }), {
      buildings: true, person: { x: 0.3, z: 14.5 },
      extra: [[0, 0, WZ, (kk, s) => {   // 窓のあいた壁（偶奇塗り）
        kk.fillStyle = C.g1; kk.beginPath(); kk.rect(-40, 0, 80, 14); kk.rect(-1.2, 0.15, 2.4, 2.2); kk.fill('evenodd');
        kk.strokeStyle = C.g3; kk.lineWidth = 1.6 / s; kk.strokeRect(-1.2, 0.15, 2.4, 2.2);
        kk.strokeStyle = C.g2; kk.lineWidth = 1.2 / s; kk.beginPath(); kk.moveTo(-40, 14); kk.lineTo(40, 14); kk.stroke();
      }]]
    });
  }, p => { const d = 8 - lerp(0, 12.5, p); return d > 0 ? `窓まで ${d.toFixed(1)}m` : '通過'; }, 0.5, 3.6));

  // @element 09
  // 09 ローアングル: カメラを地面近くに下げ、見上げる。人物が大きく、建物が高く見える
  CELLS[8] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ y: lerp(1.5, 0.35, p), pitch: lerp(0, 0.32, p) }), { person: { z: 4.5 }, tower: [-3, 22] }),
    p => `↗ ${Math.round(lerp(0, 0.32, p) * 57.3)}° · ${lerp(1.5, 0.35, p).toFixed(1)}m`, 0.6, 2.2));

  // @element 10
  // 10 ハイアングル: カメラを高い位置へ上げ、見下ろす。人物が小さく見える（#031 クレーンアップは上がり続けて全体を見せる）
  CELLS[9] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ y: lerp(1.5, 4.5, p), pitch: lerp(0, -0.5, p) }), { person: { z: 5 } }),
    p => `↘ ${Math.round(lerp(0, 0.5, p) * 57.3)}° · ${lerp(1.5, 4.5, p).toFixed(1)}m`, 0.6, 2.2));

  // @element 11
  // 11 POVショット: 登場人物の目で見た画。歩く上下動と画面下の両手で一人称だと分かる。前の人物が振り向いて手を振る
  CELLS[10] = shot(camCell((k, w, h, p, u) => {
    const z = lerp(0, 3.2, p), T = u * 2 * Math.PI / CYC;
    const bob = Math.sin(T * 6) * 0.03 * (p > 0 && p < 1 ? 1 : 0);
    world(k, w, h, cam({ z, y: 1.6 + bob, roll: Math.sin(T * 3) * 0.008 * (p > 0 && p < 1 ? 1 : 0) }), {
      person: { z: 7.5, armUp: u > 1.6 && u < 3.4, walk: 0 }, fg: [[-1.8, 2.6], [2.2, 3.8]],
      after: (kk) => {   // 両手（画面の下の両端から入る。体と一緒に動くので、揺れるのは世界のほう）
        kk.fillStyle = C.blue;
        [-1, 1].forEach(sx => { kk.save(); kk.translate(sx * 178, 64); kk.rotate(sx * -0.5); kk.fillStyle = C.blue; rr(kk, -34, -28, 68, 120, 30); kk.fill(); if (sx > 0) { kk.fillStyle = '#fff'; rr(kk, -17, -62, 34, 54, 6); kk.fill(); kk.strokeStyle = C.blue; kk.lineWidth = 3; rr(kk, -17, -62, 34, 54, 6); kk.stroke(); } kk.restore(); });
      }
    });
  }, p => 'POV', 0.3, 4.2));

  // @element 12
  // 12 オーバーザショルダー: 手前の人物の肩と後頭部を画面の端に入れ、肩越しに相手を撮る。手前はぼけ、相手にピント
  CELLS[11] = shot(camCell((k, w, h, p, u) => {
    world(k, w, h, cam({ z: lerp(0, 0.35, p), y: 1.55, yaw: 0.05 }), {
      person: { x: 0.32, z: 3.1, walk: 0.35 * Math.sin(u * 5) }, blurFg: 2.6,
      extra: [[-0.62, 0, 1.15, (kk) => { kk.fillStyle = C.g4; kk.beginPath(); kk.arc(0, 1.63, 0.17, 0, 7); kk.fill(); rr(kk, -0.34, 0.9, 0.68, 0.6, 0.14); kk.fill(); }, true]]
    });
  }, p => 'OTS'));

  // @element 13
  // 13 バーズアイ: 真上（ピッチ -90°）から真下を見る。道・人・車・木がすべて上から見た形になる（10 ハイアングルは斜めから）
  CELLS[12] = shot(camCell((k, w, h, p) => {
    const c = cam({ y: lerp(9, 15, p), pitch: -Math.PI / 2 });
    const ex = [[0, 0, 0, (kk, s) => {   // 地面（格子と道）を1枚のスプライトとして描く
      kk.fillStyle = C.g1; kk.fillRect(-1.6, -16, 3.2, 32);
      kk.strokeStyle = C.grid; kk.lineWidth = 1.3 / s; kk.beginPath();
      for (let i = -16; i <= 16; i += 2) { kk.moveTo(i, -16); kk.lineTo(i, 16); kk.moveTo(-16, i); kk.lineTo(16, i); }
      kk.stroke();
      kk.strokeStyle = '#fff'; kk.lineWidth = 2 / s; kk.setLineDash([0.6, 0.6]); kk.beginPath(); kk.moveTo(0, -16); kk.lineTo(0, 16); kk.stroke(); kk.setLineDash([]);
    }]];
    [[-4.5, -2.5, 1.0], [-5.5, 1.8, 1.2], [4.6, -0.6, 1.1], [5.2, 3.2, 0.9], [-4.2, 5.5, 1.0], [4.9, -4.4, 1.0]].forEach(([x, z, r]) => ex.push([x, 0, z, (kk) => { kk.fillStyle = C.g2; kk.beginPath(); kk.arc(0, 0, r, 0, 7); kk.fill(); kk.fillStyle = C.g3; kk.beginPath(); kk.arc(0, 0, 0.12, 0, 7); kk.fill(); }]));
    [[-8.5, -3, 3, 2.4], [8.6, 1, 3.4, 2.8], [-8.3, 2.5, 2.6, 2]].forEach(([x, z, bw, bd]) => ex.push([x, 0, z, (kk, s) => { kk.fillStyle = C.g1; kk.fillRect(-bw / 2, -bd / 2, bw, bd); kk.strokeStyle = C.g3; kk.lineWidth = 1.4 / s; kk.strokeRect(-bw / 2, -bd / 2, bw, bd); }]));
    ex.push([-0.8, 0, lerp(3.4, -3.4, p), (kk) => { kk.fillStyle = C.blue; rr(kk, -0.9, -2, 1.8, 4, 0.4); kk.fill(); kk.fillStyle = '#fff'; kk.fillRect(-0.7, 0.3, 1.4, 0.8); kk.fillRect(-0.7, -1.2, 1.4, 0.6); }]);
    ex.push([0.9, 0, lerp(-2.6, 2.6, p), (kk) => { kk.fillStyle = C.blue; kk.beginPath(); kk.ellipse(0, 0, 0.24, 0.12, 0, 0, 7); kk.fill(); kk.beginPath(); kk.arc(0, 0, 0.16, 0, 7); kk.fill(); }]);
    world(k, w, h, c, { grid: false, mountains: false, buildings: false, trees: false, sun: null, extra: ex });
  }, p => `↓ 90° · ${lerp(9, 15, p).toFixed(0)}m`));

  // @element 14
  // 14 ディープフォーカス: 手前の花から奥の建物まで、全部に同時にピントが合う（#033 ラックフォーカスは片方ずつ）
  CELLS[13] = shot(camCell((k, w, h, p) => {
    world(k, w, h, cam({ y: 1.1 }), {
      person: { x: 0.9, z: 9 }, blurFg: 5 * (1 - p), blurBg: 6 * (1 - p),
      extra: [[-0.75, 0, 2.0, (kk, s) => { kk.fillStyle = C.g3; kk.fillRect(-0.025, 0, 0.05, 0.75); kk.fillStyle = C.blueM; for (let i = 0; i < 6; i++) { kk.beginPath(); kk.ellipse(Math.cos(i) * 0.09, 0.8 + Math.sin(i) * 0.09, 0.08, 0.05, i, 0, 7); kk.fill(); } kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0.8, 0.05, 0, 7); kk.fill(); }, true]],
      after: (kk, cc) => {   // ピントの枠を手前と奥の両方に（合うにつれて濃く）
        kk.globalAlpha = p; kk.strokeStyle = C.blue; kk.lineWidth = 2; kk.beginPath();
        [[proj(cc, -0.75, 0.8, 2.0), 46], [proj(cc, 0.9, 0.9, 9), 30]].forEach(([q, r]) => [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { kk.moveTo(q.x + sx * r, q.y + sy * r - sy * 9); kk.lineTo(q.x + sx * r, q.y + sy * r); kk.lineTo(q.x + sx * r - sx * 9, q.y + sy * r); }));
        kk.stroke(); kk.globalAlpha = 1;
      }
    });
  }, p => { const a = lerp(1.8, 16, p); return `f/${a < 10 ? a.toFixed(1) : Math.round(a)}`; }));

  // @element 15
  // 15 エスタブリッシングショット: 広角・高い位置から街全体を見せる引きの画。ゆっくり寄りながら場所の表示が出る
  CELLS[14] = shot(camCell((k, w, h, p, u) => {
    const clouds = [[-30, 20, 110, 2.6], [20, 26, 150, 3.2], [60, 17, 95, 2]];
    world(k, w, h, cam({ f: 220, y: 4.5, pitch: -0.06, z: lerp(-5, -2.5, p) }), { city: true, clouds, tower: [16, 36], person: { x: -1, z: 12 } });
    const a = P(u, 0.9, 1.3);   // 場所の表示（左下）
    if (a > 0) { k.save(); k.globalAlpha = a; k.translate(30, h - 52 + (1 - a) * 8); k.fillStyle = 'rgba(255,255,255,.9)'; rr(k, 0, 0, 158, 30, 6); k.fill(); k.fillStyle = C.blue; k.fillRect(0, 0, 4, 30); txt(k, 'EXT. CITY – DAY', 14, 15.5, `600 14px ${MONO}`, C.ink, 'left', 'middle'); k.restore(); }
  }, p => `${mm(220)} WIDE`, 0.3, 4.2));

  // @element 16
  // 16 エクストリームクローズアップ: 顔のクローズアップから、目だけが画面を埋めるまで寄る
  CELLS[15] = shot(camCell((k, w, h, p) => {
    const f = 610 * Math.pow(2040 / 610, p);
    world(k, w, h, cam({ f, x: -0.06, y: 1.66 }), {
      blurBg: 3, trees: true,
      extra: [[0, 0, 1.3, (kk) => {   // 目のある顔
        person(kk, 1);
        [[-0.06, 1.66], [0.06, 1.66]].forEach(([x, y]) => { kk.fillStyle = '#fff'; kk.beginPath(); kk.ellipse(x, y, 0.045, 0.028, 0, 0, 7); kk.fill(); kk.fillStyle = C.ink; kk.beginPath(); kk.arc(x + 0.008, y, 0.016, 0, 7); kk.fill(); kk.fillStyle = '#fff'; kk.beginPath(); kk.arc(x + 0.014, y + 0.007, 0.005, 0, 7); kk.fill(); kk.strokeStyle = '#fff'; kk.lineWidth = 0.012; kk.beginPath(); kk.arc(x, y + 0.02, 0.05, Math.PI * 1.15, Math.PI * 1.85); kk.stroke(); });
      }]]
    });
  }, p => `${mm(610 * Math.pow(2040 / 610, p))} ${p > 0.85 ? 'ECU' : 'CU'}`));

  // @element 17
  // 17 インサートショット: 同じ場面の細部（手元の時計）を1.3秒だけ差し込み、元の画に戻る
  const INS = [1.6, 2.9];
  CELLS[16] = shot((k, w, h, u) => {
    const ins = u >= INS[0] && u < INS[1];
    if (!ins) world(k, w, h, cam({ y: 1.4 }), { person: { x: -0.6, z: 6, walk: 0 }, fg: [[2.2, 4]], after: (kk, cc) => { const q = proj(cc, -0.35, 1.08, 6); kk.fillStyle = C.ink; kk.beginPath(); kk.arc(q.x, q.y, 1.6 * q.s / 10, 0, 7); kk.fill(); } });
    else {   // 手首の時計の大写し
      k.save(); k.translate(w / 2, h / 2);
      k.fillStyle = C.blueXL; k.fillRect(-w, -h, w * 2, h * 2);
      k.fillStyle = C.blue; k.save(); k.rotate(-0.35); rr(k, -300, -46, 600, 92, 30); k.fill(); k.restore();
      k.fillStyle = '#fff'; k.beginPath(); k.arc(0, 0, 58, 0, 7); k.fill(); k.strokeStyle = C.ink; k.lineWidth = 5; k.stroke();
      k.strokeStyle = C.ink; k.lineWidth = 4; k.lineCap = 'round'; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -34); k.moveTo(0, 0); k.lineTo(26, 14); k.stroke();
      const a = (u - INS[0]) / (INS[1] - INS[0]) * Math.PI * 2 - Math.PI / 2;   // 秒針が1周
      k.strokeStyle = C.blue; k.lineWidth = 2; k.beginPath(); k.moveTo(0, 0); k.lineTo(Math.cos(a) * 44, Math.sin(a) * 44); k.stroke();
      k.restore();
    }
    strip(k, w, h, [[0, INS[0], 'A', C.g2], [INS[0], INS[1], '細部', C.blue], [INS[1], CYC, 'A', C.g2]], u);
    return ins ? 'INSERT' : 'SHOT A';
  });

  // @element 18
  // 18 モーフカット: 同じ人物の2テイクを、位置と姿勢をなめらかに補間してつなぐ（#041 ジャンプカットは飛ぶ）
  CELLS[17] = shot((k, w, h, u) => {
    const T0 = 2.0, T1 = 2.45, r = P(u, CYC - RESET, CYC);
    const draw = (kk, t) => {
      const q = eIOs(P(t, T0, T1));
      // テイク1とテイク2は姿勢が違う。モーフ中は同じ（補間した）位置に2つの姿勢を重ねて溶かす
      const pose = (k2, m) => world(k2, w, h, cam({ y: 1.45, z: 0 }), { person: { x: lerp(-0.4, 0.35, q), z: 3.3, walk: (m ? 0.55 : -0.45) + 0.12 * Math.sin(t * 3) }, trees: true, buildings: true });
      const bl = Math.sin(q * Math.PI) * 2.2;
      kk.save(); kk.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : 'none';
      blend(kk, k2 => pose(k2, false), k2 => pose(k2, true), q);
      kk.restore();
      strip(kk, w, h, [[0, T0, 'テイク1', C.g2], [T0, T1, '', C.blue], [T1, CYC, 'テイク2', C.g2]], t);
    };
    blend(k, kk => draw(kk, u), kk => draw(kk, 0), eIOs(r));
    return r > .5 || u < T0 ? 'TAKE 1' : u < T1 ? 'MORPH' : 'TAKE 2';
  });

  // @shared
  // ---- 切り替え: 奇数サイクルは B→A に戻る（リセット不要）
  const sceneA = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.4 }, extra.cam)), Object.assign({ person: { x: -0.6, z: 7 } }, extra));
  const CAR = [1.2, 0, 9, (kk) => { kk.fillStyle = C.blue; rr(kk, -1.9, 0.35, 3.8, 0.75, 0.25); kk.fill(); rr(kk, -1.1, 0.95, 2.1, 0.62, 0.28); kk.fill(); kk.fillStyle = '#fff'; kk.fillRect(-0.85, 1.08, 0.8, 0.36); kk.fillRect(0.12, 1.08, 0.7, 0.36); kk.fillStyle = C.ink; [-1.15, 1.15].forEach(x => { kk.beginPath(); kk.arc(x, 0.34, 0.34, 0, 7); kk.fill(); }); }];
  const SB = { city: true, mountains: false, trees: false, sun: [-26, 40, 150], extra: [CAR] };
  const sceneB = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.6, pitch: 0.1 }, extra.cam)), Object.assign({}, SB, extra));
  function abCell(trans, hudFn) {
    return (k, w, h, u, cyc) => {
      const S = cyc % 2 === 0 ? [sceneA, sceneB] : [sceneB, sceneA];
      trans(k, w, h, u, S[0], S[1], cyc);
      return hudFn ? hudFn(u, cyc) : (cyc % 2 === 0 ? 'A → B' : 'B → A');
    };
  }

  // @element 19
  // 19 フェードアウト: 画面全体が黒へ沈んで終わり、黒から次の場面が明けてくる
  CELLS[18] = shot(abCell((k, w, h, u, A, B) => {
    const out = eIOs(P(u, 1.4, 2.6)), inn = eIOs(P(u, 3.1, 4.3));
    if (u < 2.9) A(k, w, h); else B(k, w, h);
    const a = u < 2.9 ? out : 1 - inn;
    if (a > 0) { k.fillStyle = `rgba(20,20,24,${a.toFixed(3)})`; k.fillRect(0, 0, w, h); }
  }, u => u < 2.9 ? 'FADE OUT' : 'FADE IN'));

  // @element 20
  // 20 アイリスアウト: 人物を中心に丸い窓が閉じて黒になり、次の場面は丸い窓が開いて現れる
  CELLS[19] = shot(abCell((k, w, h, u, A, B) => {
    const out = eIOs(P(u, 1.3, 2.7)), inn = eIOs(P(u, 3.1, 4.4));
    const first = u < 2.9, cur = first ? A : B;
    cur(k, w, h);
    // 窓の中心は、いま映っている場面の主役（Aは人物の頭、Bは車）
    const c = cur === sceneA ? proj(cam({ y: 1.4 }), -0.6, 1.63, 7) : proj(cam({ y: 1.6, pitch: 0.1 }), 1.2, 0.9, 9);
    const rad = first ? lerp(340, 0, out) : lerp(0, 340, inn);
    const cx = w / 2 + c.x, cy = h / 2 + c.y;
    if (rad < 339) {
      k.fillStyle = '#141418'; k.beginPath(); k.rect(0, 0, w, h); k.arc(cx, cy, Math.max(0, rad), 0, Math.PI * 2, true); k.fill('evenodd');
      if (rad > 1) { k.strokeStyle = C.blue; k.lineWidth = 2; k.beginPath(); k.arc(cx, cy, rad, 0, 7); k.stroke(); }
    }
  }, u => u < 2.9 ? 'IRIS OUT' : 'IRIS IN'));

  // @element 21
  // 21 カットアウェイ: 話す人物から、別の対象（聞いている客席）へ切り替えて戻る。17 インサートは同じ場面の細部
  const CUT = [1.7, 3.0];
  CELLS[20] = shot((k, w, h, u) => {
    const away = u >= CUT[0] && u < CUT[1];
    if (!away) world(k, w, h, cam({ y: 1.4 }), { person: { x: 0, z: 5.5, walk: 0.45 * Math.sin(u * 6) }, extra: [[0.9, 0, 5.6, (kk) => { kk.fillStyle = C.g3; kk.fillRect(-0.3, 0, 0.6, 1.1); kk.fillRect(-0.4, 1.05, 0.8, 0.1); }]] });
    else {
      const t = u - CUT[0], ex = [];
      [[-1.6, 3.2], [-0.2, 3.6], [1.3, 3.1], [0.6, 4.4], [-1.1, 4.6]].forEach(([x, z], i) => ex.push([x, 0, z, (kk) => { kk.save(); kk.translate(0, Math.abs(Math.sin(t * 9 + i)) * 0.05); person(kk, 1, { armUp: true, col: i % 2 ? C.blue : C.blueM }); kk.restore(); }]));
      world(k, w, h, cam({ y: 1.6, pitch: -0.08 }), { buildings: false, trees: false, mountains: false, sun: null, extra: ex });
    }
    strip(k, w, h, [[0, CUT[0], 'A', C.g2], [CUT[0], CUT[1], '別の対象', C.blue], [CUT[1], CYC, 'A', C.g2]], u);
    return away ? 'CUTAWAY' : 'SHOT A';
  });

  // @element 22
  // 22 クロスカッティング: 同時に進む2つの場面（走る人物・走る車）を、だんだん短く交互に見せる
  const XC = [0, 1.1, 2.0, 2.7, 3.3, 3.8, 4.2, 4.5, CYC];
  CELLS[21] = shot((k, w, h, u) => {
    const r = P(u, CYC - 0.3, CYC);
    const runA = (kk, t) => world(kk, w, h, cam({ y: 1.3 }), { person: { x: -0.3, z: lerp(15, 4.5, t / CYC), walk: t * 12 }, fg: [[-2.2, 3.5], [-2.2, 6.5], [-2.2, 9.5], [-2.2, 12.5]] });
    const carB = (kk, t) => world(kk, w, h, cam({ y: 1.6, pitch: 0.06 }), { city: true, mountains: false, trees: false, sun: [-26, 40, 150], extra: [[1.0, 0, lerp(17, 4.5, t / CYC), CAR[3]]] });
    let i = 0; while (u >= XC[i + 1]) i++;
    const isA = i % 2 === 0;
    blend(k, kk => (isA ? runA : carB)(kk, u), kk => runA(kk, 0), eIOs(r));   // 最後の0.3秒で A の開始状態へ戻す
    const segs = []; for (let j = 0; j < XC.length - 1; j++) segs.push([XC[j], XC[j + 1], j % 2 ? 'B' : 'A', j % 2 ? C.blue : C.g2]);
    strip(k, w, h, segs, u);
    return r > .5 || isA ? 'SCENE A' : 'SCENE B';
  });

  // @shared
  // 跳躍の高さと、舞い落ちる葉（23 で使う）
  function jumpY(q) { return q <= 0 || q >= 1 ? 0 : 4 * q * (1 - q) * 1.1; }
  function leaves(u, speed) { const ex = []; for (let i = 0; i < 9; i++) { const ph = mod(u * speed / 4.7 + i / 9, 1); ex.push([-3 + i * 0.75 + Math.sin(i * 3) * 0.3, 3.4 - ph * 3.4, 6 + (i % 3), (kk) => { kk.fillStyle = i % 2 ? C.blueM : C.g3; kk.save(); kk.rotate(ph * 6 + i); kk.beginPath(); kk.ellipse(0, 0, 0.09, 0.045, 0, 0, 7); kk.fill(); kk.restore(); }]); } return ex; }

  // @element 23
  // 23 バレットタイム: 跳躍の頂点で時間がほぼ止まり、その間にカメラが人物の周りを回り込む（#030 オービットは時間が止まらない）
  CELLS[22] = shot((k, w, h, u, cyc) => {
    const T0 = 1.5, T1 = 3.3, SLOW = 0.1;
    const tj = u < T0 ? u : u < T1 ? T0 + (u - T0) * SLOW : u - (T1 - T0) * (1 - SLOW);   // 実時間→映像時間
    const q = P(tj, 0.6, 2.6), e = eIO(P(u, T0, T1));
    const a = cyc % 2 === 0 ? lerp(-0.6, 0.6, e) : lerp(0.6, -0.6, e), R = 6, P0 = [0, 0, 9];
    const c = cam({ x: P0[0] + Math.sin(a) * R, z: P0[2] - Math.cos(a) * R, yaw: -a, y: 1.6, pitch: -0.05 });
    world(k, w, h, c, {
      person: { z: 9, y: jumpY(q), armUp: q > 0 && q < 1, face: a }, ring: [0, 9, 10], trees: false, extra: leaves(tj, 1.5).map(l => [l[0], l[1], l[2] + 3, l[3]]),
      after: (kk, cc) => { kk.strokeStyle = C.blueM; kk.lineWidth = 2; kk.setLineDash([5, 5]); kk.beginPath(); for (let i = 0; i <= 48; i++) { const b = i / 48 * Math.PI * 2; const qq = proj(cc, Math.sin(b) * 1.3, 0, 9 + Math.cos(b) * 1.3); i ? kk.lineTo(qq.x, qq.y) : kk.moveTo(qq.x, qq.y); } kk.stroke(); kk.setLineDash([]); }
    });
    return u >= T0 && u < T1 ? `BULLET ×${SLOW.toFixed(1)}` : '×1.0';
  });

  // @element 24
  // 24 モンタージュ: 7つの短いカットで30日分の練習を見せる。つなぎは直結、右上に日付
  const MT = [
    [0.75, 1, (kk, w, h, t) => world(kk, w, h, cam({ x: t * 2.2 - 1, y: 1.3 }), { person: { x: t * 2.2 - 1, z: 6, walk: t * 14 }, fg: [[-3, 4], [-1.4, 4], [0.2, 4], [1.8, 4], [3.4, 4]] })],
    [0.7, 3, (kk, w, h, t) => world(kk, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(P(t, 0.05, 0.7)), armUp: true }, buildings: false })],
    [0.65, 7, (kk, w, h, t) => world(kk, w, h, cam({ y: 1.6, pitch: 0.1 }), { sun: [20, lerp(4, 12, t / 0.65), 170], sunCol: C.blueM, buildings: false, trees: false, clouds: [[-30, 20, 110, 2.6], [40, 26, 150, 3.2]] })],
    [0.65, 12, (kk, w, h, t) => world(kk, w, h, cam({ y: 0.5, pitch: 0.25 }), { person: { z: 4.5, armUp: true }, tower: [-3, 22] })],
    [0.65, 20, (kk, w, h, t) => world(kk, w, h, cam({ y: 1.5, f: 420 }), { city: true, mountains: false, person: { z: 7, walk: t * 9, x: -0.5 + t * 0.6 } })],
    [0.6, 28, (kk, w, h, t) => { const a = lerp(-0.3, 0.3, t / 0.6); world(kk, w, h, cam({ x: Math.sin(a) * 6, z: 9 - Math.cos(a) * 6, yaw: -a, y: 1.7, pitch: -0.07 }), { person: { z: 9, face: a }, ring: [0, 9, 10], trees: false }); }],
    [0.7, 30, (kk, w, h, t) => world(kk, w, h, cam({ y: 1.4 }), { person: { z: 6, armUp: true }, extra: [[1.4, 0, 6.3, (k2) => { k2.fillStyle = C.g4; k2.fillRect(-0.04, 0, 0.08, 2.6); k2.fillStyle = C.blue; k2.beginPath(); k2.moveTo(0.04, 2.6); k2.lineTo(0.9, 2.3); k2.lineTo(0.04, 2.0); k2.fill(); }]] })],
  ];
  CELLS[23] = shot((k, w, h, u) => {
    let i = 0, t0 = 0; while (i < MT.length - 1 && u >= t0 + MT[i][0]) { t0 += MT[i][0]; i++; }
    const r = P(u, CYC - 0.3, CYC);
    blend(k, kk => MT[i][2](kk, w, h, u - t0), kk => MT[0][2](kk, w, h, 0), eIOs(r));   // 最後の0.3秒で最初のカットへ戻す
    const segs = []; let s = 0; MT.forEach(([d, day], j) => { segs.push([s, s + d, '', j === i ? C.blue : C.g2]); s += d; });
    strip(k, w, h, segs, u);
    return `DAY ${r > .5 ? MT[0][1] : MT[i][1]}`;
  });

  // @end
  return { width: CW, height: CH, cycle: CYC * 2, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "diagram" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('diagram', function () {
  // @kit
  // 資料で使う図解・グラフの名前24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // 薄いグレーの地に、グレー3段・青3段・濃いグレーの平面だけで描く。Xの動画（1ページ9.4秒で各カードが2周）と同じ絵。
  // どのカードも「空 → 図が組み上がる → 止める → 4.1〜4.5秒で消える → 空」で1周する（u = 4.7 は u = 0 と同じ）。
  // 数字のグラフ（09〜16）は軸・目盛り・マス目を出したままにして、データだけを出し入れする。
  const CW = 539, CH = 208, CYC = 4.7;
  const C = {
    stage: '#F1F0EE', sub: '#8E8E93', mark: '#3A3A3E',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', g2: '#E2E1DE', g3: '#CFCECB', g4: '#A9A8A5'
  };
  const FONT = '"Hiragino Sans", "Helvetica Neue", "PingFang SC", "Noto Sans", "Noto Sans CJK JP", system-ui, sans-serif';
  const TAU = Math.PI * 2;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));                       // 0..1 progress of t between a and b
  const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // cubic-bezier(0.65,0,0.35,1)
  const easeOut = x => 1 - Math.pow(1 - x, 3);                                       // cubic-bezier(0.33,1,0.68,1)
  const easeOutBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };  // cubic-bezier(0.34,1.56,0.64,1)
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; } // seeded random
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.fillText(s, x, y);
  }
  function bg(k, w, h) { k.fillStyle = C.stage; k.fillRect(0, 0, w, h); }
  function fade(u) { return 1 - easeInOut(P(u, 4.1, 4.5)); }              // the whole figure fades out at the end of the cycle
  const CELLS = [];

  // @shared
  // 01〜08（整理する図）の部品: 弾んで出る箱、線を途中まで引く、矢じり
  function pop(u, a, d = 0.3) { const p = P(u, a, a + d); return p <= 0 ? 0 : easeOutBack(p); }   // 0 -> ~1.1 -> 1
  function pen(k, col, lw) { k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; }
  // point at distance d along a polyline: {x, y, a (direction), i (segment end index)}
  function along(pts, d) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], s = Math.hypot(x1 - x0, y1 - y0);
      if (d <= s || i === pts.length - 1) { const f = s ? clamp(d / s) : 0; return { x: lerp(x0, x1, f), y: lerp(y0, y1, f), a: Math.atan2(y1 - y0, x1 - x0), i }; }
      d -= s;
    }
    return { x: pts[0][0], y: pts[0][1], a: 0, i: 1 };
  }
  function pathLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
  // stroke the first fraction t of a polyline. arrow: arrowhead size at the moving tip (0 = none)
  function trace(k, pts, t, arrow = 0, col = null) {
    if (t <= 0) return;
    const L = pathLen(pts), d = t * L, tip = along(pts, d), end = along(pts, Math.max(0, d - arrow * 0.7));
    k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < end.i; i++) k.lineTo(pts[i][0], pts[i][1]);
    k.lineTo(end.x, end.y); k.stroke();
    if (arrow && d > arrow * 0.8) arrowAt(k, tip.x, tip.y, tip.a, arrow, col || k.strokeStyle);
  }
  function arrowAt(k, x, y, a, s, col) {
    k.save(); k.translate(x, y); k.rotate(a); k.fillStyle = col;
    k.beginPath(); k.moveTo(1, 0); k.lineTo(-s, -s * 0.62); k.lineTo(-s, s * 0.62); k.closePath(); k.fill();
    k.restore();
  }
  function bezPts(p0, c0, c1, p3, n = 28) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, m = 1 - t;
      out.push([m * m * m * p0[0] + 3 * m * m * t * c0[0] + 3 * m * t * t * c1[0] + t * t * t * p3[0],
                m * m * m * p0[1] + 3 * m * m * t * c0[1] + 3 * m * t * t * c1[1] + t * t * t * p3[1]]);
    }
    return out;
  }
  // rounded box scaled from its center
  function box(k, cx, cy, bw, bh, r, s, col) {
    if (s <= 0.01) return;
    k.save(); k.translate(cx, cy); k.scale(s, s); k.fillStyle = col; rr(k, -bw / 2, -bh / 2, bw, bh, r); k.fill(); k.restore();
  }

  // @element 01
  // 01 ベン図: two circles slide in from the sides and overlap; only the shared part turns blue
  function venn(k, w, h, u) {
    bg(k, w, h);
    const app = easeOut(P(u, 0.3, 0.7)), m = easeInOut(P(u, 0.5, 1.6));
    if (app <= 0) return;
    const r = 78, cy = h / 2, d = lerp(150, 44, m), ax = w / 2 - d, bx = w / 2 + d;
    k.save(); k.globalAlpha = fade(u) * app;
    k.fillStyle = C.blueL; k.beginPath(); k.arc(ax, cy, r, 0, TAU); k.fill();
    k.fillStyle = C.g2; k.beginPath(); k.arc(bx, cy, r, 0, TAU); k.fill();
    // shared part: B inside A
    k.save(); k.beginPath(); k.arc(ax, cy, r, 0, TAU); k.clip();
    k.fillStyle = C.blue; k.beginPath(); k.arc(bx, cy, r, 0, TAU); k.fill(); k.restore();
    pen(k, C.blueM, 3); k.beginPath(); k.arc(ax, cy, r, 0, TAU); k.stroke();
    pen(k, C.g4, 3); k.beginPath(); k.arc(bx, cy, r, 0, TAU); k.stroke();
    txt(k, 'A', ax - 38, cy + 1, `600 26px ${FONT}`, C.blue, 'center', 'middle');
    txt(k, 'B', bx + 38, cy + 1, `600 26px ${FONT}`, C.mark, 'center', 'middle');
    k.restore();
  }
  CELLS[0] = venn;

  // @element 02
  // 02 4象限マトリクス: two axes cross in the middle, four areas appear, items are placed; top-right is the target
  const MDOTS = [[0.55, -0.55, 1], [0.25, -0.3, 0], [-0.5, -0.45, 0], [-0.3, 0.5, 0], [-0.62, 0.22, 0], [0.45, 0.4, 0], [0.7, 0.62, 0]];
  function matrix(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const cx = w / 2, cy = h / 2, hw = 168, hh = 86, gap = 8;
    // four areas
    [[1, -1], [-1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => {
      const a = easeOut(P(u, 1.0 + i * 0.08, 1.35 + i * 0.08));
      if (a <= 0) return;
      k.save(); k.globalAlpha *= a;
      k.fillStyle = i === 0 ? C.blueL : C.g2;
      const x = sx > 0 ? cx + gap : cx - gap - (hw - 14), y = sy > 0 ? cy + gap : cy - gap - (hh - 8);
      rr(k, x, y, hw - 14, hh - 8, 10); k.fill(); k.restore();
    });
    // axes grow from the center out
    const g = easeInOut(P(u, 0.4, 1.0));
    if (g > 0) {
      pen(k, C.mark, 3);
      k.beginPath(); k.moveTo(cx - hw * g, cy); k.lineTo(cx + (hw - 6) * g, cy); k.stroke();
      k.beginPath(); k.moveTo(cx, cy + hh * g); k.lineTo(cx, cy - (hh - 6) * g); k.stroke();
      const hs = 11 * clamp((g - 0.15) * 3);
      if (hs > 1) { arrowAt(k, cx + hw * g + 2, cy, 0, hs, C.mark); arrowAt(k, cx, cy - hh * g - 2, -Math.PI / 2, hs, C.mark); }
    }
    // items
    MDOTS.forEach(([dx, dy, hot], i) => {
      const s = pop(u, 1.45 + i * 0.1, 0.3);
      if (s <= 0) return;
      const x = cx + dx * (hw - 20), y = cy + dy * (hh - 6), r = hot ? 12 : 8;
      k.fillStyle = hot ? C.blue : C.g4;
      k.beginPath(); k.arc(x, y, r * s, 0, TAU); k.fill();
    });
    k.globalAlpha = 1;
  }
  CELLS[1] = matrix;

  // @element 03
  // 03 ロジックツリー: one box on the left branches to the right, 1 -> 2 -> 4, with elbow lines
  function tree(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const R = [82, h / 2], L2 = [[248, 56], [248, 152]], L3 = [[426, 28], [426, 84], [426, 124], [426, 180]];
    const RW = 66, RH = 50, W2 = 76, H2 = 34, W3 = 92, H3 = 26;
    const elbow = (p, c, pw, cw) => { const x0 = p[0] + pw / 2, x1 = c[0] - cw / 2, xm = (x0 + x1) / 2; return [[x0, p[1]], [xm, p[1]], [xm, c[1]], [x1, c[1]]]; };
    pen(k, C.g4, 3);
    L2.forEach(c => trace(k, elbow(R, c, RW, W2), easeInOut(P(u, 0.75, 1.15))));
    L3.forEach((c, i) => trace(k, elbow(L2[i >> 1], c, W2, W3), easeInOut(P(u, 1.35 + i * 0.06, 1.75 + i * 0.06))));
    const rs = pop(u, 0.4);
    box(k, R[0], R[1], RW, RH, 10, rs, C.blue);
    if (rs > 0.6) txt(k, '?', R[0], R[1] + 2, `700 30px ${FONT}`, '#FFFFFF', 'center', 'middle');
    L2.forEach((c, i) => box(k, c[0], c[1], W2, H2, 9, pop(u, 1.05 + i * 0.08), C.blueM));
    L3.forEach((c, i) => box(k, c[0], c[1], W3, H3, 8, pop(u, 1.65 + i * 0.08), C.blueL));
    k.globalAlpha = 1;
  }
  CELLS[2] = tree;

  // @element 04
  // 04 ピラミッド図: a triangle in four layers, stacked from the bottom up; the top layer is blue
  function pyramid(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const top = 16, base = 192, hwB = 168, n = 4, gp = 6, cx = w / 2;
    const th = (base - top - gp * (n - 1)) / n, half = y => hwB * (y - top) / (base - top);
    const cols = [C.g3, C.blueL, C.blueM, C.blue];
    for (let i = 0; i < n; i++) {                       // i = 0 bottom
      const p = easeOut(P(u, 0.4 + i * 0.32, 0.8 + i * 0.32));
      if (p <= 0) continue;
      const yb = base - i * (th + gp), yt = yb - th, dy = (1 - p) * -34;
      k.save(); k.globalAlpha *= clamp(p * 1.6); k.translate(0, dy);
      k.fillStyle = cols[i]; k.beginPath();
      if (i === n - 1) { k.moveTo(cx, top); }
      else { k.moveTo(cx - half(yt), yt); k.lineTo(cx + half(yt), yt); }
      k.lineTo(cx + half(yb), yb); k.lineTo(cx - half(yb), yb); k.closePath(); k.fill();
      k.restore();
    }
    k.globalAlpha = 1;
  }
  CELLS[3] = pyramid;

  // @element 05
  // 05 マインドマップ: a center word, curved branches out to both sides, then smaller twigs
  const MM = [
    // [side, end dx, end dy, color, twigs [dx, dy]]
    [1, 128, -52, C.blueM, [[204, -72], [204, -32]]],
    [1, 142, 8, C.g4, []],
    [1, 124, 56, C.blueM, [[204, 76]]],
    [-1, 128, -52, C.g4, [[204, -70]]],
    [-1, 140, 10, C.blueM, []],
    [-1, 124, 56, C.g4, [[204, 36], [204, 76]]],
  ];
  function mindmap(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const cx = w / 2, cy = h / 2;
    MM.forEach(([sd, ex, ey, col, twigs], i) => {
      const x0 = cx + sd * 40, x1 = cx + sd * ex, y1 = cy + ey;
      const pts = bezPts([x0, cy], [cx + sd * 78, cy], [cx + sd * (ex - 50), y1], [x1 - sd * 26, y1]);
      pen(k, col, 3); trace(k, pts, easeInOut(P(u, 0.7 + i * 0.09, 1.2 + i * 0.09)));
      twigs.forEach(([tx, ty], j) => {
        const a = [x1 + sd * 26, y1], b = [cx + sd * tx - sd * 20, cy + ty], t0 = 1.45 + i * 0.07 + j * 0.05;
        const tp = bezPts(a, [a[0] + sd * 22, a[1]], [b[0] - sd * 26, b[1]], b, 16);
        pen(k, col, 2.5); trace(k, tp, easeInOut(P(u, t0, t0 + 0.35)));
        box(k, cx + sd * tx, cy + ty, 40, 18, 9, pop(u, t0 + 0.3, 0.25), col === C.g4 ? C.g3 : C.blueL);
      });
      box(k, x1, y1, 54, 24, 12, pop(u, 1.15 + i * 0.09, 0.28), col === C.g4 ? C.g4 : C.blueM);
    });
    const s = pop(u, 0.4);
    if (s > 0.01) {
      k.save(); k.translate(cx, cy); k.scale(s, s);
      k.fillStyle = C.blue; rr(k, -50, -22, 100, 44, 22); k.fill();
      txt(k, 'テーマ', 0, 1, `700 19px ${FONT}`, '#FFFFFF', 'center', 'middle');
      k.restore();
    }
    k.globalAlpha = 1;
  }
  CELLS[4] = mindmap;

  // @element 06
  // 06 フローチャート: start -> step -> decision (diamond) -> step -> end, with a "No" loop back;
  // then a marker walks the path once (loops back once, then goes on to the end)
  function flow(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const y = 80, S = [64, y], A = [158, y], D = [262, y], B = [364, y], E = [460, y], LY = 172;
    const dw = 46, dh = 36;                                   // diamond half sizes
    const arrows = [
      [[S[0] + 34, y], [A[0] - 36, y]],
      [[A[0] + 36, y], [D[0] - dw, y]],
      [[D[0] + dw, y], [B[0] - 36, y]],
      [[B[0] + 36, y], [E[0] - 34, y]],
    ];
    const loop = [[D[0], y + dh], [D[0], LY], [A[0], LY], [A[0], y + 20]];
    const tA = [0.6, 1.0, 1.4, 1.75];
    pen(k, C.g4, 3);
    arrows.forEach((pts, i) => trace(k, pts, easeInOut(P(u, tA[i], tA[i] + 0.22)), 10, C.g4));
    trace(k, loop, easeInOut(P(u, 2.0, 2.45)), 10, C.g4);
    // shapes
    const pill = (c, s, col) => box(k, c[0], c[1], 66, 36, 18, s, col);
    pill(S, pop(u, 0.4), C.g3);
    box(k, A[0], A[1], 72, 40, 6, pop(u, 0.8), C.blueL);
    const ds = pop(u, 1.2);
    if (ds > 0.01) {
      k.save(); k.translate(D[0], D[1]); k.scale(ds, ds); k.fillStyle = C.blue;
      k.beginPath(); k.moveTo(0, -dh); k.lineTo(dw, 0); k.lineTo(0, dh); k.lineTo(-dw, 0); k.closePath(); k.fill();
      txt(k, '?', 0, 2, `700 26px ${FONT}`, '#FFFFFF', 'center', 'middle');
      k.restore();
    }
    box(k, B[0], B[1], 72, 40, 6, pop(u, 1.6), C.blueL);
    pill(E, pop(u, 1.95), C.g3);
    // marker: start -> A -> D -> (No) loop -> A -> D -> (Yes) -> B -> E
    const path = [S, A, D, [D[0], LY], [A[0], LY], A, D, B, E];
    const m = P(u, 2.6, 3.8);
    const a = Math.min(P(u, 2.5, 2.65), 1 - P(u, 3.8, 4.0));
    if (a > 0) {
      const q = along(path, easeInOut(m) * pathLen(path));
      k.save(); k.globalAlpha *= a; k.fillStyle = C.mark; k.beginPath(); k.arc(q.x, q.y, 8, 0, TAU); k.fill(); k.restore();
    }
    k.globalAlpha = 1;
  }
  CELLS[5] = flow;

  // @element 07
  // 07 サイクル図: four steps on a ring; arrows draw one after another until the ring closes,
  // then the highlight goes round the ring once
  function cycle(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const cx = w / 2, cy = h / 2, RX = 128, RY = 70, nr = 26, n = 4;
    const ang = i => -Math.PI / 2 + i * TAU / n, pos = a => [cx + Math.cos(a) * RX, cy + Math.sin(a) * RY];
    for (let i = 0; i < n; i++) {
      const t = easeInOut(P(u, 0.7 + i * 0.32, 0.98 + i * 0.32));
      if (t <= 0) continue;
      const A = pos(ang(i)), B = pos(ang(i + 1)), pts = [];
      for (let j = 0; j <= 60; j++) {
        const q = pos(lerp(ang(i), ang(i + 1), j / 60));
        if (Math.hypot(q[0] - A[0], q[1] - A[1]) > nr + 10 && Math.hypot(q[0] - B[0], q[1] - B[1]) > nr + 8) pts.push(q);
      }
      pen(k, C.blueM, 3); trace(k, pts, t, 13, C.blueM);
    }
    // highlight going round: 2.2s -> 3.8s, 0.4s per step, soft edges
    const hp = P(u, 2.2, 3.8) * n;
    for (let i = 0; i < n; i++) {
      const s = pop(u, 0.4 + i * 0.32, 0.28);
      if (s <= 0.01) continue;
      const dd = hp - i;
      const on = (u > 2.15 && u < 4.0 && dd > -0.25 && dd < 1.25) ? clamp(Math.min(dd + 0.25, 1.25 - dd) * 2.5) : 0;
      const [x, y] = pos(ang(i));
      k.save(); k.translate(x, y); k.scale(s, s);
      k.fillStyle = C.blueL; k.beginPath(); k.arc(0, 0, nr, 0, TAU); k.fill();
      if (on > 0) { k.save(); k.globalAlpha *= on; k.fillStyle = C.blue; k.beginPath(); k.arc(0, 0, nr, 0, TAU); k.fill(); k.restore(); }
      txt(k, String(i + 1), 0, 1, `700 22px ${FONT}`, on > 0.5 ? '#FFFFFF' : C.blue, 'center', 'middle');
      k.restore();
    }
    k.globalAlpha = 1;
  }
  CELLS[6] = cycle;

  // @element 08
  // 08 フィッシュボーン図: a spine runs right to the head (the result); slanted bones join it from above
  // and below, each with small side bones (the causes)
  function fishbone(k, w, h, u) {
    bg(k, w, h);
    k.globalAlpha = fade(u);
    const y = h / 2, x0 = 52, x1 = 404, hx = 452;
    // tail
    const ta = easeOut(P(u, 0.35, 0.6));
    if (ta > 0) {
      k.save(); k.globalAlpha *= ta; pen(k, C.mark, 3);
      k.beginPath(); k.moveTo(x0 - 26, y - 22); k.lineTo(x0, y); k.lineTo(x0 - 26, y + 22); k.stroke(); k.restore();
    }
    // spine
    const sp = easeInOut(P(u, 0.45, 1.0));
    if (sp > 0) { pen(k, C.mark, 3); trace(k, [[x0, y], [x1, y]], sp, 14, C.mark); }
    // head
    const hs = pop(u, 0.95);
    if (hs > 0.01) {
      k.save(); k.translate(hx, y); k.scale(hs, hs);
      k.fillStyle = C.blue; rr(k, -38, -28, 92, 56, 12); k.fill();
      txt(k, '結果', 8, 1, `700 20px ${FONT}`, '#FFFFFF', 'center', 'middle');
      k.restore();
    }
    // big bones: root on the spine at bx, tip up-left / down-left
    const bones = [[150, -1], [258, -1], [366, -1], [150, 1], [258, 1], [366, 1]];
    bones.forEach(([bx, sd], i) => {
      const a = 1.1 + (i % 3) * 0.14 + (sd > 0 ? 0.07 : 0);
      const t = easeInOut(P(u, a, a + 0.35));
      if (t <= 0) return;
      const tip = [bx - 62, y + sd * 80];
      pen(k, C.blueM, 3); trace(k, [[bx, y], tip], t);
      // small bones (horizontal, pointing left) at 1/3 and 2/3 of the bone
      [0.36, 0.68].forEach((f, j) => {
        const st = easeOut(P(u, a + 0.38 + j * 0.08, a + 0.6 + j * 0.08));
        if (st <= 0) return;
        const px = lerp(tip[0], bx, f), py = lerp(tip[1], y, f);
        pen(k, C.g4, 2.5); k.beginPath(); k.moveTo(px, py); k.lineTo(px - 26 * st, py); k.stroke();
      });
    });
    k.globalAlpha = 1;
  }
  CELLS[7] = fishbone;

  // @shared
  // 09〜16（数字を見せるグラフ）の部品: 色を混ぜる、直線、L字の軸と目盛り線、点。軸は1周ずっと出したまま、データだけ 4.15〜4.55秒で消える
  function hexRGB(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {   // hex in, hex out
    const A = hexRGB(a), B = hexRGB(b);
    return '#' + [0, 1, 2].map(i => Math.round(lerp(A[i], B[i], clamp(t))).toString(16).padStart(2, '0')).join('');
  }
  const dataFade = (u, a = 4.15, b = 4.55) => 1 - easeInOut(P(u, a, b));
  function seg(k, x0, y0, x1, y1, col, lw = 2.5, dash) {
    k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round';
    if (dash) k.setLineDash(dash);
    k.beginPath(); k.moveTo(x0, y0); k.lineTo(x1, y1); k.stroke();
    if (dash) k.setLineDash([]);
  }
  // L-shaped axes with a few light grid lines
  function axes(k, x0, y0, x1, y1, grid = 3) {
    for (let i = 1; i <= grid; i++) { const y = lerp(y1, y0, i / (grid + 0.4)); seg(k, x0 + 4, y, x1, y, C.g2, 2); }
    seg(k, x0, y0, x0, y1, C.g4, 2.5);
    seg(k, x0, y1, x1, y1, C.g4, 2.5);
  }
  function dot(k, x, y, r, col) { if (r <= 0.05) return; k.fillStyle = col; k.beginPath(); k.arc(x, y, r, 0, Math.PI * 2); k.fill(); }
  const SC = { x0: 96, x1: 448, y0: 24, y1: 184 };   // plot area shared by 09 scatter and 10 bubble

  // @element 09
  // 09 散布図: many small dots pop in from left to right, rising to the right; a dashed trend line follows
  const SCPTS = (() => {
    const r = rand(907), pts = [];
    for (let i = 0; i < 52; i++) {
      const x = 0.04 + r() * 0.92;
      const y = clamp(0.1 + 0.74 * x + (r() + r() - 1) * 0.2, 0.05, 0.95);
      pts.push({ x, y });
    }
    return pts.sort((a, b) => a.x - b.x);
  })();
  function scatter(k, w, h, u) {
    bg(k, w, h);
    const A = SC; axes(k, A.x0, A.y0, A.x1, A.y1);
    const fo = dataFade(u);
    k.save(); k.globalAlpha = fo;
    const X = x => lerp(A.x0 + 10, A.x1 - 8, x), Y = y => lerp(A.y1 - 8, A.y0 + 6, y);
    // trend line (drawn after the dots)
    const tl = easeInOut(P(u, 1.85, 2.5));
    if (tl > 0) {
      const xa = X(0.02), ya = Y(0.11), xb = X(0.98), yb = Y(0.83);
      seg(k, xa, ya, lerp(xa, xb, tl), lerp(ya, yb, tl), C.g4, 2.5, [7, 8]);
    }
    for (const p of SCPTS) {
      const t0 = 0.4 + p.x * 1.25;
      const s = easeOutBack(P(u, t0, t0 + 0.28));
      dot(k, X(p.x), Y(p.y), 5 * s, C.blue);
    }
    k.restore();
  }
  CELLS[8] = scatter;

  // @element 10
  // 10 バブルチャート: a few semi-transparent circles of different sizes grow on the axes
  const BB = [   // x, y (0..1 in the plot), radius px, emphasized
    [0.16, 0.30, 18, 0], [0.34, 0.64, 34, 0], [0.53, 0.34, 25, 0], [0.67, 0.6, 44, 1], [0.89, 0.30, 14, 0],
  ];
  function bubble(k, w, h, u) {
    bg(k, w, h);
    const A = SC; axes(k, A.x0, A.y0, A.x1, A.y1);
    const fo = dataFade(u);
    const X = x => lerp(A.x0 + 10, A.x1 - 8, x), Y = y => lerp(A.y1 - 8, A.y0 + 6, y);
    BB.forEach(([bx, by, br, em], i) => {
      const t0 = 0.45 + i * 0.24;
      const r = br * easeOutBack(P(u, t0, t0 + 0.5));
      if (r <= 0.3) return;
      const col = em ? C.blue : C.blueM;
      k.save(); k.globalAlpha = fo * (em ? 0.42 : 0.5);
      dot(k, X(bx), Y(by), r, col);
      k.restore();
      k.save(); k.globalAlpha = fo; k.strokeStyle = col; k.lineWidth = 2.5;
      k.beginPath(); k.arc(X(bx), Y(by), r, 0, Math.PI * 2); k.stroke();
      k.restore();
    });
  }
  CELLS[9] = bubble;

  // @element 11
  // 11 ヒートマップ: a table of cells; shades of blue sweep across it like a wave
  const HM = (() => {
    const r = rand(1103), cols = 12, rows = 5, v = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const base = 0.5 + 0.42 * Math.sin(i * 0.62 - 0.4) * Math.cos(j * 0.85 - 1.1) + (r() - 0.5) * 0.28;
      v.push(clamp(Math.floor(clamp(base, 0, 0.999) * 5), 0, 4));
    }
    return { cols, rows, v };
  })();
  const HMCOL = [mix(C.stage, C.blueL, 0.55), C.blueL, C.blueM, mix(C.blueM, C.blue, 0.55), C.blue];
  function heatmap(k, w, h, u) {
    bg(k, w, h);
    const { cols, rows, v } = HM;
    const cw = 30, ch = 28, g = 4, gx = 96, gy = (h - (rows * (ch + g) - g)) / 2;
    // row labels (short gray bars) so it reads as a table
    for (let j = 0; j < rows; j++) { rr(k, 46, gy + j * (ch + g) + ch / 2 - 4, 36, 8, 4); k.fillStyle = C.g3; k.fill(); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const tin = 0.4 + i * 0.075 + j * 0.06;
      const tout = 3.95 + i * 0.025 + j * 0.02;
      const p = easeOut(P(u, tin, tin + 0.32)) * (1 - easeInOut(P(u, tout, tout + 0.22)));
      rr(k, gx + i * (cw + g), gy + j * (ch + g), cw, ch, 4); k.fillStyle = mix(C.g2, HMCOL[v[j * cols + i]], p); k.fill();
    }
  }
  CELLS[10] = heatmap;

  // @element 12
  // 12 レーダーチャート: a spider-web scale; a gray polygon, then the blue polygon spreads out from the center
  const RA = [0.92, 0.58, 0.84, 0.4, 0.76, 0.52];
  const RB = [0.55, 0.74, 0.46, 0.72, 0.5, 0.66];
  function radarPath(k, cx, cy, R, vals, s) {
    k.beginPath();
    vals.forEach((v, i) => {
      const a = -Math.PI / 2 + i / vals.length * Math.PI * 2, r = R * v * s;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? k.lineTo(x, y) : k.moveTo(x, y);
    });
    k.closePath();
  }
  function radar(k, w, h, u) {
    bg(k, w, h);
    const cx = w / 2, cy = h / 2 + 2, R = 86, n = 6;
    k.lineJoin = 'round';
    for (let ring = 1; ring <= 4; ring++) {
      radarPath(k, cx, cy, R, Array(n).fill(ring / 4), 1);
      k.strokeStyle = ring === 4 ? C.g4 : C.g3; k.lineWidth = 2; k.stroke();
    }
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i / n * Math.PI * 2;
      seg(k, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, C.g3, 2);
      dot(k, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 4, C.g4);
    }
    const fo = dataFade(u);
    const sb = easeOut(P(u, 0.4, 1.1));
    if (sb > 0.01) {
      k.save(); k.globalAlpha = fo;
      radarPath(k, cx, cy, R, RB, sb);
      k.fillStyle = 'rgba(169,168,165,0.22)'; k.fill();
      k.strokeStyle = C.g4; k.lineWidth = 2.5; k.stroke();
      k.restore();
    }
    const qa = P(u, 0.95, 1.85), sa = lerp(easeOut(qa), easeOutBack(qa), 0.45);   // mild overshoot, stays near the web
    if (sa > 0.01) {
      k.save(); k.globalAlpha = fo;
      radarPath(k, cx, cy, R, RA, sa);
      k.fillStyle = 'rgba(47,107,235,0.28)'; k.fill();
      k.strokeStyle = C.blue; k.lineWidth = 3; k.stroke();
      RA.forEach((v, i) => {
        const a = -Math.PI / 2 + i / n * Math.PI * 2, r = R * v * sa;
        dot(k, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4.5, C.blue);
      });
      k.restore();
    }
  }
  CELLS[11] = radar;

  // @element 13
  // 13 ゲージチャート: a half-circle meter; the needle swings past and settles at 72%
  function gauge(k, w, h, u) {
    bg(k, w, h);
    const cx = w / 2, cy = 152, R = 120, T = 30, V = 0.72;
    const t = Math.max(0, u - 0.5);
    const s = u <= 0.5 ? 0 : 1 - Math.exp(-3.2 * t) * Math.cos(7.5 * t);   // overshoot, wobble, settle
    const f = V * s * (1 - easeInOut(P(u, 4.1, 4.5)));
    k.lineCap = 'butt';
    k.strokeStyle = C.g2; k.lineWidth = T;
    k.beginPath(); k.arc(cx, cy, R - T / 2, Math.PI, Math.PI * 2); k.stroke();
    if (f > 0.002) {
      k.strokeStyle = C.blue; k.lineWidth = T;
      k.beginPath(); k.arc(cx, cy, R - T / 2, Math.PI, Math.PI + Math.PI * f); k.stroke();
    }
    for (let i = 0; i <= 10; i++) {   // ticks every 10%
      const a = Math.PI + Math.PI * i / 10, r0 = R - T - 12, r1 = R - T - (i % 5 === 0 ? 24 : 18);
      seg(k, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, C.g4, 2.5);
    }
    const a = Math.PI + Math.PI * f, L = R - 22, bw = 7;
    const ca = Math.cos(a), sa = Math.sin(a);
    k.fillStyle = C.mark; k.beginPath();
    k.moveTo(cx + ca * L, cy + sa * L);
    k.lineTo(cx - sa * bw, cy + ca * bw);
    k.lineTo(cx - ca * 12, cy - sa * 12);
    k.lineTo(cx + sa * bw, cy - ca * bw);
    k.closePath(); k.fill();
    dot(k, cx, cy, 13, C.mark);
    dot(k, cx, cy, 5, C.stage);
    txt(k, `${Math.round(f * 100)}%`, cx, cy + 36, `700 26px ${FONT}`, C.mark, 'center', 'middle');
  }
  CELLS[12] = gauge;

  // @element 14
  // 14 複合グラフ（棒＋折れ線）: bars on the left scale (gray ticks), a dotted line on the right scale (blue ticks)
  const CB = [42, 55, 50, 66, 74, 88];       // bars (left scale, % of height)
  const CL = [26, 34, 52, 46, 64, 80];       // line (right scale, % of height)
  function combo(k, w, h, u) {
    bg(k, w, h);
    const floor = 186, top = 24, sc = (floor - top) / 100, x0 = 86, x1 = 452, slot = (x1 - x0) / CB.length, bw = 36;
    for (let i = 1; i <= 3; i++) { const y = lerp(floor, top, i / 3.4); seg(k, x0 + 4, y, x1 - 4, y, C.g2, 2); }
    seg(k, x0, top, x0, floor, C.g4, 2.5);
    seg(k, x1, top, x1, floor, C.blue, 2.5);
    seg(k, x0, floor, x1, floor, C.g4, 2.5);
    for (let i = 0; i <= 4; i++) {   // two different scales: gray ticks on the left, blue ticks on the right
      const y = lerp(floor, top, i / 4);
      seg(k, x0 - 10, y, x0, y, C.g4, 2.5);
      seg(k, x1, y, x1 + 10, y, C.blue, 2.5);
    }
    const fo = dataFade(u);
    k.save(); k.globalAlpha = fo;
    CB.forEach((v, i) => {
      const t0 = 0.4 + i * 0.12, p = easeOut(P(u, t0, t0 + 0.36));
      if (p <= 0) return;
      const hh = v * sc * p;
      rr(k, x0 + slot * (i + 0.5) - bw / 2, floor - hh, bw, hh, 3); k.fillStyle = C.blueL; k.fill();
    });
    const pts = CL.map((v, i) => [x0 + slot * (i + 0.5), floor - v * sc]);
    const pl = P(u, 1.3, 2.2) * (pts.length - 1);
    if (pl > 0) {
      k.strokeStyle = C.blue; k.lineWidth = 3.5; k.lineJoin = 'round'; k.lineCap = 'round';
      k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
      const n = Math.floor(pl);
      for (let i = 1; i <= n; i++) k.lineTo(pts[i][0], pts[i][1]);
      if (n < pts.length - 1) { const f = pl - n; k.lineTo(lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)); }
      k.stroke();
    }
    pts.forEach(([x, y], i) => {
      const s = easeOutBack(P(u, 1.25 + i * 0.18, 1.45 + i * 0.18));
      if (s > 0) { dot(k, x, y, 7 * s, C.blue); dot(k, x, y, 3 * s, C.stage); }
    });
    k.restore();
  }
  CELLS[13] = combo;

  // @element 15
  // 15 絵グラフ（ピクトグラム）: 10 people in one row pop in gray, then 3 of them turn blue and "30%" counts up
  // faceless pictogram person (the same parts as the camera packs). x,y = feet, h = height in px. o.col: color
  function person(k, x, y, h, o = {}) {
    k.save(); k.translate(x, y); const s = h / 1.8; k.scale(s, -s); if (o.lean) k.rotate(o.lean);
    k.fillStyle = o.col || C.blue;
    const legs = o.legs || [0, 0], arms = o.arms || [0, 0];
    [[-0.08, legs[0]], [0.08, legs[1]]].forEach(([lx, a]) => { k.save(); k.translate(lx, 0.86); k.rotate(a); rr(k, -0.075, -0.86, 0.15, 0.88, 0.07); k.fill(); k.restore(); });
    [[-0.25, arms[0]], [0.25, arms[1]]].forEach(([ax, a]) => { k.save(); k.translate(ax, 1.38); k.rotate(a); rr(k, -0.06, -0.58, 0.12, 0.6, 0.06); k.fill(); k.restore(); });
    rr(k, -0.23, 0.82, 0.46, 0.64, 0.12); k.fill();
    k.beginPath(); k.arc(0, 1.63, 0.16, 0, 7); k.fill();
    k.restore();
  }
  function picto(k, w, h, u) {
    bg(k, w, h);
    const fo = dataFade(u), n = 10, xs = 214, sp = 32, foot = 158, ph = 80, HI = 3;
    k.save(); k.globalAlpha = fo;
    for (let i = 0; i < n; i++) {
      const t0 = 0.35 + i * 0.06, s = easeOutBack(P(u, t0, t0 + 0.3));
      if (s <= 0.02) continue;
      let col = C.g3;
      if (i < HI) { const pc = easeInOut(P(u, 1.25 + i * 0.22, 1.5 + i * 0.22)); col = mix(C.g3, C.blue, pc); }
      person(k, xs + i * sp, foot, ph * s, { col });
    }
    // the share, counting up while the people turn blue
    const pc = easeInOut(P(u, 1.25, 1.94));
    if (pc > 0) {
      const v = Math.round(30 * pc);
      txt(k, `${v}%`, 164, 112, `800 46px ${FONT}`, C.blue, 'right', 'middle');
      txt(k, '10人中3人', 164, 148, `600 16px ${FONT}`, C.sub, 'right', 'middle');
    }
    seg(k, xs - 22, foot + 6, xs + (n - 1) * sp + 18, foot + 6, C.g3, 2);
    k.restore();
  }
  CELLS[14] = picto;

  // @element 16
  // 16 帯グラフ（100%積み上げ）: 4 bands of the same length fill from left to right; dashed lines join the borders
  const BD = [[38, 27, 22, 13], [30, 34, 20, 16], [46, 24, 18, 12], [25, 31, 28, 16]];
  function band(k, w, h, u) {
    bg(k, w, h);
    const COL = [C.blue, C.blueM, C.blueL, C.g3];
    const x0 = 100, bwid = 390, bh = 28, gap = 16, y0 = (h - (4 * bh + 3 * gap)) / 2;
    for (let j = 0; j < 4; j++) { rr(k, 46, y0 + j * (bh + gap) + bh / 2 - 4, 36, 8, 4); k.fillStyle = C.g3; k.fill(); }
    const fo = dataFade(u);
    k.save(); k.globalAlpha = fo;
    const edges = BD.map(r => { let a = 0; return r.map(v => (a += v, x0 + bwid * a / 100)); });
    // dashed lines joining the borders of neighbouring bands (the classic 帯グラフ guide lines)
    const pg = easeInOut(P(u, 1.6, 2.0));
    if (pg > 0) {
      k.save(); k.globalAlpha = fo * pg;
      for (let j = 0; j < 3; j++) for (let s = 0; s < 3; s++) {
        seg(k, edges[j][s], y0 + j * (bh + gap) + bh + 2, edges[j + 1][s], y0 + (j + 1) * (bh + gap) - 2, C.g4, 1.8, [4, 4]);
      }
      k.restore();
    }
    BD.forEach((row, j) => {
      const y = y0 + j * (bh + gap), t0 = 0.4 + j * 0.16, p = easeInOut(P(u, t0, t0 + 0.7));
      if (p <= 0) return;
      k.save(); k.beginPath(); k.rect(x0, y - 2, bwid * p, bh + 4); k.clip();
      let a = x0;
      row.forEach((v, s) => {
        const ww = bwid * v / 100;
        k.fillStyle = COL[s]; k.fillRect(a, y, ww, bh);
        if (s) { k.fillStyle = C.stage; k.fillRect(a - 1, y, 2, bh); }
        a += ww;
      });
      k.restore();
      const pt = P(u, t0 + 0.75, t0 + 1.0);   // % on the first part of each band
      if (pt > 0) {
        k.save(); k.globalAlpha = fo * pt;
        txt(k, `${row[0]}%`, x0 + bwid * row[0] / 200, y + bh / 2 + 1, `700 16px ${FONT}`, '#FFFFFF', 'center', 'middle');
        k.restore();
      }
    });
    k.restore();
  }
  CELLS[15] = band;

  // @shared
  // 17〜24（流れと全体を見せる図）の部品: 出てくる速さ、向きを指定する矢じり
  const appear = (u, a, d) => easeOut(P(u, a, a + d));              // 0..1 appear progress
  function arrowTo(k, x, y, dx, dy, s, col) {                       // filled arrow head pointing along (dx,dy)
    const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    k.fillStyle = col; k.beginPath();
    k.moveTo(x + ux * 2, y + uy * 2);
    k.lineTo(x - ux * s - uy * s * 0.6, y - uy * s + ux * s * 0.6);
    k.lineTo(x - ux * s + uy * s * 0.6, y - uy * s - ux * s * 0.6);
    k.closePath(); k.fill();
  }

  // @element 17
  // 17 ガントチャート: date scale on top, bars start at staggered columns and grow to the right
  function gantt(k, w, h, u) {
    bg(k, w, h);
    const x0 = 84, cols = 8, cw = 52, yAxis = 44, f = fade(u);
    // skeleton: date scale + grid (always visible)
    for (let i = 0; i < cols; i++) txt(k, String(i + 1), x0 + cw * i + cw / 2, 34, `500 18px ${FONT}`, C.sub, 'center');
    k.strokeStyle = C.g2; k.lineWidth = 2;
    for (let i = 0; i <= cols; i++) { k.beginPath(); k.moveTo(x0 + cw * i, yAxis); k.lineTo(x0 + cw * i, 194); k.stroke(); }
    k.strokeStyle = C.g4; k.lineWidth = 2.5; k.lineCap = 'round';
    k.beginPath(); k.moveTo(x0, yAxis); k.lineTo(x0 + cw * cols, yAxis); k.stroke();
    for (let i = 0; i <= cols; i++) { k.beginPath(); k.moveTo(x0 + cw * i, yAxis - 6); k.lineTo(x0 + cw * i, yAxis); k.stroke(); }
    const T = [[0, 2], [1.5, 2], [3, 1.5], [3.5, 3], [6, 2]];
    T.forEach(([s, len], i) => {
      const y = 62 + i * 27;
      txt(k, 'ABCDE'[i], 54, y + 1, `600 18px ${FONT}`, C.g4, 'center', 'middle');
      const p = appear(u, 0.4 + i * 0.3, 0.5) * f;
      if (p <= 0.001) return;
      k.globalAlpha = Math.min(1, p * 3) * f;
      k.fillStyle = i === 3 ? C.blue : C.blueM;
      rr(k, x0 + cw * s + 3, y - 10, Math.max(6, (cw * len - 6) * appear(u, 0.4 + i * 0.3, 0.5)), 20, 6); k.fill();
      k.globalAlpha = 1;
    });
  }
  CELLS[16] = gantt;

  // @element 18
  // 18 タイムライン: one line drawn left to right; dots and short marks appear in order, alternating up/down
  function timeline(k, w, h, u) {
    bg(k, w, h);
    const y = 106, xa = 36, xb = 503, f = fade(u);
    const pl = easeInOut(P(u, 0.4, 2.0));
    const tip = lerp(xa, xb, pl);
    k.globalAlpha = f;
    if (pl > 0) {
      k.strokeStyle = C.mark; k.lineWidth = 3; k.lineCap = 'round';
      k.beginPath(); k.moveTo(xa, y); k.lineTo(tip, y); k.stroke();
      if (pl > 0.97) arrowTo(k, xb + 6, y, 1, 0, 11, C.mark);
    }
    const XS = [78, 166, 254, 342, 430], LB = ['4月', '6月', '8月', '10月', '12月'];
    XS.forEach((x, i) => {
      const t0 = 0.4 + 1.6 * tipT(i, XS, xa, xb);
      const pd = P(u, t0, t0 + 0.25); if (pd <= 0) return;
      const up = i % 2 === 0, last = i === XS.length - 1;
      const s = easeOutBack(pd), r = last ? 10 : 7;
      // short stem + small card
      const ps = appear(u, t0 + 0.1, 0.3);
      const dir = up ? -1 : 1, y1 = y + dir * (r + 4), y2 = y + dir * (r + 4 + 22 * ps);
      k.strokeStyle = last ? C.blue : C.g4; k.lineWidth = 2.5;
      k.beginPath(); k.moveTo(x, y1); k.lineTo(x, y2); k.stroke();
      if (ps > 0) {
        const cwid = 64, chh = 32, cy = up ? y - r - 26 - chh / 2 : y + r + 26 + chh / 2;
        k.globalAlpha = f * ps;
        k.fillStyle = last ? C.blue : '#FFFFFF'; k.strokeStyle = last ? C.blue : C.g3; k.lineWidth = 2;
        rr(k, x - cwid / 2, cy - chh / 2, cwid, chh, 8); k.fill(); k.stroke();
        txt(k, LB[i], x, cy + 1, `600 18px ${FONT}`, last ? '#FFFFFF' : C.mark, 'center', 'middle');
        k.globalAlpha = f;
      }
      k.fillStyle = last ? C.blue : C.blueM;
      k.beginPath(); k.arc(x, y, r * s, 0, 7); k.fill();
      k.strokeStyle = C.stage; k.lineWidth = 2; k.stroke();
    });
    k.globalAlpha = 1;
  }
  // time at which the line tip (easeInOut over 0.4..2.0) reaches XS[i]
  function tipT(i, XS, xa, xb) {
    const target = (XS[i] - xa) / (xb - xa);
    let lo = 0, hi = 1; for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (easeInOut(m) < target) lo = m; else hi = m; }
    return lo;
  }
  CELLS[17] = timeline;

  // @element 19
  // 19 ファネル図: separate center-aligned bars, each shorter than the one above, with light funnel joints
  function funnel(k, w, h, u) {
    bg(k, w, h);
    const cx0 = w / 2, bh = 34, gap = 10, y0 = 21, f = fade(u);
    const WD = [470, 350, 236, 132], NUM = ['100', '58', '27', '9'];
    const COL = [C.blueL, C.blueM, C.blueM, C.blue];
    WD.forEach((wd, i) => {
      const t0 = 0.4 + i * 0.36, p = appear(u, t0, 0.45);
      if (p <= 0) return;
      const y = y0 + i * (bh + gap);
      // joint from the bar above
      if (i > 0) {
        const wa = WD[i - 1], ya = y - gap;
        k.globalAlpha = f * p * 0.8; k.fillStyle = C.g3;
        k.beginPath(); k.moveTo(cx0 - wa / 2 + 6, ya); k.lineTo(cx0 + wa / 2 - 6, ya);
        k.lineTo(cx0 + wd / 2 - 6, y); k.lineTo(cx0 - wd / 2 + 6, y); k.closePath(); k.fill();
      }
      k.globalAlpha = f;
      const ww = wd * p;
      k.fillStyle = COL[i]; rr(k, cx0 - ww / 2, y, ww, bh, 7); k.fill();
      const pt = P(u, t0 + 0.3, t0 + 0.55);
      if (pt > 0) {
        k.globalAlpha = f * pt;
        txt(k, NUM[i], cx0, y + bh / 2 + 1, `700 20px ${FONT}`, i === 3 ? '#FFFFFF' : C.mark, 'center', 'middle');
      }
    });
    k.globalAlpha = 1;
  }
  CELLS[18] = funnel;

  // @element 20
  // 20 カスタマージャーニーマップ: stage headers as plain boxes (columns), an action card under each,
  // then the feeling line goes up and down across the stages, with a smile / frown mark on each point
  const JV = [0.35, 0.7, -0.6, 0.15, 0.85];     // feeling per stage (+ up = good)
  function face(k, x, y, r, good, col) {
    k.fillStyle = col; k.beginPath(); k.arc(x, y, r, 0, Math.PI * 2); k.fill();
    k.fillStyle = '#FFFFFF';
    k.beginPath(); k.arc(x - r * 0.36, y - r * 0.22, r * 0.13, 0, 7); k.fill();
    k.beginPath(); k.arc(x + r * 0.36, y - r * 0.22, r * 0.13, 0, 7); k.fill();
    k.strokeStyle = '#FFFFFF'; k.lineWidth = Math.max(1.6, r * 0.15); k.lineCap = 'round';
    k.beginPath();
    if (good) k.arc(x, y + r * 0.02, r * 0.42, Math.PI * 0.2, Math.PI * 0.8);
    else k.arc(x, y + r * 0.62, r * 0.42, Math.PI * 1.2, Math.PI * 1.8);
    k.stroke();
  }
  function journey(k, w, h, u) {
    bg(k, w, h);
    const f = fade(u), n = 5, xl = 22, xr = w - 22, cw = (xr - xl) / n;
    const cx = i => xl + cw * (i + 0.5);
    const yMid = 150, amp = 36;
    // column separators and the neutral line stay as the frame
    for (let i = 1; i < n; i++) seg(k, xl + cw * i, 14, xl + cw * i, h - 12, C.g2, 2);
    k.globalAlpha = f;
    // stage headers: plain rounded boxes (not arrows), the stage names as short bars
    for (let i = 0; i < n; i++) {
      const p = appear(u, 0.35 + i * 0.1, 0.3);
      if (p <= 0) continue;
      k.save(); k.globalAlpha = f * p;
      rr(k, cx(i) - cw / 2 + 6, 14, cw - 12, 26, 7); k.fillStyle = i === 2 ? C.g3 : C.blueM; k.fill();
      rr(k, cx(i) - 22, 25, 44, 5, 2.5); k.fillStyle = '#FFFFFF'; k.fill();
      k.restore();
    }
    // action cards (what the customer does at each stage)
    for (let i = 0; i < n; i++) {
      const p = appear(u, 0.6 + i * 0.1, 0.3);
      if (p <= 0) continue;
      k.save(); k.globalAlpha = f * p;
      const y = 50 + (1 - p) * 8;
      rr(k, cx(i) - cw / 2 + 10, y, cw - 20, 38, 6); k.fillStyle = '#FFFFFF'; k.fill();
      k.strokeStyle = C.g3; k.lineWidth = 1.5; k.stroke();
      rr(k, cx(i) - cw / 2 + 18, y + 10, cw - 46, 6, 3); k.fillStyle = C.g3; k.fill();
      rr(k, cx(i) - cw / 2 + 18, y + 22, cw - 60, 6, 3); k.fillStyle = C.g2; k.fill();
      k.restore();
    }
    k.globalAlpha = 1;
    seg(k, xl + 4, yMid, xr - 4, yMid, C.g3, 2, [5, 6]);
    k.globalAlpha = f;
    // feeling line (smooth through the 5 points), drawn left to right
    const pts = JV.map((v, i) => [cx(i), yMid - v * amp]);
    const pl = easeInOut(P(u, 1.25, 2.25));
    if (pl > 0) {
      k.save(); k.beginPath(); k.rect(0, 0, lerp(pts[0][0], pts[n - 1][0], pl) + 1, h); k.clip();
      k.strokeStyle = C.blue; k.lineWidth = 3.5; k.lineJoin = 'round'; k.lineCap = 'round';
      k.beginPath(); k.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], mx = (x0 + x1) / 2;
        k.bezierCurveTo(mx, y0, mx, y1, x1, y1);
      }
      k.stroke(); k.restore();
    }
    pts.forEach(([x, y], i) => {
      const tx = 1.25 + (i / (n - 1)) * 1.0, s = easeOutBack(P(u, tx - 0.05, tx + 0.2));
      if (s <= 0.02) return;
      const good = JV[i] >= 0;
      face(k, x, y, 12 * s, good, good ? C.blue : C.g4);
    });
    k.globalAlpha = 1;
  }
  CELLS[19] = journey;

  // @element 21
  // 21 ツリーマップ: one outer rectangle gets filled by rectangles of different sizes, biggest first
  function treemap(k, w, h, u) {
    bg(k, w, h);
    const f = fade(u);
    const X0 = 50, Y0 = 18, X1 = 489, Y1 = 190;
    k.strokeStyle = C.g3; k.lineWidth = 2; k.setLineDash([6, 6]);
    rr(k, X0, Y0, X1 - X0, Y1 - Y0, 6); k.stroke(); k.setLineDash([]);
    const RS = [                                  // x, y, w, h, color, label
      [50, 18, 206, 172, C.blue, 'A'],
      [260, 18, 140, 96, C.blueM, 'B'],
      [404, 18, 85, 96, C.blueL, 'C'],
      [260, 118, 98, 72, C.blueL, 'D'],
      [362, 118, 70, 72, C.g3, ''],
      [436, 118, 53, 34, C.g3, ''],
      [436, 156, 53, 34, C.g4, ''],
    ];
    RS.forEach(([x, y, ww, hh, col, lb], i) => {
      const p = P(u, 0.4 + i * 0.22, 0.8 + i * 0.22);
      if (p <= 0) return;
      const s = lerp(0.55, 1, easeOutBack(p));
      k.save(); k.globalAlpha = f * Math.min(1, p * 2.5);
      k.translate(x + ww / 2, y + hh / 2); k.scale(s, s);
      k.fillStyle = col; rr(k, -ww / 2, -hh / 2, ww, hh, 5); k.fill();
      if (lb) txt(k, lb, -ww / 2 + 12, -hh / 2 + 26, `700 ${i === 0 ? 24 : 20}px ${FONT}`, i === 0 ? '#FFFFFF' : C.mark, 'left');
      k.restore();
    });
  }
  CELLS[20] = treemap;

  // @element 22
  // 22 スイムレーン図: lane names on the left; boxes and arrows move across the lanes step by step
  function swimlane(k, w, h, u) {
    bg(k, w, h);
    const f = fade(u), X0 = 22, X1 = 517, HW = 62, Y0 = 13, LH = 60, NL = 3;
    const NAMES = ['顧客', '営業', '制作'];
    // skeleton: lanes
    for (let i = 0; i < NL; i++) {
      const y = Y0 + i * LH;
      k.fillStyle = '#FFFFFF'; k.fillRect(X0 + HW, y, X1 - X0 - HW, LH);
      k.fillStyle = C.g2; k.fillRect(X0, y, HW, LH);
      txt(k, NAMES[i], X0 + HW / 2, y + LH / 2 + 1, `600 18px ${FONT}`, C.mark, 'center', 'middle');
    }
    k.strokeStyle = C.g3; k.lineWidth = 2;
    for (let i = 1; i < NL; i++) { k.beginPath(); k.moveTo(X0, Y0 + i * LH); k.lineTo(X1, Y0 + i * LH); k.stroke(); }
    k.beginPath(); k.moveTo(X0 + HW, Y0); k.lineTo(X0 + HW, Y0 + NL * LH); k.stroke();
    rr(k, X0, Y0, X1 - X0, NL * LH, 6); k.stroke();
    // steps
    const BX = [138, 224, 310, 396, 474], BL = [0, 1, 2, 1, 0], bw = 56, bh = 30;
    const cyOf = l => Y0 + l * LH + LH / 2;
    k.globalAlpha = f;
    for (let i = 0; i < BX.length; i++) {
      const t0 = 0.4 + i * 0.38;
      // arrow from previous box: right, then down/up into this box
      if (i > 0) {
        const pa = easeInOut(P(u, t0 - 0.24, t0 + 0.02));
        if (pa > 0) {
          const xs = BX[i - 1] + bw / 2, ys = cyOf(BL[i - 1]), xe = BX[i], ye0 = cyOf(BL[i]);
          const down = ye0 > ys, ye = ye0 + (down ? -bh / 2 - 3 : bh / 2 + 3);
          const l1 = xe - xs, l2 = Math.abs(ye - ys), tot = l1 + l2, d = pa * tot;
          k.strokeStyle = C.mark; k.lineWidth = 2.5; k.lineCap = 'round'; k.lineJoin = 'round';
          k.beginPath(); k.moveTo(xs, ys);
          if (d <= l1) k.lineTo(xs + d, ys);
          else { k.lineTo(xe, ys); k.lineTo(xe, ys + (down ? 1 : -1) * (d - l1)); }
          k.stroke();
          if (pa > 0.98) arrowTo(k, xe, ye, 0, down ? 1 : -1, 9, C.mark);
        }
      }
      const pb = P(u, t0, t0 + 0.28);
      if (pb > 0) {
        const s = easeOutBack(pb), last = i === BX.length - 1, cy = cyOf(BL[i]);
        k.save(); k.translate(BX[i], cy); k.scale(s, s);
        k.fillStyle = last ? C.blue : C.blueL; k.strokeStyle = last ? C.blue : C.blueM; k.lineWidth = 2;
        rr(k, -bw / 2, -bh / 2, bw, bh, 7); k.fill(); k.stroke();
        k.fillStyle = last ? '#FFFFFF' : C.g4;
        rr(k, -16, -3, 32, 6, 3); k.fill();
        k.restore();
      }
    }
    k.globalAlpha = 1;
  }
  CELLS[21] = swimlane;

  // @element 23
  // 23 矢羽根図（シェブロン）: arrow-shaped steps line up from left to right, each with short notes below
  function chevron(k, w, h, u) {
    bg(k, w, h);
    const f = fade(u), n = 5, cw = 104, dp = 24, gp = 6, step = cw - dp + gp;
    const tot = n * step - gp + dp, x0 = (w - tot) / 2, y0 = 40, ch = 74, ym = y0 + ch / 2;
    const COL = [C.blueL, C.blueL, C.blueM, C.blueM, C.blue];
    for (let i = 0; i < n; i++) {
      const t0 = 0.4 + i * 0.3, p = appear(u, t0, 0.42);
      if (p <= 0) continue;
      const x = x0 + i * step - (1 - p) * 34;
      k.globalAlpha = f * Math.min(1, p * 1.6);
      k.fillStyle = COL[i];
      k.beginPath();
      k.moveTo(x, y0); k.lineTo(x + cw - dp, y0); k.lineTo(x + cw, ym); k.lineTo(x + cw - dp, y0 + ch); k.lineTo(x, y0 + ch);
      if (i > 0) k.lineTo(x + dp, ym);
      k.closePath(); k.fill();
      const tx = x + (i > 0 ? dp : 0) / 2 + (cw - dp) / 2 + (i > 0 ? 0 : -2);
      txt(k, String(i + 1), tx + 4, ym + 1, `700 24px ${FONT}`, i === n - 1 ? '#FFFFFF' : C.mark, 'center', 'middle');
      // short notes under each step
      const pn = P(u, t0 + 0.25, t0 + 0.55);
      if (pn > 0) {
        k.globalAlpha = f * pn; k.fillStyle = C.g3;
        const bx = x0 + i * step + (i > 0 ? dp : 0) + 4;
        rr(k, bx, y0 + ch + 20, 62, 8, 4); k.fill();
        rr(k, bx, y0 + ch + 36, 44, 8, 4); k.fill();
      }
    }
    k.globalAlpha = 1;
  }
  CELLS[22] = chevron;

  // @element 24
  // 24 同心円図: circles appear one inside another around the same center (TAM > SAM > SOM)
  function concentric(k, w, h, u) {
    bg(k, w, h);
    const f = fade(u), cx0 = w / 2, cy0 = h / 2 + 2;
    const RR = [91, 61, 31], COL = [C.blueL, C.blueM, C.blue], LB = ['TAM', 'SAM', 'SOM'];
    // skeleton: faint outer ring guide
    k.strokeStyle = C.g2; k.lineWidth = 2; k.beginPath(); k.arc(cx0, cy0, RR[0], 0, 7); k.stroke();
    k.globalAlpha = f;
    RR.forEach((r, i) => {
      const t0 = 0.4 + i * 0.45, p = P(u, t0, t0 + 0.5);
      if (p <= 0) return;
      k.fillStyle = COL[i]; k.beginPath(); k.arc(cx0, cy0, r * lerp(easeOut(p), easeOutBack(p), 0.4), 0, 7); k.fill();
    });
    RR.forEach((r, i) => {
      const t0 = 0.4 + i * 0.45, pt = P(u, t0 + 0.55, t0 + 0.85);
      if (pt <= 0) return;
      k.globalAlpha = f * pt;
      const ly = i < 2 ? cy0 - (r + RR[i + 1]) / 2 : cy0;
      txt(k, LB[i], cx0, ly + 1, `700 18px ${FONT}`, i === 2 ? '#FFFFFF' : C.mark, 'center', 'middle');
    });
    k.globalAlpha = 1;
  }
  CELLS[23] = concentric;

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});


/* Motion Prompt · pack "lp3" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('lp3', function () {
  // @kit
  // LP・Webサイトの演出の名前 第3弾 24（各カード 539x208・1つの動きは4.7秒、パックの周期は9.4秒。各コマは時間 u の純関数）
  // カードの中にブラウザの窓を1つ描き、その中の簡略化したページで演出を見せる。きっかけ（スクロールバー・カーソル）も一緒に描く。
  // 色はカメラワークのパック（camera・camera2）と同じ: 薄いグレーの地に白い窓、青1色（#2F6BEB と、それを薄めた4段）と文字の黒・グレーだけ。
  const CW = 539, CH = 208;
  const CYC = 4.7;                                   // 1つの動きは4.7秒
  const LOOP = CYC * 2;                              // パックの周期は9.4秒。各カードは4.7秒の動きを2回くり返す
  const TAU = Math.PI * 2, W1 = TAU / CYC;           // 4.7秒で1周する角速度（ゆらぎは必ずこの整数倍で回す）
  const C = {
    desk: '#F1F0EE', win: '#FFFFFF', bar: '#F4F3F0', rule: '#E3E1DC',
    ink: '#1E1E21', mark: '#3A3A3E', sub: '#8E8E93', faint: '#E2E1DE', soft: '#F4F3F0', g3: '#CFCECB', g4: '#A9A8A5',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', blueXL: '#E4ECFE', blueBg: '#F1F5FF'
  };
  const PAL = [C.blue, C.blueM, C.blueL, C.blue, C.blueM];
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif';
  const EN = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const MONO = '"SF Mono", "Menlo", "Consolas", monospace';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOut（3乗）
  const eOut = x => 1 - Math.pow(1 - x, 3);                                      // easeOut（3乗）
  const eIn = x => x * x * x;                                                    // easeIn（3乗）
  const eBack = x => { const s = 1.70158; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };   // backOut
  const mod = (a, n) => ((a % n) + n) % n;
  // 浮動小数の誤差で周期の終わり（4.6999…）と始まり（0）が別のコマ扱いになるのを防ぎ、u を 0〜4.7秒に折り返す
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.letterSpacing = ls; k.fillText(s, x, y); k.letterSpacing = '0px';
  }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function rgba(c, a) { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
  // キーフレーム [[秒, 値], …] を easeInOut（3乗）でつなぐ。u は周期で折り返す
  function steps(keys, u, ease = eIO) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, ease((u - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // カーソルの通り道 [[秒, x, y], …]（easeInOut 3乗でつなぐ）
  function path(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const a = keys[i - 1], b = keys[i], f = eIO((u - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  // ブラウザの窓。中のページは V（511x170）の座標で描く。g = 0/1/2 で机の色が変わる
  const WIN = { x: 14, y: 8, w: 511, h: 192, r: 10, bar: 22 };
  const VW = WIN.w, VH = WIN.h - WIN.bar;
  function frame(k, g = 0, url = 'example.com') {
    k.fillStyle = C.desk; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(30,30,33,.14)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
    k.fillStyle = C.win; rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.fill(); k.restore();
    k.save(); rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.clip();
    k.fillStyle = C.bar; k.fillRect(WIN.x, WIN.y, WIN.w, WIN.bar); k.fillStyle = C.rule; k.fillRect(WIN.x, WIN.y + WIN.bar - 1, WIN.w, 1); k.restore();
    [0, 1, 2].forEach(i => { k.fillStyle = C.g3; k.beginPath(); k.arc(WIN.x + 14 + i * 11, WIN.y + 11, 3.4, 0, 7); k.fill(); });
    k.fillStyle = C.faint; rr(k, WIN.x + WIN.w / 2 - 100, WIN.y + 4.5, 200, 13, 6.5); k.fill();
    txt(k, url, WIN.x + WIN.w / 2, WIN.y + 11.5, `500 9px ${EN}`, C.sub, 'center', 'middle');
  }
  function view(k, fn, bg = '#fff') {
    k.save(); rr(k, WIN.x, WIN.y + WIN.bar, VW, VH, [0, 0, WIN.r, WIN.r]); k.clip(); k.translate(WIN.x, WIN.y + WIN.bar);
    k.fillStyle = bg; k.fillRect(0, 0, VW, VH); fn(); k.restore();
  }
  // スクロールバー（つまみだけ。pos 0〜1、ratio＝見えている割合）
  function sbar(k, pos, ratio = 0.42, col = 'rgba(30,30,33,.35)') { const th = (VH - 8) * ratio; k.fillStyle = col; rr(k, VW - 8, 4 + (VH - 8 - th) * clamp(pos), 4.5, th, 2.25); k.fill(); }
  // 文字の代わりの棒（n 行。最後の行は短い）
  function bars(k, x, y, w, n, col = C.faint, hh = 5, gap = 10, last = 0.62) {
    k.fillStyle = col; for (let i = 0; i < n; i++) { rr(k, x, y + i * gap, i === n - 1 && n > 1 ? w * last : w, hh, hh / 2); k.fill(); }
  }
  // マウスのカーソル（矢印）。press で少し縮む。grab = 1 で手のひら（ドラッグ中）の代わりに丸い印
  function cursor(k, x, y, press = 0, col = C.ink) {
    const s = 1.15 * (1 - 0.12 * press);
    k.save(); k.translate(x, y); k.scale(s, s); k.beginPath();
    [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b));
    k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = col; k.fill(); k.stroke(); k.restore();
  }
  // ドラッグ中の印（つかんだ手の代わりに、押した輪のついた丸）
  function grabber(k, x, y, on) {
    k.save(); k.fillStyle = rgba(C.ink, 0.85); k.strokeStyle = '#fff'; k.lineWidth = 2;
    k.beginPath(); k.arc(x, y, on ? 7 : 8.5, 0, 7); k.fill(); k.stroke();
    if (on) { k.strokeStyle = rgba(C.ink, 0.3); k.lineWidth = 2; k.beginPath(); k.arc(x, y, 13, 0, 7); k.stroke(); }
    k.restore();
  }
  // 画面外のキャンバス（id ごとに1枚）。呼び出し側の拡大率に合わせた解像度で作り、w×h の座標で描けるようにする
  const LAY = {};
  function layer(k, id, w, h, res) {
    const m = k.getTransform(), s = res || Math.min(4, Math.max(1, Math.hypot(m.a, m.b)));
    let c = LAY[id]; if (!c) c = LAY[id] = document.createElement('canvas');
    const W = Math.max(1, Math.ceil(w * s)), H = Math.max(1, Math.ceil(h * s));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const g = c.getContext('2d'); g.clearRect(0, 0, W, H); g.save(); g.scale(W / w, H / h);
    return [c, g, W / w];
  }
  // 低い解像度のマス目（nx×ny）を f(i, j) の色で塗り、なめらかに引き伸ばして (x, y, w, h) に描く。シェーダーの代わり
  function field(k, id, x, y, w, h, nx, ny, f) {
    const [c, g] = layer(k, id, nx, ny, 1);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { g.fillStyle = f(i, j); g.fillRect(i, j, 1, 1); }
    g.restore(); k.save(); k.imageSmoothingEnabled = true; k.imageSmoothingQuality = 'high'; k.drawImage(c, x, y, w, h); k.restore();
  }
  // 決まった種の乱数（描くたびに同じ値）
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  // 絵の代わりのアート（色の地に 丸・三角・帯）。v で色と形が変わる。ジャケット・写真・カードの絵柄に使う
  const ARTS = [
    [C.blue, C.blueL, '#FFFFFF'], [C.blueL, C.blue, '#FFFFFF'], [C.blueXL, C.blueM, C.blue],
    [C.blueM, '#FFFFFF', C.blue], [C.blueXL, C.blue, C.blueM], [C.blue, C.blueM, C.blueXL]
  ];
  function art(k, x, y, w, h, v = 0, r = 6) {
    const [a, b, c] = ARTS[mod(v, ARTS.length)], m = Math.min(w, h);
    k.save(); rr(k, x, y, w, h, r); k.clip();
    k.fillStyle = a; k.fillRect(x, y, w, h);
    const t = mod(v, 3);
    if (t === 0) { k.fillStyle = b; k.beginPath(); k.arc(x + w * 0.62, y + h * 0.42, m * 0.3, 0, 7); k.fill(); k.fillStyle = c; k.fillRect(x, y + h * 0.7, w, h * 0.3); }
    else if (t === 1) { k.fillStyle = b; k.beginPath(); k.moveTo(x, y + h); k.lineTo(x + w * 0.45, y + h * 0.25); k.lineTo(x + w * 0.9, y + h); k.fill(); k.fillStyle = c; k.beginPath(); k.arc(x + w * 0.78, y + h * 0.28, m * 0.14, 0, 7); k.fill(); }
    else { k.fillStyle = b; for (let i = 0; i < 3; i++) k.fillRect(x, y + h * (0.18 + i * 0.26), w, h * 0.1); k.fillStyle = c; k.beginPath(); k.arc(x + w * 0.3, y + h * 0.5, m * 0.22, 0, 7); k.fill(); }
    k.restore();
  }
  const CELLS = [];

  // @element 01
  // 01 スクローリーテリング（左の文章を読み進めると、右に固定した空の絵が 朝→昼→夜 と切り替わる）
  CELLS[0] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const s = steps([[0.25, 0], [1.05, 1], [1.85, 1], [2.65, 2], [3.6, 2], [4.4, 0]], u);   // 読んでいる段（0〜2）
    const STEP = [['07:00', '朝', '日がのぼる'], ['12:00', '昼', '空が高くなる'], ['21:00', '夜', '星が出てくる']];
    view(k, () => {
      // 左: 文章の列（1段 120px ずつスクロール）
      k.save(); k.translate(0, -s * 120);
      STEP.forEach(([tm, a, b], i) => {
        const on = clamp(1 - Math.abs(s - i) * 1.4), y = 46 + i * 120;
        txt(k, `0${i + 1}`, 28, y, `700 11px ${MONO}`, mix(C.g3, C.blue, on));
        txt(k, `${a}  ${b}`, 28, y + 26, `800 19px ${JP}`, mix(C.g3, C.ink, on));
        bars(k, 28, y + 40, 178, 3, mix(C.soft, C.faint, on));
      });
      k.restore();
      // 右: 固定した絵（スクロールしても動かない）
      const X = 236, Y = 12, PW = 252, PH = 146;
      k.save(); rr(k, X, Y, PW, PH, 10); k.clip();
      const top = s < 1 ? mix(C.blueXL, C.blueM, s) : mix(C.blueM, C.blue, s - 1);
      const bot = s < 1 ? mix('#FFFFFF', C.blueXL, s) : mix(C.blueXL, C.blueM, s - 1);
      const g = k.createLinearGradient(0, Y, 0, Y + PH); g.addColorStop(0, top); g.addColorStop(1, bot); k.fillStyle = g; k.fillRect(X, Y, PW, PH);
      // 星（夜）
      const st = clamp((s - 1.35) / 0.6), R = rng(241);
      for (let i = 0; i < 22; i++) { const sx = X + R() * PW, sy = Y + R() * 80, a = st * (0.5 + 0.5 * R()); k.fillStyle = `rgba(255,255,255,${a})`; k.beginPath(); k.arc(sx, sy, 1 + R() * 1.2, 0, 7); k.fill(); }
      // 太陽（朝は左下 → 昼は真上 → 夕方に右へ沈む）と月
      const th = Math.PI * (0.92 - 0.42 * Math.min(s, 1) - 0.5 * clamp(s - 1));
      const sunA = 1 - clamp((s - 1.25) / 0.45);
      k.fillStyle = rgba('#FFFFFF', sunA); k.beginPath(); k.arc(X + PW / 2 + Math.cos(th) * 104, Y + 118 - Math.sin(th) * 92, 17, 0, 7); k.fill();
      k.fillStyle = rgba('#FFFFFF', sunA * 0.45); k.beginPath(); k.arc(X + PW / 2 + Math.cos(th) * 104, Y + 118 - Math.sin(th) * 92, 25, 0, 7); k.fill();
      const mo = clamp((s - 1.45) / 0.5);
      if (mo > 0) { const mx = X + 192, my = Y + 40 + (1 - mo) * 30; k.fillStyle = rgba('#FFFFFF', mo * 0.25); k.beginPath(); k.arc(mx, my, 22, 0, 7); k.fill(); k.fillStyle = rgba('#FFFFFF', mo); k.beginPath(); k.arc(mx, my, 13, 0, 7); k.fill(); k.fillStyle = rgba(C.blueL, mo); k.beginPath(); k.arc(mx - 4, my - 3, 3, 0, 7); k.arc(mx + 4, my + 4, 2, 0, 7); k.fill(); }
      // 丘（色も時間で変わる）
      const h1 = s < 1 ? mix(C.blueL, C.blueM, s) : mix(C.blueM, C.blueL, s - 1), h2 = s < 1 ? mix(C.blueM, C.blue, s) : mix(C.blue, C.blueM, s - 1);
      k.fillStyle = h1; k.beginPath(); k.moveTo(X, Y + PH); k.quadraticCurveTo(X + 70, Y + 96, X + 150, Y + 116); k.quadraticCurveTo(X + 210, Y + 128, X + PW, Y + 104); k.lineTo(X + PW, Y + PH); k.fill();
      k.fillStyle = h2; k.beginPath(); k.moveTo(X, Y + 128); k.quadraticCurveTo(X + 110, Y + 112, X + PW, Y + 136); k.lineTo(X + PW, Y + PH); k.lineTo(X, Y + PH); k.fill();
      // 時刻のラベル（近い段の時刻）
      const near = Math.round(s), la = clamp(1 - Math.abs(s - near) * 3);
      k.fillStyle = `rgba(255,255,255,${0.88 * la})`; rr(k, X + 12, Y + 12, 58, 22, 11); k.fill();
      txt(k, STEP[near][0], X + 41, Y + 23.5, `700 11px ${MONO}`, rgba(C.ink, la), 'center', 'middle');
      k.restore();
      sbar(k, s / 2, 0.42);
    });
  };

  // @element 02
  // 02 連番アニメーション（スクロール量に合わせて、商品の写真を1コマずつ差し替え、缶が回って見える）
  CELLS[1] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const s = steps([[0.3, 0], [2.3, 1], [2.9, 1], [4.4, 0]], u);       // スクロール量（0〜1）
    const N = 36, f = Math.min(N - 1, Math.floor(s * N + 1e-6));           // いま見せているコマ（36コマで1回転）
    const ang = f / N * TAU;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, 'NEW FLAVOR', 32, 50, `800 11px ${EN}`, C.blue, 'left', 'alphabetic', '2px');
      txt(k, 'レモンソーダ', 32, 80, `800 22px ${JP}`, C.ink);
      bars(k, 32, 96, 150, 3);
      // 進み具合とコマ番号
      k.fillStyle = C.faint; rr(k, 32, 136, 150, 5, 2.5); k.fill();
      k.fillStyle = C.blue; rr(k, 32, 136, 150 * (f + 1) / N, 5, 2.5); k.fill();
      txt(k, `frame ${String(f + 1).padStart(3, '0')} / ${N}`, 32, 158, `600 10px ${MONO}`, C.sub);
      // 舞台
      const X = 330, Y = 86;
      const st = k.createRadialGradient(X, Y + 10, 10, X, Y + 10, 130); st.addColorStop(0, C.blueBg); st.addColorStop(1, rgba(C.blueBg, 0)); k.fillStyle = st; k.fillRect(200, 0, 311, VH);
      k.fillStyle = 'rgba(30,30,33,.14)'; k.beginPath(); k.ellipse(X, Y + 66, 52, 8, 0, 0, 7); k.fill();
      // 缶（円柱）。ラベルの柄を回転角に合わせて横へ送る
      const R = 36, H0 = Y - 56, H1 = Y + 62;
      k.save(); k.beginPath(); k.moveTo(X - R, H0); k.lineTo(X - R, H1); k.ellipse(X, H1, R, 7, 0, Math.PI, 0, true); k.lineTo(X + R, H0); k.closePath(); k.clip();
      k.fillStyle = C.blueL; k.fillRect(X - R, H0 - 8, R * 2, H1 - H0 + 16);
      // 帯（青）と水玉・ロゴ: 経度 phi にある物は x = R sin(phi + ang)、見えるのは cos > 0 の側
      for (let i = 0; i < 12; i++) {
        const phi = i / 12 * TAU + ang, cz = Math.cos(phi);
        if (cz <= 0) continue;
        const x = X + R * Math.sin(phi);
        k.fillStyle = i % 2 ? C.blue : '#FFFFFF'; k.beginPath(); k.ellipse(x, H0 + 22, 5 * cz, 5, 0, 0, 7); k.fill();
        k.fillStyle = C.blueM; k.beginPath(); k.ellipse(x, H1 - 20, 3.5 * cz, 3.5, 0, 0, 7); k.fill();
      }
      k.fillStyle = C.blue; k.fillRect(X - R, Y - 18, R * 2, 36);
      const lc = Math.cos(ang);
      if (lc > 0.05) { const lx = X + R * Math.sin(ang); k.save(); k.translate(lx, Y); k.scale(lc, 1); txt(k, 'LEMON', 0, 1, `900 15px ${EN}`, '#fff', 'center', 'middle', '1px'); k.restore(); }
      const bc = Math.cos(ang + Math.PI);
      if (bc > 0.05) { const bx = X + R * Math.sin(ang + Math.PI); k.save(); k.translate(bx, Y); k.scale(bc, 1); txt(k, 'SODA', 0, 1, `900 15px ${EN}`, C.blueL, 'center', 'middle', '1px'); k.restore(); }
      // 立体の陰
      const sh = k.createLinearGradient(X - R, 0, X + R, 0); sh.addColorStop(0, 'rgba(30,30,33,.28)'); sh.addColorStop(0.35, 'rgba(255,255,255,.28)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(30,30,33,.3)');
      k.fillStyle = sh; k.fillRect(X - R, H0 - 8, R * 2, H1 - H0 + 16); k.restore();
      // ふた
      k.fillStyle = C.faint; k.beginPath(); k.ellipse(X, H0, R, 7, 0, 0, 7); k.fill(); k.strokeStyle = C.g3; k.lineWidth = 1.5; k.beginPath(); k.ellipse(X, H0, R - 4, 5, 0, 0, 7); k.stroke();
      sbar(k, s, 0.3);
    });
  };

  // @element 03
  // 03 ベロシティスキュー（速くスクロールするほど画像が斜めに傾き、止まるとまっすぐに戻る）
  CELLS[2] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const Y = t => steps([[0.25, 0], [1.25, 240], [1.95, 240], [2.55, 480], [3.25, 480], [4.45, 720]], t);   // スクロール量。1周で720px（＝6段）進む
    const y = Y(u), dt = 1 / 60;
    const Ys = t => Y(t) + 720 * Math.floor(t / CYC);                    // 周期をまたいでもつながるスクロール量
    const v = (Ys(u + dt) - Ys(u - dt)) / (2 * dt);                       // 速さ（px/秒）
    const sk = clamp(v / 130, 0, 9) * Math.PI / 180;                      // 傾き（速さ130px/秒ごとに1°、最大9°）
    view(k, () => {
      k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH);
      const COLS = [40, 190, 340], TW = 130, TH = 96, PITCH = 120;
      for (let c = 0; c < 3; c++) {
        const off = mod(y + c * 40, PITCH * 6);
        for (let r = -1; r < 3; r++) {
          const row = r + Math.floor(off / PITCH), ty = r * PITCH - mod(off, PITCH) + 14;
          const v2 = mod(row * 3 + c, 6);
          k.save(); k.translate(COLS[c] + TW / 2, ty + TH / 2); k.transform(1, Math.tan(sk), 0, 1, 0, 0);
          art(k, -TW / 2, -TH / 2, TW, TH, v2, 8);
          k.restore();
        }
      }
      // 速さの目盛り（右下）
      k.fillStyle = 'rgba(30,30,33,.82)'; rr(k, 380, 136, 112, 24, 12); k.fill();
      txt(k, 'skew', 394, 148.5, `600 10px ${MONO}`, 'rgba(255,255,255,.7)', 'left', 'middle');
      txt(k, `${(sk * 180 / Math.PI).toFixed(1)}°`, 478, 148.5, `700 11px ${MONO}`, C.blueL, 'right', 'middle');
      sbar(k, mod(y, 720) / 720, 0.25);
    });
  };

  // @element 04
  // 04 マルチスクロール（画面を左右2列に分け、1回のスクロールで左の列は上へ、右の列は下へ動いて、次の組がそろう）
  CELLS[3] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const s = steps([[0.35, 0], [1.15, 1], [1.95, 1], [2.75, 2], [3.6, 2], [4.45, 0]], u);   // いまの組（0〜2）
    const HW = VW / 2;
    const SEC = [[C.blue, '01', 'COLOR', 0], [C.blueL, '02', 'SHAPE', 1], [C.blueM, '03', 'MOTION', 3]];
    view(k, () => {
      // 左の列: 0,1,2 の順に上から並び、上へ流れる
      k.save(); k.beginPath(); k.rect(0, 0, HW, VH); k.clip();
      SEC.forEach(([col, no, word], i) => {
        const y = (i - s) * VH;
        if (y > VH || y < -VH) return;
        k.fillStyle = col; k.fillRect(0, y, HW, VH);
        const dark = col === C.blueL || col === C.blueM;
        txt(k, no, 28, y + 44, `700 12px ${MONO}`, dark ? C.ink : 'rgba(255,255,255,.75)');
        txt(k, word, 26, y + 96, `900 40px ${EN}`, dark ? C.ink : '#fff', 'left', 'alphabetic', '1px');
        bars(k, 28, y + 116, 150, 2, dark ? 'rgba(30,30,33,.25)' : 'rgba(255,255,255,.45)');
      });
      k.restore();
      // 右の列: 2,1,0 の順に上から並び（組 i は下から i 番目）、下へ流れる
      k.save(); k.beginPath(); k.rect(HW, 0, HW, VH); k.clip();
      SEC.forEach(([col, no, word, v], i) => {
        const y = (s - i) * VH;
        if (y > VH || y < -VH) return;
        art(k, HW, y, HW, VH, v, 0);
      });
      k.restore();
      // 真ん中の境目と、組の目印
      k.fillStyle = '#fff'; k.fillRect(HW - 1, 0, 2, VH);
      for (let i = 0; i < 3; i++) { const on = clamp(1 - Math.abs(s - i) * 1.5); k.fillStyle = `rgba(255,255,255,${0.45 + 0.55 * on})`; k.beginPath(); k.arc(HW, 58 + i * 27, 3.5 + 2 * on, 0, 7); k.fill(); k.strokeStyle = 'rgba(30,30,33,.25)'; k.lineWidth = 1; k.stroke(); }
      // 矢印（動いている間だけ。左右は逆向き）
      const ds = steps([[0.35, 0], [1.15, 1], [1.95, 1], [2.75, 2], [3.6, 2], [4.45, 0]], u + 0.02) - s;
      if (Math.abs(ds) > 1e-4) {
        const d = ds > 0 ? 1 : -1;
        k.fillStyle = '#fff';
        const tri = (x, y, up) => { k.beginPath(); k.moveTo(x, y + (up ? -7 : 7)); k.lineTo(x - 8, y + (up ? 5 : -5)); k.lineTo(x + 8, y + (up ? 5 : -5)); k.fill(); };
        tri(HW - 22, 146, d > 0); tri(HW + 22, 146, d < 0);
      }
    });
  };

  // @element 05
  // 05 縮むヘッダー（ページの上の幅いっぱいのヘッダーが、スクロールすると細い角丸のピル形に縮んで上に浮く。戻ると元に広がる）
  CELLS[4] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const y = steps([[0.4, 0], [1.9, 150], [2.9, 150], [4.3, 0]], u);     // スクロール量
    const q = eIO(clamp(y / 70));                                         // 縮み具合（70px スクロールで縮みきる）
    view(k, () => {
      // ページ
      k.save(); k.translate(0, -y);
      art(k, 0, 0, VW, 150, 0, 0);
      txt(k, 'SUMMER', 30, 98, `900 38px ${EN}`, '#fff', 'left', 'alphabetic', '2px');
      txt(k, 'COLLECTION', 32, 120, `800 14px ${EN}`, 'rgba(255,255,255,.85)', 'left', 'alphabetic', '3px');
      for (let i = 0; i < 4; i++) { art(k, 24 + i * 120, 170, 106, 84, i + 2, 8); bars(k, 24 + i * 120, 262, 90, 2); }
      art(k, 24, 300, 466, 70, 4, 8);
      k.restore();
      // ヘッダー: 幅 511→310、高さ 46→34、上の余白 0→10、角丸 0→17、白→黒
      const hw = lerp(VW, 310, q), hh = lerp(46, 34, q), hx = (VW - hw) / 2, hy = lerp(0, 10, q), r = lerp(0, 17, q);
      k.save(); k.shadowColor = `rgba(30,30,33,${0.08 + 0.22 * q})`; k.shadowBlur = 6 + 10 * q; k.shadowOffsetY = 2 + 3 * q;
      k.fillStyle = mix('#FFFFFF', C.ink, q * 0.92); rr(k, hx, hy, hw, hh, r); k.fill(); k.restore();
      const ink = mix(C.ink, '#FFFFFF', q), cy = hy + hh / 2;
      k.fillStyle = C.blue; k.beginPath(); k.arc(hx + lerp(22, 20, q), cy, lerp(7, 6, q), 0, 7); k.fill();
      txt(k, 'PALETTE', hx + lerp(34, 31, q), cy + 0.5, `800 ${lerp(13, 11, q)}px ${EN}`, ink, 'left', 'middle', '1px');
      const nav = ['Shop', 'Story', 'Blog'];
      nav.forEach((s, i) => txt(k, s, hx + hw - lerp(232, 168, q) + i * lerp(56, 40, q), cy + 0.5, `600 ${lerp(12, 10.5, q)}px ${EN}`, ink, 'left', 'middle'));
      const bw = lerp(82, 30, q), bh = lerp(28, 24, q);
      k.fillStyle = C.blue; rr(k, hx + hw - bw - lerp(14, 6, q), cy - bh / 2, bw, bh, bh / 2); k.fill();
      k.globalAlpha = 1 - q; txt(k, 'カート', hx + hw - bw / 2 - lerp(14, 6, q), cy + 0.5, `700 11px ${JP}`, '#fff', 'center', 'middle'); k.globalAlpha = 1;
      if (q > 0) { k.globalAlpha = q; k.strokeStyle = '#fff'; k.lineWidth = 1.8; const bx = hx + hw - bw / 2 - 6, by = cy; k.beginPath(); k.moveTo(bx - 6, by - 4); k.lineTo(bx - 4, by + 4); k.lineTo(bx + 5, by + 4); k.lineTo(bx + 6, by - 2); k.lineTo(bx - 5, by - 2); k.stroke(); k.globalAlpha = 1; }
      sbar(k, y / 150, 0.45);
    });
  };

  // @element 06
  // 06 下から現れるフッター（フッターは画面の下に固定され、本文の下に隠れている。最後までスクロールすると本文がめくれるように上がり、フッターが現れる）
  CELLS[5] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const y = steps([[0.35, 0], [2.0, 130], [3.0, 130], [4.35, 0]], u);   // スクロール量。130px でフッターが全部見える
    const q = y / 130;
    view(k, () => {
      // フッター（固定。中身は少し下から上がってくる）
      const FY = VH - 130;
      k.fillStyle = C.blue; k.fillRect(0, FY, VW, 130);
      const fy = FY + 26 * (1 - q);
      txt(k, "Let's make", 28, fy + 48, `900 28px ${EN}`, '#fff');
      txt(k, 'something.', 28, fy + 80, `900 28px ${EN}`, C.blueL);
      [['Work', 'About'], ['Blog', 'Contact']].forEach((col, i) => col.forEach((s, j) => txt(k, s, 290 + i * 80, fy + 44 + j * 22, `600 12px ${EN}`, 'rgba(255,255,255,.85)')));
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(462, fy + 66, 16, 0, 7); k.fill();
      k.strokeStyle = C.blue; k.lineWidth = 2.2; k.beginPath(); k.moveTo(456, fy + 66); k.lineTo(468, fy + 66); k.moveTo(463, fy + 61); k.lineTo(468, fy + 66); k.lineTo(463, fy + 71); k.stroke();
      // 本文（フッターの上に重なり、スクロールで上がる）
      k.save(); k.translate(0, -y);
      k.shadowColor = `rgba(30,30,33,${0.35 * Math.min(1, q * 4)})`; k.shadowBlur = 18; k.shadowOffsetY = 6;
      k.fillStyle = '#fff'; rr(k, 0, -10, VW, VH + 10, [0, 0, 14 * Math.min(1, q * 3), 14 * Math.min(1, q * 3)]); k.fill();
      k.shadowColor = 'transparent';
      txt(k, 'WORKS', 28, 40, `800 11px ${EN}`, C.blue, 'left', 'alphabetic', '2px');
      for (let i = 0; i < 3; i++) { art(k, 28 + i * 156, 54, 142, 78, i + 1, 8); bars(k, 28 + i * 156, 142, 110, 2); }
      k.restore();
      sbar(k, q, 0.55);
    });
  };

  // @element 07
  // 07 カバーフロー（正面に1枚、左右のジャケットは斜めに傾いて重なる。送ると次の1枚が回り込んで正面に来る。床に映り込み）
  CELLS[6] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    const p = steps([[0.25, 0], [0.75, 1], [1.05, 1], [1.55, 2], [1.85, 2], [2.35, 3], [3.0, 3], [4.3, 0]], u);   // 正面にある番号（0〜3）
    const NAMES = ['Sunset Club', 'Lemon Tree', 'Mint Night', 'Pink Noise', 'Blue Hour', 'Deep Sea'];
    view(k, () => {
      const bg = k.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, C.desk); k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      const CX = 255, CY = 70, S = 88;
      const items = [];
      for (let i = Math.floor(p) - 5; i <= Math.ceil(p) + 5; i++) items.push(i);
      items.sort((a, b) => Math.abs(b - p) - Math.abs(a - p));            // 遠い物から描く
      for (const i of items) {
        const rel = i - p, ar = Math.abs(rel), sg = Math.sign(rel);
        const x = CX + (ar < 1 ? rel * 74 : sg * (74 + (ar - 1) * 30));    // 正面から1つ目は74px、その先は30pxずつ
        const a = clamp(ar) * 62 * Math.PI / 180 * sg;                     // 回転（最大62°）
        if (Math.abs(x - CX) > 300) continue;
        const sx = Math.cos(a), skw = Math.sin(a) * 0.28;
        const draw = (flip) => {
          k.save(); k.translate(x, CY + (flip ? S : 0)); k.transform(sx, -skw, 0, flip ? -1 : 1, 0, 0);
          art(k, -S / 2, flip ? -S : -S / 2, S, S, mod(i, 6), 3);
          if (!flip) { txt(k, String(mod(i, 6) + 1).padStart(2, '0'), -S / 2 + 8, -S / 2 + 16, `800 10px ${MONO}`, rgba(C.ink, 0.55)); }
          k.restore();
        };
        k.globalAlpha = 0.22; draw(true); k.globalAlpha = 1;
        draw(false);
        k.fillStyle = `rgba(255,255,255,${0.45 * clamp(ar)})`;                // 横を向いた物は暗く
        k.save(); k.translate(x, CY); k.transform(sx, -skw, 0, 1, 0, 0); k.fillRect(-S / 2, -S / 2, S, S); k.restore();
      }
      // 映り込みを床でぼかす
      const fl = k.createLinearGradient(0, CY + S / 2, 0, VH); fl.addColorStop(0, rgba(C.desk, 0.35)); fl.addColorStop(0.6, rgba(C.desk, 1)); k.fillStyle = fl; k.fillRect(0, CY + S / 2, VW, VH);
      // 曲名（正面の1枚）
      const near = Math.round(p), la = clamp(1 - Math.abs(p - near) * 3);
      txt(k, NAMES[mod(near, 6)], CX, 140, `800 13px ${EN}`, rgba(C.ink, la), 'center');
      txt(k, 'LP3 Records', CX, 156, `500 10px ${EN}`, rgba(C.sub, la), 'center');
      // 送りのつまみ
      k.fillStyle = C.faint; rr(k, 150, 162, 210, 4, 2); k.fill();
      k.fillStyle = C.blue; rr(k, 150 + 210 * p / 5, 160, 36, 8, 4); k.fill();
    });
  };

  // @element 08
  // 08 無限キャンバス（上下左右に途切れなく続く作品の壁を、つかんでドラッグして見て回る。端が来ない）
  CELLS[7] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 0);
    // ドラッグは2回。1回目は左上へ、2回目は左へ。1周で横に6枚・縦に2段ぶん進む（タイルは 6×2 で繰り返すので継ぎ目なし）
    const TX = 96, TY = 84;
    const d1 = eIO(P(u, 0.3, 1.9)), d2 = eIO(P(u, 2.5, 4.2));
    const ox = -(TX * 3) * d1 - (TX * 3) * d2, oy = -(TY * 2) * d1 + 0 * d2 + 14 * Math.sin(Math.PI * d2);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      // うすい方眼
      k.strokeStyle = rgba(C.blue, 0.08); k.lineWidth = 1;
      for (let x = mod(ox, 24); x < VW; x += 24) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, VH); k.stroke(); }
      for (let y = mod(oy, 24); y < VH; y += 24) { k.beginPath(); k.moveTo(0, y); k.lineTo(VW, y); k.stroke(); }
      const i0 = Math.floor(-ox / TX) - 1, j0 = Math.floor(-oy / TY) - 1;
      for (let j = j0; j < j0 + 4; j++) for (let i = i0; i < i0 + 7; i++) {
        const x = ox + i * TX + (mod(j, 2) ? 48 : 0) + 10, y = oy + j * TY + 12;
        const v = mod(i * 5 + j * 3, 6), sz = mod(i + j * 3, 3);
        const tw = [74, 64, 70][sz], th = [58, 52, 46][sz];
        k.save(); k.shadowColor = 'rgba(30,30,33,.14)'; k.shadowBlur = 8; k.shadowOffsetY = 3; art(k, x, y, tw, th, v, 6); k.restore();
      }
      // つかむ印: ドラッグ中は押した輪、間は離して元の位置へ戻る
      const on = (u > 0.3 && u < 1.9) || (u > 2.5 && u < 4.2);
      const gx = on ? (u < 2 ? 380 - 120 * d1 : 400 - 150 * d2) : (u >= 1.9 && u < 2.5 ? lerp(260, 400, eIO(P(u, 1.9, 2.5))) : u >= 4.2 ? lerp(250, 380, eIO(P(u, 4.2, 4.7))) : 380);
      const gy = on ? (u < 2 ? 120 - 60 * d1 : 90 + 14 * Math.sin(Math.PI * d2)) : (u >= 1.9 && u < 2.5 ? lerp(60, 90, eIO(P(u, 1.9, 2.5))) : u >= 4.2 ? lerp(90, 120, eIO(P(u, 4.2, 4.7))) : 120);
      grabber(k, gx, gy, on);
      // 右上の札
      k.fillStyle = 'rgba(30,30,33,.82)'; rr(k, 392, 10, 106, 20, 10); k.fill();
      txt(k, 'DRAG TO EXPLORE', 445, 20.5, `700 8.5px ${EN}`, '#fff', 'center', 'middle', '1px');
    });
  };

  // @element 09
  // 09 ドック風メニュー（下に並んだアイコンの上をカーソルが通ると、近いアイコンほど大きくなって持ち上がり、まわりが押し広がる）
  CELLS[8] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const [cx, cy] = path([[0, 560, 150], [0.5, 470, 136], [2.2, 110, 136], [2.6, 110, 136], [4.2, 470, 136], [4.7, 560, 150]], u);
    view(k, () => {
      const bg = k.createLinearGradient(0, 0, VW, VH); bg.addColorStop(0, C.blueBg); bg.addColorStop(0.55, C.blueXL); bg.addColorStop(1, C.blueL); k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      k.fillStyle = 'rgba(255,255,255,.55)'; k.beginPath(); k.arc(90, 30, 60, 0, 7); k.fill();
      txt(k, '10:24', 482, 46, `200 30px ${EN}`, C.ink, 'right');
      txt(k, 'Tuesday, Nov 24', 481, 62, `600 10px ${EN}`, C.sub, 'right');
      // アイコンの大きさ: 1 + 0.85·exp(−(d/46)²)（d＝カーソルとの横の距離）。カーソルが外ならゆっくり 1 に戻る
      const N = 7, BASE = 34, GAP = 8, ICONS = [C.blue, C.blueM, C.blue, C.blueM, C.blue, C.blueM, C.blue];
      const lab = ['ホーム', '写真', 'メモ', '音楽', '地図', '設定', 'ゴミ箱'];
      let in1 = clamp(P(u, 0.35, 0.65)) * (1 - clamp(P(u, 4.15, 4.45)));
      const base0 = (VW - (N * BASE + (N - 1) * GAP)) / 2;
      const sc = [];
      for (let i = 0; i < N; i++) { const bx = base0 + i * (BASE + GAP) + BASE / 2, d = (cx - bx); sc.push(1 + 0.85 * Math.exp(-(d / 46) * (d / 46)) * in1); }
      const total = sc.reduce((a, s) => a + s * BASE, 0) + (N - 1) * GAP;
      // ドックの台（中身に合わせて伸びる）
      const DY = 152;
      k.fillStyle = 'rgba(255,255,255,.55)'; k.strokeStyle = 'rgba(255,255,255,.9)'; k.lineWidth = 1;
      rr(k, (VW - total) / 2 - 10, DY - BASE - 12, total + 20, BASE + 20, 14); k.fill(); k.stroke();
      let x = (VW - total) / 2, hov = -1, best = 0;
      for (let i = 0; i < N; i++) {
        const s = sc[i] * BASE; if (sc[i] > best) { best = sc[i]; hov = i; }
        const ix = x, iy = DY - 4 - s;
        k.save(); k.shadowColor = 'rgba(30,30,33,.2)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
        k.fillStyle = ICONS[i]; rr(k, ix, iy, s, s, s * 0.24); k.fill(); k.restore();
        // 中の印
        k.fillStyle = 'rgba(255,255,255,.9)'; const m = s / 2;
        if (i % 3 === 0) { k.beginPath(); k.arc(ix + m, iy + m, s * 0.2, 0, 7); k.fill(); }
        else if (i % 3 === 1) { k.beginPath(); k.moveTo(ix + s * 0.28, iy + s * 0.7); k.lineTo(ix + m, iy + s * 0.3); k.lineTo(ix + s * 0.72, iy + s * 0.7); k.fill(); }
        else { rr(k, ix + s * 0.3, iy + s * 0.3, s * 0.4, s * 0.4, s * 0.06); k.fill(); }
        x += s + GAP;
      }
      // いちばん大きいアイコンの名前
      if (best > 1.55) {
        let lx = (VW - total) / 2; for (let i = 0; i < hov; i++) lx += sc[i] * BASE + GAP; lx += sc[hov] * BASE / 2;
        const a = clamp((best - 1.55) / 0.2), ty = DY - 10 - sc[hov] * BASE - 14;
        k.globalAlpha = a; k.fillStyle = 'rgba(30,30,33,.85)'; rr(k, lx - 26, ty - 10, 52, 19, 9.5); k.fill(); txt(k, lab[hov], lx, ty + 0.5, `700 10px ${JP}`, '#fff', 'center', 'middle'); k.globalAlpha = 1;
      }
      cursor(k, cx, cy);
    });
  };

  // @element 10
  // 10 ホログラムカード（カーソルの向きにカードが傾き、表面の虹色の箔と光の反射がカーソルを追って走る）
  CELLS[9] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const cx = 255 + 112 * Math.sin(W1 * u), cy = 86 + 40 * Math.sin(2 * W1 * u);     // カーソル（8の字）
    const nx = (cx - 255) / 112, ny = (cy - 86) / 40;                                  // -1〜1
    const ry = nx * 0.42, rx = -ny * 0.3;                                              // 傾き（ラジアン）
    view(k, () => {
      const bg = k.createRadialGradient(255, 80, 10, 255, 80, 300); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, C.blueXL); k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      const CWd = 172, CHd = 112;
      const [c, g, sc] = layer(k, 'holo', CWd, CHd);
      // 台紙
      const base = g.createLinearGradient(0, 0, CWd, CHd); base.addColorStop(0, C.blueM); base.addColorStop(1, C.blue); g.fillStyle = base; rr(g, 0, 0, CWd, CHd, 10); g.fill();
      // 虹色の箔（帯の位置がカーソルの横位置で流れる）
      g.save(); rr(g, 0, 0, CWd, CHd, 10); g.clip();
      const off = nx * 70 + ny * 30;
      const fo = g.createLinearGradient(-60 + off, -40, 120 + off, 150);
      [C.blue, C.blueL, '#FFFFFF', C.blueM, C.blue, C.blueXL, C.blueL].forEach((col, i) => fo.addColorStop(i / 6, col));
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.95; g.fillStyle = fo; g.fillRect(0, 0, CWd, CHd);
      // 箔の細かい斜線（光の当たる帯だけ濃く見える）
      g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 0.7; g.strokeStyle = '#fff'; g.lineWidth = 1;
      for (let i = -CHd; i < CWd; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + CHd, CHd); g.stroke(); }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      // 絵柄: 星のキャラクター
      g.save(); g.translate(CWd / 2, 52); g.fillStyle = C.blueL; g.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 13 : 30, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); g.fillStyle = C.ink; [-7, 7].forEach(ex => { g.beginPath(); g.arc(ex, 0, 2.6, 0, 7); g.fill(); }); g.restore();
      g.fillStyle = C.blue; rr(g, 10, 10, 44, 15, 7.5); g.fill(); txt(g, '★ RARE', 32, 18, `800 8.5px ${EN}`, '#fff', 'center', 'middle');
      txt(g, 'No.241', 12, CHd - 12, `700 9px ${MONO}`, 'rgba(255,255,255,.85)');
      txt(g, 'STARLING', CWd - 12, CHd - 12, `800 11px ${EN}`, '#fff', 'right', 'alphabetic', '1.5px');
      // 光の反射（カーソルの側に白い光）
      const gx = CWd / 2 + nx * 70, gy = CHd / 2 + ny * 40;
      const gl = g.createRadialGradient(gx, gy, 2, gx, gy, 90); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.globalCompositeOperation = 'screen'; g.fillStyle = gl; g.fillRect(0, 0, CWd, CHd); g.globalCompositeOperation = 'source-over';
      g.restore(); g.restore();
      // 影
      k.save(); k.fillStyle = 'rgba(30,30,33,.16)'; k.filter = 'none';
      k.beginPath(); k.ellipse(255 - nx * 14, 160, 78, 6, 0, 0, 7); k.fill(); k.restore();
      // 傾けて描く（奥へ倒れた側が少し細くなる、簡易の遠近）
      k.save(); k.translate(255, 84);
      k.transform(Math.cos(ry), Math.sin(ry) * 0.16, -Math.sin(rx) * 0.16, Math.cos(rx), 0, 0);
      k.drawImage(c, -CWd / 2, -CHd / 2, CWd, CHd);
      k.strokeStyle = 'rgba(255,255,255,.45)'; k.lineWidth = 1; rr(k, -CWd / 2 + 0.5, -CHd / 2 + 0.5, CWd - 1, CHd - 1, 10); k.stroke();
      k.restore();
      cursor(k, cx, cy, 0, C.ink);
    });
  };

  // @element 11
  // 11 イメージトレイル（カーソルを動かすと、通った所に写真が次々に置かれ、古い物から縮んで消えていく）
  CELLS[10] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const pos = t => [255 + 185 * Math.sin(W1 * t), 88 + 46 * Math.sin(2 * W1 * t + 0.6)];   // カーソルの通り道（8の字）
    const DT = CYC / 40, LIFE = 0.85;                                     // 0.1175秒ごとに1枚、0.85秒で消える
    view(k, () => {
      k.fillStyle = C.blueBg; k.fillRect(0, 0, VW, VH);
      txt(k, 'PORTFOLIO', VW / 2, 98, `900 54px ${EN}`, rgba(C.ink, 0.92), 'center', 'alphabetic', '4px');
      txt(k, 'Photo / Art / Motion — 2026', VW / 2, 124, `600 11px ${EN}`, C.sub, 'center');
      const n0 = Math.floor(u / DT);
      for (let j = Math.ceil(LIFE / DT); j >= 0; j--) {
        const n = n0 - j, t0 = n * DT, age = u - t0;
        if (age < 0 || age > LIFE) continue;
        const [x, y] = pos(t0), q = age / LIFE;
        const s = (q < 0.12 ? eBack(q / 0.12) : 1) * (1 - eIn(clamp((q - 0.55) / 0.45)));
        const m = mod(n, 40), rot = (mod(m * 37, 11) - 5) * 0.025;     // 1周で40枚。番号は40で回す（継ぎ目なし）
        k.save(); k.translate(x, y); k.rotate(rot); k.scale(s, s);
        k.shadowColor = 'rgba(30,30,33,.25)'; k.shadowBlur = 8; k.shadowOffsetY = 3;
        k.fillStyle = '#fff'; k.fillRect(-29, -36, 58, 72); k.shadowColor = 'transparent';
        art(k, -25, -32, 50, 64, mod(m, 6), 2);
        k.restore();
      }
      const [cx, cy] = pos(u); cursor(k, cx, cy);
    });
  };

  // @element 12
  // 12 流体シミュレーション（カーソルの通った所から色の煙が湧き、渦を巻いて広がりながら薄れていく）
  CELLS[11] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const pos = t => [255 + 170 * Math.sin(W1 * t), 86 + 48 * Math.sin(2 * W1 * t)];   // カーソル（8の字）
    const DT = CYC / 40, LIFE = 1.4;
    const COL = [C.blue, C.blueM, C.blue, C.blueL, C.blueM].map(hex);
    // 生きている煙の粒（0.1175秒ごとに1つ、1.4秒で消える）
    const B = [];
    for (let n = Math.floor(u / DT) - Math.ceil(LIFE / DT); n <= Math.floor(u / DT); n++) {
      const t0 = n * DT, age = u - t0; if (age < 0 || age > LIFE) continue;
      const m = mod(n, 40), [x, y] = pos(t0), a = m * 0.9 + age * 2.4;
      const r = 12 + 30 * age, wgt = Math.exp(-age * 2.1) * clamp(age / 0.1);
      B.push([x + Math.cos(a) * 26 * age, y + Math.sin(a) * 26 * age - 10 * age, r, wgt, COL[mod(m, 5)]]);
    }
    view(k, () => {
      const NX = 128, NY = 43, sx = VW / NX, sy = VH / NY, ph = W1 * u;
      const bg = hex(C.blueBg);
      field(k, 'fluid', 0, 0, VW, VH, NX, NY, (i, j) => {
        let px = (i + 0.5) * sx, py = (j + 0.5) * sy;
        // うずの歪み（流れて見えるように座標をずらす）
        px += 7 * Math.sin(py * 0.07 + ph * 2); py += 6 * Math.cos(px * 0.05 - ph);
        let r = 0, g = 0, b = 0, sw = 0;
        for (const [bx, by, br, bw, c] of B) {
          const dx = px - bx, dy = py - by, e = bw * Math.exp(-(dx * dx + dy * dy) / (br * br));
          if (e < 0.003) continue; r += c[0] * e; g += c[1] * e; b += c[2] * e; sw += e;
        }
        if (sw <= 0) return `rgb(${bg[0]},${bg[1]},${bg[2]})`;
        const q = Math.min(1, sw * 1.6);                                  // 煙の濃さ。煙の色は重なった粒の色の平均
        return `rgb(${lerp(bg[0], r / sw, q) | 0},${lerp(bg[1], g / sw, q) | 0},${lerp(bg[2], b / sw, q) | 0})`;
      });
      txt(k, 'Touch the color.', 30, 150, `800 15px ${EN}`, C.ink);
      const [cx, cy] = pos(u); cursor(k, cx, cy, 0, C.ink);
    });
  };

  // @element 13
  // 13 スクラッチカード（カードの表面の膜をコインでこすった所だけ削れて、下の当たりが見えてくる。ある程度削ると膜がすっと消える）
  CELLS[12] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const X = 150, Y = 30, CWd = 211, CHd = 106;
    const tri = x => 1 - Math.abs(mod(x, 2) - 1);                        // 0→1→0 の三角波
    const coin = t => [X + 24 + (CWd - 48) * tri((t - 0.45) / 0.42), Y + 20 + (CHd - 40) * clamp((t - 0.45) / 2.0)];
    view(k, () => {
      k.fillStyle = C.blueBg; k.fillRect(0, 0, VW, VH);
      txt(k, 'LUCKY DRAW', VW / 2, 20, `800 10px ${EN}`, C.blue, 'center', 'middle', '3px');
      // 下の当たり
      const pop = eBack(clamp((u - 2.6) / 0.35)) * (u < 4.1 ? 1 : 1);
      k.save(); k.shadowColor = 'rgba(30,30,33,.18)'; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = '#FFFFFF'; rr(k, X, Y, CWd, CHd, 12); k.fill(); k.restore();
      const R = rng(13);
      for (let i = 0; i < 26; i++) { k.fillStyle = PAL[i % 5]; const x = X + 8 + R() * (CWd - 16), y = Y + 8 + R() * (CHd - 16); k.save(); k.translate(x, y); k.rotate(R() * 3); k.fillRect(-3, -1.5, 6, 3); k.restore(); }
      k.save(); k.translate(X + CWd / 2, Y + CHd / 2); const ps = 1 + 0.08 * Math.sin(Math.PI * clamp((u - 2.6) / 0.35)); k.scale(ps, ps);
      txt(k, '当たり！', 0, -14, `900 20px ${JP}`, C.ink, 'center', 'middle');
      txt(k, '30% OFF', 0, 16, `900 26px ${EN}`, C.blue, 'center', 'middle', '1px'); k.restore();
      // 表面の膜（画面外に描き、こすった跡を消す）
      const fadeOut = clamp((u - 2.55) / 0.35), fadeIn = clamp((u - 4.1) / 0.45);
      const showFresh = u >= 4.1;
      const alpha = showFresh ? fadeIn : 1 - fadeOut;
      if (alpha > 0) {
        const [c, g] = layer(k, 'scratch', CWd, CHd);
        const fg = g.createLinearGradient(0, 0, CWd, CHd); fg.addColorStop(0, C.blueM); fg.addColorStop(0.5, C.blueL); fg.addColorStop(1, C.blueM); g.fillStyle = fg; rr(g, 0, 0, CWd, CHd, 12); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 6; for (let i = -CHd; i < CWd; i += 16) { g.beginPath(); g.moveTo(i, CHd); g.lineTo(i + CHd, 0); g.stroke(); }
        txt(g, 'ここをこすってね', CWd / 2, CHd / 2 + 1, `800 14px ${JP}`, '#fff', 'center', 'middle', '1px');
        if (!showFresh && u > 0.45) {
          g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = 24; g.lineCap = 'round'; g.lineJoin = 'round';
          g.beginPath(); const t1 = Math.min(u, 2.45);
          for (let t = 0.45; t <= t1 + 1e-9; t += 1 / 60) { const [x, y] = coin(Math.min(t, t1)); t === 0.45 ? g.moveTo(x - X, y - Y) : g.lineTo(x - X, y - Y); }
          const [ex, ey] = coin(t1); g.lineTo(ex - X, ey - Y); g.stroke(); g.globalCompositeOperation = 'source-over';
        }
        g.restore();
        k.globalAlpha = alpha; k.drawImage(c, X, Y, CWd, CHd); k.globalAlpha = 1;
      }
      // コイン（こすっている間だけカードの上。それ以外は右下で待つ）
      const on = u > 0.45 && u < 2.45;
      const [qx, qy] = on ? coin(u) : u <= 0.45 ? [lerp(420, coin(0.45)[0], eIO(P(u, 0.05, 0.45))), lerp(140, coin(0.45)[1], eIO(P(u, 0.05, 0.45)))] : [lerp(coin(2.45)[0], 420, eIO(P(u, 2.45, 2.9))), lerp(coin(2.45)[1], 140, eIO(P(u, 2.45, 2.9)))];
      k.save(); k.shadowColor = 'rgba(30,30,33,.3)'; k.shadowBlur = 6; k.shadowOffsetY = 2;
      k.fillStyle = '#FFFFFF'; k.beginPath(); k.arc(qx, qy, 13, 0, 7); k.fill(); k.restore();
      k.strokeStyle = C.blue; k.lineWidth = 2; k.beginPath(); k.arc(qx, qy, 9.5, 0, 7); k.stroke();
      txt(k, '★', qx, qy + 0.5, `700 10px ${EN}`, C.blue, 'center', 'middle');
    });
  };

  // @element 14
  // 14 スワイプカード（いちばん上のカードをつかんで右へ払うと「いいね」、左へ払うと「パス」。カードは傾きながら飛んでいき、下のカードが前に出る）
  CELLS[13] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const CARDS = [['レモンのタルト', '★ 4.8 ・ 保存 1,204', 3], ['ミントのモヒート', '★ 4.6 ・ 保存 862', 2]];   // 交互に出てくる2枚（おすすめのレシピ）
    // 1枚目: 0.3〜1.1 右へ引く → 1.1〜1.45 飛ぶ。2枚目: 2.4〜3.2 左へ引く → 3.2〜3.55 飛ぶ
    const sw = (t0) => { const d = 90 * eIO(P(u, t0, t0 + 0.8)), f = eIn(P(u, t0 + 0.8, t0 + 1.15)); return d + f * 320; };
    const out1 = sw(0.3), out2 = -sw(2.4);
    const up1 = eOut(P(u, 1.1, 1.5)), up2 = eOut(P(u, 3.2, 3.6));       // 下のカードが前に出る
    view(k, () => {
      k.fillStyle = C.blueXL; k.fillRect(0, 0, VW, VH);
      txt(k, 'TODAY\'S RECIPES', 26, 30, `800 10px ${EN}`, C.blue, 'left', 'middle', '2px');
      txt(k, '← パス', 70, 150, `700 11px ${JP}`, rgba(C.sub, 0.45 + 0.55 * clamp(-out2 / 90)), 'center', 'middle');
      txt(k, 'いいね →', 440, 150, `700 11px ${JP}`, rgba(C.blue, 0.45 + 0.55 * clamp(out1 / 90) * (u < 2 ? 1 : 0)), 'center', 'middle');
      const card = (idx, dx, depth, stamp, al = 1) => {
        if (al <= 0) return;
        const [ttl, sub, v] = CARDS[idx], s = 1 - depth * 0.06, dy = depth * 9;
        k.save(); k.globalAlpha = al; k.translate(255 + dx, 86 + dy); k.rotate(dx * 0.0016); k.scale(s, s);
        k.shadowColor = 'rgba(30,30,33,.18)'; k.shadowBlur = 12; k.shadowOffsetY = 4; k.fillStyle = '#fff'; rr(k, -78, -72, 156, 144, 14); k.fill(); k.shadowColor = 'transparent';
        art(k, -70, -64, 140, 86, v, 9);
        txt(k, ttl, -68, 40, `800 12.5px ${JP}`, C.ink); txt(k, sub, -68, 58, `500 10px ${JP}`, C.sub);
        if (stamp) { const [lb, col, a] = stamp; if (a > 0) { k.save(); k.globalAlpha = a; k.rotate(lb === 'LIKE' ? -0.25 : 0.25); k.fillStyle = 'rgba(255,255,255,.92)'; rr(k, -36, -44, 72, 28, 6); k.fill(); k.strokeStyle = col; k.lineWidth = 3; k.stroke(); txt(k, lb, 0, -29.5, `900 15px ${EN}`, col, 'center', 'middle', '2px'); k.restore(); } }
        k.restore();
      };
      // 奥から: 3枚目・2枚目・いちばん上
      if (u < 2.0) {
        card(1, 0, 3 - up1, null, up1); card(0, 0, 2 - up1, null); card(1, 0, 1 - up1, null);
        card(0, out1, 0, ['LIKE', C.blue, clamp(out1 / 60)]);
      } else {
        card(0, 0, 3 - up2, null, up2); card(1, 0, 2 - up2, null); card(0, 0, 1 - up2, null);
        card(1, out2, 0, ['NOPE', C.sub, clamp(-out2 / 60)]);
      }
      // つかむ印
      const on1 = u > 0.3 && u < 1.1, on2 = u > 2.4 && u < 3.2;
      const gx = 270 + (on1 ? out1 : on2 ? out2 : u < 2.4 && u >= 1.1 ? lerp(90, 0, eIO(P(u, 1.1, 1.7))) : u >= 3.2 ? lerp(-90, 0, eIO(P(u, 3.2, 3.8))) : 0);
      grabber(k, gx, 110, on1 || on2);
    });
  };

  // @element 15
  // 15 パタパタ表示（駅の発車標のように、1文字ずつの板が上下に割れてめくれ、何枚か途中の文字を経て次の文字に止まる。左から少しずつずれて始まる）
  CELLS[14] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const WORDS = ['TOKYO 09:30', 'PARIS 11:05', 'SEOUL 13:40'];
    const START = [0.5, 2.0, 3.5];                                        // 0→1, 1→2, 2→0 の切り替え開始
    const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:';
    const FL = 0.09, STAG = 0.045;                                        // 1回めくるのに0.09秒、1文字ごとに0.045秒ずつ遅れる
    // 文字 i の、時刻 u での [今の文字, 次の文字, めくれ具合 0〜1]
    const state = i => {
      let seg = 2; for (let s = 0; s < 3; s++) if (u >= START[s] + i * STAG) seg = s;
      if (u < START[0] + i * STAG) seg = 2;
      const from = WORDS[seg][i], to = WORDS[(seg + 1) % 3][i];
      const t = u - START[seg] - i * STAG + (u < START[0] + i * STAG ? CYC : 0);
      if (from === to) return [to, to, 0];
      const nf = 3 + mod(i * 5 + seg, 3);                                // 途中の文字を含めて3〜5回めくる
      const seq = [from]; for (let j = 1; j < nf; j++) seq.push(CH[mod(CH.indexOf(from) + j * 7 + i, CH.length)]); seq.push(to);
      const step = Math.floor(t / FL);
      if (step >= nf) return [to, to, 0];
      return [seq[step], seq[step + 1], (t - step * FL) / FL];
    };
    view(k, () => {
      k.fillStyle = C.blueBg; k.fillRect(0, 0, VW, VH);
      k.fillStyle = C.ink; rr(k, 24, 30, 463, 110, 14); k.fill();
      txt(k, 'DEPARTURES', 44, 52, `800 10px ${EN}`, C.blue, 'left', 'middle', '3px');
      txt(k, '出発', 467, 52, `800 11px ${JP}`, 'rgba(255,255,255,.7)', 'right', 'middle');
      const N = 11, FW = 34, FH = 54, G = 4, x0 = (VW - (N * FW + (N - 1) * G)) / 2, y0 = 66, mid = y0 + FH / 2;
      const glyph = (c, x, i) => txt(k, c, x + FW / 2, mid + 1.5, `800 30px ${MONO}`, i >= 6 ? C.blueL : '#fff', 'center', 'middle');
      const half = (c, x, i, top, sy = 1) => {       // 上半分 or 下半分（sy で真ん中を軸に縮める）
        k.save(); k.beginPath(); k.rect(x, top ? y0 : mid, FW, FH / 2); k.clip();
        k.translate(0, mid); k.scale(1, sy); k.translate(0, -mid);
        k.fillStyle = C.mark; rr(k, x, y0, FW, FH, 5); k.fill(); glyph(c, x, i);
        if (sy < 1) { k.fillStyle = `rgba(0,0,0,${0.35 * (1 - sy)})`; k.fillRect(x, y0, FW, FH); }
        k.restore();
      };
      for (let i = 0; i < N; i++) {
        const x = x0 + i * (FW + G), [a, b, f] = state(i);
        if (f <= 0) { half(a, x, i, true); half(a, x, i, false); }
        else {
          half(b, x, i, true); half(a, x, i, false);                     // うしろ: 上は次の字、下は今の字
          if (f < 0.5) half(a, x, i, true, 1 - f * 2);                   // 今の字の上半分が倒れてくる
          else half(b, x, i, false, f * 2 - 1);                          // 次の字の下半分が下りてくる
        }
        k.fillStyle = C.ink; k.fillRect(x, mid - 0.75, FW, 1.5);
      }
      bars(k, 44, 128, 120, 1, 'rgba(255,255,255,.18)', 4);
    });
  };

  // @element 16
  // 16 FLIPアニメーション（絞り込みのボタンを押すと、外れたカードが縮んで消え、残ったカードが元の場所から新しい場所へ滑って並び直す）
  CELLS[15] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 1);
    const TYPE = [0, 1, 0, 1, 1, 0, 0, 1], V = [1, 0, 4, 2, 3, 1, 4, 5];   // 0＝写真（山の絵）、1＝イラスト（丸・しま）
    const slot = n => [24 + (n % 4) * 118, 44 + Math.floor(n / 4) * 62];
    const after = []; let c = 0; TYPE.forEach((t, i) => { after[i] = t === 0 ? c++ : -1; });
    // 写真で絞る: 0.6 押す → 0.6〜0.85 イラストが消える → 0.75〜1.4 写真が滑る。すべてに戻す: 2.6 押す → 2.6〜3.2 戻る → 3.0〜3.35 イラストが出る
    const mv = eIO(P(u, 0.75, 1.4)) * (1 - eIO(P(u, 2.6, 3.2)));
    const gone = eOut(P(u, 0.6, 0.85)) * (1 - eOut(P(u, 3.0, 3.35)));
    const [cx, cy] = path([[0, 430, 140], [0.45, 130, 26], [1.4, 130, 26], [2.0, 320, 150], [2.45, 62, 26], [3.4, 62, 26], [4.4, 430, 140]], u);
    const press = Math.max(clamp(1 - Math.abs(u - 0.6) / 0.08), clamp(1 - Math.abs(u - 2.6) / 0.08));
    const sel = u >= 0.6 && u < 2.6 ? 1 : 0;
    view(k, () => {
      k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH);
      ['すべて', '写真', 'イラスト'].forEach((s, i) => {
        const x = 24 + i * 72, on = i === (sel ? 1 : 0);
        k.fillStyle = on ? C.ink : C.soft; rr(k, x, 12, 64, 22, 11); k.fill();
        txt(k, s, x + 32, 23.5, `700 10.5px ${JP}`, on ? '#fff' : C.ink, 'center', 'middle');
      });
      txt(k, `${sel ? 4 : 8} 件`, 487, 23.5, `600 10px ${JP}`, C.sub, 'right', 'middle');
      for (let i = 0; i < 8; i++) {
        const [x0, y0] = slot(i);
        if (TYPE[i] === 1) {
          if (gone >= 1) continue;
          const s = 1 - 0.25 * gone; k.save(); k.globalAlpha = 1 - gone; k.translate(x0 + 53, y0 + 26); k.scale(s, s); art(k, -53, -26, 106, 52, V[i], 7); k.restore();
          continue;
        }
        const [x1, y1] = slot(after[i]), x = lerp(x0, x1, mv), y = lerp(y0, y1, mv);
        // First（元の場所）の点線の枠: 動いている間だけ
        if (mv > 0.02 && mv < 0.98 && (x0 !== x1 || y0 !== y1)) { k.save(); k.setLineDash([4, 4]); k.strokeStyle = rgba(C.blue, 0.45); k.lineWidth = 1.2; rr(k, x0 + 0.5, y0 + 0.5, 105, 51, 7); k.stroke(); k.restore(); }
        k.save(); k.shadowColor = 'rgba(30,30,33,.16)'; k.shadowBlur = 8; k.shadowOffsetY = 3; art(k, x, y, 106, 52, V[i], 7); k.restore();
      }
      cursor(k, cx, cy, press);
    });
  };

  // @element 17
  // 17 リキッドグラス（カラフルな見出しの上を、ガラスのレンズのような丸いバーが動き、下の絵と文字をふくらませて曲げる）
  CELLS[16] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    view(k, () => {
      // 背景（レンズで曲げるので、見出しまで画面外の1枚に描いておく）
      const [bgc, g, sc] = layer(k, 'lg-bg', VW, VH);
      const base = g.createLinearGradient(0, 0, VW, VH); base.addColorStop(0, C.blue); base.addColorStop(1, C.blueM); g.fillStyle = base; g.fillRect(0, 0, VW, VH);
      g.filter = `blur(${22 * sc}px)`;
      [[C.blueL, 110 + 40 * Math.sin(W1 * u), 40 + 14 * Math.cos(W1 * u), 62], ['#FFFFFF', 400 + 30 * Math.cos(W1 * u), 140, 70], [C.blueXL, 280, 10 + 12 * Math.sin(2 * W1 * u), 54]]
        .forEach(([col, x, y, r]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
      g.filter = 'none';
      txt(g, 'LIGHT', 30, 74, `900 46px ${EN}`, '#fff', 'left', 'alphabetic', '2px');
      txt(g, 'IN MOTION', 30, 112, `900 34px ${EN}`, 'rgba(255,255,255,.92)', 'left', 'alphabetic', '2px');
      g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 2; i++) { rr(g, 32, 128 + i * 11, i ? 120 : 190, 5, 2.5); g.fill(); }
      g.fillStyle = '#fff'; rr(g, 380, 22, 100, 26, 13); g.fill(); txt(g, 'JOIN NOW', 430, 35.5, `800 11px ${EN}`, C.blue, 'center', 'middle', '1px');
      g.restore();
      k.drawImage(bgc, 0, 0, VW, VH);
      // レンズ（丸いバー）の位置: 左右に往復し、少し上下する
      const LW = 176, LH = 58, lx = 255 + 140 * Math.sin(W1 * u) - LW / 2, ly = 64 + 16 * Math.sin(2 * W1 * u) - LH / 2;
      const ccx = lx + LW / 2, ccy = ly + LH / 2;
      const lens = (inset, z) => { k.save(); rr(k, lx + inset, ly + inset, LW - inset * 2, LH - inset * 2, LH / 2 - inset); k.clip();
        k.translate(ccx, ccy); k.scale(z, z); k.translate(-ccx, -ccy); k.drawImage(bgc, 0, 0, VW, VH); k.restore(); };
      k.save(); k.shadowColor = 'rgba(30,30,33,.35)'; k.shadowBlur = 18; k.shadowOffsetY = 6; k.fillStyle = 'rgba(255,255,255,.01)'; rr(k, lx, ly, LW, LH, LH / 2); k.fill(); k.restore();
      // ふちほど強く曲げる: 外側の輪は大きく拡大、内側はやや拡大
      lens(0, 1.7); lens(7, 1.38); lens(13, 1.22);
      // 白いうすい膜と、上のふちの光、下のふちの色のにじみ
      k.fillStyle = 'rgba(255,255,255,.10)'; rr(k, lx, ly, LW, LH, LH / 2); k.fill();
      const hl = k.createLinearGradient(0, ly, 0, ly + LH); hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(0.35, 'rgba(255,255,255,0)'); hl.addColorStop(0.8, 'rgba(255,255,255,0)'); hl.addColorStop(1, 'rgba(255,255,255,.6)');
      k.strokeStyle = hl; k.lineWidth = 2; rr(k, lx + 1, ly + 1, LW - 2, LH - 2, LH / 2 - 1); k.stroke();
      k.strokeStyle = rgba(C.blueM, 0.5); k.lineWidth = 1; rr(k, lx + 3, ly + 3.5, LW - 6, LH - 6, LH / 2 - 3); k.stroke();
      // バーの中のアイコン3つ（ナビの形）
      for (let i = 0; i < 3; i++) { k.fillStyle = i === 1 ? '#fff' : 'rgba(255,255,255,.7)'; k.beginPath(); k.arc(ccx + (i - 1) * 46, ccy, i === 1 ? 8 : 6, 0, 7); k.fill(); }
    });
  };

  // @element 18
  // 18 フルーテッドガラス（縦の溝が並んだガラスの板の向こうで、色と文字がにじみ、溝ごとに細く縮んで並ぶ。板はゆっくり左右に動く）
  CELLS[17] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    view(k, () => {
      const blobs = g => {
        const base = g.createLinearGradient(0, 0, VW, VH); base.addColorStop(0, C.blue); base.addColorStop(1, C.blueM); g.fillStyle = base; g.fillRect(0, 0, VW, VH);
        [['#FFFFFF', 330 + 70 * Math.sin(W1 * u), 70 + 30 * Math.cos(W1 * u), 52], [C.blueL, 420 + 40 * Math.cos(W1 * u + 1), 130, 40], [C.blueXL, 250, 20 + 20 * Math.sin(2 * W1 * u), 34]]
          .forEach(([col, x, y, r]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.beginPath(); g.arc(400 - 30 * Math.sin(W1 * u), 88, 46, 0, 7); g.stroke();
        txt(g, 'SOFT', 32, 80, `900 50px ${EN}`, '#fff', 'left', 'alphabetic', '3px');
        txt(g, 'FOCUS', 32, 128, `900 50px ${EN}`, C.blueXL, 'left', 'alphabetic', '3px');
      };
      const [bc, bg] = layer(k, 'fl-bg', VW, VH); blobs(bg); bg.restore();
      const [cc, cg, s] = layer(k, 'fl-blur', VW, VH); cg.filter = `blur(${2.5 * s}px)`; blobs(cg); cg.filter = 'none'; cg.restore();
      k.drawImage(bc, 0, 0, VW, VH);
      // ガラスの板: 左の端が 150〜250 を往復。溝 1本 16px は、うしろの 40px ぶんを左右反転して縮めて映す
      const PX = 200 + 50 * Math.sin(W1 * u), RW = 16;
      for (let x = PX; x < VW; x += RW) {
        const src = clamp(x - RW * 0.75, 0, VW - RW * 2.5);
        k.save(); k.translate(x + RW, 0); k.scale(-1, 1); k.drawImage(cc, src * s, 0, RW * 2.5 * s, VH * s, 0, 0, RW, VH); k.restore();
        const sh = k.createLinearGradient(x, 0, x + RW, 0);
        sh.addColorStop(0, 'rgba(255,255,255,.34)'); sh.addColorStop(0.25, 'rgba(255,255,255,.06)'); sh.addColorStop(0.7, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(30,30,33,.18)');
        k.fillStyle = sh; k.fillRect(x, 0, RW, VH);
      }
      k.fillStyle = 'rgba(255,255,255,.08)'; k.fillRect(PX, 0, VW - PX, VH);
      k.fillStyle = 'rgba(255,255,255,.7)'; k.fillRect(PX, 0, 1.5, VH);
    });
  };

  // @element 19
  // 19 リキッドメタル（見出しの文字と球の中を、溶けた金属のような映り込みがうねりながら流れ続ける）
  CELLS[18] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    // 金属の色の並び（黒→青→薄い青→白→中間の青→白→ごく薄い青→青→黒）
    const RAMP = [C.ink, C.blue, C.blueL, '#FFFFFF', C.blueM, '#FFFFFF', C.blueXL, C.blue, C.ink].map(hex);
    const ramp = t => { t = mod(t, 1) * (RAMP.length - 1); const i = Math.floor(t), f = t - i, a = RAMP[i], b = RAMP[Math.min(i + 1, RAMP.length - 1)];
      return `rgb(${lerp(a[0], b[0], f) | 0},${lerp(a[1], b[1], f) | 0},${lerp(a[2], b[2], f) | 0})`; };
    view(k, () => {
      const bg = k.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, C.desk); k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      const ph = W1 * u;
      const [c, g] = layer(k, 'metal', VW, VH);
      field(g, 'metal-f', 0, 0, VW, VH, 128, 43, (i, j) => {
        const x = i * 4, y = j * 4;
        const v = Math.sin(x * 0.03 + 2.3 * Math.sin(y * 0.045 + ph) + ph) + 0.55 * Math.sin(y * 0.08 - x * 0.018 + 2 * ph) + 0.3 * Math.sin((x + y) * 0.05 - ph);
        return ramp(v * 0.22 + y * 0.002);
      });
      // 形だけ残す（文字と球を1枚の型にまとめてから切り抜く）
      const [mc, mg] = layer(k, 'metal-m', VW, VH);
      txt(mg, 'FLOW', 30, 112, `900 84px ${EN}`, '#000', 'left', 'alphabetic', '2px');
      mg.beginPath(); mg.arc(414, 80, 52, 0, 7); mg.fill(); mg.restore();
      g.globalCompositeOperation = 'destination-in'; g.drawImage(mc, 0, 0, VW, VH);
      g.globalCompositeOperation = 'source-over';
      // 球の立体感
      const sg = g.createRadialGradient(396, 60, 6, 414, 80, 56); sg.addColorStop(0, 'rgba(255,255,255,.55)'); sg.addColorStop(0.55, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(30,30,33,.55)');
      g.fillStyle = sg; g.beginPath(); g.arc(414, 80, 52, 0, 7); g.fill();
      g.restore();
      k.save(); k.shadowColor = rgba(C.blue, 0.25); k.shadowBlur = 14; k.drawImage(c, 0, 0, VW, VH); k.restore();
      txt(k, 'Liquid metal type & objects', 32, 140, `600 11px ${EN}`, C.sub);
      k.fillStyle = 'rgba(30,30,33,.08)'; k.beginPath(); k.ellipse(414, 150, 46, 6, 0, 0, 7); k.fill();
    });
  };

  // @element 20
  // 20 コースティクス（水の底に、波で集まった光の網目がゆらめき続ける。プールの見出しと浮き輪が上に乗る）
  CELLS[19] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    const ph = W1 * u;
    const A = hex(C.blue), B = hex(C.blueM), L = hex('#FFFFFF');
    view(k, () => {
      // 光の網目（自前の式）: 向きと細かさの違う3つの波 w = sin(f·(向きの座標) + m·a + 1.6·sin(0.6f·(直角の座標) + n·a)) を足し、
      // 和が0に近い所ほど明るくする（明るさ = (1 − |和| / 1.6)^6）。a = 2πt/4.7、m・n は整数なので4.7秒で元に戻る
      const WV = [[0.35, 0.050, 1, -1], [2.45, 0.043, -1, 2], [4.15, 0.057, 2, 1]].map(([th, f, m, n]) => [Math.cos(th), Math.sin(th), f, m, n]);
      const NX = 128, NY = 43;
      field(k, 'caustic', 0, 0, VW, VH, NX, NY, (i, j) => {
        const px = (i + 0.5) * VW / NX, py = (j + 0.5) * VH / NY;
        let sum = 0;
        for (const [c, s2, f, m, n] of WV) { const u1 = px * c + py * s2, u2 = -px * s2 + py * c; sum += Math.sin(f * u1 + m * ph + 1.6 * Math.sin(0.6 * f * u2 + n * ph)); }
        const v = Math.pow(clamp(1 - Math.abs(sum) / 1.6), 6);
        const d = j / NY;
        const r = lerp(A[0], B[0], d), g = lerp(A[1], B[1], d), bb = lerp(A[2], B[2], d);
        return `rgb(${lerp(r, L[0], v) | 0},${lerp(g, L[1], v) | 0},${lerp(bb, L[2], v) | 0})`;
      });
      // 浮き輪（影は水の底に落ちる）
      const fx = 400 + 10 * Math.sin(W1 * u), fy = 70 + 5 * Math.sin(2 * W1 * u);
      k.fillStyle = 'rgba(30,30,33,.18)'; k.beginPath(); k.ellipse(fx + 18, fy + 44, 44, 16, 0, 0, 7); k.fill();
      k.save(); k.translate(fx, fy); k.rotate(0.15 * Math.sin(W1 * u));
      for (let i = 0; i < 8; i++) { k.fillStyle = i % 2 ? '#fff' : C.blue; k.beginPath(); k.arc(0, 0, 38, i * Math.PI / 4, (i + 1) * Math.PI / 4); k.arc(0, 0, 18, (i + 1) * Math.PI / 4, i * Math.PI / 4, true); k.fill(); }
      k.fillStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.ellipse(-14, -22, 12, 5, -0.6, 0, 7); k.fill();
      k.restore();
      k.save(); k.shadowColor = 'rgba(30,30,33,.3)'; k.shadowBlur = 8;
      txt(k, 'POOL DAYS', 30, 58, `800 11px ${EN}`, 'rgba(255,255,255,.9)', 'left', 'alphabetic', '3px');
      txt(k, '夏の、水の底で。', 28, 96, `900 28px ${JP}`, '#fff'); k.restore();
      k.fillStyle = '#fff'; rr(k, 30, 116, 96, 26, 13); k.fill(); txt(k, '予約する', 78, 129.5, `800 11px ${JP}`, C.blue, 'center', 'middle');
    });
  };

  // @element 21
  // 21 木漏れ日（壁に差す光の中で、葉の影がぼけたままゆっくり揺れる。光の当たる所だけ少し明るく暖かい）
  CELLS[20] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    view(k, () => {
      const wall = k.createLinearGradient(0, 0, VW, VH); wall.addColorStop(0, C.desk); wall.addColorStop(1, C.blueBg); k.fillStyle = wall; k.fillRect(0, 0, VW, VH);
      // 窓から差す光（斜めの明るい帯）
      k.save(); k.globalCompositeOperation = 'screen';
      const lg = k.createLinearGradient(150, 0, 420, VH); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.35, 'rgba(255,255,255,.95)'); lg.addColorStop(0.75, 'rgba(255,255,255,.7)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = lg; k.beginPath(); k.moveTo(170, 0); k.lineTo(470, 0); k.lineTo(380, VH); k.lineTo(60, VH); k.fill(); k.restore();
      // 葉の影（画面外に描いてぼかし、青で重ねる）
      const [c, g, s] = layer(k, 'leaf', VW, VH);
      g.filter = `blur(${4.5 * s}px)`; g.fillStyle = C.blue; g.strokeStyle = C.blue;
      const BR = [[520, -20, 2.55, 6, 0], [470, 190, 3.55, 5, 1.7], [-20, -10, 0.75, 5, 3.1]];
      for (const [bx, by, ang0, n, o] of BR) {
        const ang = ang0 + 0.06 * Math.sin(W1 * u + o);
        g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ang) * 230, by + Math.sin(ang) * 230); g.stroke();
        for (let i = 0; i < n * 2; i++) {
          const d = 40 + i * 18, side = i % 2 ? 1 : -1;
          const lx = bx + Math.cos(ang) * d + Math.cos(ang + side * 1.2) * 16, ly = by + Math.sin(ang) * d + Math.sin(ang + side * 1.2) * 16;
          const rot = ang + side * 0.9 + 0.22 * Math.sin(2 * W1 * u + i * 1.3 + o);
          g.beginPath(); g.ellipse(lx, ly, 17, 7, rot, 0, 7); g.fill();
        }
      }
      g.filter = 'none'; g.restore();
      k.save(); k.globalAlpha = 0.3; k.drawImage(c, 0, 0, VW, VH); k.restore();
      // ページの中身
      txt(k, 'MORNING CERAMICS', 30, 50, `800 10px ${EN}`, C.blue, 'left', 'alphabetic', '3px');
      txt(k, 'ひだまりの器', 28, 86, `900 26px ${JP}`, C.ink);
      bars(k, 30, 100, 160, 2, 'rgba(30,30,33,.15)');
      k.fillStyle = C.ink; rr(k, 30, 126, 92, 26, 13); k.fill(); txt(k, 'SHOP', 76, 139.5, `800 11px ${EN}`, '#fff', 'center', 'middle', '2px');
      // 花びん
      k.fillStyle = 'rgba(30,30,33,.12)'; k.beginPath(); k.ellipse(330, 156, 40, 7, 0, 0, 7); k.fill();
      k.fillStyle = C.blueM; k.beginPath(); k.moveTo(312, 70); k.bezierCurveTo(292, 110, 296, 156, 330, 156); k.bezierCurveTo(364, 156, 368, 110, 348, 70); k.closePath(); k.fill();
      k.fillStyle = 'rgba(255,255,255,.35)'; k.beginPath(); k.ellipse(316, 112, 5, 22, 0.1, 0, 7); k.fill();
      k.strokeStyle = C.blue; k.lineWidth = 2; k.beginPath(); k.moveTo(330, 72); k.quadraticCurveTo(338, 40, 352, 26); k.moveTo(326, 72); k.quadraticCurveTo(314, 46, 300, 36); k.stroke();
      k.fillStyle = C.blue; k.beginPath(); k.arc(352, 26, 6, 0, 7); k.arc(300, 36, 5, 0, 7); k.fill();
    });
  };

  // @element 22
  // 22 トポグラフィック（山の高さを等高線で描いた模様が、地形ごとゆっくりうねって形を変え続ける）
  CELLS[21] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    const ph = W1 * u;
    // 高さ: 動く4つの山 ＋ ゆるい波
    const HILL = [[150, 70, 70, 1.0, 0], [340, 110, 80, 0.9, 1.6], [470, 30, 60, 0.7, 3.2], [60, 150, 55, 0.6, 4.4]];
    const H = (x, y) => {
      let v = 0.12 * Math.sin(x * 0.02 + ph) * Math.cos(y * 0.03 - ph);
      for (const [hx, hy, r, a, o] of HILL) { const cx = hx + 22 * Math.cos(ph + o), cy = hy + 14 * Math.sin(ph + o); v += a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (r * r)); }
      return v;
    };
    view(k, () => {
      const bg = k.createLinearGradient(0, 0, VW, VH); bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(1, C.blueBg); k.fillStyle = bg; k.fillRect(0, 0, VW, VH);
      const G = 7, NX = Math.ceil(VW / G) + 1, NY = Math.ceil(VH / G) + 1, Z = [];
      for (let j = 0; j < NY; j++) { Z.push([]); for (let i = 0; i < NX; i++) Z[j].push(H(i * G, j * G)); }
      const LV = 11, COLS = [C.blueL, C.blueM, C.blue];
      k.lineWidth = 1.3; k.lineCap = 'round';
      for (let l = 0; l < LV; l++) {
        const iso = -0.08 + l * 0.1, cf = l / (LV - 1) * (COLS.length - 1), ci = Math.floor(cf);
        k.strokeStyle = mix(COLS[ci], COLS[Math.min(ci + 1, COLS.length - 1)], cf - ci); k.globalAlpha = 0.55 + 0.45 * (l / LV);
        k.beginPath();
        for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
          const a = Z[j][i], b = Z[j][i + 1], c = Z[j + 1][i + 1], d = Z[j + 1][i];
          const pts = [];
          const ed = (p, q, x1, y1, x2, y2) => { if ((p < iso) !== (q < iso)) { const t = (iso - p) / (q - p); pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); } };
          const x = i * G, y = j * G;
          ed(a, b, x, y, x + G, y); ed(b, c, x + G, y, x + G, y + G); ed(c, d, x + G, y + G, x, y + G); ed(d, a, x, y + G, x, y);
          for (let p = 0; p + 1 < pts.length; p += 2) { k.moveTo(pts[p][0], pts[p][1]); k.lineTo(pts[p + 1][0], pts[p + 1][1]); }
        }
        k.stroke();
      }
      k.globalAlpha = 1;
      k.save(); k.shadowColor = 'rgba(30,30,33,.12)'; k.shadowBlur = 10; k.shadowOffsetY = 3; k.fillStyle = '#FFFFFF'; rr(k, 24, 44, 196, 84, 12); k.fill(); k.restore();
      txt(k, 'GEO LAB OPEN DAY', 40, 68, `800 10px ${EN}`, C.blue, 'left', 'alphabetic', '2px');
      txt(k, '地図にない線を描く', 40, 98, `900 21px ${JP}`, C.ink);
      txt(k, '12.6 Sat ・ 研究所の公開日', 40, 116, `600 10px ${JP}`, C.sub);
    });
  };

  // @element 23
  // 23 ハーフトーン（印刷の網点のように、絵の明るさを点の大きさに置きかえて描く。下の絵が動くと点が育ったり縮んだりする）
  CELLS[22] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    const ph = W1 * u;
    // 下の絵（0〜1）: 右から昇る大きな太陽と、流れる波
    const sun = (x, y) => { const cx = 360 + 20 * Math.sin(ph), cy = 70 - 10 * Math.cos(ph); return clamp(1.15 - Math.hypot(x - cx, y - cy) / 70); };
    const wave = (x, y) => clamp((y - (118 + 12 * Math.sin(x * 0.028 - ph) + 6 * Math.sin(x * 0.06 + 2 * ph))) / 40 + 0.15);
    view(k, () => {
      k.fillStyle = C.blueBg; k.fillRect(0, 0, VW, VH);
      const S = 8;
      const screen = (fn, col, ang, ox, oy) => {
        k.save(); k.fillStyle = col;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        for (let a = -30; a < 50; a++) for (let b = -10; b < 80; b++) {
          const x = ox + (a * ca - b * sa) * S, y = oy + (a * sa + b * ca) * S;
          if (x < 180 || x > VW + 4 || y < -4 || y > VH + 4) continue;
          const fade = clamp((x - 180) / 70);
          const r = S * 0.58 * Math.sqrt(fn(x, y)) * fade;
          if (r > 0.35) { k.beginPath(); k.arc(x, y, r, 0, 7); k.fill(); }
        }
        k.restore();
      };
      k.save(); k.globalCompositeOperation = 'multiply';
      screen(sun, C.blue, 0.26, 200, -40);
      screen(wave, C.blueM, 1.31, 400, -60);
      screen((x, y) => 0.35 * sun(x, y) * wave(x + 30, y - 30), C.blue, 0.79, 300, -50);
      k.restore();
      txt(k, 'POP', 30, 82, `900 50px ${EN}`, C.ink, 'left', 'alphabetic', '3px');
      txt(k, 'PRINT', 30, 128, `900 50px ${EN}`, C.ink, 'left', 'alphabetic', '3px');
      k.fillStyle = C.blue; k.beginPath(); k.arc(186, 66, 8, 0, 7); k.fill();
    });
  };

  // @element 24
  // 24 CRTエフェクト（ブラウン管のように、横の走査線・赤緑青の細い縞・文字の色ずれとにじみ・上から下へ流れる明るい帯・四隅の暗さを重ねる）
  CELLS[23] = (k, w, h, u) => {
    u = snapU(u);
    frame(k, 2);
    const ph = W1 * u;
    view(k, () => {
      k.fillStyle = C.desk; k.fillRect(0, 0, VW, VH);
      const X = 16, Y = 12, SW = VW - 32, SH = VH - 24;
      k.save(); rr(k, X, Y, SW, SH, 24); k.clip();
      const sg = k.createRadialGradient(X + SW / 2, Y + SH / 2, 10, X + SW / 2, Y + SH / 2, SW * 0.6); sg.addColorStop(0, C.mark); sg.addColorStop(1, C.ink); k.fillStyle = sg; k.fillRect(X, Y, SW, SH);
      // 中身（色ずれ: 赤みと青みを左右に1.6pxずらして重ねる）
      const flick = 0.93 + 0.07 * (0.5 + 0.5 * Math.sin(12 * ph));
      const draw = (dx, col, a) => {
        k.save(); k.globalAlpha = a * flick; k.shadowColor = col; k.shadowBlur = 10;
        txt(k, 'PLAY', X + SW / 2 + dx, Y + 74, `900 64px ${MONO}`, col, 'center', 'middle', '6px');
        if (dx === 0) { k.shadowColor = C.blueM; k.shadowBlur = 4; txt(k, 'HI-SCORE 024100', X + SW / 2, Y + 26, `700 11px ${MONO}`, C.blueM, 'center', 'middle', '2px'); }
        k.restore();
      };
      k.globalCompositeOperation = 'lighter';
      draw(-1.6, C.blue, 0.9); draw(1.6, C.blueM, 0.8);
      k.globalCompositeOperation = 'source-over';
      draw(0, '#fff', 0.9);
      if (Math.sin(4 * ph) > -0.2) txt(k, '▶ PRESS START', X + SW / 2, Y + 122, `700 12px ${MONO}`, C.blueL, 'center', 'middle', '2px');
      // 赤緑青の縦の縞
      const RGB = [rgba(C.blue, 0.1), rgba(C.blueM, 0.06), rgba(C.blueXL, 0.05)];
      for (let x = X; x < X + SW; x += 3) for (let c = 0; c < 3; c++) { k.fillStyle = RGB[c]; k.fillRect(x + c, Y, 1, SH); }
      // 走査線
      k.fillStyle = 'rgba(0,0,0,.32)'; for (let y = Y; y < Y + SH; y += 3) k.fillRect(X, y + 2, SW, 1);
      // 流れる明るい帯（4.7秒で上から下へ1回）
      const by = Y - 40 + (SH + 80) * (u / CYC);
      const bg2 = k.createLinearGradient(0, by - 24, 0, by + 24); bg2.addColorStop(0, 'rgba(255,255,255,0)'); bg2.addColorStop(0.5, 'rgba(255,255,255,.08)'); bg2.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = bg2; k.fillRect(X, by - 24, SW, 48);
      // 四隅の暗さとガラスの反射
      const vg = k.createRadialGradient(X + SW / 2, Y + SH / 2, SH * 0.45, X + SW / 2, Y + SH / 2, SW * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.65)');
      k.fillStyle = vg; k.fillRect(X, Y, SW, SH);
      k.fillStyle = 'rgba(255,255,255,.05)'; k.beginPath(); k.ellipse(X + SW * 0.3, Y + 10, SW * 0.32, 20, -0.05, 0, 7); k.fill();
      k.restore();
      k.strokeStyle = C.g3; k.lineWidth = 2; rr(k, X, Y, SW, SH, 24); k.stroke();
    });
  };

  // @end
  return { width: CW, height: CH, cycle: LOOP, cells: CELLS, fonts: [] };
});

