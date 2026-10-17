/* 場景分派：每個場景 ID 對應 SCN 裡的一個繪圖函式（純函式：只依 K=對時資訊 與時間）。 */
(() => {
  window.prepareScenes = async () => { await document.fonts.ready; };
  window.drawScene = (c, args) => {
    const K = L.makeK(args), fn = window.SCN && window.SCN[args.scene.id];
    if (!fn) throw Error(`尚未實作場景：${args.scene.id}`);
    fn(c, K);
  };
})();
