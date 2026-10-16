(() => {
  const status = document.getElementById('app-status');
  const install = document.getElementById('app-install');
  const update = document.getElementById('app-update');
  const help = document.getElementById('install-help');
  const standalone = matchMedia('(display-mode: standalone)');
  let promptEvent, ready = false, failed = false, registration;
  const installed = () => standalone.matches || navigator.standalone === true;
  function render() {
    install.hidden = installed();
    status.textContent = ready
      ? (navigator.onLine ? '오프라인 사용 준비 완료' : '오프라인 · 진단과 기록 저장 가능')
      : failed ? '오프라인 준비 실패 · 인터넷 연결 후 다시 열어 주세요'
      : !navigator.onLine ? '오프라인 · 처음에는 인터넷 연결이 필요합니다'
      : '오프라인 사용 준비 중…';
  }
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  standalone.addEventListener('change', render);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    promptEvent = event;
    install.textContent = '앱 설치';
    render();
  });
  window.addEventListener('appinstalled', () => { promptEvent = null; install.hidden = true; });
  install.addEventListener('click', async () => {
    if (!promptEvent) { help.showModal(); return; }
    const event = promptEvent;
    promptEvent = null;
    try { await event.prompt(); await event.userChoice; }
    catch (_) { help.showModal(); }
    install.textContent = '앱 설치 안내';
  });
  update.addEventListener('click', () => {
    if (registration && registration.waiting) {
      update.disabled = true;
      registration.waiting.postMessage('APPLY_UPDATE');
    }
  });
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.textContent = '앱 설치·오프라인 사용은 HTTPS 주소에서 지원됩니다';
    return;
  }
  let applying = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (update.disabled && !applying) { applying = true; location.reload(); }
  });
  (async () => {
    try {
      registration = await navigator.serviceWorker.register('./dough-kit-sw.js', {scope: './', updateViaCache: 'none'});
      const showUpdate = () => { update.hidden = !(registration.waiting && registration.active); };
      showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', () => {
          showUpdate();
          if (worker.state === 'redundant' && !registration.active) { failed = true; render(); }
        });
      });
      await navigator.serviceWorker.ready;
      ready = true;
      render();
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) registration.update().catch(() => {});
      });
    } catch (_) { failed = true; render(); }
  })();
  render();
})();
