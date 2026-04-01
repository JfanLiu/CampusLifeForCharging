const state = {
  session: null,
  account: null,
  chargeStatus: null,
  priceInfo: null,
  records: [],
  recordMonth: getDefaultMonth(),
  jacount: null,
  chargeList: null,
  stations: null,
  stationQuery: '',
  stationFilter: 'all',
  expandedStations: new Set(),
  message: null,
  payment: null,
  mobileLayout: false,
  mobileTab: 'welcome',
  scanner: {
    active: false,
    detector: null,
    stream: null,
    rafId: 0,
  },
};

const elements = {};
let toastTimer = 0;

document.addEventListener('DOMContentLoaded', () => {
  captureElements();
  bindEvents();
  initializeApp().catch((error) => {
    console.error(error);
    showToast(error.message || '初始化失败', true);
  });
});

function captureElements() {
  Object.assign(elements, {
    heroSection: document.getElementById('hero-section'),
    loginView: document.getElementById('login-view'),
    dashboardView: document.getElementById('dashboard-view'),
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginSubmit: document.getElementById('login-submit'),
    dashboardStats: document.getElementById('dashboard-stats'),
    profileName: document.getElementById('profile-name'),
    profilePhone: document.getElementById('profile-phone'),
    profileAvatar: document.getElementById('profile-avatar'),
    accountSummary: document.getElementById('account-summary'),
    chargeStatusSummary: document.getElementById('charge-status-summary'),
    refreshAccount: document.getElementById('refresh-account'),
    refreshChargeStatus: document.getElementById('refresh-charge-status'),
    chargeForm: document.getElementById('charge-form'),
    chargeQrcode: document.getElementById('charge-qrcode'),
    scanTriggers: document.querySelectorAll('[data-scan-trigger]'),
    focusChargeInput: document.getElementById('focus-charge-input'),
    chargeQuickMeta: document.getElementById('charge-quick-meta'),
    chargeContextNote: document.getElementById('charge-context-note'),
    payForm: document.getElementById('pay-form'),
    payAmount: document.getElementById('pay-amount'),
    paymentLaunch: document.getElementById('payment-launch'),
    paymentMessage: document.getElementById('payment-message'),
    paymentOpen: document.getElementById('payment-open'),
    paymentRefresh: document.getElementById('payment-refresh'),
    paymentUrl: document.getElementById('payment-url'),
    recordsForm: document.getElementById('records-form'),
    recordsYear: document.getElementById('records-yy'),
    recordsMonth: document.getElementById('records-mm'),
    recordsList: document.getElementById('records-list'),
    fetchPriceInfo: document.getElementById('fetch-price-info'),
    fetchJacount: document.getElementById('fetch-jacount'),
    fetchChargeList: document.getElementById('fetch-charge-list'),
    fetchMessage: document.getElementById('fetch-message'),
    priceInfoRaw: document.getElementById('price-info-raw'),
    jacountRaw: document.getElementById('jacount-raw'),
    chargeListRaw: document.getElementById('charge-list-raw'),
    stationNote: document.getElementById('station-note'),
    stationSummary: document.getElementById('station-summary'),
    stationResultsMeta: document.getElementById('station-results-meta'),
    stationSearch: document.getElementById('station-search'),
    stationGrid: document.getElementById('station-grid'),
    refreshOverview: document.getElementById('refresh-overview'),
    refreshStations: document.getElementById('refresh-stations'),
    stationAvailableShortcut: document.getElementById('station-available-shortcut'),
    stationResetFilters: document.getElementById('station-reset-filters'),
    expandStations: document.getElementById('expand-stations'),
    collapseStations: document.getElementById('collapse-stations'),
    messageRaw: document.getElementById('message-raw'),
    logoutButtons: document.querySelectorAll('[data-logout-trigger]'),
    mobileJumpButtons: document.querySelectorAll('[data-mobile-nav-jump]'),
    mobileGuestNav: document.getElementById('mobile-guest-nav'),
    mobileAuthNav: document.getElementById('mobile-auth-nav'),
    mobileNavButtons: document.querySelectorAll('[data-mobile-nav]'),
    mobilePanels: document.querySelectorAll('[data-mobile-panel]'),
    mobilePanelGroups: document.querySelectorAll('#dashboard-view > .grid-two'),
    scannerModal: document.getElementById('scanner-modal'),
    scannerClose: document.getElementById('scanner-close'),
    scannerVideo: document.getElementById('scanner-video'),
    scannerStatus: document.getElementById('scanner-status'),
    toast: document.getElementById('toast'),
  });
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.refreshAccount.addEventListener('click', () => loadAccount(true));
  elements.refreshChargeStatus.addEventListener('click', () => loadChargeStatus(true));
  elements.chargeForm.addEventListener('submit', handleChargeSubmit);
  elements.scanTriggers.forEach((button) => {
    button.addEventListener('click', openScanner);
  });
  elements.focusChargeInput.addEventListener('click', focusChargeInput);
  elements.payForm.addEventListener('submit', handlePaySubmit);
  elements.paymentOpen.addEventListener('click', openPaymentLink);
  elements.paymentRefresh.addEventListener('click', refreshAfterPayment);
  elements.recordsForm.addEventListener('submit', handleRecordsSubmit);
  elements.fetchPriceInfo.addEventListener('click', () => loadPriceInfo(true));
  elements.fetchJacount.addEventListener('click', () => loadJacount(true));
  elements.fetchChargeList.addEventListener('click', () => loadChargeList(true));
  elements.fetchMessage.addEventListener('click', () => loadMessage(true));
  elements.refreshOverview.addEventListener('click', refreshOverview);
  elements.refreshStations.addEventListener('click', () => loadStations(true));
  elements.stationAvailableShortcut.addEventListener('click', () => {
    state.stationFilter = 'available';
    syncStationFilterButtons();
    renderStations();
  });
  elements.stationResetFilters.addEventListener('click', resetStationFilters);
  elements.expandStations.addEventListener('click', expandAllStations);
  elements.collapseStations.addEventListener('click', collapseAllStations);
  elements.stationSearch.addEventListener('input', (event) => {
    state.stationQuery = event.target.value.trim().toLowerCase();
    renderStations();
  });
  elements.stationGrid.addEventListener('click', handleStationGridClick);
  elements.logoutButtons.forEach((button) => {
    button.addEventListener('click', handleLogout);
  });
  elements.mobileNavButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMobileTab(button.dataset.mobileNav, {
        targetId: button.dataset.mobileNavTarget,
      });
    });
  });
  elements.mobileJumpButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setMobileTab(button.dataset.mobileNavJump, {
        targetId: button.dataset.mobileNavTarget,
      });
    });
  });
  elements.scannerClose.addEventListener('click', closeScanner);
  elements.scannerModal.addEventListener('click', (event) => {
    if (event.target === elements.scannerModal) {
      closeScanner();
    }
  });

  document.querySelectorAll('[data-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      elements.payAmount.value = button.getAttribute('data-amount') || '';
    });
  });

  document.querySelectorAll('[data-station-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.stationFilter = button.getAttribute('data-station-filter') || 'all';
      syncStationFilterButtons();
      renderStations();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.scanner.active) {
      closeScanner();
    }
  });
  document.addEventListener('click', handleInternalSectionJump);
  window.addEventListener('resize', syncMobileLayout);
}

async function initializeApp() {
  syncMobileLayout();
  syncMobileTabFromHash();
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  syncStationFilterButtons();
  await handlePaymentReturnFromUrl();
  await restoreSession();
  if (!state.stations) {
    await loadStations(false);
  }
}

async function restoreSession() {
  const session = await api('/api/session');
  if (!session.loggedIn) {
    state.session = null;
    render();
    return;
  }

  const bootstrap = await api('/api/bootstrap');
  state.session = bootstrap.session;
  state.account = bootstrap.account;
  state.chargeStatus = bootstrap.chargeStatus;
  state.priceInfo = bootstrap.priceInfo;
  state.records = bootstrap.records || [];
  state.stations = bootstrap.stations || state.stations;
  state.recordMonth = bootstrap.recordMonth || state.recordMonth;
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  render();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!username || !password) {
    showToast('请输入账号和密码', true);
    return;
  }

  setButtonBusy(elements.loginSubmit, true, '登录中...');
  try {
    const session = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    state.session = session;
    state.mobileTab = 'overview';
    elements.loginPassword.value = '';
    showToast('登录成功');
    await loadBootstrap();
  } catch (error) {
    showToast(error.message || '登录失败', true);
  } finally {
    setButtonBusy(elements.loginSubmit, false, '登录');
  }
}

async function loadBootstrap() {
  const bootstrap = await api('/api/bootstrap');
  state.session = bootstrap.session;
  state.account = bootstrap.account;
  state.chargeStatus = bootstrap.chargeStatus;
  state.priceInfo = bootstrap.priceInfo;
  state.records = bootstrap.records || [];
  state.stations = bootstrap.stations || state.stations;
  state.recordMonth = bootstrap.recordMonth || state.recordMonth;
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  render();
}

async function handleLogout() {
  await api('/api/logout', { method: 'POST', body: '{}' });
  state.session = null;
  state.account = null;
  state.chargeStatus = null;
  state.priceInfo = null;
  state.records = [];
  state.jacount = null;
  state.chargeList = null;
  state.message = null;
  state.payment = null;
  state.mobileTab = 'login';
  closeScanner();
  render();
  scrollToSection('login-view');
  showToast('已退出登录');
}

async function refreshOverview() {
  setButtonBusy(elements.refreshOverview, true, '更新中...');
  try {
    await loadBootstrap();
    showToast('总览已刷新');
  } catch (error) {
    showToast(error.message || '总览刷新失败', true);
  } finally {
    setButtonBusy(elements.refreshOverview, false, '刷新总览');
  }
}

function focusChargeInput() {
  elements.chargeQrcode.focus();
  elements.chargeQrcode.select();
  scrollToSection('charge-section');
}

function resetStationFilters() {
  state.stationQuery = '';
  state.stationFilter = 'all';
  elements.stationSearch.value = '';
  syncStationFilterButtons();
  renderStations();
}

async function loadAccount(withToast = false) {
  try {
    state.account = await api('/api/account');
    renderAccount();
    renderDashboardStats();
    if (withToast) {
      showToast('余额已刷新');
    }
  } catch (error) {
    showToast(error.message || '余额刷新失败', true);
  }
}

async function loadChargeStatus(withToast = false) {
  try {
    state.chargeStatus = await api('/api/charge-status');
    renderChargeStatus();
    renderDashboardStats();
    if (withToast) {
      showToast('充电状态已刷新');
    }
  } catch (error) {
    showToast(error.message || '状态刷新失败', true);
  }
}

async function loadPriceInfo(withToast = false) {
  try {
    state.priceInfo = await api('/api/price-info');
    renderAdvanced();
    if (withToast) {
      showToast('价格信息已刷新');
    }
  } catch (error) {
    showToast(error.message || '价格信息加载失败', true);
  }
}

async function loadJacount(withToast = false) {
  try {
    state.jacount = await api('/api/jacount');
    renderAdvanced();
    if (withToast) {
      showToast('电表信息已刷新');
    }
  } catch (error) {
    showToast(error.message || '电表信息加载失败', true);
  }
}

async function loadChargeList(withToast = false) {
  try {
    state.chargeList = await api('/api/charge-list');
    renderAdvanced();
    if (withToast) {
      showToast('充电列表已刷新');
    }
  } catch (error) {
    showToast(error.message || '充电列表加载失败', true);
  }
}

async function loadMessage(withToast = false) {
  try {
    state.message = await api('/api/message', { method: 'POST', body: '{}' });
    renderAdvanced();
    if (withToast) {
      showToast('用户消息已刷新');
    }
  } catch (error) {
    showToast(error.message || '用户消息加载失败', true);
  }
}

async function loadStations(withToast = false) {
  try {
    state.stations = await api('/api/stations');
    renderStations();
    renderDashboardStats();
    if (withToast) {
      showToast('地点状态已刷新');
    }
  } catch (error) {
    showToast(error.message || '地点状态加载失败', true);
  }
}

async function handleChargeSubmit(event) {
  event.preventDefault();
  const qrcode = elements.chargeQrcode.value.trim();
  if (!/^\d+$/.test(qrcode)) {
    showToast('请输入纯数字二维码后 8 位', true);
    return;
  }

  const submitButton =
    event.submitter || elements.chargeForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '提交中...');
  try {
    const result = await api('/api/charge', {
      method: 'POST',
      body: JSON.stringify({ qrcode }),
    });
    showToast(result.note || '充电请求已提交');
    await Promise.all([loadAccount(false), loadChargeStatus(false)]);
  } catch (error) {
    showToast(error.message || '充电失败', true);
  } finally {
    setButtonBusy(submitButton, false, '开始充电');
  }
}

async function handlePaySubmit(event) {
  event.preventDefault();
  const amount = Number(elements.payAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('请输入合法的充值金额', true);
    return;
  }

  const submitButton =
    event.submitter || elements.payForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '生成中...');
  try {
    state.payment = await api('/api/pay/apply', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    renderPayment();
    showToast('支付订单已生成');
  } catch (error) {
    showToast(error.message || '支付订单生成失败', true);
  } finally {
    setButtonBusy(submitButton, false, '生成支付订单');
  }
}

async function refreshAfterPayment() {
  await Promise.all([loadAccount(false), loadChargeStatus(false)]);
  showToast('已刷新余额与状态');
}

function openPaymentLink() {
  const launch = state.payment?.launch;
  if (!launch?.gatewayUrl || !launch?.formFields) {
    showToast('当前没有可用的支付链接', true);
    return;
  }

  if (launch.webSupported === false) {
    showToast('当前上游只返回 App 支付订单，Web 端无法直接完成支付。', true);
    return;
  }

  const isMobile = /iphone|ipad|android|mobile/i.test(navigator.userAgent);
  if (!isMobile && launch.method === 'alipay.trade.app.pay') {
    showToast('当前是支付宝 App 支付单，桌面浏览器拉起成功率较低，建议在手机上继续。', true);
  }
  const target = isMobile ? '_self' : '_blank';
  submitPaymentForm(launch.gatewayUrl, launch.formFields, target);
}

async function handleRecordsSubmit(event) {
  event.preventDefault();
  const yy = elements.recordsYear.value.trim();
  const mm = elements.recordsMonth.value.trim().padStart(2, '0');

  if (!/^\d{4}$/.test(yy) || !/^\d{2}$/.test(mm)) {
    showToast('请输入正确的年月', true);
    return;
  }

  const submitButton =
    event.submitter || elements.recordsForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '查询中...');
  try {
    state.records = await api(
      `/api/charge-records?yy=${encodeURIComponent(yy)}&mm=${encodeURIComponent(mm)}`,
    );
    state.recordMonth = { yy, mm };
    renderRecords();
    renderDashboardStats();
    showToast('记录已刷新');
  } catch (error) {
    showToast(error.message || '记录查询失败', true);
  } finally {
    setButtonBusy(submitButton, false, '查询记录');
  }
}

async function handlePaymentReturnFromUrl() {
  const query = new URLSearchParams(window.location.search);
  if (!query.size) {
    return;
  }

  const entries = Object.fromEntries(query.entries());
  const hasPaymentLikeField = Object.keys(entries).some((key) =>
    ['resultStatus', 'memo', 'result', 'trade_status', 'out_trade_no'].includes(key),
  );

  if (!hasPaymentLikeField) {
    return;
  }

  try {
    await api('/api/pay/return', {
      method: 'POST',
      body: JSON.stringify({
        returnContent: JSON.stringify(entries),
      }),
    });
    showToast('已回传支付结果');
  } catch (error) {
    showToast(`支付结果回传失败：${error.message}`, true);
  } finally {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function openScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('当前浏览器不支持相机访问', true);
    return;
  }

  elements.scannerStatus.textContent = '正在尝试打开后置摄像头。';
  elements.scannerModal.classList.remove('hidden');
  state.scanner.active = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    });

    state.scanner.stream = stream;
    elements.scannerVideo.srcObject = stream;
    await elements.scannerVideo.play();

    if (!('BarcodeDetector' in window)) {
      elements.scannerStatus.textContent =
        '当前浏览器没有内置条码识别能力。请手动输入二维码后 8 位，或换到支持 BarcodeDetector 的浏览器。';
      return;
    }

    const desiredFormats = [
      'qr_code',
      'code_128',
      'code_39',
      'code_93',
      'ean_13',
      'ean_8',
      'pdf417',
      'aztec',
      'data_matrix',
    ];
    const supportedFormats =
      typeof BarcodeDetector.getSupportedFormats === 'function'
        ? await BarcodeDetector.getSupportedFormats()
        : desiredFormats;

    const activeFormats = desiredFormats.filter((format) =>
      supportedFormats.includes(format),
    );
    state.scanner.detector = new BarcodeDetector(
      activeFormats.length ? { formats: activeFormats } : undefined,
    );
    elements.scannerStatus.textContent = '识别中，请将二维码放在画面中央。';
    scanLoop();
  } catch (error) {
    closeScanner();
    showToast(error.message || '无法打开摄像头', true);
  }
}

async function scanLoop() {
  if (!state.scanner.active || !state.scanner.detector) {
    return;
  }

  try {
    if (elements.scannerVideo.readyState >= 2) {
      const results = await state.scanner.detector.detect(elements.scannerVideo);
      if (results.length > 0) {
        const code = String(results[0].rawValue || '').trim();
        if (code) {
          elements.chargeQrcode.value = code.slice(-8);
          closeScanner();
          showToast('已识别并回填二维码');
          return;
        }
      }
    }
  } catch (error) {
    elements.scannerStatus.textContent = `识别失败：${error.message}`;
  }

  state.scanner.rafId = window.requestAnimationFrame(() => {
    scanLoop();
  });
}

function closeScanner() {
  state.scanner.active = false;
  if (state.scanner.rafId) {
    window.cancelAnimationFrame(state.scanner.rafId);
    state.scanner.rafId = 0;
  }
  if (state.scanner.stream) {
    state.scanner.stream.getTracks().forEach((track) => track.stop());
    state.scanner.stream = null;
  }
  state.scanner.detector = null;
  elements.scannerVideo.srcObject = null;
  elements.scannerModal.classList.add('hidden');
}

function handleStationGridClick(event) {
  const toggle = event.target.closest('[data-station-toggle]');
  if (!toggle) {
    return;
  }

  const stationId = toggle.getAttribute('data-station-toggle');
  if (!stationId) {
    return;
  }

  if (state.expandedStations.has(stationId)) {
    state.expandedStations.delete(stationId);
  } else {
    state.expandedStations.add(stationId);
  }
  renderStations();
}

function expandAllStations() {
  const ids = (state.stations?.locations || [])
    .map((item) => buildStationKey(item))
    .filter(Boolean);
  state.expandedStations = new Set(ids);
  renderStations();
}

function collapseAllStations() {
  state.expandedStations.clear();
  renderStations();
}

function syncStationFilterButtons() {
  document.querySelectorAll('[data-station-filter]').forEach((item) => {
    item.classList.toggle(
      'chip-active',
      item.getAttribute('data-station-filter') === state.stationFilter,
    );
  });
}

function handleInternalSectionJump(event) {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || !state.mobileLayout) {
    return;
  }

  const targetId = anchor.getAttribute('href').slice(1);
  const target = targetId ? document.getElementById(targetId) : null;
  const panel = target?.closest('[data-mobile-panel]');
  if (!target || !panel?.dataset.mobilePanel) {
    return;
  }

  event.preventDefault();
  setMobileTab(panel.dataset.mobilePanel, { targetId });
}

function syncMobileLayout() {
  state.mobileLayout = window.innerWidth <= 720;
  document.body.classList.toggle('mobile-nav-mode', state.mobileLayout);
  syncMobileNavigation();
}

function syncMobileTabFromHash() {
  const targetId = window.location.hash.replace(/^#/u, '');
  if (!targetId) {
    return;
  }

  const target = document.getElementById(targetId);
  const panel = target?.closest('[data-mobile-panel]');
  if (panel?.dataset.mobilePanel) {
    state.mobileTab = panel.dataset.mobilePanel;
  }
}

function ensureMobileTab() {
  const availableTabs = state.session
    ? ['overview', 'charge', 'records', 'stations', 'more']
    : ['welcome', 'login', 'stations'];

  if (!availableTabs.includes(state.mobileTab)) {
    state.mobileTab = state.session ? 'overview' : 'welcome';
  }
}

function syncMobileNavigation() {
  ensureMobileTab();

  const loggedIn = Boolean(state.session);
  const activeTab = state.mobileTab;

  elements.mobileGuestNav.classList.toggle('hidden', !state.mobileLayout || loggedIn);
  elements.mobileAuthNav.classList.toggle('hidden', !state.mobileLayout || !loggedIn);

  elements.mobilePanels.forEach((panel) => {
    panel.classList.toggle(
      'mobile-panel-hidden',
      state.mobileLayout && panel.dataset.mobilePanel !== activeTab,
    );
  });

  elements.mobilePanelGroups.forEach((group) => {
    const hasVisibleChild = Array.from(group.children).some(
      (child) =>
        !child.classList.contains('hidden') && !child.classList.contains('mobile-panel-hidden'),
    );
    group.classList.toggle('mobile-group-hidden', state.mobileLayout && !hasVisibleChild);
  });

  const hasVisibleDashboardChild = Array.from(elements.dashboardView.children).some(
    (child) =>
      !child.classList.contains('hidden') &&
      !child.classList.contains('mobile-panel-hidden') &&
      !child.classList.contains('mobile-group-hidden'),
  );
  elements.dashboardView.classList.toggle(
    'mobile-dashboard-hidden',
    state.mobileLayout && loggedIn && !hasVisibleDashboardChild,
  );

  elements.mobileNavButtons.forEach((button) => {
    const navName = button.dataset.mobileNav;
    const navRoot = button.closest('.mobile-nav');
    const isActiveNav =
      (loggedIn && navRoot === elements.mobileAuthNav) ||
      (!loggedIn && navRoot === elements.mobileGuestNav);
    const active = isActiveNav && navName === activeTab;

    button.classList.toggle('mobile-nav-item-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function setMobileTab(tab, options = {}) {
  if (!tab) {
    return;
  }

  state.mobileTab = tab;
  syncMobileNavigation();

  if (options.scroll === false) {
    return;
  }

  scrollToSection(options.targetId || getDefaultMobileTarget(tab));
}

function getDefaultMobileTarget(tab) {
  switch (tab) {
    case 'login':
      return 'login-view';
    case 'overview':
      return 'dashboard-view';
    case 'charge':
      return 'charge-section';
    case 'records':
      return 'records-section';
    case 'stations':
      return 'stations-section';
    case 'more':
      return 'tools-section';
    case 'welcome':
    default:
      return 'hero-section';
  }
}

function scrollToSection(targetId) {
  if (!targetId) {
    return;
  }

  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  window.requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}

function render() {
  const loggedIn = Boolean(state.session);
  elements.heroSection.classList.toggle('hidden', loggedIn);
  elements.loginView.classList.toggle('hidden', loggedIn);
  elements.dashboardView.classList.toggle('hidden', !loggedIn);
  syncMobileNavigation();
  renderStations();

  if (!loggedIn) {
    if (!state.mobileLayout || state.mobileTab === 'login') {
      elements.loginUsername.focus();
    }
    return;
  }

  renderProfile();
  renderDashboardStats();
  renderAccount();
  renderChargeStatus();
  renderChargeUtility();
  renderRecords();
  renderAdvanced();
  renderPayment();
}

function renderProfile() {
  const profile = state.session?.profile || {};
  elements.profileName.textContent = profile.username || '未命名用户';
  elements.profilePhone.textContent = profile.phone || '未提供手机号';
  elements.profileAvatar.innerHTML = '';

  if (profile.avatar) {
    const image = document.createElement('img');
    image.src = profile.avatar;
    image.alt = profile.username || 'avatar';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      elements.profileAvatar.textContent = buildInitials(profile.username);
    });
    elements.profileAvatar.appendChild(image);
  } else {
    elements.profileAvatar.textContent = buildInitials(profile.username);
  }
}

function renderDashboardStats() {
  if (!elements.dashboardStats) {
    return;
  }

  elements.dashboardStats.innerHTML = '';
  if (!state.session) {
    return;
  }

  const chargeSummary = summarizeChargeStatus(state.chargeStatus);
  const totalLocations = Number(state.stations?.totals?.locationCount || 0);
  const freePiles = Number(state.stations?.totals?.freeCount || 0);
  const availableLocations = (state.stations?.locations || []).filter(
    (item) => Number(item.freeCount || 0) > 0,
  ).length;
  const stats = [
    {
      label: '账户余额',
      value: state.account?.acbalance || '-',
      caption: state.account?.jacountroom || state.account?.jacountname || '校园账户已连接',
    },
    {
      label: '当前充电',
      value: chargeSummary.value,
      caption: chargeSummary.caption,
    },
    {
      label: '本月记录',
      value: String(Array.isArray(state.records) ? state.records.length : 0),
      caption: `${state.recordMonth.yy}-${state.recordMonth.mm}`,
    },
    {
      label: '可用地点',
      value: totalLocations ? `${availableLocations}/${totalLocations}` : '-',
      caption: totalLocations ? `空闲桩 ${freePiles} 根` : '地点状态尚未加载',
    },
  ];

  stats.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'snapshot-card';
    card.innerHTML = `
      <div class="snapshot-label">${escapeHtml(item.label)}</div>
      <div class="snapshot-value">${escapeHtml(item.value)}</div>
      <div class="snapshot-caption">${escapeHtml(item.caption)}</div>
    `;
    elements.dashboardStats.appendChild(card);
  });
}

function renderAccount() {
  const account = state.account;
  if (!account) {
    renderDefinitionList(elements.accountSummary, [['状态', '暂无数据']]);
    return;
  }

  renderDefinitionList(elements.accountSummary, [
    ['账户余额', account.acbalance || '-'],
    ['电表名称', account.jacountname || '-'],
    ['电表编号', account.jacountno || '-'],
    ['电表房间', account.jacountroom || '-'],
  ]);
}

function renderChargeStatus() {
  const status = state.chargeStatus;
  if (!status || !Object.keys(status).length) {
    renderDefinitionList(elements.chargeStatusSummary, [['当前状态', '当前暂无充电记录']]);
    return;
  }

  renderDefinitionList(elements.chargeStatusSummary, [
    ['当前状态', status.chargestatus || '-'],
    ['设备位置', status.position || '-'],
    ['开始时间', status.bgtime || '-'],
    ['持续时长', status.duration || '-'],
    ['用电量', status.quantity || '-'],
    ['当前费用', status.price || '-'],
  ]);
}

function renderChargeUtility() {
  const quickItems = [];
  const balance = state.account?.acbalance;
  const status = state.chargeStatus;

  if (balance) {
    quickItems.push({
      label: '余额',
      value: balance,
      tone: 'accent',
    });
  }

  if (status && Object.keys(status).length) {
    quickItems.push({
      label: '当前状态',
      value: status.chargestatus || '进行中',
      tone: 'teal',
    });
    if (status.position) {
      quickItems.push({
        label: '设备位置',
        value: status.position,
        tone: 'neutral',
      });
    }
  } else {
    quickItems.push({
      label: '当前状态',
      value: '暂无充电',
      tone: 'neutral',
    });
  }

  const supportsScanner = Boolean(
    navigator.mediaDevices?.getUserMedia && 'BarcodeDetector' in window,
  );
  elements.chargeContextNote.textContent = supportsScanner
    ? '当前浏览器支持扫码，建议到设备旁后直接打开相机；识别失败时再手动输入后 8 位。'
    : '当前浏览器可能无法直接识别条码，建议优先手动输入二维码后 8 位，或换到支持扫码的浏览器。';

  elements.chargeQuickMeta.innerHTML = quickItems
    .map(
      (item) => `
        <div class="charge-meta-pill charge-meta-${escapeHtml(item.tone || 'neutral')}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>`,
    )
    .join('');
}

function renderRecords() {
  const records = Array.isArray(state.records) ? state.records : [];
  elements.recordsList.innerHTML = '';

  if (records.length === 0) {
    const emptyCard = document.createElement('article');
    emptyCard.className = 'empty-card';
    emptyCard.textContent = `${state.recordMonth.yy}-${state.recordMonth.mm} 暂无记录`;
    elements.recordsList.appendChild(emptyCard);
    return;
  }

  records.forEach((record, index) => {
    const card = document.createElement('article');
    card.className = 'record-card';

    const title = document.createElement('h3');
    title.textContent = record.position || record.bgtime || `记录 ${index + 1}`;
    card.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'record-grid';
    for (const [key, value] of Object.entries(record)) {
      grid.appendChild(buildRecordRow(key, value));
    }
    card.appendChild(grid);
    elements.recordsList.appendChild(card);
  });
}

function renderAdvanced() {
  elements.priceInfoRaw.textContent = prettyJson(state.priceInfo);
  elements.jacountRaw.textContent = prettyJson(state.jacount);
  elements.chargeListRaw.textContent = prettyJson(state.chargeList);
  elements.messageRaw.textContent = prettyJson(state.message);
}

function renderPayment() {
  const launch = state.payment?.launch;
  const visible = Boolean(launch);
  elements.paymentLaunch.classList.toggle('hidden', !visible);
  if (!visible) {
    elements.paymentUrl.value = '';
    elements.paymentMessage.textContent = '';
    return;
  }

  elements.paymentMessage.textContent =
    `${launch.message || '支付订单已生成。'} 当前 method=${launch.method || '-'}，product_code=${launch.productCode || '-' }。`;
  elements.paymentOpen.disabled = launch.webSupported === false;
  elements.paymentOpen.textContent =
    launch.webSupported === false ? '当前 Web 无法支付' : '前往支付宝';
  elements.paymentUrl.value = prettyJson({
    gatewayUrl: launch.gatewayUrl || '',
    method: launch.method || '',
    productCode: launch.productCode || '',
    webSupported: launch.webSupported !== false,
    strategy: launch.strategy || '',
    queryUrl: launch.queryUrl || '',
  });
}

function renderStations() {
  const overview = state.stations;
  elements.stationSummary.innerHTML = '';
  elements.stationGrid.innerHTML = '';

  if (!overview) {
    elements.stationNote.textContent = '地点状态尚未加载。';
    elements.stationResultsMeta.textContent = '还没有地点数据，稍后可点“刷新地点状态”再试。';
    return;
  }

  elements.stationNote.textContent = overview.note
    ? `${overview.note} 逐桩列表默认折叠，方便手机上快速浏览。`
    : '逐桩列表默认折叠，方便手机上快速浏览。';

  const totals = overview.totals || {};
  const locations = Array.isArray(overview.locations) ? overview.locations : [];
  const availableLocations = locations.filter((item) => Number(item.freeCount || 0) > 0).length;
  const statRows = [
    ['地点数', totals.locationCount ?? 0],
    ['可用地点', availableLocations],
    ['充电桩总数', totals.totalCount ?? 0],
    ['空闲桩', totals.freeCount ?? 0],
    ['充电中', totals.chargingCount ?? 0],
    ['异常桩', totals.errorCount ?? 0],
  ];

  statRows.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'station-stat';
    card.innerHTML = `
      <div class="station-stat-label">${escapeHtml(label)}</div>
      <div class="station-stat-value">${escapeHtml(String(value))}</div>
    `;
    elements.stationSummary.appendChild(card);
  });

  const filtered = locations
    .filter((item) => {
      const piles = Array.isArray(item.piles) ? item.piles : [];
      const matchesQuery =
        !state.stationQuery ||
        String(item.rname || '').toLowerCase().includes(state.stationQuery) ||
        piles.some((pile) =>
          String(pile.name || '').toLowerCase().includes(state.stationQuery),
        );

      if (!matchesQuery) {
        return false;
      }

      if (state.stationFilter === 'all') {
        return true;
      }
      if (state.stationFilter === 'available') {
        return item.statusCode === 'available';
      }
      if (state.stationFilter === 'busy') {
        return item.statusCode === 'busy' || item.statusCode === 'mixed';
      }
      if (state.stationFilter === 'fault') {
        return item.statusCode === 'fault';
      }
      return true;
    })
    .sort(compareStations);

  elements.stationResultsMeta.textContent = buildStationResultsMeta(
    filtered,
    locations.length,
    availableLocations,
  );

  if (filtered.length === 0) {
    const empty = document.createElement('article');
    empty.className = 'empty-card';
    empty.textContent = '当前筛选条件下没有匹配的地点。';
    elements.stationGrid.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const stationId = buildStationKey(item);
    const piles = Array.isArray(item.piles) ? item.piles : [];
    const expanded = state.expandedStations.has(stationId);
    const visiblePiles = expanded ? piles : piles.slice(0, 6);
    const pileMarkup = piles.length
      ? `
        <div class="station-piles">
          ${visiblePiles
            .map(
              (pile) => `
                <div class="pile-item status-${pile.statusCode || 'unknown'}">
                  <div class="pile-name">${escapeHtml(pile.name || '未命名充电桩')}</div>
                  <div class="pile-status">${escapeHtml(
                    pile.statusLabel || pile.status || '状态未知',
                  )}</div>
                </div>`,
            )
            .join('')}
        </div>
      `
      : '<div class="empty-card">当前地点没有拿到逐桩数据。</div>';
    const previewText = piles.length
      ? expanded
        ? `已展开 ${piles.length} 根`
        : `预览 ${visiblePiles.length} / ${piles.length} 根`
      : '暂无逐桩数据';
    const toggleMarkup =
      piles.length > 6
        ? `<button class="button button-secondary button-small" data-station-toggle="${escapeHtml(
            stationId,
          )}" type="button">${expanded ? '收起逐桩' : `展开全部 ${piles.length} 根`}</button>`
        : '';
    const card = document.createElement('article');
    card.className = `station-card status-${item.statusCode || 'unknown'}`;
    card.innerHTML = `
      <div class="station-card-header">
        <div>
          <h3>${escapeHtml(item.rname || '未命名地点')}</h3>
          <p class="muted">地点编号 ${escapeHtml(item.rid || '-')}</p>
        </div>
        <span class="status-pill status-${item.statusCode || 'unknown'}">${escapeHtml(item.statusLabel || '状态未知')}</span>
      </div>
      <div class="station-meta">
        <span class="meta-pill">空闲 ${escapeHtml(String(item.freeCount ?? 0))}</span>
        <span class="meta-pill">充电中 ${escapeHtml(String(item.chargingCount ?? 0))}</span>
        <span class="meta-pill">异常 ${escapeHtml(String(item.errorCount ?? 0))}</span>
        <span class="meta-pill">总计 ${escapeHtml(String(item.totalCount ?? 0))}</span>
      </div>
      <div class="pile-section">
        <div class="pile-section-head">
          <div>
            <div class="muted">逐桩状态</div>
            <div class="pile-preview-note">${escapeHtml(previewText)}</div>
          </div>
          ${toggleMarkup}
        </div>
        ${pileMarkup}
      </div>
    `;
    elements.stationGrid.appendChild(card);
  });
}

function renderDefinitionList(container, rows) {
  container.innerHTML = '';
  rows.forEach(([term, value]) => {
    const row = document.createElement('div');
    row.className = 'definition-row';

    const termElement = document.createElement('div');
    termElement.className = 'definition-term';
    termElement.textContent = term;

    const valueElement = document.createElement('div');
    valueElement.className = 'definition-value';
    valueElement.textContent = value || '-';

    row.appendChild(termElement);
    row.appendChild(valueElement);
    container.appendChild(row);
  });
}

function buildRecordRow(key, value) {
  const row = document.createElement('div');
  row.className = 'definition-row';

  const keyElement = document.createElement('div');
  keyElement.className = 'definition-term';
  keyElement.textContent = key;

  const valueElement = document.createElement('div');
  valueElement.className = 'definition-value';
  valueElement.textContent = value == null ? '-' : String(value);

  row.appendChild(keyElement);
  row.appendChild(valueElement);
  return row;
}

function summarizeChargeStatus(status) {
  if (!status || !Object.keys(status).length) {
    return {
      value: '未充电',
      caption: '当前暂无充电记录',
    };
  }

  return {
    value: status.chargestatus || '进行中',
    caption: status.position || status.bgtime || '设备状态已更新',
  };
}

function compareStations(left, right) {
  const leftRank = getStationRank(left);
  const rightRank = getStationRank(right);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const freeGap = Number(right.freeCount || 0) - Number(left.freeCount || 0);
  if (freeGap !== 0) {
    return freeGap;
  }

  const totalGap = Number(right.totalCount || 0) - Number(left.totalCount || 0);
  if (totalGap !== 0) {
    return totalGap;
  }

  return String(left.rname || '').localeCompare(String(right.rname || ''), 'zh-CN');
}

function getStationRank(item) {
  switch (item.statusCode) {
    case 'available':
      return 0;
    case 'mixed':
      return 1;
    case 'busy':
      return 2;
    case 'fault':
      return 3;
    default:
      return 4;
  }
}

function buildStationResultsMeta(filtered, totalCount, availableCount) {
  const visibleCount = Array.isArray(filtered) ? filtered.length : 0;
  const queryText = state.stationQuery ? `搜索“${state.stationQuery}”` : '';
  const filterText = getStationFilterLabel(state.stationFilter);
  const prefix = queryText ? `${queryText}，` : '';

  return `${prefix}${filterText}下显示 ${visibleCount}/${totalCount || 0} 个地点，可充电地点共 ${availableCount} 个。`;
}

function getStationFilterLabel(filter) {
  switch (filter) {
    case 'available':
      return '可充电筛选';
    case 'busy':
      return '无空闲筛选';
    case 'fault':
      return '异常筛选';
    case 'all':
    default:
      return '全部地点';
  }
}

function buildStationKey(item) {
  return String(item?.rid || item?.rname || '');
}

function buildInitials(name) {
  return String(name || 'AC').trim().slice(0, 2).toUpperCase();
}

function prettyJson(value) {
  if (value == null) {
    return '尚未加载';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function getDefaultMonth() {
  const now = new Date();
  return {
    yy: String(now.getFullYear()),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function submitPaymentForm(action, fields, target) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.target = target;
  form.style.display = 'none';

  Object.entries(fields || {}).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value ?? '');
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.dataset.tone = isError ? 'error' : 'success';
  elements.toast.classList.remove('hidden');
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2800);
}

function setButtonBusy(button, busy, label) {
  if (!button) {
    return;
  }
  button.disabled = busy;
  button.textContent = label;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (response.status === 401) {
    state.session = null;
    state.mobileTab = 'login';
    render();
  }

  if (!response.ok) {
    throw new Error(payload?.error || '请求失败');
  }

  return payload;
}
