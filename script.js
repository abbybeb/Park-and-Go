const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    panels.forEach((panel) => {
      panel.classList.remove('active');
      panel.setAttribute('aria-hidden', 'true');
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.querySelector(`.tab-panel[data-panel="${target}"]`)?.classList.add('active');
    document.querySelector(`.tab-panel[data-panel="${target}"]`)?.setAttribute('aria-hidden', 'false');
  });
});
