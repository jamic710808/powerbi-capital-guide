/* scenes-c.js — s07 第五站（集團資金調配）、s08 第六站（跨境與匯率風險）、s09 傍晚（收尾與片尾字卡） */
(() => {
  const { P } = L, W = L.W, H = L.H, TAU = L.TAU;
  const SCN = window.SCN = window.SCN || {};
  const pop = (t, tc, d = .45) => L.ramp(t, tc, d, L.eOB);
  const enter = (c, p, dy = 40) => { c.globalAlpha *= L.clamp(p * 2); c.translate(0, (1 - p) * dy); };

  /* ---------- s07 第五站：集團資金調配 ---------- */
  SCN['s07-pool'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: false });
    L.station(c, K, '第五站', '集團資金調配', cu('第五頁', 0, -.3));
    // 資金池：六個口袋圍成一圈（手拉手）
    const CX = 650, CY = 500, R = 250, ring = pop(t, cu('先別急著借', 0, -.4), .6);
    const ANG = { 總部: -100, 華東: -40, 香港貿易: 20, 華南: 80, 華北: 140, 跨境運營: 200 };
    if (ring > 0) {
      c.save(); c.globalAlpha *= L.clamp(ring * 2);
      c.beginPath(); c.arc(CX, CY, R, 0, TAU); c.strokeStyle = 'rgba(20,163,179,.35)'; c.lineWidth = 26; c.stroke();
      c.setLineDash([2, 34]); c.beginPath(); c.arc(CX, CY, R, t * .4, t * .4 + TAU); c.strokeStyle = P.teal; c.lineWidth = 12; c.lineCap = 'round'; c.stroke(); c.setLineDash([]);
      c.restore();
    }
    Object.entries(ANG).forEach(([n, a], i) => {
      const p = pop(t, cu('先別急著借', 0, -.3) + i * .08, .5); if (p <= 0) return;
      const x = CX + Math.cos(a * Math.PI / 180) * R, y = CY + Math.sin(a * Math.PI / 180) * R + 70, hk = n === '香港貿易';
      L.pocket(c, { x, y, s: .56 * p, color: L.PK[n], face: hk ? (t > cu('補得上', 0, 1.8) ? 'happy' : 'nervous') : 'happy', sweat: hk ? .85 * (1 - L.ramp(t, cu('補得上', 0, 1.8), .5)) : 0, fill: 1, tag: false, t, rot: L.bob(t, .03, .8, i), hot: hk ? .4 * (1 - L.ramp(t, cu('補得上', 0, 1.8), .5)) : 0 });
      L.pill(c, n, x, y + 28, { size: 24, bg: P.white, stroke: P.ink, lw: 2, padX: 20, padY: 12, alpha: p });
    });
    // 中央：人民幣資金池
    const tP = cu('人民幣資金池', 0, -.2), cp = pop(t, tP, .5);
    if (cp > 0) {
      c.save(); c.translate(CX, CY + 40); c.scale(.6 + .4 * cp, .6 + .4 * cp); c.globalAlpha *= L.clamp(cp * 2);
      L.panel(c, -170, -90, 340, 180, { r: 28, bg: '#e6faf3', blur: 14 }); L.text(c, '人民幣資金池', 0, -48, { size: 34, color: P.tealD });
      L.text(c, L.fmt(14997.3 * L.ramp(t, tP, 1.0, L.eO), 1), 0, 8, { size: 62, color: P.ink, w: 900 }); L.text(c, '萬元（約 1.5 億）', 0, 58, { size: 26, color: P.navy2 }); c.restore();
    }
    // 缺口條與元氣寶補上（候選安排：半透明＋虛線）
    const tF = cu('補得上', 0, -.1), hkx = CX + Math.cos(20 * Math.PI / 180) * R, hky = CY + Math.sin(20 * Math.PI / 180) * R + 70;
    const gap = 1 - L.ramp(t, tF + .6, 1.6, L.eO);
    if (t > cu('補得上', 0, -.3)) {
      c.save(); c.globalAlpha *= pop(t, cu('補得上', 0, -.3), .3);
      L.fillRR(c, hkx + 90, hky - 20 - 120 * gap, 34, Math.max(2, 120 * gap), 8, P.coral, P.red, 3);
      L.pill(c, gap > .02 ? '缺口 908.6' : '缺口 0', hkx + 107, hky - 40 - 120 * gap, { size: 26, bg: gap > .02 ? '#ffe9e5' : '#e6faf3', color: gap > .02 ? P.red : P.mintD, padX: 18, padY: 12 }); c.restore();
    }
    for (let i = 0; i < 5; i++) {
      const p = L.ramp(t, tF + .1 + i * .2, 1.1, x => x); if (p <= 0 || p >= 1) continue;
      const x = L.lerp(CX, hkx, p), y = L.lerp(CY + 30, hky - 110, p) - Math.sin(p * Math.PI) * 90;
      c.save(); c.globalAlpha *= .55; c.strokeStyle = P.navy2; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); c.arc(x, y, 34, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
      L.yq(c, { x, y, r: 24, expr: 'happy', t, alpha: .6, rot: p * 3 });
    }
    // 右側：審批桌、印章懸在半空、小衡遞簽核單
    const tA = cu('不過這只是候選安排', 0, -.2), ap = pop(t, tA, .5);
    const r0 = pop(t, .6, .5) * (1 - L.ramp(t, tA - .1, .3));                    // 開場先用一張卡說明「資金池」
    if (r0 > 0) {
      c.save(); enter(c, r0); L.panel(c, 1180, 190, 660, 620, { r: 28 });
      L.text(c, '資金池是什麼？', 1510, 250, { size: 42, color: P.navy2 });
      [['同一個池', '集團內可以互相調配的一組帳戶', P.teal], ['同一種幣種', '人民幣池就只調人民幣', P.orange]].forEach((r, i) => {
        const y = 320 + i * 190; L.fillRR(c, 1220, y, 580, 160, 20, '#f3f8fa'); L.pill(c, r[0], 1400, y + 44, { size: 38, bg: r[2], color: '#fff', padX: 44, padY: 20 }); L.text(c, r[1], 1510, y + 108, { size: 32, color: P.ink });
      });
      L.yq(c, { x: 1700, y: 700, r: 34, expr: 'happy', t }); L.yq(c, { x: 1620, y: 730, r: 28, expr: 'smile', t: t + 1 });
      c.restore();
    }
    if (ap > 0) {
      c.save(); enter(c, ap);
      L.panel(c, 1180, 190, 660, 620, { r: 28 });
      L.pill(c, '候選安排', 1510, 246, { size: 38, bg: P.gold, color: P.ink, padX: 44, padY: 20, stroke: P.ink, lw: 3 });
      L.fillRR(c, 1260, 560, 500, 28, 10, P.wood, P.woodD, 3); L.fillRR(c, 1290, 588, 22, 170, 6, P.woodD); L.fillRR(c, 1710, 588, 22, 170, 6, P.woodD);
      L.fillRR(c, 1585, 520, 130, 40, 8, P.red); L.fillRR(c, 1601, 524, 98, 28, 6, '#b8323a');
      const tAp = cu('要經過審批', 0, -.1), bob = Math.sin(t * 3) * 10 * (1 - L.ramp(t, tAp + 2.5, .5));
      c.save(); c.translate(1650, 420 + bob); L.fillRR(c, -14, -90, 28, 90, 10, P.wood, P.woodD, 3); L.fillRR(c, -58, 0, 116, 40, 10, P.red, '#7a1d24', 3); c.restore();
      const sp = L.ramp(t, tAp, .35, L.eOB); if (sp > 0) L.stamp(c, 1430, 330, '審批中', { p: sp, rot: -.08, col: P.orangeD });
      const doc = pop(t, tA + .3, .4); if (doc > 0) { c.save(); c.translate(1380, 500); c.rotate(-.08); c.scale(doc, doc); L.fillRR(c, -60, -80, 120, 150, 8, '#fff', P.grey, 3); for (let i = 0; i < 5; i++) L.line(c, -40, -52 + i * 24, 40 - (i % 2) * 18, -52 + i * 24, P.grey, 5); L.text(c, '簽核單', 0, -92, { size: 24, color: P.navy2 }); c.restore(); }
      c.restore();
      L.xh(c, { x: 1360, y: 690, s: .78, t, brow: 'calm', mouth: 'smile', rh: [90, -110], hold: null, lh: [-50, -34], eyes: 'dot', blink: (t % 3.3) < .12 });
    }
    // 「再熱心的口袋，也得等簽核點頭」：印章點頭一次，仍然懸空
    const tN = cu('簽核點頭', 0, -.2);
    if (t > tN) L.text(c, '等簽核點頭…', 1510, 150, { size: 40, color: P.navy2, alpha: pop(t, tN, .3) * (.7 + .3 * Math.sin(t * 6)) });
    L.wipe(c, K);
  };

  /* ---------- s08 第六站：跨境與匯率風險 ---------- */
  SCN['s08-fx'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: true, floorY: 810 });
    L.station(c, K, '第六站', '跨境與匯率風險', cu('最後一頁', 0, -.3));
    // 敞口塔（對沖前：美元／歐元／港幣）
    const tN = cu('對沖前的淨敞口', 0, -.2), TX = 560, TB = 800, SCL = .02;
    const sway = Math.sin(t * 2.4) * .045 * L.ramp(t, cu('各幣種不利變動', 0, -.1), .6) * (1 - 0);
    const tF = cu('做了遠期', 0, -.1), fw = L.ramp(t, tF + 1.0, .6, L.eOB);
    const blocks = [['美元', 9765.1, '#1f9fb0'], ['歐元', 6717.4, '#59a5e6'], ['港幣', 3133.9, '#ff9b6b']].map((b, i) => ({ h: b[1] * SCL * L.ramp(t, tN + i * .35, .5, L.eOB), col: b[2], label: `${b[0]} ${L.fmt(b[1])}`, w: 260 }));
    if (t > .3) {
      c.save(); c.globalAlpha *= L.clamp(pop(t, .3, .5) * 2);
      L.panel(c, 300, 200, 520, 600, { r: 28, bg: 'rgba(255,255,255,.55)', blur: 8 });
      L.text(c, '外幣淨敞口（萬元）', 560, 240, { size: 32, color: P.navy2 });
      if (fw > 0) blocks.push({ h: 46 * fw, col: P.red, label: '遠期 +207.8', w: 260, drop: (1 - fw) * 120, tc: '#fff' });
      L.tower(c, TX, TB - 10, 260, blocks, { sway });
      const tUs = cu('美元最大', 0, -.1); if (t > tUs) L.pill(c, '美元最大', 752, 690, { size: 28, bg: P.gold, color: P.ink, padX: 22, padY: 14, alpha: pop(t, tUs, .3) });
      c.restore();
      if (fw > 0) L.pill(c, '高度示意放大', 560, 276, { size: 22, bg: '#fff3f1', color: P.red, padX: 16, padY: 10, alpha: fw * .9 });
    }
    // 小衡放上遠期積木
    const hand = [L.lerp(60, 90, fw), L.lerp(-30, -210, L.ramp(t, tF, .5)) + fw * 40];
    L.xh(c, { x: 230, y: 690, s: .9, t, brow: fw > .5 ? 'worry' : 'calm', mouth: fw > .5 ? 'awk' : 'smile', eyes: 'dot', rh: [L.lerp(66, 190, L.ramp(t, tF, .5)), L.lerp(-34, -240, L.ramp(t, tF, .5)) + fw * 60], blink: (t % 3.3) < .12 });
    // 右側卡片：A 淨敞口數字 → B 炸雞 → C ±5%
    const tChk = cu('就像想減肥', 0, -.2), tSens = cu('各幣種不利變動', 0, -.2);
    const aA = pop(t, tN, .5) * (1 - L.ramp(t, tChk, .3)), aB = L.ramp(t, tChk, .3) * (1 - L.ramp(t, tSens, .3)), aC = L.ramp(t, tSens, .3);
    if (aA > 0) {
      c.save(); c.globalAlpha *= aA; L.panel(c, 900, 200, 940, 600, { r: 28 });
      L.text(c, '淨敞口', 1370, 254, { size: 38, color: P.navy2 });
      const inc = L.ramp(t, cu('增加到', 0, -.05), 1.0, L.eO), v = 19616 + 208 * inc;
      L.text(c, L.fmt(L.lerp(0, 19616, L.ramp(t, tN, 1.0, L.eO)) + (v - 19616), 0), 1370, 380, { size: 150, color: inc > .05 ? P.red : P.tealD, w: 900 });
      L.text(c, '萬元', 1700, 430, { size: 36, color: P.navy2 });
      if (inc > .05) { L.pill(c, '▲ +207.8', 1370, 500, { size: 46, bg: '#ffe9e5', color: P.red, padX: 40, padY: 22, alpha: L.clamp(inc * 3) }); }
      const tR = cu('反而從', 0, -.2); if (t > tR) L.text(c, '19,616 → 19,824', 1370, 620, { size: 52, color: P.ink, alpha: pop(t, tR, .3) });
      const tWhy = cu('因為買進的方向', 0, -.2); if (t > tWhy) L.pill(c, '買進的方向 ＝ 原本多頭的方向', 1370, 720, { size: 36, bg: '#fff3f1', color: P.red, padX: 40, padY: 22, alpha: pop(t, tWhy, .3) });
      c.restore();
    }
    if (aB > 0) {
      c.save(); c.globalAlpha *= aB; L.panel(c, 900, 200, 940, 600, { r: 28, bg: '#fffaf0' });
      // 體重計＋炸雞
      L.fillRR(c, 1010, 600, 300, 60, 18, P.grey, P.ink, 4); L.circle(c, 1160, 560, 90, '#fff', P.ink, 5); L.line(c, 1160, 560, 1160 + Math.cos(-1 + Math.min(1, aB) * 1.6) * 62, 560 + Math.sin(-1 + Math.min(1, aB) * 1.6) * 62, P.red, 7);
      L.text(c, 'kg', 1160, 592, { size: 26, color: P.navy2 });
      L.bubble(c, 1030, 270, 380, 110, [1130, 460], { bg: '#e6faf3', stroke: P.mintD }); L.text(c, '這次一定要減肥！', 1220, 326, { size: 40, color: P.ink });
      const tCh = cu('多點了一份炸雞', 0, -.2), cp = pop(t, tCh, .5);
      if (cp > 0) {
        c.save(); c.translate(1600, 560); c.scale(.4 + .6 * cp, .4 + .6 * cp);
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 70, 190, 40, 0, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 4; c.stroke();
        for (const d of [-1, 1]) { c.save(); c.translate(d * 80, 10); c.rotate(d * .5); L.fillRR(c, -14, 20, 28, 70, 10, '#f2e6d0', P.ink, 3); L.circle(c, 0, -10, 58, '#d9822b', P.ink, 4); L.circle(c, -16, -26, 14, 'rgba(255,255,255,.35)'); c.restore(); }
        c.restore();
        L.pill(c, '+1 炸雞', 1600, 420, { size: 44, bg: P.gold, color: P.ink, padX: 36, padY: 20, alpha: cp });
      }
      c.restore();
    }
    if (aC > 0) {
      c.save(); c.globalAlpha *= aC; L.panel(c, 900, 200, 940, 600, { r: 28 });
      L.text(c, '各幣種不利變動 5%', 1370, 254, { size: 40, color: P.navy2 });
      for (let i = 0; i < 6; i++) { const ph = (t * .8 + i * .17) % 1; c.save(); c.globalAlpha *= .5 * (1 - ph); L.line(c, 1000 + ph * 700, 330 + i * 18, 1100 + ph * 700, 330 + i * 18, P.skyD, 5); c.restore(); }
      const tV = cu('影響約負', 0, -.2), vp = L.ramp(t, tV, 1.0, L.eO);
      L.text(c, '−' + L.fmt(991 * vp, 0), 1370, 520, { size: 170, color: P.red, w: 900 }); L.text(c, '萬元', 1640, 580, { size: 40, color: P.navy2 });
      L.pill(c, '靜態敏感性，不等於已實現損益', 1370, 700, { size: 32, bg: '#eef3f5', color: P.navy2, padX: 36, padY: 20 });
      c.restore();
    }
    L.wipe(c, K);
  };

  /* ---------- s09 傍晚：收尾與片尾字卡 ---------- */
  SCN['s09-evening'] = (c, K) => {
    const t = K.t, cu = K.cue;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b4d63'); g.addColorStop(.55, '#d98a5f'); g.addColorStop(1, '#f6c58f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    L.circle(c, 1010, 420, 120, 'rgba(255,214,130,.9)');                                  // 夕陽
    c.fillStyle = 'rgba(15,43,61,.55)'; for (let i = 0; i < 18; i++) { const bw = 80 + L.hash(i + 3) * 60, bh = 80 + L.hash(i + 11) * 200; c.fillRect(i * 112 - 20, 640 - bh, bw, bh); }
    c.fillStyle = '#f3dcc0'; c.fillRect(0, 640, W, 440);                                  // 地板
    c.fillStyle = 'rgba(15,43,61,.08)'; c.fillRect(0, 640, W, 30);
    const tB = cu('老闆又打來', 0, -.1), tQ = cu('我們到底有沒有錢', 0, -.15);
    // 手機與對話框
    L.fillRR(c, 80, 706, 360, 24, 10, P.wood, P.woodD, 3); L.fillRR(c, 110, 730, 20, 110, 6, P.woodD); L.fillRR(c, 390, 730, 20, 110, 6, P.woodD);
    const ring = L.ramp(t, tB - .5, .2) * (1 - L.ramp(t, tB + .6, .3));
    L.phone(c, 260, 640, .9, { shake: ring, ring, t });
    const bp = pop(t, tB + .2, .4);
    if (bp > 0) { c.save(); c.translate(260, 520); c.scale(.6 + .4 * bp, .6 + .4 * bp); c.translate(-260, -520); L.bubble(c, 40, 300, 560, 160, [260, 580], { bg: '#ffe6c7', stroke: P.orangeD, alpha: L.clamp(bp * 2) }); L.pill(c, '老闆', 84, 292, { size: 22, bg: P.orange, color: '#fff', padX: 22, padY: 14 }); L.text(c, L.typed('所以，我們到底有沒有錢？', L.ramp(t, tB + .3, 1.6, x => x)), 320, 380, { size: 44, color: P.ink }); c.restore(); }
    // 看板與便利貼、門
    const tNote = cu('至少這一晚', 0, -.1), np = pop(t, tNote, .5), tDoor = cu('該去敲哪一扇門', 0, -.15), dp = pop(t, tDoor - .3, .4), knock = L.ramp(t, tDoor + .3, .2) * (1 - L.ramp(t, tDoor + 1.0, .3));
    c.save(); L.panel(c, 1240, 170, 600, 400, { bg: P.navy, r: 30 }); L.text(c, 'Power BI 報表（示意）', 1540, 214, { size: 30, color: P.sky });
    for (let i = 0; i < 3; i++) L.fillRR(c, 1270 + i * 190, 250, 170, 90, 14, 'rgba(255,255,255,.14)');
    L.fillRR(c, 1270, 360, 540, 170, 14, 'rgba(255,255,255,.1)'); c.restore();
    if (np > 0) { c.save(); c.translate(1470, 440); c.rotate(-.04); c.scale(.5 + .5 * np, .5 + .5 * np); L.fillRR(c, -200, -70, 400, 140, 10, '#ffe77a', '#d9b93a', 3); L.text(c, '香港貿易', 0, -34, { size: 34, color: '#7a6416' }); L.text(c, '→ 人民幣池 → 簽核', 0, 14, { size: 38, color: P.ink, w: 800 }); c.restore(); }
    if (dp > 0) { c.save(); c.translate(1760, 470); c.scale(.6 + .4 * dp, .6 + .4 * dp); L.fillRR(c, -50, -90, 100, 170, 10, '#8a5a2b', P.ink, 4); L.circle(c, 28, 0, 7, P.gold); L.pill(c, '簽核', 0, -112, { size: 24, bg: P.white, padX: 20, padY: 10 }); c.restore();
      if (knock > 0) { L.text(c, '咚咚', 1700, 380, { size: 40, color: P.red, w: 900, alpha: knock, stroke: '#fff', sw: 8 }); } }
    // 香港貿易口袋：縫補
    const tS = cu('而那個口袋', 0, -.1), tH = cu('還來得及補回元氣', 0, -.1), sew = L.ramp(t, tS, 3.2, x => x), heal = L.ramp(t, tH, 1.8, L.eO);
    L.fillRR(c, 880, 800, 300, 22, 10, P.wood, P.woodD, 3); L.fillRR(c, 900, 822, 20, 80, 6, P.woodD); L.fillRR(c, 1140, 822, 20, 80, 6, P.woodD);
    L.pocket(c, { x: 1030, y: 800, s: 1.0, color: L.PK['香港貿易'], label: '香港貿易', face: heal > .3 ? 'happy' : 'nervous', sweat: .8 * (1 - heal), fill: .6 + .4 * heal, t, hot: .3 * (1 - heal), badge: '¥', droop: 0 });
    if (t > tS - .3) {                                                                         // 補丁與針線
      const pp = pop(t, tS, .4); c.save(); c.translate(1056, 748); c.rotate(.12); c.scale(pp, pp); L.fillRR(c, -34, -30, 68, 60, 10, '#fff3d6', P.orangeD, 3); c.setLineDash([8, 6]); L.fillRR(c, -26, -22, 52, 44, 8, null, P.orangeD, 3); c.setLineDash([]); c.restore();
    }
    // 小衡
    const smileT = cu('小衡笑了', 0, -.1);
    const nx = 1056 + Math.sin(t * 5) * 8 * (t > tS ? 1 : 0), ny = 748 - 40 + Math.cos(t * 5) * 12;
    const sewing = t > tS && t < tH + 2;
    const hands = L.xh(c, { x: 720, y: 700, s: 1.12, t, eyes: t > smileT ? 'happy' : 'dot', brow: t > smileT ? 'happy' : 'calm', mouth: 'smile', blush: L.ramp(t, smileT, .6) * .6, rh: sewing ? [(nx - 720) / 1.12, (ny - 700) / 1.12] : [66, -34], lh: [-70, -40], blink: (t % 3.4) < .12 });
    if (sewing) { const [hx, hy] = [720 + hands.r[0] * 1.12, 700 + hands.r[1] * 1.12]; L.line(c, hx, hy, hx + 30, hy + 60, '#e6edf1', 4); c.strokeStyle = P.coral; c.lineWidth = 3; c.beginPath(); c.moveTo(hx + 30, hy + 60); c.quadraticCurveTo(hx + 20, hy + 100, 1040, 790); c.stroke(); }
    // 進度條：待審批
    const barP = L.ramp(t, tS, 3.2, x => x) * .55; const bpp = pop(t, tS + .2, .4);
    if (bpp > 0) { c.save(); c.globalAlpha *= bpp; L.fillRR(c, 1260, 740, 300, 26, 13, '#fff', P.ink, 3); L.fillRR(c, 1264, 744, 292 * barP, 18, 9, P.orange); L.pill(c, '待審批', 1410, 700, { size: 30, bg: P.white, stroke: P.ink, lw: 3, padX: 30, padY: 14 }); c.restore(); }
    // 元氣小隊魚貫經過並豎起大拇指
    const tP = cu('而那個口袋', 0, 1.2);
    for (let i = 0; i < 4; i++) {
      const p = L.ramp(t, tP + i * .5, 4.2, x => x); if (p <= 0 || p >= 1) continue;
      L.yq(c, { x: L.lerp(W + 80, -120, p), y: 838 - Math.abs(Math.sin(p * 40 + i)) * 12, r: 36, expr: 'proud', thumb: i % 2 === 0, walk: p * 90, flip: -1, t, droop: 0 });
    }
    // 「看餘額 → 做安排」
    const tM = cu('不是告訴你還剩多少', 0, -.2), mp = pop(t, tM, .4) * (1 - L.ramp(t, tNote - .15, .3));
    if (mp > 0) {
      c.save(); c.globalAlpha *= mp; L.panel(c, 520, 120, 880, 170, { r: 34, bg: 'rgba(255,255,255,.92)', blur: 16 });
      L.pill(c, '看餘額', 740, 205, { size: 54, bg: '#e8eef1', color: P.navy2, padX: 60, padY: 36 });
      const ap = L.ramp(t, cu('而是告訴你', 0, -.1), .5, L.eOB); L.arrow(c, 880, 205, 880 + 140 * ap, 205, P.orange, 10, 30);
      L.pill(c, '做安排', 1180, 205, { size: 60, bg: P.orange, color: '#fff', padX: 64, padY: 40, alpha: ap }); c.restore();
    }
    // 片尾字卡（旁白結束後淡入）
    const ec = L.ramp(t, K.vend + .35, .8, L.eO);
    if (ec > 0) {
      c.save(); c.globalAlpha *= ec; c.fillStyle = '#0f2b3d'; c.fillRect(0, 0, W, H);
      L.text(c, '有個口袋在冒汗', W / 2, 330, { size: 110, color: '#fff', w: 900 });
      L.text(c, 'PowerBI資金分析報告｜看全局，也看每個口袋', W / 2, 440, { size: 44, color: P.sky });
      L.pill(c, '示意動畫', W / 2, 560, { size: 38, bg: P.orange, color: '#fff', padX: 50, padY: 26 });
      L.text(c, '數字取自示範（模擬）資料報告，截至 2026-10-05', W / 2, 650, { size: 38, color: '#fff' });
      L.text(c, '介紹文章：〈從資金安全到匯率風險：用這個Power BI資金分析報告幫你看清楚〉', W / 2, 730, { size: 32, color: P.skyD });
      c.restore();
    }
    L.wipe(c, K, { end: false });
  };
})();
