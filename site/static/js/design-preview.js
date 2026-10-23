(() => {
  const params = new URLSearchParams(location.search), scheme = params.get('scheme');
  document.body.dataset.scheme = ['A','B','C'].includes(scheme) ? scheme : 'A';
  function show(view) {
    const article = view === 'article'; document.body.dataset.view = article ? 'article' : 'home';
    document.querySelector('.preview-home').hidden = article; document.querySelector('.preview-article').hidden = !article;
    window.scrollTo(0,0);
    if (parent !== window) parent.postMessage({type:'design-preview-view',view:article ? 'article' : 'home'}, location.origin);
  }
  document.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => show(b.dataset.show)));
  document.querySelector('[data-projects]').addEventListener('click', () => show('home'));
  window.addEventListener('message', e => {
    if (e.source !== parent || e.origin !== location.origin || e.data?.type !== 'design-preview') return;
    if (['A','B','C'].includes(e.data.scheme)) document.body.dataset.scheme = e.data.scheme;
    show(e.data.view);
  });
  show(params.get('view'));
})();
