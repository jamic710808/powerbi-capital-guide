/* lib.js — 《有個口袋在冒汗》共用繪圖工具：配色、角色（小衡／元氣寶／口袋）、MG 元件、轉場、旁白對時。
   全部是純函式：畫面只依「參數＋時間」決定，不累積狀態，才能任意跳格重畫。
   角色與造型為本片新設計（風格 A：扁平插畫＋MG 動效）。 */
(() => {
  const L = window.L = {};
  const TAU = Math.PI * 2, W = 1920, H = 1080;
  L.W = W; L.H = H; L.TAU = TAU;
  L.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  L.lerp = (a, b, t) => a + (b - a) * t;
  L.prog = (x, a, b) => L.clamp((x - a) / (b - a));
  L.eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  L.eO = t => 1 - Math.pow(1 - t, 3);
  L.eI = t => t * t * t;
  L.eOB = t => { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  L.eEl = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1;
  L.ramp = (t, a, d, e = L.eIO) => e(L.prog(t, a, a + d));            // 從 a 秒起、花 d 秒、套用緩動 e
  L.hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  L.fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  L.bob = (t, a = 6, f = 1.2, ph = 0) => Math.sin(t * TAU * f + ph) * a;

  const P = L.P = {
    ink: '#0f2b3d', navy: '#12384f', navy2: '#1d5069', teal: '#14a3b3', tealD: '#0e7c8c', mint: '#59d3b5', mintD: '#2fa98a',
    sky: '#bfe9f2', skyD: '#8fd0e0', water: '#7fd0e8', waterD: '#4fb2d2',
    cream: '#fff4e3', paper: '#fffaf0', cream2: '#fde9c9',
    orange: '#ff8a3d', orangeD: '#e56a1a', gold: '#ffc233', goldD: '#d99a0b', gold2: '#ffe07a',
    coral: '#ff6b5a', red: '#e8484f', green: '#3fbf7f', greenD: '#27955f', white: '#ffffff',
    skin: '#f5c9a6', skinD: '#e8ae86', hair: '#4a2f2a', wood: '#d9b48a', woodD: '#b98e62', grey: '#c9d6dc'
  };

  /* ---------- 基本形狀與文字 ---------- */
  L.rr = (c, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };
  L.fillRR = (c, x, y, w, h, r, fill, stroke, lw) => {
    L.rr(c, x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 3; c.stroke(); }
  };
  L.circle = (c, x, y, r, fill, stroke, lw) => {
    c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 3; c.stroke(); }
  };
  L.shadow = (c, blur = 24, oy = 10, color = 'rgba(15,43,61,.25)') => { c.shadowColor = color; c.shadowBlur = blur; c.shadowOffsetY = oy; };
  L.noShadow = c => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; };
  L.line = (c, x1, y1, x2, y2, color, w, cap = 'round') => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = w; c.lineCap = cap; c.stroke(); };
  const FONT = "'Noto Sans TC','Microsoft JhengHei','PingFang TC',sans-serif";
  L.FONT = FONT;
  L.font = (size, w = 700) => `${w} ${size}px ${FONT}`;
  L.text = (c, s, x, y, o = {}) => {
    c.save(); c.font = L.font(o.size || 40, o.w || 700); c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.stroke) { c.lineWidth = o.sw || 8; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
    c.fillStyle = o.color || P.ink; c.fillText(s, x, y); c.restore();
  };
  L.measure = (c, s, size, w = 700) => { c.save(); c.font = L.font(size, w); const m = c.measureText(s).width; c.restore(); return m; };
  L.pill = (c, s, x, y, o = {}) => {                                  // 膠囊標籤（以 x,y 為中心），回傳寬度
    const size = o.size || 36, tw = L.measure(c, s, size, o.w || 700), pw = tw + (o.padX == null ? 36 : o.padX), ph = size + (o.padY == null ? 22 : o.padY);
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    if (o.shadow) L.shadow(c, 18, 8);
    L.fillRR(c, x - pw / 2, y - ph / 2, pw, ph, o.r == null ? ph / 2 : o.r, o.bg || P.white, o.stroke, o.lw);
    L.noShadow(c); L.text(c, s, x, y + (o.dy || 0), { size, w: o.w || 700, color: o.color || P.ink });
    c.restore(); return pw;
  };
  L.at = (c, x, y, s, rot, fn) => { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(s, s); fn(); c.restore(); };
  L.sparkle = (c, x, y, r, color = P.gold, rot = 0) => {
    c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = color; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .3 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fill(); c.restore();
  };
  L.arrow = (c, x1, y1, x2, y2, color = P.ink, w = 6, head = 22) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    L.line(c, x1, y1, x2 - Math.cos(a) * head * .6, y2 - Math.sin(a) * head * .6, color, w);
    c.fillStyle = color; c.beginPath(); c.moveTo(x2, y2);
    c.lineTo(x2 - Math.cos(a - .45) * head, y2 - Math.sin(a - .45) * head); c.lineTo(x2 - Math.cos(a + .45) * head, y2 - Math.sin(a + .45) * head); c.closePath(); c.fill();
  };
  // 對話框：x,y 為左上角；tail=[tx,ty] 尾巴指向
  L.bubble = (c, x, y, w, h, tail, o = {}) => {
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha;
    L.shadow(c, 20, 8, 'rgba(15,43,61,.22)');
    L.rr(c, x, y, w, h, o.r == null ? 30 : o.r); c.fillStyle = o.bg || P.white; c.fill(); L.noShadow(c);
    if (tail) {
      const [tx, ty] = tail; let bx, by, dx = 0, dy = 0;
      if (ty > y + h) { bx = L.clamp(tx, x + 50, x + w - 50); by = y + h; dx = 1; }
      else if (ty < y) { bx = L.clamp(tx, x + 50, x + w - 50); by = y; dx = 1; }
      else if (tx > x + w) { bx = x + w; by = L.clamp(ty, y + 40, y + h - 40); dy = 1; }
      else { bx = x; by = L.clamp(ty, y + 40, y + h - 40); dy = 1; }
      c.beginPath(); c.moveTo(bx - dx * 24, by - dy * 24); c.lineTo(tx, ty); c.lineTo(bx + dx * 24, by + dy * 24); c.closePath(); c.fillStyle = o.bg || P.white; c.fill();
    }
    L.rr(c, x, y, w, h, o.r == null ? 30 : o.r); c.strokeStyle = o.stroke || P.ink; c.lineWidth = o.lw || 4; c.stroke();
    c.restore();
  };

  /* ---------- 對時：以旁白文字片段取得「相對場景起點的秒數」 ---------- */
  L.makeK = args => {
    const { scene: sc, frame, timeline: tl } = args, fps = tl.fps;
    const text = (sc.narration || '').replace(/\s+/g, '');
    const lead = (sc.voiceStartFrame - sc.startFrame) / fps, vs = sc.voiceFrames / fps;
    const cue = (frag, nth = 0, off = 0) => {
      const f = frag.replace(/\s+/g, ''); let idx = -1;
      for (let i = 0; i <= nth; i++) { idx = text.indexOf(f, idx + 1); if (idx < 0) throw Error(`${sc.id}: 找不到對時片段「${frag}」`); }
      return lead + vs * idx / text.length + off;
    };
    return { sc, id: sc.id, frame, fps, t: (frame - sc.startFrame) / fps, dur: sc.durationFrames / fps, lead, vs, vend: lead + vs, cue, seed: tl.seed };
  };

  /* ---------- 轉場：青橘兩條斜帶快速掃過（0.35 秒） ---------- */
  const BANDS = [P.teal, P.orange, P.navy];
  L.wipeCover = (c, p, dir = 1) => {      // p:0→1 斜帶由左蓋上（dir=1）或由右離開（dir=-1 時用於退場）
    for (let i = 0; i < 3; i++) {
      const q = L.clamp(p * 1.55 - i * .27); if (q <= 0) continue;
      const x = -W * 1.3 + (W * 1.3) * L.eIO(q) * 1.0 + 0;
      c.save(); c.fillStyle = BANDS[i]; c.beginPath();
      c.moveTo(x - 160, 0); c.lineTo(x + W + 160, 0); c.lineTo(x + W - 160, H); c.lineTo(x - 320, H); c.closePath(); c.fill(); c.restore();
    }
  };
  L.wipeReveal = (c, p) => {              // p:0→1 斜帶向右離開，露出畫面（p=0 與 wipeCover(1) 相同）
    for (let i = 0; i < 3; i++) {
      const q = L.clamp(p * 1.55 - (2 - i) * .27); if (q >= 1) continue;
      const x = (W * 1.3) * L.eIO(q);
      c.save(); c.fillStyle = BANDS[i]; c.beginPath();
      c.moveTo(x - 160, 0); c.lineTo(x + W + 160, 0); c.lineTo(x + W - 160, H); c.lineTo(x - 320, H); c.closePath(); c.fill(); c.restore();
    }
  };
  L.wipe = (c, K, o = {}) => {
    const inD = o.inD == null ? .38 : o.inD, outD = o.outD == null ? .38 : o.outD;
    if (o.start !== false && K.t < inD) L.wipeReveal(c, K.t / inD);
    if (o.end !== false && K.t > K.dur - outD) L.wipeCover(c, (K.t - (K.dur - outD)) / outD);
  };

  /* ---------- 背景 ---------- */
  L.bg = (c, o = {}) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#fff4e3'); g.addColorStop(1, o.bot || '#fde3bd');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (o.dots !== false) { c.fillStyle = o.dotc || 'rgba(20,163,179,.07)'; for (let i = 0; i < 26; i++) for (let j = 0; j < 15; j++) if ((i + j) % 2 === 0) L.circle(c, 40 + i * 76, 40 + j * 76, 5); }
    if (o.floor !== false) { c.fillStyle = o.floorc || 'rgba(15,43,61,.07)'; c.fillRect(0, o.floorY || 860, W, H - (o.floorY || 860)); }
  };

  /* ---------- 逆向運動學（雙骨） ---------- */
  L.ik = (sx, sy, tx, ty, l1, l2, dir) => {
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const mx = l1 + l2 - .5;
    if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; tx = sx + dx; ty = sy + dy; }
    d = Math.max(d, .01);
    const a = Math.atan2(dy, dx), ang = Math.acos(L.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    return { ex: sx + Math.cos(a + dir * ang) * l1, ey: sy + Math.sin(a + dir * ang) * l1, hx: tx, hy: ty };
  };

  /* ================= 小衡（集團財務主管）：原點在臀部，s=1 時身高約 400px ================= */
  const XH = { vest: '#14a3b3', vestD: '#0e7c8c', shirt: '#ffffff', pants: '#244a63', shoe: '#7a4b2a' };
  L.XH = XH;
  L.xh = (c, o = {}) => {
    const { x = 0, y = 0, s = 1, flip = 1, lean = 0, head = 0, brow = 'calm', eyes = 'dot', mouth = 'smile', talk = 0,
      look = [0, 0], sweat = 0, blush = 0, hold = null, holdHand = 'r', t = 0, walk = null, lh = null, rh = null, blink = false, alpha = 1, sit = false } = o;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(s * flip, s);
    c.lineCap = 'round'; c.lineJoin = 'round';
    // 腿與鞋
    if (!sit) {
      const swing = walk == null ? 0 : Math.sin(walk) * 34, lift = walk == null ? 0 : 16;
      for (const d of [-1, 1]) {
        const hx = d * 20, fx = d * 22 + (d < 0 ? swing : -swing), fy = 118 - (walk == null ? 0 : Math.max(0, d < 0 ? Math.cos(walk) : -Math.cos(walk)) * lift);
        c.beginPath(); c.moveTo(hx, 6); c.lineTo(fx, fy); c.strokeStyle = XH.pants; c.lineWidth = 34; c.stroke();
        c.beginPath(); c.ellipse(fx + 8, fy + 8, 28, 13, 0, 0, TAU); c.fillStyle = XH.shoe; c.fill();
      }
    } else { for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 20, 6); c.lineTo(d * 20 + 50, 20); c.lineTo(d * 20 + 56, 100); c.strokeStyle = XH.pants; c.lineWidth = 34; c.stroke(); } }
    c.save(); c.rotate(lean);
    // 軀幹：白襯衫＋青色背心
    L.fillRR(c, -54, -150, 108, 168, 36, XH.shirt);
    c.fillStyle = XH.vest; c.beginPath(); c.moveTo(-54, -110); c.lineTo(-28, -150); c.lineTo(-10, -150); c.lineTo(0, -92); c.lineTo(10, -150); c.lineTo(28, -150); c.lineTo(54, -110);
    c.lineTo(54, -20); c.quadraticCurveTo(54, 18, 20, 18); c.lineTo(-20, 18); c.quadraticCurveTo(-54, 18, -54, -20); c.closePath(); c.fill();
    c.strokeStyle = XH.vestD; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -92); c.lineTo(0, 16); c.stroke();
    for (const by of [-70, -38, -6]) L.circle(c, 0, by, 4.5, XH.vestD);
    // 領口與工作證
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-18, -152); c.lineTo(0, -126); c.lineTo(18, -152); c.closePath(); c.fill();
    c.strokeStyle = P.orange; c.lineWidth = 5; c.beginPath(); c.moveTo(-20, -150); c.lineTo(-8, -78); c.moveTo(20, -150); c.lineTo(8, -78); c.stroke();
    L.fillRR(c, -16, -80, 32, 40, 6, '#fff', P.ink, 3); L.fillRR(c, -10, -74, 20, 14, 3, P.orange); L.line(c, -9, -52, 9, -52, P.grey, 3);
    // 脖子
    c.fillStyle = P.skin; c.fillRect(-14, -166, 28, 22);
    // 頭
    c.save(); c.translate(0, -158); c.rotate(head); c.translate(0, -60);
    for (const d of [-1, 1]) { L.circle(c, d * 64, 6, 14, P.skin); L.circle(c, d * 64, 6, 7, P.skinD); }
    L.circle(c, 0, 0, 66, P.skin);
    // 頭髮：短髮＋瀏海＋翹毛
    c.fillStyle = P.hair; c.beginPath(); c.moveTo(-68, -2); c.bezierCurveTo(-84, -92, 84, -92, 68, -2);
    c.bezierCurveTo(60, -34, 36, -50, 10, -48); c.bezierCurveTo(-8, -38, -30, -40, -44, -24); c.bezierCurveTo(-52, -16, -62, -10, -68, -2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-6, -84); c.bezierCurveTo(-4, -112, 18, -116, 24, -100); c.bezierCurveTo(14, -104, 6, -98, 4, -84); c.closePath(); c.fill();   // 翹毛
    // 耳後鉛筆
    c.save(); c.translate(58, -6); c.rotate(.55); L.fillRR(c, -4, -46, 9, 46, 2, '#ffd84d', P.goldD, 2); L.fillRR(c, -4, -52, 9, 8, 2, '#ff8fa3'); c.restore();
    // 眼睛
    const bl = blink && (eyes === 'dot' || eyes === 'wide') ? 'closed' : eyes;
    for (const d of [-1, 1]) {
      const ex = d * 26 + look[0] * 5, ey = 6 + look[1] * 4;
      if (bl === 'dot' || bl === 'worry') { L.circle(c, ex, ey, 7, P.ink); L.circle(c, ex + 2.5, ey - 2.5, 2.4, '#fff'); }
      else if (bl === 'wide') { L.circle(c, ex, ey, 11, '#fff', P.ink, 3); L.circle(c, ex + look[0] * 3, ey + look[1] * 3, 5.5, P.ink); }
      else if (bl === 'happy') { c.beginPath(); c.arc(ex, ey + 5, 10, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = P.ink; c.lineWidth = 4.5; c.stroke(); }
      else if (bl === 'closed') { L.line(c, ex - 9, ey + 1, ex + 9, ey + 1, P.ink, 4.5); }
      else if (bl === 'half') { L.circle(c, ex, ey + 2, 7, P.ink); c.fillStyle = P.skin; c.fillRect(ex - 9, ey - 8, 18, 9); L.line(c, ex - 9, ey + 1, ex + 9, ey + 1, P.ink, 4); }
    }
    // 眉毛
    for (const d of [-1, 1]) {
      const bx = d * 26, by = -22; c.strokeStyle = P.hair; c.lineWidth = 5.5; c.beginPath();
      if (brow === 'worry') { c.moveTo(bx - d * 13, by - 9); c.lineTo(bx + d * 13, by + 4); }
      else if (brow === 'up') { c.moveTo(bx - 13, by - 8); c.quadraticCurveTo(bx, by - 20, bx + 13, by - 8); }
      else if (brow === 'happy') { c.moveTo(bx - 13, by - 2); c.quadraticCurveTo(bx, by - 13, bx + 13, by - 2); }
      else if (brow === 'flat') { c.moveTo(bx - 12, by); c.lineTo(bx + 12, by); }
      else { c.moveTo(bx - 12, by + (d < 0 ? 0 : -1)); c.quadraticCurveTo(bx, by - 5, bx + 12, by + (d < 0 ? -1 : 0)); }
      c.stroke();
    }
    if (blush > 0) { c.globalAlpha *= blush; L.circle(c, -44, 30, 12, '#ff9a8a'); L.circle(c, 44, 30, 12, '#ff9a8a'); c.globalAlpha /= blush; }
    // 嘴
    const my = 40; c.strokeStyle = '#7a2b3a'; c.lineWidth = 4.5;
    const open = talk > 0 ? talk * (.35 + .65 * Math.abs(Math.sin(t * 13))) * 13 : 0;
    if (open > 1.5) { c.beginPath(); c.ellipse(0, my, 12, open * .9, 0, 0, TAU); c.fillStyle = '#7a2b3a'; c.fill(); }
    else if (mouth === 'smile') { c.beginPath(); c.arc(0, my - 10, 18, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
    else if (mouth === 'grin') { c.beginPath(); c.arc(0, my - 6, 22, 0, Math.PI); c.closePath(); c.fillStyle = '#7a2b3a'; c.fill(); c.fillStyle = '#fff'; c.fillRect(-15, my - 6, 30, 6); }
    else if (mouth === 'o') { c.beginPath(); c.ellipse(0, my, 9, 12, 0, 0, TAU); c.fillStyle = '#7a2b3a'; c.fill(); }
    else if (mouth === 'worry') { c.beginPath(); c.moveTo(-15, my + 3); c.quadraticCurveTo(-7, my - 5, 0, my + 3); c.quadraticCurveTo(7, my + 10, 15, my + 3); c.stroke(); }
    else if (mouth === 'awk') { c.beginPath(); c.moveTo(-15, my + 2); c.quadraticCurveTo(0, my + 9, 15, my - 4); c.stroke(); }
    else { c.beginPath(); c.moveTo(-11, my); c.lineTo(11, my); c.stroke(); }
    if (sweat > 0) {
      const sy = -4 + sweat * 30 + Math.sin(t * 5) * 2; c.globalAlpha *= Math.min(1, sweat * 3);
      c.fillStyle = '#9fd8ff'; c.beginPath(); c.moveTo(72, sy - 18); c.quadraticCurveTo(88, sy + 6, 72, sy + 14); c.quadraticCurveTo(56, sy + 6, 72, sy - 18); c.fill(); c.globalAlpha = 1;
    }
    c.restore();   // 頭
    // 手臂（雙骨 IK）：白色袖子捲到手肘，前臂露膚色
    const arms = [[-1, lh || [-66, -34]], [1, rh || [66, -34]]], hands = {};
    for (const [d, tgt] of arms) {
      const sx = d * 50, sy = -124, k = L.ik(sx, sy, tgt[0], tgt[1], 64, 60, d === -1 ? 1 : -1);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(k.ex, k.ey); c.strokeStyle = '#fff'; c.lineWidth = 32; c.stroke();
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(k.ex, k.ey); c.strokeStyle = 'rgba(15,43,61,.18)'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(k.ex, k.ey); c.lineTo(k.hx, k.hy); c.strokeStyle = P.skin; c.lineWidth = 26; c.stroke();
      L.circle(c, k.hx, k.hy, 16, P.skin);
      hands[d === -1 ? 'l' : 'r'] = [k.hx, k.hy];
    }
    if (hold) { const [hx, hy] = hands[holdHand]; L.xhItem(c, hold, hx, hy, t); }
    c.restore(); c.restore();
    return hands;
  };
  // 手持道具（以手為原點）
  L.xhItem = (c, kind, x, y, t) => {
    c.save(); c.translate(x, y);
    if (kind === 'tumbler') {                                         // 保溫杯
      L.fillRR(c, -17, -78, 34, 74, 10, '#e6edf1', P.ink, 3.5); L.fillRR(c, -17, -78, 34, 20, 8, P.teal, P.ink, 3.5); L.fillRR(c, -13, -86, 26, 10, 4, P.ink);
      L.fillRR(c, -17, -40, 34, 9, 3, P.orange);
    } else if (kind === 'note') {
      c.rotate(-.1); L.fillRR(c, -34, -64, 68, 64, 6, '#ffe77a', '#d9b93a', 2.5); for (const i of [0, 1, 2]) L.line(c, -22, -48 + i * 14, 20 - i * 6, -48 + i * 14, '#b8982c', 3);
    } else if (kind === 'phone') {
      c.rotate(-.12); L.fillRR(c, -20, -62, 40, 70, 8, P.ink); L.fillRR(c, -15, -56, 30, 56, 4, P.sky);
    } else if (kind === 'calc') {
      c.rotate(-.1); L.fillRR(c, -26, -64, 52, 66, 8, P.navy2, P.ink, 3); L.fillRR(c, -19, -57, 38, 16, 3, P.mint);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) L.circle(c, -13 + j * 13, -30 + i * 12, 4, i === 2 && j === 2 ? P.orange : P.sky);
    } else if (kind === 'pen') {
      c.rotate(.6); L.line(c, 0, 0, 0, -56, P.teal, 9); c.fillStyle = P.ink; c.beginPath(); c.moveTo(-4, 2); c.lineTo(4, 2); c.lineTo(0, 12); c.fill();
    } else if (kind === 'needle') {
      c.rotate(-.5); L.line(c, 0, 0, 0, -70, '#e6edf1', 5); c.strokeStyle = P.coral; c.lineWidth = 4; c.beginPath(); c.arc(0, -70, 7, 0, TAU); c.stroke();
    }
    c.restore();
  };

  /* ================= 元氣寶（元氣小隊）：小金元寶，頭頂一株嫩芽；中心為原點 ================= */
  L.yq = (c, o = {}) => {
    const { x = 0, y = 0, r = 44, rot = 0, expr = 'smile', droop = 0, sx = 1, sy = 1, alpha = 1, t = 0, blink = false, flip = 1,
      walk = null, sign = null, luggage = false, thumb = false, arms = null, glow = 0, tint = null } = o;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(rot); c.scale(sx * flip, sy);
    if (glow > 0) { const g = c.createRadialGradient(0, 0, r * .3, 0, 0, r * 2.2); g.addColorStop(0, `rgba(255,224,122,${.6 * glow})`); g.addColorStop(1, 'rgba(255,224,122,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 2.2, 0, TAU); c.fill(); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    // 小腳
    if (walk != null) for (const d of [-1, 1]) {
      const sw = Math.sin(walk + (d > 0 ? Math.PI : 0)) * r * .28, up = Math.max(0, Math.cos(walk + (d > 0 ? Math.PI : 0))) * r * .16;
      c.beginPath(); c.moveTo(d * r * .36, r * .6); c.lineTo(d * r * .36 + sw, r * 1.02 - up); c.strokeStyle = P.goldD; c.lineWidth = r * .22; c.stroke();
      c.beginPath(); c.ellipse(d * r * .36 + sw + r * .06, r * 1.06 - up, r * .22, r * .1, 0, 0, TAU); c.fillStyle = P.ink; c.fill();
    }
    // 行李（離開時拖著）
    if (luggage) { L.fillRR(c, r * .9, r * .1, r * .8, r * .62, r * .1, P.coral, P.ink, r * .05); L.line(c, r * 1.2, r * .1, r * 1.2, -r * .12, P.ink, r * .06); L.line(c, r * 1.04, -r * .12, r * 1.36, -r * .12, P.ink, r * .06); }
    // 元寶本體：船形底座＋中央隆起
    const base = tint || [P.gold2, P.gold, P.goldD];
    const g = c.createLinearGradient(0, -r * .8, 0, r * .9); g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
    c.beginPath(); c.moveTo(-r * 1.22, -r * .1); c.quadraticCurveTo(0, r * .28, r * 1.22, -r * .1);
    c.bezierCurveTo(r * 1.1, r * .62, r * .6, r * .86, 0, r * .86); c.bezierCurveTo(-r * .6, r * .86, -r * 1.1, r * .62, -r * 1.22, -r * .1); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = base[2]; c.lineWidth = r * .09; c.stroke();
    c.beginPath(); c.ellipse(0, -r * .12, r * .74, r * .58, 0, 0, TAU); c.fillStyle = g; c.fill(); c.strokeStyle = base[2]; c.lineWidth = r * .09; c.stroke();
    c.beginPath(); c.arc(-r * .2, -r * .3, r * .5, 3.5, 4.5); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = r * .07; c.stroke();
    L.text(c, '元', 0, r * .55, { size: r * .34, color: base[2], w: 800 });
    // 臉
    const ex = r * .27, ey = -r * .16, ink = '#5a3a08';
    const bl = blink && (expr === 'smile' || expr === 'proud') ? 'closed' : expr;
    if (bl === 'closed' || bl === 'happy') { for (const d of [-1, 1]) { c.beginPath(); if (bl === 'happy') c.arc(d * ex, ey + r * .05, r * .09, Math.PI * 1.1, Math.PI * 1.9); else c.arc(d * ex, ey, r * .09, .15 * Math.PI, .85 * Math.PI); c.strokeStyle = ink; c.lineWidth = r * .05; c.stroke(); } }
    else if (bl === 'shock') { for (const d of [-1, 1]) { L.circle(c, d * ex, ey, r * .16, '#fff', ink, r * .04); L.circle(c, d * ex, ey, r * .06, ink); } }
    else if (bl === 'sad') { for (const d of [-1, 1]) { L.circle(c, d * ex, ey + r * .03, r * .07, ink); } c.strokeStyle = ink; c.lineWidth = r * .045; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * ex - d * r * .02 - r * .12 * d, ey - r * .2 - r * .0); c.lineTo(d * ex + r * .1 * d, ey - r * .12); c.stroke(); } }
    else { for (const d of [-1, 1]) L.circle(c, d * ex, ey, r * .07, ink); }
    c.strokeStyle = ink; c.lineWidth = r * .05; const my = r * .2;
    if (expr === 'smile' || expr === 'proud' || expr === 'happy') { c.beginPath(); c.arc(0, my - r * .08, r * .15, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
    else if (expr === 'sad') { c.beginPath(); c.arc(0, my + r * .12, r * .13, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke(); }
    else if (expr === 'shock') { c.beginPath(); c.ellipse(0, my, r * .07, r * .1, 0, 0, TAU); c.fillStyle = '#7a2b3a'; c.fill(); }
    else { c.beginPath(); c.moveTo(-r * .09, my); c.lineTo(r * .09, my); c.stroke(); }
    c.globalAlpha *= .5; L.circle(c, -r * .5, r * .12, r * .09, '#ff8f7a'); L.circle(c, r * .5, r * .12, r * .09, '#ff8f7a'); c.globalAlpha /= .5;
    // 嫩芽（droop 0＝挺立，1＝垂下）
    const sway = Math.sin(t * 3.2) * (1 - droop) * .12;
    c.save(); c.translate(0, -r * .66); c.rotate(sway + droop * .9);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * .06, -r * .3, r * (.02 + droop * .15), -r * (.52 - droop * .2)); c.strokeStyle = P.greenD; c.lineWidth = r * .09; c.stroke();
    c.save(); c.translate(r * (.02 + droop * .15), -r * (.52 - droop * .2));
    for (const d of [-1, 1]) { c.save(); c.rotate(d * (.9 + droop * .7)); c.beginPath(); c.ellipse(d * r * .2, -r * .06, r * .22, r * .11, 0, 0, TAU); c.fillStyle = droop > .5 ? '#7fbf6a' : P.green; c.fill(); c.strokeStyle = P.greenD; c.lineWidth = r * .03; c.stroke(); c.restore(); }
    c.restore(); c.restore();
    // 手臂：舉牌 / 大拇指 / 自訂
    if (sign) {
      const bob = Math.sin(t * 4) * 2;
      c.beginPath(); c.moveTo(r * .95, r * .1); c.lineTo(r * 1.15, -r * .6 + bob); c.strokeStyle = base[2]; c.lineWidth = r * .16; c.stroke();
      const sw = L.measure(c, sign, r * .5) + r * .5; c.save(); c.translate(r * 1.15, -r * 1.05 + bob);
      L.fillRR(c, -sw / 2, -r * .36, sw, r * .72, r * .12, '#fff', P.ink, r * .05); L.text(c, sign, 0, 0, { size: r * .5, color: P.ink }); c.restore();
    }
    if (thumb) {
      c.beginPath(); c.moveTo(r * .95, r * .15); c.lineTo(r * 1.3, -r * .2); c.strokeStyle = base[2]; c.lineWidth = r * .16; c.stroke();
      L.circle(c, r * 1.35, -r * .28, r * .17, base[1], base[2], r * .05); c.beginPath(); c.moveTo(r * 1.35, -r * .42); c.lineTo(r * 1.35, -r * .62); c.strokeStyle = base[2]; c.lineWidth = r * .14; c.stroke();
    }
    if (arms) for (const d of [-1, 1]) { const a = arms[d > 0 ? 1 : 0]; c.beginPath(); c.moveTo(d * r * 1.0, r * .1); c.lineTo(d * r * (1.28 + .1 * Math.cos(a)), r * .1 + Math.sin(a) * r * .5); c.strokeStyle = base[2]; c.lineWidth = r * .15; c.stroke(); }
    c.restore();
  };

  /* ================= 口袋（法人的化身）：底部中心為原點 ================= */
  L.PK = { 總部: '#3a7ca5', 華東: '#14a3b3', 華南: '#59d3b5', 華北: '#7fb7e6', 跨境運營: '#8a7bd6', 香港貿易: '#ff7a6b' };
  L.pocket = (c, o = {}) => {
    const { x = 0, y = 0, s = 1, color = P.teal, label = '', face = 'calm', sweat = 0, fill = 1, rot = 0, t = 0, alpha = 1, tag = true, hot = 0, blink = false, droop = 0, badge = null } = o;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
    if (hot > 0) { const g = c.createRadialGradient(0, -80, 20, 0, -80, 190); g.addColorStop(0, `rgba(255,107,90,${.45 * hot})`); g.addColorStop(1, 'rgba(255,107,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, -80, 190, 0, TAU); c.fill(); }
    // 露出的元氣寶（滿的時候看得見金色）
    if (fill > 0) { for (let i = 0; i < 3; i++) { const dx = (i - 1) * 34; c.beginPath(); c.arc(dx, -150 - (fill * 6), 24 * Math.min(1, fill * 1.4), Math.PI, 0); c.fillStyle = i % 2 ? P.gold : P.gold2; c.fill(); c.strokeStyle = P.goldD; c.lineWidth = 3; c.stroke(); } }
    // 袋身
    const g = c.createLinearGradient(0, -150, 0, 0); g.addColorStop(0, color); g.addColorStop(1, color);
    c.beginPath(); c.moveTo(-34, -146); c.bezierCurveTo(-96, -120, -92, -10, -60, -2); c.lineTo(60, -2); c.bezierCurveTo(92, -10, 96, -120, 34, -146); c.closePath();
    c.fillStyle = color; c.fill(); c.strokeStyle = 'rgba(15,43,61,.55)'; c.lineWidth = 4; c.stroke();
    c.globalAlpha *= .22; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-36, -78, 14, 34, .2, 0, TAU); c.fill(); c.globalAlpha /= .22;
    // 束口與蝴蝶結
    L.fillRR(c, -40, -156, 80, 22, 11, 'rgba(255,255,255,.85)', 'rgba(15,43,61,.55)', 3);
    c.beginPath(); c.moveTo(0, -150); c.lineTo(-20, -168); c.lineTo(-20, -140); c.closePath(); c.moveTo(0, -150); c.lineTo(20, -168); c.lineTo(20, -140); c.closePath(); c.fillStyle = P.orange; c.fill();
    L.circle(c, 0, -150, 6, P.orangeD);
    // 臉
    const droopy = face === 'nervous' || face === 'sad';
    const ey = -82, ex = 24;
    if (blink || face === 'sleep') { for (const d of [-1, 1]) L.line(c, d * ex - 8, ey, d * ex + 8, ey, P.ink, 4); }
    else if (face === 'happy') { for (const d of [-1, 1]) { c.beginPath(); c.arc(d * ex, ey + 4, 9, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = P.ink; c.lineWidth = 4.5; c.stroke(); } }
    else { for (const d of [-1, 1]) { L.circle(c, d * ex, ey, 6.5, P.ink); L.circle(c, d * ex + 2, ey - 2, 2.2, '#fff'); } }
    if (face === 'nervous') { for (const d of [-1, 1]) { c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(d * ex - d * 12, ey - 20); c.lineTo(d * ex + d * 10, ey - 12); c.stroke(); } }
    c.strokeStyle = '#7a2b3a'; c.lineWidth = 4.5; c.beginPath();
    if (face === 'happy' || face === 'calm') c.arc(0, -62, 14, .2 * Math.PI, .8 * Math.PI);
    else if (face === 'nervous') { c.moveTo(-14, -52); c.quadraticCurveTo(-7, -60, 0, -52); c.quadraticCurveTo(7, -44, 14, -52); }
    else if (face === 'sad') c.arc(0, -46, 13, 1.2 * Math.PI, 1.8 * Math.PI);
    else if (face === 'o') { c.ellipse(0, -54, 7, 10, 0, 0, TAU); }
    else { c.moveTo(-10, -54); c.lineTo(10, -54); }
    c.stroke();
    c.globalAlpha *= .5; L.circle(c, -50, -62, 9, '#ffc2b8'); L.circle(c, 50, -62, 9, '#ffc2b8'); c.globalAlpha /= .5;
    if (sweat > 0) {
      const p = (t * .8) % 1, sy = -128 + p * 46 * sweat; c.globalAlpha *= Math.min(1, sweat * 2) * (1 - p * .6);
      c.fillStyle = '#9fd8ff'; c.beginPath(); c.moveTo(56, sy - 18); c.quadraticCurveTo(72, sy + 6, 56, sy + 14); c.quadraticCurveTo(40, sy + 6, 56, sy - 18); c.fill(); c.globalAlpha = 1;
    }
    if (badge) { L.circle(c, -58, -128, 20, P.white, P.ink, 3); L.text(c, badge, -58, -127, { size: 24, color: P.ink }); }
    c.restore();
    if (tag && label) {
      c.save(); c.globalAlpha *= alpha; L.pill(c, label, x, y + 36 * s, { size: 30 * s, bg: P.white, stroke: P.ink, lw: 3, padX: 28 * s, padY: 18 * s }); c.restore();
    }
  };

  /* ================= MG 元件 ================= */
  L.panel = (c, x, y, w, h, o = {}) => {
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; L.shadow(c, o.blur == null ? 22 : o.blur, 10);
    L.fillRR(c, x, y, w, h, o.r == null ? 26 : o.r, o.bg || P.white); L.noShadow(c);
    if (o.stroke) L.fillRR(c, x, y, w, h, o.r == null ? 26 : o.r, null, o.stroke, o.lw || 4);
    c.restore();
  };
  // 數字磚：label 小字、value 大字；p＝出現進度（彈出），num 提供則做數字滾動
  L.tile = (c, x, y, w, h, label, value, o = {}) => {
    const p = o.p == null ? 1 : o.p; if (p <= 0) return; const sc = .6 + .4 * L.eOB(p);
    c.save(); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc); c.globalAlpha *= L.clamp(p * 2.2);
    L.panel(c, -w / 2, -h / 2, w, h, { r: 22, bg: o.bg || P.white, blur: 16 });
    L.fillRR(c, -w / 2, -h / 2, w, 12, 6, o.col || P.teal);
    L.text(c, label, 0, -h * .22, { size: o.ls || 26, color: P.navy2, w: 600 });
    let v = value; if (o.num != null) v = L.fmt(o.num * (o.cp == null ? 1 : o.cp), o.dec || 0);
    L.text(c, v, 0, h * .12, { size: o.vs || 58, color: o.vc || P.ink, w: 800 });
    if (o.unit) L.text(c, o.unit, 0, h * .38, { size: 22, color: P.navy2, w: 500 });
    c.restore();
  };
  // 半圓儀表：v/max；100 刻度後轉紅
  L.gauge = (c, cx, cy, r, v, mx, o = {}) => {
    const a0 = Math.PI, a1 = TAU, at = x => a0 + (a1 - a0) * L.clamp(x / mx);
    c.save(); c.lineCap = 'butt'; c.lineWidth = r * .22;
    c.beginPath(); c.arc(cx, cy, r, a0, at(100)); c.strokeStyle = P.mint; c.stroke();
    c.beginPath(); c.arc(cx, cy, r, at(100), a1); c.strokeStyle = P.coral; c.stroke();
    for (let i = 0; i <= 6; i++) { const val = i * mx / 6, a = at(val); L.line(c, cx + Math.cos(a) * (r * .9), cy + Math.sin(a) * (r * .9), cx + Math.cos(a) * (r * 1.16), cy + Math.sin(a) * (r * 1.16), P.ink, 3); }
    const a100 = at(100); L.line(c, cx + Math.cos(a100) * (r * .8), cy + Math.sin(a100) * (r * .8), cx + Math.cos(a100) * (r * 1.3), cy + Math.sin(a100) * (r * 1.3), P.ink, 6);
    L.text(c, '100%', cx + Math.cos(a100) * (r * 1.52), cy + Math.sin(a100) * (r * 1.4), { size: r * .2, color: P.ink });
    const av = at(v); c.save(); c.translate(cx, cy); c.rotate(av);
    c.beginPath(); c.moveTo(-r * .06, -r * .05); c.lineTo(r * .86, 0); c.lineTo(-r * .06, r * .05); c.closePath(); c.fillStyle = P.ink; c.fill(); c.restore();
    L.circle(c, cx, cy, r * .09, P.ink); c.restore();
  };
  // 牆上日曆：head 月份字、day 目前日期；flip 0..1 翻頁；circle 0..1 紅圈
  L.wallCal = (c, x, y, s, day, o = {}) => {
    const { head = '10月', from = null, flip = 1, circle = 0, alpha = 1, shake = 0 } = o;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.rotate(shake); c.scale(s, s);
    L.shadow(c, 18, 8); L.fillRR(c, -90, -110, 180, 220, 16, P.white); L.noShadow(c);
    L.fillRR(c, -90, -110, 180, 56, 16, P.coral); c.fillStyle = P.coral; c.fillRect(-90, -76, 180, 22);
    for (const d of [-1, 1]) { L.fillRR(c, d * 44 - 6, -126, 12, 34, 6, P.ink); }
    L.text(c, head, 0, -82, { size: 34, color: '#fff', w: 800 });
    c.save(); L.rr(c, -86, -50, 172, 156, 10); c.clip();
    if (from != null && flip < 1) {                                  // 舊頁向上翻走，新頁由下方露出
      L.text(c, String(from), 0, 14 - flip * 140, { size: 110, color: P.ink, w: 900, alpha: 1 - flip });
      L.text(c, String(day), 0, 14 + (1 - flip) * 120, { size: 110, color: P.ink, w: 900, alpha: flip });
    } else L.text(c, String(day), 0, 14, { size: 110, color: P.ink, w: 900 });
    c.restore();
    if (circle > 0) { c.strokeStyle = P.red; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.ellipse(0, 12, 82, 56, -.08, -1.2, -1.2 + TAU * circle); c.stroke(); }
    c.restore();
  };
  // 水管：從 (x1,y1) 到 (x2,y2)，粗細 th，t 控制水流；dash＝虛線（假設）
  L.pipe = (c, x1, y1, x2, y2, th, t, o = {}) => {
    c.save(); c.lineCap = 'round';
    if (o.alpha != null) c.globalAlpha *= o.alpha;
    c.strokeStyle = o.wall || P.navy2; c.lineWidth = th + 10; if (o.dash) c.setLineDash([22, 16]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = o.fill || P.water; c.lineWidth = th - 2; c.setLineDash([]);
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.floor(len / 60));
    for (let i = 0; i < n; i++) { const p = ((t * (o.speed || .6)) + i / n) % 1; L.circle(c, L.lerp(x1, x2, p), L.lerp(y1, y2, p), Math.max(3, th * .22), 'rgba(255,255,255,.8)'); }
    c.restore();
  };
  // 積木塔：由下往上疊，blocks=[{h,col,label,w}]
  L.tower = (c, x, yb, w, blocks, o = {}) => {
    c.save(); c.translate(x, yb); c.rotate(o.sway || 0); let y = 0;
    for (const b of blocks) {
      const bw = b.w || w, bh = b.h * (b.p == null ? 1 : b.p); if (bh <= 0) continue; y -= bh;
      c.save(); if (b.drop) c.translate(0, -b.drop);
      L.shadow(c, 10, 4); L.fillRR(c, -bw / 2, y, bw, bh - 4, 12, b.col, 'rgba(15,43,61,.45)', 3); L.noShadow(c);
      if (b.label) L.text(c, b.label, 0, y + bh / 2 - 2, { size: Math.min(34, bh * .5), color: b.tc || '#fff', w: 800 });
      c.restore();
    }
    c.restore();
  };
  // 手機：中心 x,y；shake 左右抖；screen 顯示文字
  L.phone = (c, x, y, s, o = {}) => {
    const { shake = 0, ring = 0, t = 0, alpha = 1, screen = '' } = o;
    c.save(); c.globalAlpha *= alpha; c.translate(x + Math.sin(t * 60) * shake * 6, y); c.rotate(Math.sin(t * 60) * shake * .05); c.scale(s, s);
    L.shadow(c, 16, 8); L.fillRR(c, -48, -84, 96, 168, 18, P.ink); L.noShadow(c); L.fillRR(c, -40, -72, 80, 132, 8, ring > 0 ? '#ffd9a8' : P.sky);
    if (screen) L.text(c, screen, 0, -6, { size: 22, color: P.ink });
    L.circle(c, 0, 72, 6, '#456');
    c.restore();
    if (ring > 0) for (let i = 0; i < 3; i++) { const p = ((t * 1.6) + i / 3) % 1; c.save(); c.globalAlpha = (1 - p) * .55 * ring; c.strokeStyle = P.orange; c.lineWidth = 5; c.beginPath(); c.arc(x, y, 60 * s + p * 70 * s, 0, TAU); c.stroke(); c.restore(); }
  };
  // 站牌：左上角膠囊，滑入
  L.station = (c, K, no, name, tin = 0.15) => {
    const p = L.ramp(K.t, tin, .5, L.eOB), x = L.lerp(-520, 70, p);
    c.save(); L.shadow(c, 14, 6);
    L.fillRR(c, x, 56, 150, 76, 38, P.orange); L.noShadow(c); L.text(c, no, x + 75, 95, { size: 38, color: '#fff', w: 800 });
    const w = L.measure(c, name, 40) + 70; L.shadow(c, 14, 6); L.fillRR(c, x + 130, 56, w, 76, 38, P.navy); L.noShadow(c);
    L.text(c, name, x + 130 + w / 2 + 10, 95, { size: 40, color: '#fff', w: 800 }); c.restore();
  };
  L.stamp = (c, x, y, text, o = {}) => {
    const { p = 1, rot = -.18, col = P.red, alpha = 1 } = o; if (p <= 0) return;
    c.save(); c.translate(x, y); c.rotate(rot); const sc = 1.6 - .6 * L.eOB(p); c.scale(sc, sc); c.globalAlpha *= alpha * L.clamp(p * 3);
    const w = L.measure(c, text, 54) + 50; c.strokeStyle = col; c.lineWidth = 8; L.rr(c, -w / 2, -44, w, 88, 14); c.stroke();
    L.text(c, text, 0, 2, { size: 54, color: col, w: 900 }); c.restore();
  };
  L.medal = (c, x, y, s, text, o = {}) => {
    const { p = 1, rot = 0 } = o; if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * (.5 + .5 * L.eOB(p)), s * (.5 + .5 * L.eOB(p))); c.globalAlpha *= L.clamp(p * 2);
    c.fillStyle = P.coral; c.beginPath(); c.moveTo(-30, -10); c.lineTo(-52, 80); c.lineTo(-30, 66); c.lineTo(-12, 84); c.lineTo(8, 0); c.closePath(); c.fill();
    c.fillStyle = P.orange; c.beginPath(); c.moveTo(30, -10); c.lineTo(52, 80); c.lineTo(30, 66); c.lineTo(12, 84); c.lineTo(-8, 0); c.closePath(); c.fill();
    L.circle(c, 0, -20, 58, P.gold, P.goldD, 8); L.circle(c, 0, -20, 44, null, 'rgba(255,255,255,.7)', 4);
    L.sparkle(c, 0, -20, 26, '#fff'); c.restore();
    if (text) L.pill(c, text, x, y + 120 * s, { size: 30, bg: P.white, stroke: P.ink, lw: 3 });
  };
  L.fall = (t, h0, g = 2400, e = .5) => {
    const T0 = Math.sqrt(2 * h0 / g); if (t < 0) return h0; if (t < T0) return h0 - .5 * g * t * t;
    let tt = t - T0, v = g * T0 * e; for (let i = 0; i < 8; i++) { const Tb = 2 * v / g; if (tt < Tb) return v * tt - .5 * g * tt * tt; tt -= Tb; v *= e; if (v < 40) return 0; } return 0;
  };
  L.typed = (s, p) => s.slice(0, Math.floor(s.length * L.clamp(p)));
  L.cloud = (c, x, y, s, col = 'rgba(255,255,255,.8)') => { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.arc(48, 10, 32, 0, TAU); c.arc(-48, 12, 30, 0, TAU); c.fill(); c.fillRect(-48, 10, 96, 32); c.restore(); };
})();
