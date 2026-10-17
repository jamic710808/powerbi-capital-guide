/* scenes-a.js — s00 片頭、s01 一通電話、s02 六個口袋、s03 第一站（資金安全總覽）
   每個場景是純函式 (c, K)：K.t＝場景內秒數，K.cue(旁白片段, 第幾次, 偏移秒)＝該片段在場景內的起點。 */
(() => {
  const { P } = L, W = L.W, H = L.H, TAU = L.TAU;
  const SCN = window.SCN = window.SCN || {};
  const pop = (t, tc, d = .45) => L.ramp(t, tc, d, L.eOB);
  const NAMES = ['總部', '華東', '華南', '華北', '跨境運營', '香港貿易'];

  /* ---------- s00 片頭 ---------- */
  SCN['s00-title'] = (c, K) => {
    const t = K.t;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f2b3d'); g.addColorStop(.55, '#14839a'); g.addColorStop(1, '#ffc58a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    L.circle(c, 1480, 640, 120, 'rgba(255,224,140,.9)');                                   // 日出
    c.fillStyle = '#12384f';                                                               // 城市剪影
    for (let i = 0; i < 24; i++) { const bw = 70 + L.hash(i) * 70, bh = 120 + L.hash(i + 9) * 250; c.fillRect(i * 84 - 10, 900 - bh, bw, bh + 200); }
    c.fillStyle = '#0f2b3d'; c.fillRect(0, 900, W, 180);
    // 晾衣繩與六個口袋
    const ry = 290; c.strokeStyle = '#e6d3b0'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, ry - 20); c.quadraticCurveTo(W / 2, ry + 50, W, ry - 20); c.stroke();
    NAMES.forEach((n, i) => {
      const x = 330 + i * 260, y0 = ry + 18 + Math.sin((x / W) * Math.PI) * 28, p = pop(t, .1 + i * .08, .5);
      if (p <= 0) return;
      L.fillRR(c, x - 8, y0 - 22, 16, 40, 5, P.cream, P.woodD, 2);
      L.pocket(c, { x, y: y0 + 170 * .9 * p, s: .9 * p, color: L.PK[n], face: i === 5 ? 'nervous' : 'happy', sweat: i === 5 ? .9 : 0, fill: 1, t, tag: false, rot: L.bob(t, .05, .7, i) });
    });
    const tp = pop(t, .35, .6);
    c.save(); c.translate(W / 2, 690); c.scale(.7 + .3 * tp, .7 + .3 * tp); c.globalAlpha = L.clamp(tp * 2);
    L.text(c, '有個口袋在冒汗', 0, 0, { size: 150, color: '#fff', stroke: '#0f2b3d', sw: 16, w: 900 });
    c.restore();
    L.text(c, 'PowerBI資金分析報告｜看全局，也看每個口袋', W / 2, 810, { size: 46, color: '#fff', alpha: L.ramp(t, .8, .5, L.eO) });
    L.wipe(c, K, { start: false });
  };

  /* ---------- s01 一通電話 ---------- */
  SCN['s01-call'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floorY: 840 });
    // 牆上看板（Power BI 報表，示意）
    const bx = 1010, by = 170, bw = 800, bh = 500, bp = pop(t, .1, .5);
    c.save(); c.globalAlpha *= L.clamp(bp * 2); c.translate(0, (1 - bp) * 40);
    L.panel(c, bx, by, bw, bh, { bg: P.navy, r: 30 });
    L.text(c, 'Power BI 報表（示意）', bx + bw / 2, by + 46, { size: 34, color: P.sky });
    const T0 = cu('約四點三億元', 0, -.25);
    for (let i = 0; i < 4; i++) { c.save(); c.globalAlpha *= .16 * (1 - L.ramp(t, T0 + i * .5, .3)); L.fillRR(c, bx + 30 + (i % 2) * 380, by + 90 + Math.floor(i / 2) * 200, 360, 180, 22, '#fff'); c.restore(); }   // 尚未亮起的磚（佔位）
    [['可用資金', 42961.7], ['可調配資金', 34527.8], ['13 週最低可用', 35812.5], ['最大缺口', 908.6]].forEach((d, i) => {
      const tt = T0 + i * .5;
      L.tile(c, bx + 30 + (i % 2) * 380, by + 90 + Math.floor(i / 2) * 200, 360, 180, d[0], '', { p: pop(t, tt, .4), num: d[1], dec: 1, cp: L.ramp(t, tt, 1.0, L.eO), unit: '萬元', col: i === 3 ? P.coral : P.teal, vc: i === 3 ? P.red : P.ink });
    });
    c.restore();
    // 桌子與手機
    L.fillRR(c, 560, 716, 460, 26, 10, P.wood, P.woodD, 3); L.fillRR(c, 590, 742, 22, 98, 6, P.woodD); L.fillRR(c, 970, 742, 22, 98, 6, P.woodD);
    const tBoss = cu('老闆問', 0, .1), tOk = cu('那就好', 0, -.05), tQuiet = cu('安靜了', 0, -.1);
    const ring = (1 - L.ramp(t, tBoss + .3, .3)) * L.ramp(t, .1, .2);
    L.phone(c, 790, 660, .9, { shake: ring, ring, t });
    // 老闆對話框（只出現文字，不配音）
    const bub = (txt, tc, tout, w = 470) => {
      const p = pop(t, tc, .35) * (1 - L.ramp(t, tout, .2)); if (p <= 0) return;
      c.save(); c.translate(790, 560); c.scale(.6 + .4 * p, .6 + .4 * p); c.translate(-790, -560);
      L.bubble(c, 790 - w / 2 - 40, 330, w, 120, [790, 600], { bg: '#ffe6c7', stroke: P.orangeD, alpha: L.clamp(p * 2) });
      L.pill(c, '老闆', 790 - w / 2 + 20, 322, { size: 22, bg: P.orange, color: '#fff', padX: 22, padY: 14 });
      L.text(c, txt, 790 - 40, 392, { size: 52, color: P.ink }); c.restore();
    };
    bub('帳上有錢嗎？', tBoss, tOk - .05); bub('那就好～', tOk, tQuiet - .05, 400);
    const dp = pop(t, tQuiet, .3) * 1;
    if (dp > 0) {
      L.bubble(c, 790 - 235 - 40, 330, 470, 120, [790, 600], { bg: '#ffe6c7', stroke: P.orangeD, alpha: L.clamp(dp * 2) });
      for (let i = 0; i < 3; i++) L.circle(c, 790 - 40 - 60 + i * 60, 392, 11 * pop(t, tQuiet + .2 + i * .45, .25), P.ink);
    }
    // 小衡
    const tLook = cu('看了一眼', 0, -.1), tFinger = cu('小衡補一句', 0, .05);
    const finger = L.ramp(t, tFinger, .4, L.eOB), quiet = L.ramp(t, tQuiet, .6);
    const rhT = [L.lerp(66, 70, finger), L.lerp(-34, -230, finger)];
    const hands = L.xh(c, { x: 400, y: 650, s: 1.12, t, look: [L.ramp(t, tLook, .3) * 1.0, 0], head: L.ramp(t, tLook, .4) * .12 - quiet * .06, hold: 'tumbler', holdHand: 'l', lh: [-76, -66],
      rh: rhT, brow: finger > .3 ? 'up' : 'calm', eyes: quiet > .3 ? 'worry' : 'dot', mouth: quiet > .3 ? 'awk' : (t > tOk ? 'smile' : 'smile'), sweat: quiet * .8, blink: (t % 3.1) < .12 });
    if (finger > .05) { const [fx, fy] = [400 + hands.r[0] * 1.12, 650 + hands.r[1] * 1.12]; L.fillRR(c, fx - 6, fy - 44 * finger, 12, 46 * finger, 6, P.skin); }
    // 保溫杯蒸氣
    const [lx, ly] = [400 - hands.l[0] * 1.12, 650 + hands.l[1] * 1.12];
    const steam = (1 - L.ramp(t, tQuiet + .2, 1.6)) * L.ramp(t, .3, .4);
    for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; c.save(); c.globalAlpha = steam * Math.sin(ph * Math.PI) * .75; c.strokeStyle = '#fff'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx + (i - 1) * 14, ly - 100 - ph * 46); c.quadraticCurveTo(lx + (i - 1) * 14 + 9, ly - 112 - ph * 46, lx + (i - 1) * 14, ly - 124 - ph * 46); c.stroke(); c.restore(); }
    // 日曆：10/5 翻到 10/15
    const cp = pop(t, tFinger + .15, .4), tFlip = cu('十月十五日', 0, -.15);
    if (cp > 0) L.wallCal(c, 190, 340, 1.0 * (.5 + .5 * cp), 15, { alpha: L.clamp(cp * 2), from: 5, flip: L.ramp(t, tFlip, .5, L.eO), circle: L.ramp(t, tFlip + .55, .5, L.eO) });
    L.wipe(c, K);
  };

  /* ---------- s02 六個口袋 ---------- */
  SCN['s02-pockets'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: false });
    L.fillRR(c, 110, 652, 1700, 44, 16, P.wood, P.woodD, 4); c.fillStyle = 'rgba(15,43,61,.1)'; c.fillRect(150, 696, 1620, 16);
    const tPot = cu('錢不是一鍋粥', 0, -.15), tSix = cu('是六個口袋', 0, -.1), tChar = cu('各有各的脾氣', 0, -.1);
    const tHead = L.ramp(t, .15, .5, L.eOB);
    c.save(); c.globalAlpha *= tHead * (1 - L.ramp(t, cu('總部', 0, -.2), .4)); c.translate(0, (1 - tHead) * -30);
    L.text(c, '星橋集團', 960, 300, { size: 110, color: P.navy, w: 900 }); L.pill(c, '六個口袋', 960, 420, { size: 54, bg: P.orange, color: '#fff', padX: 60, padY: 30 }); c.restore();
    NAMES.forEach((n, i) => { c.save(); c.globalAlpha *= .4 * (1 - pop(t, cu(n, 0, -.15), .3)); c.strokeStyle = P.navy2; c.lineWidth = 4; c.setLineDash([14, 12]); L.rr(c, 270 + i * 276 - 80, 460, 160, 190, 50); c.stroke(); c.restore(); });
    // 一鍋粥（被叉掉）
    const pp = pop(t, tPot, .45) * (1 - L.ramp(t, tSix + .5, .4));
    if (pp > 0) {
      c.save(); c.translate(960, 250); c.scale(.6 + .4 * pp, .6 + .4 * pp); c.globalAlpha *= L.clamp(pp * 2);
      c.beginPath(); c.arc(0, 0, 130, 0, Math.PI); c.closePath(); c.fillStyle = P.navy2; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 6; c.stroke();
      c.beginPath(); c.ellipse(0, 0, 138, 34, 0, 0, TAU); c.fillStyle = P.gold; c.fill(); c.stroke();
      for (const d of [-1, 1]) { c.beginPath(); c.arc(d * 150, 14, 24, d > 0 ? -1.2 : Math.PI - 1.9, d > 0 ? 1.2 : Math.PI + 1.2); c.strokeStyle = P.ink; c.lineWidth = 12; c.stroke(); }
      for (let i = 0; i < 3; i++) { const ph = (t * .5 + i / 3) % 1; c.save(); c.globalAlpha *= Math.sin(ph * Math.PI) * .8; c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo((i - 1) * 40, -50 - ph * 60); c.quadraticCurveTo((i - 1) * 40 + 12, -70 - ph * 60, (i - 1) * 40, -92 - ph * 60); c.stroke(); c.restore(); }
      L.pill(c, '總數 約 4.3 億（示意）', 0, -150, { size: 38, bg: P.white, stroke: P.ink, lw: 3 });
      const xp = L.ramp(t, tSix - .1, .3, L.eOB); if (xp > 0) { c.strokeStyle = P.red; c.lineWidth = 16; c.lineCap = 'round'; L.line(c, -150, -80, -150 + 300 * xp, 130 * xp - 80, P.red, 16); L.line(c, 150, -80, 150 - 300 * xp, 130 * xp - 80, P.red, 16); }
      c.restore();
    }
    // 六個口袋依唸出的名字彈出
    const FACE = ['calm', 'happy', 'happy', 'calm', 'o', 'nervous'], ps = [];
    NAMES.forEach((n, i) => {
      const p = pop(t, cu(n, 0, -.15), .5), x = 270 + i * 276, hk = i === 5;
      if (p <= 0) return;
      const jiggle = L.ramp(t, tChar + i * .12, .5) * (1 - L.ramp(t, tChar + i * .12 + .5, .4)) * Math.sin(t * 24) * .06;
      L.pocket(c, { x, y: 652 + (1 - p) * -40, s: p * 1.12, color: L.PK[n], label: n, face: t > tChar ? FACE[i] : (hk ? 'nervous' : 'calm'), sweat: hk ? .9 : 0, fill: 1, t, badge: hk ? '¥' : null, hot: hk ? .45 * L.ramp(t, tChar, .6) : 0, rot: jiggle + (hk ? L.bob(t, .03, 1.1) : 0), blink: !hk && ((t + i * .7) % 3.4) < .12 });
    });
    // 元氣寶分流到六個口袋
    NAMES.forEach((n, i) => {
      const p = L.ramp(t, tSix + .05 + i * .1, .7), x1 = 270 + i * 276;
      if (p <= 0 || p >= 1) return;
      const x = L.lerp(960, x1, p), y = L.lerp(250, 470, p) - Math.sin(p * Math.PI) * 120;
      L.yq(c, { x, y, r: 26, expr: 'happy', t, rot: p * 6, alpha: 1 - L.prog(p, .88, 1) });
    });
    L.wipe(c, K);
  };

  /* ---------- s03 第一站：資金安全總覽 ---------- */
  SCN['s03-safety'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: false });
    L.station(c, K, '第一站', '資金安全總覽', cu('第一頁', 0, -.3));
    // 頂部判斷橫幅
    const tBan = cu('一句話判斷', 0, -.1), bp = pop(t, tBan, .45);
    if (bp > 0) {
      c.save(); c.globalAlpha *= L.clamp(bp * 2); c.translate(0, (1 - bp) * -30);
      L.panel(c, 660, 56, 1170, 84, { bg: P.navy, r: 24, blur: 14 });
      L.text(c, L.typed('總量充裕，區域性存在資金缺口', L.ramp(t, tBan + .2, 1.2, x => x)), 1245, 98, { size: 44, color: '#fff' });
      c.restore();
    }
    const tRes = cu('整座水庫', 0, -.25), tPipe = cu('原因是合同回款', 0, -.2);
    // ---- 左面板 A：十三週曲線 vs 備付底線 ----
    const PX = 100, PY = 200, PW = 860, PH = 600;
    const fadeA = 1 - L.ramp(t, tRes, .35), fadeB = L.ramp(t, tRes, .35) * (1 - L.ramp(t, tPipe, .35)), fadeC = L.ramp(t, tPipe, .35);
    if (fadeA > 0) {
      c.save(); c.globalAlpha *= fadeA * L.clamp(pop(t, tBan + .5, .4) * 2);
      L.panel(c, PX, PY, PW, PH, { r: 28 }); L.text(c, '未來 13 週可用資金（示意）', PX + PW / 2, PY + 40, { size: 32, color: P.navy2 });
      const gx = PX + 70, gy = PY + 110, gw = PW - 120, gh = 360, yv = v => gy + gh - gh * (v / 45000);
      for (let i = 0; i <= 3; i++) L.line(c, gx, gy + gh * i / 3, gx + gw, gy + gh * i / 3, 'rgba(15,43,61,.1)', 2);
      // 曲線
      const pts = []; for (let i = 0; i <= 13; i++) { const v = 42961 - (i / 13) * 7149 * 0 - [0, 900, 2100, 3300, 4300, 5200, 6200, 6900, 7100, 6900, 6600, 6400, 6200, 6149][i]; pts.push([gx + gw * i / 13, yv(v)]); }
      const dp = L.ramp(t, cu('最低也有', 0, -.1), 1.4, L.eO), nseg = Math.floor(dp * 13), fr = dp * 13 - nseg;
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= Math.min(13, nseg); i++) c.lineTo(pts[i][0], pts[i][1]);
      if (nseg < 13) c.lineTo(L.lerp(pts[nseg][0], pts[nseg + 1][0], fr), L.lerp(pts[nseg][1], pts[nseg + 1][1], fr));
      c.strokeStyle = P.teal; c.lineWidth = 9; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
      // 備付底線（細紅線）
      const fy = yv(1209.8); L.line(c, gx, fy, gx + gw, fy, P.red, 5); L.pill(c, '備付底線 1,209.8', gx + 150, fy - 26, { size: 26, bg: '#ffe1de', color: P.red, padX: 20, padY: 12 });
      // 最低點標記
      const mp = pop(t, cu('最低也有', 0, 1.2), .4);
      if (mp > 0) { const [mx, my] = pts[8]; L.circle(c, mx, my, 12 * mp, P.orange, '#fff', 4); L.pill(c, '最低 35,812.5', mx, my - 40, { size: 26, bg: '#fff3e6', color: P.orangeD, padX: 20, padY: 12, alpha: mp }); }
      // 尺：量出 29.6 倍
      const rp = L.ramp(t, cu('二十九點六倍', 0, -.2), .6, L.eOB);
      if (rp > 0) {
        const [mx, my] = pts[8], rx = mx + 120; c.save(); c.globalAlpha *= rp;
        L.line(c, rx, my, rx, fy, P.ink, 5); L.line(c, rx - 16, my, rx + 16, my, P.ink, 5); L.line(c, rx - 16, fy, rx + 16, fy, P.ink, 5);
        L.pill(c, '29.6 倍', rx + 90, (my + fy) / 2, { size: 40, bg: P.gold, color: P.ink, padX: 30, padY: 18, stroke: P.ink, lw: 3 }); c.restore();
      }
      c.restore();
    }
    // ---- 左面板 B：滿水的水庫＋一戶水龍頭咳嗽 ----
    if (fadeB > 0) {
      c.save(); c.globalAlpha *= fadeB; L.panel(c, PX, PY, PW, PH, { r: 28, bg: '#eaf8fb' });
      L.fillRR(c, PX + 80, PY + 60, PW - 160, 250, 28, P.waterD, P.navy2, 6); L.fillRR(c, PX + 92, PY + 72, PW - 184, 226, 20, P.water);
      for (let i = 0; i < 4; i++) { c.beginPath(); const wy = PY + 100 + i * 50; c.moveTo(PX + 100, wy); for (let x = 0; x <= PW - 200; x += 20) c.lineTo(PX + 100 + x, wy + Math.sin(x * .05 + t * 2 + i) * 6); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; c.stroke(); }
      L.text(c, '水庫：滿的', PX + PW / 2, PY + 185, { size: 54, color: P.navy, w: 800 });
      // 五戶人家
      const hx0 = PX + 110, dx = 150, cough = L.ramp(t, cu('在咳嗽', 0, -.2), .2);
      for (let i = 0; i < 5; i++) {
        const x = hx0 + i * dx, y = PY + 440, bad = i === 4;
        L.line(c, x, PY + 312, x, y - 40, P.waterD, 12);
        c.fillStyle = bad ? '#ffd2cc' : '#fff'; c.beginPath(); c.moveTo(x - 56, y + 80); c.lineTo(x - 56, y + 10); c.lineTo(x, y - 36); c.lineTo(x + 56, y + 10); c.lineTo(x + 56, y + 80); c.closePath(); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 4; c.stroke();
        L.fillRR(c, x - 14, y + 30, 28, 50, 6, P.wood, P.woodD, 2);
        // 水龍頭
        L.fillRR(c, x - 10, y - 70, 20, 28, 6, P.grey, P.ink, 3); L.fillRR(c, x - 10, y - 50, 44, 16, 8, P.grey, P.ink, 3);
        if (!bad) { for (let k = 0; k < 2; k++) { const ph = (t * 1.4 + k * .5) % 1; c.fillStyle = P.water; c.fillRect(x + 22, y - 34 + ph * 70, 6, 24); } }
        else if (cough > 0) {
          const beats = [0, .55]; beats.forEach((b, k) => { const p = L.prog(t, cu('在咳嗽', 0, -.1) + b, cu('在咳嗽', 0, -.1) + b + .5); if (p > 0 && p < 1) { L.circle(c, x + 28, y - 30 + p * 70, 8 * (1 - p * .3), P.water); } });
          const w = Math.sin(t * 40) * 3 * cough; L.text(c, '噗…噗…', x + 30 + w, y - 128 - w, { size: 34, color: P.red, w: 800, alpha: cough });
        }
      }
      c.restore();
    }
    // ---- 左面板 C：水管（進水細／出水粗）＋量杯 13.6% ----
    if (fadeC > 0) {
      c.save(); c.globalAlpha *= fadeC; L.panel(c, PX, PY, PW, PH, { r: 28 });
      L.text(c, '合同到期的收與付（萬元）', PX + PW / 2, PY + 44, { size: 32, color: P.navy2 });
      L.pipe(c, PX + 60, PY + 190, PX + 420, PY + 190, 22, t, { fill: P.mint }); L.pill(c, '回款 1,336.8', PX + 230, PY + 140, { size: 30, bg: '#e6faf3', color: P.mintD });
      L.pipe(c, PX + 60, PY + 380, PX + 420, PY + 380, 86, t, { fill: P.coral, speed: 1.1 }); L.pill(c, '支出 9,829.0', PX + 230, PY + 300, { size: 30, bg: '#ffe9e5', color: P.red });
      // 量杯
      const cx = PX + 600, cy = PY + 470, cw = 150, ch = 280, lv = L.ramp(t, cu('百分之十三點六', 0, -.2), .9, L.eO) * .136;
      L.fillRR(c, cx - cw / 2, cy - ch, cw, ch, 20, '#f3fbfd', P.ink, 5);
      c.save(); L.rr(c, cx - cw / 2 + 5, cy - ch + 5, cw - 10, ch - 10, 16); c.clip(); c.fillStyle = P.mint; c.fillRect(cx - cw / 2, cy - lv * ch * 2.1, cw, lv * ch * 2.1 + 10); c.restore();
      for (let i = 1; i < 5; i++) L.line(c, cx + cw / 2 - 34, cy - ch * i / 5, cx + cw / 2, cy - ch * i / 5, P.ink, 3);
      L.pill(c, '13.6%', cx, cy - ch - 40, { size: 48, bg: P.gold, color: P.ink, stroke: P.ink, lw: 3, padX: 34, padY: 20, alpha: L.ramp(t, cu('百分之十三點六', 0, -.1), .3) });
      c.restore();
    }
    // ---- 右半：六個口袋→香港貿易放大、元氣寶離開、日曆、缺口條 ----
    const tSplit = cu('可是按法人', 0, -.2), rp = pop(t, tSplit, .5);
    if (rp > 0) {
      c.save(); c.globalAlpha *= L.clamp(rp * 2);
      L.panel(c, 1000, 200, 840, 600, { r: 28, bg: '#fffaf0' });
      ['總部', '華東', '華南', '華北', '跨境運營'].forEach((n, i) => L.pocket(c, { x: 1090 + i * 160, y: 400, s: .42, color: L.PK[n], face: 'happy', fill: 1, tag: false, t, rot: L.bob(t, .03, .8, i) }));
      const tHK = cu('香港貿易的人民幣口袋', 0, -.1), hp = pop(t, tHK, .5), tCal = cu('十月十五日', 0, -.1), tGap = cu('缺口最大', 0, -.1);
      const gp = L.ramp(t, tGap, 1.6, L.eO), tl = L.ramp(t, tCal, 1.4);
      L.pocket(c, { x: 1210, y: 740, s: .95 * (.4 + .6 * hp), color: L.PK['香港貿易'], label: '香港貿易', face: 'nervous', sweat: .9, fill: 1 - tl * .9, hot: .5 * hp, t, badge: '¥', droop: tl });
      // 元氣寶提行李離開
      for (let i = 0; i < 3; i++) {
        const p = L.ramp(t, tCal + .1 + i * .35, 1.6, x => x); if (p <= 0) continue;
        L.yq(c, { x: 1280 + p * 330 + i * 62, y: 700 - Math.abs(Math.sin(p * 16)) * 14 + i * 10, r: 38, expr: 'sad', droop: .9, walk: p * 30, luggage: true, t, alpha: 1 - L.prog(p, .85, 1) });
      }
      if (tl > 0 || t > tCal - .2) L.wallCal(c, 1480, 580, .66, 15, { head: '10月', circle: L.ramp(t, tCal + .1, .5, L.eO), alpha: L.clamp(pop(t, tCal - .1, .3) * 2) });
      // 缺口條
      if (gp > 0) {
        const bx2 = 1745, by2 = 790, bh2 = 200 * gp; L.fillRR(c, bx2 - 34, by2 - bh2, 68, bh2, 10, P.coral, P.red, 4); L.line(c, bx2 - 60, by2, bx2 + 60, by2, P.ink, 4);
        L.pill(c, '缺口 908.6 萬', bx2 - 20, by2 - bh2 - 34, { size: 26, bg: '#ffe9e5', color: P.red, padX: 18, padY: 12, alpha: gp });
      }
      c.restore();
    }
    L.wipe(c, K);
  };
})();
