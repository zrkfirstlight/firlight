(() => {
  const frame = document.getElementById('lab-frame'), note = document.getElementById('lab-note');
  const descriptions = {A:'主文占据视觉重心，侧栏与短记录错落排列；信息层次清楚，首页需要较多留白。',B:'时间索引成为主入口，项目作为侧面的细轨；便于查找与回顾，大封面存在感更低。',C:'偏心开场、弧线与错落的横向组合；空间感更强，窄屏时收束为直接的阅读顺序。'};
  let scheme = 'A', view = 'home';
  window.addEventListener('message', e => {
    if (e.source !== frame.contentWindow || e.origin !== location.origin || e.data?.type !== 'design-preview-view' || !['home','article'].includes(e.data.view)) return;
    view = e.data.view;
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    frame.title = `${scheme} 布局：${view === 'home' ? '首页' : '文章阅读'}预览`;
  });
  document.querySelectorAll('[data-scheme],[data-width],[data-view]').forEach(b => b.addEventListener('click', () => {
    const key = Object.keys(b.dataset)[0];
    document.querySelectorAll(`[data-${key}]`).forEach(other => other.setAttribute('aria-pressed', String(other === b)));
    if (key === 'width') { frame.classList.toggle('narrow', b.dataset.width === 'narrow'); return; }
    if (key === 'scheme') scheme = b.dataset.scheme; else view = b.dataset.view;
    frame.contentWindow.postMessage({type:'design-preview', scheme, view}, location.origin);
    frame.title = `${scheme} 布局：${view === 'home' ? '首页' : '文章阅读'}预览`; note.textContent = descriptions[scheme];
  }));
})();
