window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.main-article').forEach(element => {
    if (typeof renderMathInElement === 'function') renderMathInElement(element, {
      delimiters: [{left:'$$',right:'$$',display:true},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],
      throwOnError:false, trust:false
    });
  });
});
