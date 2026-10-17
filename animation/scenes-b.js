/* scenes-b.js — s04 第二站（收支與預算）、s05 第三站（結算與到期）、s06 第四站（融資與金融工具） */
(() => {
  const { P } = L, W = L.W, H = L.H, TAU = L.TAU;
  const SCN = window.SCN = window.SCN || {};
  const pop = (t, tc, d = .45) => L.ramp(t, tc, d, L.eOB);
  const enter = (c, p, dy = 40) => { c.globalAlpha *= L.clamp(p * 2); c.translate(0, (1 - p) * dy); };

  /* ---------- s04 第二站：收支與預算 ---------- */
  SCN['s04-flows'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: false });
    L.station(c, K, '第二站', '收支與預算', cu('第二頁', 0, -.3));
    // 面板 1：淨現金流與三個來源
    const p1 = pop(t, .35, .5);
    if (p1 > 0) {
      c.save(); enter(c, p1);
      L.panel(c, 90, 190, 640, 620, { r: 28 });
      L.text(c, '淨現金流', 410, 244, { size: 36, color: P.navy2 });
      L.text(c, t < cu('淨現金流', 0, -.1) ? '約 ？ 億' : '約 ' + L.fmt(3.7 * L.ramp(t, cu('淨現金流', 0, 0), 1.0, L.eO), 1) + ' 億', 410, 330, { size: 88, color: P.tealD, w: 900 });
      const tOp = cu('全靠經營活動', 0, -.15);
      [['經營', 38566, P.teal, '+38,566'], ['投資', -55.2, P.coral, '−55.2'], ['籌資', -1194.6, P.coral, '−1,194.6']].forEach((r, i) => {
        const y = 430 + i * 100, bp = pop(t, tOp + i * .35, .4); if (bp <= 0) return;
        L.text(c, r[0], 160, y + 30, { size: 36, color: P.ink });
        const w = Math.max(12, Math.abs(r[1]) / 38566 * 360) * bp; L.fillRR(c, 220, y + 6, w, 48, 12, r[2]);
        L.text(c, r[3], 220 + w + 14, y + 30, { size: 32, color: r[1] > 0 ? P.tealD : P.red, align: 'left', alpha: bp });
      });
      L.pill(c, '全靠經營活動撐著', 410, 760, { size: 32, bg: '#e6faf3', color: P.tealD, alpha: pop(t, tOp + .9, .3) });
      c.restore();
    }
    // 面板 2：預算執行率儀表
    const tG = cu('預算執行率', 0, -.2), p2 = pop(t, .5, .5);
    if (p2 > 0) {
      c.save(); enter(c, p2);
      L.panel(c, 760, 190, 520, 620, { r: 28 });
      L.text(c, '預算執行率', 1020, 244, { size: 36, color: P.navy2 });
      const v = 110.5 * L.ramp(t, cu('百分之一百一十點五', 0, -.1), 1.3, L.eO);
      L.gauge(c, 1020, 540, 170, v, 150);
      L.text(c, L.fmt(v, 1) + '%', 1020, 610, { size: 84, color: v > 100 ? P.red : P.tealD, w: 900 });
      const sp = L.ramp(t, cu('叫超支', 0, -.2), .35, L.eOB);
      L.stamp(c, 1020, 720, '超支', { p: sp, rot: -.12 });
      L.pill(c, '超標達成 ✗', 1020, 720, { size: 36, bg: '#eef3f5', color: P.navy2, alpha: L.ramp(t, cu('超標達成', 0, -.2), .3) * (1 - L.ramp(t, cu('叫超支', 0, -.3), .2)) });
      c.restore();
    }
    // 面板 3：法人排行榜
    const tR = cu('各法人裡', 0, -.2), p3 = pop(t, .65, .5);
    if (p3 > 0) {
      c.save(); enter(c, p3);
      L.panel(c, 1310, 190, 520, 620, { r: 28 });
      L.text(c, '法人預算執行率', 1570, 244, { size: 36, color: P.navy2 });
      const rows = [['香港貿易', 126.1], ['集團總部', 112.1], ['華北零售', 111.3], ['跨境運營', 110.0], ['華東零售', 107.4], ['華南零售', 106.6]];
      rows.forEach((r, i) => {
        const y = 300 + i * 80, bp = pop(t, tR + .15 + i * .12, .4), hk = i === 0; if (bp <= 0) return;
        L.text(c, r[0], 1440, y + 30, { size: 30, color: hk ? P.red : P.ink, align: 'right', w: hk ? 800 : 600 });
        const w = (r[1] - 80) / 50 * 280 * bp; L.fillRR(c, 1456, y + 6, w, 44, 10, hk ? P.coral : P.skyD);
        L.text(c, L.fmt(r[1], 1) + '%', 1456 + w + 10, y + 30, { size: 28, color: hk ? P.red : P.navy2, align: 'left', w: 800, alpha: bp });
      });
      const busy = pop(t, cu('今天特別忙', 0, -.2), .4);
      if (busy > 0) {
        L.pocket(c, { x: 1400, y: 172, s: .36 * busy, color: L.PK['香港貿易'], face: 'nervous', sweat: .9, fill: 1, tag: false, t, rot: Math.sin(t * 18) * .08 * busy });
        L.bubble(c, 1450, 60, 380, 90, [1620, 312], { bg: '#ffe9e5', stroke: P.red, alpha: busy, lw: 4 }); L.text(c, '今天特別忙！', 1640, 106, { size: 44, color: P.red, alpha: busy });
        c.save(); c.globalAlpha *= busy * (.5 + .5 * Math.sin(t * 10)); L.fillRR(c, 1318, 296, 500, 62, 12, null, P.red, 5); c.restore();
      }
      c.restore();
    }
    L.wipe(c, K);
  };

  /* ---------- s05 第三站：結算與到期 ---------- */
  const snail = (c, x, y, s, t) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#b9d7a8'; c.beginPath(); c.ellipse(0, 6, 46, 14, 0, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 3; c.stroke();
    L.circle(c, 52, -4, 12, '#b9d7a8', P.ink, 3); L.line(c, 56, -14, 60, -34 + Math.sin(t * 6) * 3, P.ink, 3); L.line(c, 48, -14, 46, -34 + Math.cos(t * 6) * 3, P.ink, 3);
    L.circle(c, 62, -36, 4, P.ink); L.circle(c, 46, -36, 4, P.ink);
    L.circle(c, -8, -14, 28, P.orange, P.ink, 3); c.beginPath(); c.arc(-8, -14, 16, 0, TAU * .8); c.strokeStyle = P.orangeD; c.lineWidth = 4; c.stroke();
    c.restore();
  };
  SCN['s05-timeline'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: false });
    L.station(c, K, '第三站', '渠道結算與到期', cu('第三頁', 0, -.3));
    // 行事曆（10 月，示意）
    const gp = pop(t, cu('第三頁', 0, .1), .5);
    c.save(); enter(c, gp);
    L.panel(c, 90, 170, 980, 610, { r: 28 });
    const x0 = 120, y0 = 250, cw = 132, ch = 100;
    ['一', '二', '三', '四', '五', '六', '日'].forEach((d, i) => L.text(c, d, x0 + i * cw + cw / 2, 224, { size: 28, color: P.navy2 }));
    const hl = L.ramp(t, cu('未來三十日', 0, -.15), .6);
    for (let d = 1; d <= 31; d++) {
      const idx = d + 2, col = idx % 7, row = Math.floor(idx / 7), x = x0 + col * cw, y = y0 + row * ch, fut = d >= 6;
      L.fillRR(c, x + 3, y + 3, cw - 6, ch - 6, 10, (fut && hl > 0) ? `rgba(255,138,61,${.12 + .18 * hl})` : '#f3f8fa');
      L.text(c, String(d), x + 22, y + 24, { size: 24, color: P.navy2, w: 600 });
    }
    // 便利貼：未結應收；逾期標籤
    const pn = pop(t, cu('未結應收', 0, -.15), .5);
    if (pn > 0) { c.save(); c.translate(x0 + 2 * cw + 66, y0 + 56); c.rotate(-.06); c.scale(.5 + .5 * pn, .5 + .5 * pn); L.fillRR(c, -180, -62, 360, 124, 10, '#ffe77a', '#d9b93a', 3); L.text(c, '未結應收', 0, -24, { size: 30, color: '#7a6416' }); L.text(c, '1,337 萬', 0, 22, { size: 54, color: P.ink, w: 900 }); c.restore(); }
    const pl = pop(t, cu('逾期七十一萬元', 0, -.15), .5);
    if (pl > 0) { c.save(); c.translate(x0 + 5 * cw + 40, y0 + 250); c.rotate(.07); c.scale(.5 + .5 * pl, .5 + .5 * pl); L.fillRR(c, -170, -52, 340, 104, 16, P.red); L.text(c, '逾期 71 萬', 0, -18, { size: 38, color: '#fff', w: 800 }); L.text(c, '逾期率 5.3%', 0, 24, { size: 34, color: '#fff' }); c.restore(); }
    c.restore();
    // 朋友（元氣寶）舉牌慢慢走，蝸牛超車
    const tF = cu('像朋友說下週還', 0, -.1), tS = cu('慢了一點點', 0, -.2);
    const fp = L.ramp(t, tF, 7.0, x => x);
    if (t > tF) {
      L.yq(c, { x: 200 + fp * 110, y: 822, r: 34, expr: t > tS ? 'sad' : 'smile', sign: '下週還你', walk: fp * 40, t, droop: L.ramp(t, tS, .5) * .6 });
      if (t > tS - .3) snail(c, L.lerp(60, 520, L.ramp(t, tS - .3, 4.5, x => x)), 832, .9, t);
    }
    // 右側：自家逾期應付＝0，準時付款好公民；未來 30 日應付
    const pr = pop(t, cu('自家的逾期應付', 0, -.2), .5);
    const r0 = pop(t, .5, .5) * (1 - L.ramp(t, cu('自家的逾期應付', 0, -.3), .3));     // 開場先用一張小卡解釋「應收／應付」
    if (r0 > 0) {
      c.save(); enter(c, r0); L.panel(c, 1110, 170, 730, 330, { r: 28 });
      L.text(c, '兩個詞', 1475, 224, { size: 36, color: P.navy2 });
      [['應收', '別人欠我們的錢', P.mint, 1], ['應付', '我們欠別人的錢', P.orange, -1]].forEach((r, i) => {
        const y = 290 + i * 100; L.fillRR(c, 1150, y, 650, 84, 18, '#f3f8fa'); L.pill(c, r[0], 1230, y + 42, { size: 36, bg: r[2], color: '#fff', padX: 40, padY: 18 });
        L.text(c, r[1], 1540, y + 44, { size: 38, color: P.ink }); L.arrow(c, r[3] > 0 ? 1370 : 1420, y + 42, r[3] > 0 ? 1420 : 1370, y + 42, r[2], 6, 18);
      });
      c.restore();
    }
    if (pr > 0) {
      c.save(); enter(c, pr);
      L.panel(c, 1110, 170, 730, 330, { r: 28 });
      L.text(c, '自家逾期應付', 1475, 224, { size: 38, color: P.navy2 });
      L.fillRR(c, 1260, 290, 430, 150, 16, '#f3f8fa', P.grey, 3); L.text(c, '0', 1475, 366, { size: 130, color: P.tealD, w: 900 });
      L.text(c, '萬元', 1620, 410, { size: 30, color: P.navy2 });
      c.restore();
    }
    const pt = pop(t, cu('未來三十日', 0, -.2), .5);
    if (pt > 0) { c.save(); enter(c, pt); L.tile(c, 1110, 540, 380, 200, '未來 30 日應付', '', { p: 1, num: 4813, cp: L.ramp(t, cu('未來三十日', 0, 0), 1.1, L.eO), unit: '萬元', col: P.orange }); c.restore(); }
    const tM = cu('準時付款', 0, -.1), mp = pop(t, tM, .5);
    L.xh(c, { x: 1690, y: 690, s: .82, t, mouth: 'smile', eyes: mp > .3 ? 'happy' : 'dot', brow: mp > .3 ? 'happy' : 'calm', blush: mp * .6, rh: [66, -34], lh: [-66, -34] });
    if (mp > 0) { L.medal(c, 1690, 612, .5, null, { p: mp }); L.pill(c, '準時付款好公民', 1690, 438, { size: 34, bg: P.white, stroke: P.ink, lw: 3, alpha: mp }); }
    L.wipe(c, K);
  };

  /* ---------- s06 第四站：融資與金融工具 ---------- */
  const landlord = (c, x, y, s, t, shake) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    L.fillRR(c, -60, -140, 120, 160, 40, '#8a6a4a'); L.fillRR(c, -60, -120, 120, 140, 40, '#a98a68');
    c.save(); c.translate(0, -190); c.rotate(Math.sin(t * 14) * .18 * shake);
    L.circle(c, 0, 0, 62, '#e8b88e'); c.fillStyle = '#6b6b6b'; c.beginPath(); c.arc(0, -8, 64, Math.PI * 1.05, Math.PI * 1.95); c.fill();
    L.circle(c, -22, 2, 6, P.ink); L.circle(c, 22, 2, 6, P.ink); L.line(c, -34, -16, -12, -10, P.ink, 5); L.line(c, 34, -16, 12, -10, P.ink, 5);
    c.fillStyle = '#6b6b6b'; c.beginPath(); c.ellipse(0, 30, 30, 10, 0, 0, TAU); c.fill();
    c.restore();
    L.line(c, -66, -90, 40, -60, '#e8b88e', 26); L.line(c, 66, -90, -40, -60, '#e8b88e', 26);
    c.restore();
  };
  SCN['s06-borrow'] = (c, K) => {
    const t = K.t, cu = K.cue;
    L.bg(c, { floor: true, floorY: 820 });
    L.station(c, K, '第四站', '融資與金融工具', cu('第四頁', 0, -.3));
    // 銀行與貸款
    const bp = pop(t, cu('貸款餘額', 0, -.25), .5);
    if (bp > 0) {
      c.save(); enter(c, bp);
      c.fillStyle = P.navy; c.beginPath(); c.moveTo(80, 290); c.lineTo(330, 190); c.lineTo(580, 290); c.closePath(); c.fill();
      L.pill(c, '銀行', 330, 250, { size: 38, bg: P.gold, color: P.ink, padX: 50, padY: 20 });
      L.fillRR(c, 100, 290, 460, 24, 6, P.grey); for (let i = 0; i < 4; i++) L.fillRR(c, 130 + i * 112, 314, 56, 290, 8, '#eef5f8', P.grey, 3);
      L.fillRR(c, 80, 604, 500, 26, 8, P.grey);
      L.tile(c, 110, 330, 440, 150, '貸款餘額', '', { p: 1, num: 7017, cp: L.ramp(t, cu('貸款餘額', 0, 0), 1.0, L.eO), unit: '萬元', col: P.navy2, vs: 62 });
      const rp = pop(t, cu('加權年利率', 0, -.1), .45);
      if (rp > 0) { c.save(); c.translate(330, 540); c.scale(.6 + .4 * rp, .6 + .4 * rp); L.fillRR(c, -200, -50, 400, 100, 16, P.ink); L.text(c, '加權年利率', -100, 0, { size: 30, color: P.sky }); L.text(c, '5.73%', 100, 2, { size: 56, color: P.orange, w: 900 }); c.restore(); }
      c.restore();
    }
    // 備用額度貼紙與玻璃
    const tQ = cu('另有可提款授信', 0, -.1), sp = pop(t, tQ, .5), tB = cu('但授信只是備用額度', 0, -.1);
    const reach = L.ramp(t, tB, .55, L.eOB) * (1 - L.ramp(t, tB + 1.3, .6)), bump = L.ramp(t, tB + .5, .25) * (1 - L.ramp(t, tB + 1.1, .5));
    const DX0 = 120;
    if (sp > 0) { c.save(); c.translate(1180 + DX0, 520); c.rotate(-.05); c.scale(.5 + .5 * sp, .5 + .5 * sp); L.fillRR(c, -170, -78, 340, 156, 12, '#ffe77a', '#d9b93a', 3); L.text(c, '備用額度', 0, -26, { size: 34, color: '#7a6416' }); L.text(c, '7,707 萬', 0, 26, { size: 62, color: P.ink, w: 900 }); c.restore(); }
    // 玻璃
    const DX = 120;
    L.fillRR(c, 960 + DX, 300, 52, 500, 10, 'rgba(190,230,255,.45)', 'rgba(255,255,255,.9)', 4);
    c.save(); c.beginPath(); c.rect(960 + DX, 300, 52, 500); c.clip(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 6; for (let i = 0; i < 4; i++) L.line(c, 940 + DX, 340 + i * 120, 1030 + DX, 280 + i * 120, 'rgba(255,255,255,.7)', 6); c.restore();
    const eyes = t > tQ && t < tB + .45 ? 'wide' : (bump > .1 ? 'half' : 'dot');
    const rh = [L.lerp(66, 205, reach), L.lerp(-34, -118, reach)];
    L.xh(c, { x: 920 - bump * 14, y: 700, s: 1.0, t, eyes, brow: bump > .1 ? 'worry' : 'calm', mouth: bump > .1 ? 'o' : 'smile', rh, lean: reach * .08 - bump * .1, head: -bump * .15, sparkle: 0 });
    if (bump > .1) { for (let i = 0; i < 4; i++) L.sparkle(c, 1105 + Math.cos(i * 1.6 + t * 8) * 36, 560 + Math.sin(i * 1.6 + t * 8) * 36, 14 * bump, P.gold, t * 3); L.text(c, '咚！', 1060, 470, { size: 60, color: P.red, w: 900, alpha: bump, stroke: '#fff', sw: 10 }); }
    L.stamp(c, 1300, 700, '≠ 現金', { p: L.ramp(t, tB + .65, .3, L.eOB), rot: -.1 });
    // 朋友的話與房東
    const tF = cu('像朋友說缺錢跟我說', 0, -.1), fb = pop(t, tF, .4) * (1 - L.ramp(t, cu('理財可變現', 0, -.3), .3));
    if (fb > 0) { c.save(); c.translate(1600, 340); c.scale(.6 + .4 * fb, .6 + .4 * fb); c.translate(-1600, -340); L.bubble(c, 1400, 270, 420, 130, [1500, 440], { bg: '#e6faf3', stroke: P.mintD, alpha: L.clamp(fb * 2) }); L.pill(c, '朋友', 1440, 262, { size: 22, bg: P.mint, color: '#fff', padX: 22, padY: 14 }); L.text(c, '缺錢跟我說', 1620, 336, { size: 52, color: P.ink }); c.restore(); }
    const tL = cu('房租不能用心意付', 0, -.5), lp = pop(t, tL, .5) * (1 - L.ramp(t, cu('理財可變現', 0, -.35), .3)), shake = L.ramp(t, tL + .9, .3) * (1 - L.ramp(t, tL + 2.3, .4));
    if (lp > 0) {
      landlord(c, 1640, 760, .8 * (.5 + .5 * lp), t, shake); L.pill(c, '房東', 1640, 800, { size: 24, bg: '#fff', padX: 24, padY: 14, alpha: lp });
      c.save(); c.globalAlpha *= lp; L.fillRR(c, 1400, 620, 150, 70, 14, '#e6faf3', P.mintD, 3); L.text(c, '心意', 1475, 655, { size: 36, color: P.mintD }); c.restore();
      L.text(c, '✗', 1640, 560, { size: 96, color: P.red, w: 900, alpha: shake });
    }
    // 理財可變現：0
    const mp = pop(t, cu('理財可變現', 0, -.15), .5);
    if (mp > 0) { c.save(); c.translate(1560, 700); c.scale(.5 + .5 * mp, .5 + .5 * mp); c.globalAlpha *= L.clamp(mp * 2); L.fillRR(c, -140, -70, 280, 140, 18, P.white, P.ink, 4); L.fillRR(c, -140, -70, 280, 40, 18, P.navy2); L.text(c, '理財', 0, -50, { size: 30, color: '#fff' }); L.text(c, '可變現：0', 0, 24, { size: 52, color: P.red, w: 900 }); c.restore(); }
    L.wipe(c, K);
  };
})();
