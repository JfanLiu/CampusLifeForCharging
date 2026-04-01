import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { ApiError, api } from '../api/client';
import type {
  BootstrapPayload,
  BusyState,
  ChargeQuickItem,
  DashboardStat,
  DefinitionRow,
  MobileTab,
  MonthValue,
  RecordSummaryCard,
  SessionPayload,
  StationFilter,
} from '../types';
import { useToast } from './useToast';
import {
  buildInitials,
  detectRecordPreset,
  getDefaultMonth,
  getErrorMessage,
  getRelativeMonth,
  summarizeChargeStatus,
  textOf,
} from '../utils/formatters';
import { buildRecordCardModel, summarizeRecords } from '../utils/records';
import {
  buildStationCardModels,
  buildStationKey,
  buildStationResultsMeta,
  buildStationSummaryCards,
} from '../utils/stations';

const GUEST_TABS: MobileTab[] = ['welcome', 'login', 'stations'];
const AUTH_TABS: MobileTab[] = ['overview', 'charge', 'records', 'stations', 'more'];

export function useCampusLifeApp() {
  const toast = useToast();
  const session = ref<SessionPayload | null>(null);
  const account = ref<Record<string, unknown> | null>(null);
  const chargeStatus = ref<Record<string, unknown> | null>(null);
  const records = ref<Array<Record<string, unknown>>>([]);
  const stations = ref<BootstrapPayload['stations']>(null);
  const recordMonth = ref<MonthValue>(getDefaultMonth());
  const mobileTab = ref<MobileTab>('welcome');
  const isMobileLayout = ref(false);
  const stationQuery = ref('');
  const stationFilter = ref<StationFilter>('all');
  const expandedStations = ref<Set<string>>(new Set());

  const loginForm = reactive({
    username: '',
    password: '',
  });
  const chargeForm = reactive({
    qrcode: '',
  });
  const recordForm = reactive(getDefaultMonth());
  const busy = reactive<BusyState>({
    login: false,
    overview: false,
    account: false,
    chargeStatus: false,
    charge: false,
    records: false,
    stations: false,
    payment: false,
  });

  const profile = computed(() => session.value?.profile || null);
  const profileInitials = computed(() => buildInitials(profile.value?.username));
  const dashboardStats = computed<DashboardStat[]>(() => {
    if (!session.value) {
      return [];
    }

    const chargeSummary = summarizeChargeStatus(chargeStatus.value);
    const totalLocations = Number(stations.value?.totals?.locationCount || 0);
    const freePiles = Number(stations.value?.totals?.freeCount || 0);
    const availableLocations = (stations.value?.locations || []).filter(
      (item) => Number(item.freeCount || 0) > 0,
    ).length;

    return [
      {
        label: '账户余额',
        value: textOf(account.value?.acbalance),
        caption: textOf(account.value?.jacountroom ?? account.value?.jacountname, '校园账户已连接'),
      },
      {
        label: '当前充电',
        value: chargeSummary.value,
        caption: chargeSummary.caption,
      },
      {
        label: '本月记录',
        value: String(records.value.length),
        caption: `${recordMonth.value.yy}-${recordMonth.value.mm}`,
      },
      {
        label: '可用地点',
        value: totalLocations ? `${availableLocations}/${totalLocations}` : '-',
        caption: totalLocations ? `空闲桩 ${freePiles} 根` : '地点状态尚未加载',
      },
    ];
  });
  const accountRows = computed<DefinitionRow[]>(() => {
    if (!account.value) {
      return [{ term: '状态', value: '暂无数据' }];
    }

    return [
      { term: '账户余额', value: textOf(account.value.acbalance) },
      { term: '电表名称', value: textOf(account.value.jacountname) },
      { term: '电表编号', value: textOf(account.value.jacountno) },
      { term: '电表房间', value: textOf(account.value.jacountroom) },
    ];
  });
  const chargeStatusRows = computed<DefinitionRow[]>(() => {
    if (!chargeStatus.value || !Object.keys(chargeStatus.value).length) {
      return [{ term: '当前状态', value: '当前暂无充电记录' }];
    }

    return [
      { term: '当前状态', value: textOf(chargeStatus.value.chargestatus) },
      { term: '设备位置', value: textOf(chargeStatus.value.position) },
      { term: '开始时间', value: textOf(chargeStatus.value.bgtime) },
      { term: '持续时长', value: textOf(chargeStatus.value.duration) },
      { term: '用电量', value: textOf(chargeStatus.value.quantity) },
      { term: '当前费用', value: textOf(chargeStatus.value.price) },
    ];
  });
  const supportsScanner = computed(
    () =>
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof window !== 'undefined' &&
      'BarcodeDetector' in window,
  );
  const chargeContextNote = computed(() =>
    supportsScanner.value
      ? '当前浏览器支持网页扫码，你可以直接打开相机，也可以手动输入编号。'
      : '当前浏览器暂不支持网页扫码，你仍然可以手动输入编号继续使用。',
  );
  const chargeQuickItems = computed<ChargeQuickItem[]>(() => {
    const items: ChargeQuickItem[] = [];
    if (account.value?.acbalance != null) {
      items.push({
        label: '余额',
        value: textOf(account.value.acbalance),
        tone: 'accent',
      });
    }

    if (chargeStatus.value && Object.keys(chargeStatus.value).length) {
      items.push({
        label: '当前状态',
        value: textOf(chargeStatus.value.chargestatus, '进行中'),
        tone: 'teal',
      });

      if (chargeStatus.value.position != null) {
        items.push({
          label: '设备位置',
          value: textOf(chargeStatus.value.position),
          tone: 'neutral',
        });
      }
    } else {
      items.push({
        label: '当前状态',
        value: '暂无充电',
        tone: 'neutral',
      });
    }

    return items;
  });
  const recordSummary = computed<RecordSummaryCard[]>(() => {
    const summary = summarizeRecords(records.value);
    return [
      {
        label: '查询月份',
        value: `${recordMonth.value.yy}-${recordMonth.value.mm}`,
        caption: `共 ${summary.count} 条记录`,
      },
      {
        label: '费用合计',
        value: summary.totalPriceText,
        caption: '按当前月份记录汇总',
      },
      {
        label: '用电量',
        value: summary.totalQuantityText,
        caption: '仅统计可识别的数值',
      },
    ];
  });
  const recordCards = computed(() => records.value.map((record, index) => buildRecordCardModel(record, index)));
  const activeRecordPreset = computed(() => detectRecordPreset(recordMonth.value));
  const stationSummaryCards = computed(() => buildStationSummaryCards(stations.value));
  const stationView = computed(() =>
    buildStationCardModels(stations.value, stationQuery.value, stationFilter.value, expandedStations.value),
  );
  const stationNote = computed(
    () =>
      stations.value?.note ||
      '这里会展示各地点和充电桩的当前状态，逐桩列表默认折叠，方便手机上快速浏览。',
  );
  const stationResultsMeta = computed(() =>
    buildStationResultsMeta(
      stationView.value.cards.length,
      stationView.value.totalCount,
      stationView.value.availableCount,
      stationQuery.value.trim(),
      stationFilter.value,
    ),
  );

  onMounted(() => {
    syncMobileLayout();
    syncMobileTabFromHash();
    window.addEventListener('resize', syncMobileLayout);
    void initialize();
  });

  onUnmounted(() => {
    window.removeEventListener('resize', syncMobileLayout);
  });

  watch(
    isMobileLayout,
    (value) => {
      document.body.classList.toggle('mobile-nav-mode', value);
    },
    { immediate: true },
  );

  function syncMobileLayout() {
    isMobileLayout.value = window.innerWidth <= 720;
    ensureMobileTab();
  }

  function syncMobileTabFromHash() {
    const targetId = window.location.hash.replace(/^#/u, '');
    if (!targetId) {
      return;
    }

    const tab = getTabForTarget(targetId);
    if (tab) {
      mobileTab.value = tab;
    }
  }

  function ensureMobileTab() {
    const allowedTabs = session.value ? AUTH_TABS : GUEST_TABS;
    if (!allowedTabs.includes(mobileTab.value)) {
      mobileTab.value = session.value ? 'overview' : 'welcome';
    }
  }

  function setMobileTab(tab: MobileTab) {
    mobileTab.value = tab;
    ensureMobileTab();
  }

  async function initialize() {
    await restoreSession();
    if (!stations.value) {
      await loadStations(false);
    }
  }

  async function restoreSession() {
    try {
      const payload = await request<SessionPayload>('/api/session');
      if (!payload.loggedIn) {
        session.value = null;
        return;
      }

      await loadBootstrap();
    } catch (error) {
      toast.show(getErrorMessage(error, '初始化失败'), 'error');
    }
  }

  async function login() {
    const username = loginForm.username.trim();
    const password = loginForm.password.trim();

    if (!username || !password) {
      toast.show('请输入账号和密码', 'error');
      return;
    }

    busy.login = true;
    try {
      const payload = await request<SessionPayload>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      session.value = payload;
      loginForm.password = '';
      mobileTab.value = 'overview';
      toast.show('登录成功');
      await loadBootstrap();
    } catch (error) {
      toast.show(getErrorMessage(error, '登录失败'), 'error');
    } finally {
      busy.login = false;
    }
  }

  async function logout() {
    try {
      await request<{ ok: boolean }>('/api/logout', {
        method: 'POST',
        body: '{}',
      });
    } catch (error) {
      toast.show(getErrorMessage(error, '退出失败'), 'error');
      return;
    }

    clearSessionState();
    mobileTab.value = 'login';
    toast.show('已退出登录');
  }

  async function refreshOverview() {
    busy.overview = true;
    try {
      await loadBootstrap();
      toast.show('总览已刷新');
    } catch (error) {
      toast.show(getErrorMessage(error, '总览刷新失败'), 'error');
    } finally {
      busy.overview = false;
    }
  }

  async function loadAccount(withToast = false) {
    busy.account = true;
    try {
      account.value = await request('/api/account');
      if (withToast) {
        toast.show('余额已刷新');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, '余额刷新失败'), 'error');
    } finally {
      busy.account = false;
    }
  }

  async function loadChargeStatus(withToast = false) {
    busy.chargeStatus = true;
    try {
      chargeStatus.value = await request('/api/charge-status');
      if (withToast) {
        toast.show('充电状态已刷新');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, '状态刷新失败'), 'error');
    } finally {
      busy.chargeStatus = false;
    }
  }

  async function loadStations(withToast = false) {
    busy.stations = true;
    try {
      stations.value = await request('/api/stations');
      if (withToast) {
        toast.show('地点状态已刷新');
      }
    } catch (error) {
      toast.show(getErrorMessage(error, '地点状态加载失败'), 'error');
    } finally {
      busy.stations = false;
    }
  }

  async function submitCharge() {
    const qrcode = chargeForm.qrcode.trim();
    if (!/^\d+$/.test(qrcode)) {
      toast.show('请输入纯数字二维码后 8 位', 'error');
      return;
    }

    busy.charge = true;
    try {
      const payload = await request<{ note?: string }>('/api/charge', {
        method: 'POST',
        body: JSON.stringify({ qrcode }),
      });
      toast.show(textOf(payload.note, '充电请求已提交'));
      await Promise.all([loadAccount(false), loadChargeStatus(false)]);
    } catch (error) {
      toast.show(getErrorMessage(error, '充电失败'), 'error');
    } finally {
      busy.charge = false;
    }
  }

  async function refreshAfterPayment() {
    busy.payment = true;
    try {
      await Promise.all([loadAccount(false), loadChargeStatus(false)]);
      toast.show('已刷新余额与状态');
    } catch (error) {
      toast.show(getErrorMessage(error, '刷新失败'), 'error');
    } finally {
      busy.payment = false;
    }
  }

  async function submitRecords() {
    const yy = recordForm.yy.trim();
    const mm = recordForm.mm.trim().padStart(2, '0');

    if (!/^\d{4}$/.test(yy) || !/^\d{2}$/.test(mm)) {
      toast.show('请输入正确的年月', 'error');
      return;
    }

    busy.records = true;
    try {
      await loadRecordsForMonth(yy, mm);
      toast.show('记录已刷新');
    } catch (error) {
      toast.show(getErrorMessage(error, '记录查询失败'), 'error');
    } finally {
      busy.records = false;
    }
  }

  async function applyRecordPreset(preset: 'current' | 'previous') {
    const targetMonth = preset === 'current' ? getRelativeMonth(0) : getRelativeMonth(-1);
    recordForm.yy = targetMonth.yy;
    recordForm.mm = targetMonth.mm;

    busy.records = true;
    try {
      await loadRecordsForMonth(targetMonth.yy, targetMonth.mm);
      toast.show('记录已切换');
    } catch (error) {
      toast.show(getErrorMessage(error, '记录查询失败'), 'error');
    } finally {
      busy.records = false;
    }
  }

  function setStationFilter(filter: StationFilter) {
    stationFilter.value = filter;
  }

  function resetStationFilters() {
    stationQuery.value = '';
    stationFilter.value = 'all';
  }

  function toggleStation(stationId: string) {
    const next = new Set(expandedStations.value);
    if (next.has(stationId)) {
      next.delete(stationId);
    } else {
      next.add(stationId);
    }
    expandedStations.value = next;
  }

  function expandAllStations() {
    const ids = (stations.value?.locations || [])
      .map((item) => buildStationKey(item))
      .filter(Boolean);
    expandedStations.value = new Set(ids);
  }

  function collapseAllStations() {
    expandedStations.value = new Set();
  }

  function clearSessionState() {
    session.value = null;
    account.value = null;
    chargeStatus.value = null;
    records.value = [];
    chargeForm.qrcode = '';
    ensureMobileTab();
  }

  async function loadBootstrap() {
    const payload = await request<BootstrapPayload>('/api/bootstrap');
    session.value = payload.session;
    account.value = payload.account;
    chargeStatus.value = payload.chargeStatus;
    records.value = payload.records || [];
    stations.value = payload.stations || stations.value;
    recordMonth.value = payload.recordMonth || recordMonth.value;
    recordForm.yy = recordMonth.value.yy;
    recordForm.mm = recordMonth.value.mm;
  }

  async function loadRecordsForMonth(yy: string, mm: string) {
    records.value = await request(
      `/api/charge-records?yy=${encodeURIComponent(yy)}&mm=${encodeURIComponent(mm)}`,
    );
    recordMonth.value = { yy, mm };
    recordForm.yy = yy;
    recordForm.mm = mm;
  }

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      return await api<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSessionState();
        mobileTab.value = 'login';
      }
      throw error;
    }
  }

  return {
    toast,
    busy,
    session,
    profile,
    profileInitials,
    accountRows,
    chargeStatusRows,
    dashboardStats,
    chargeQuickItems,
    chargeContextNote,
    recordSummary,
    recordCards,
    activeRecordPreset,
    stationSummaryCards,
    stationView,
    stationNote,
    stationResultsMeta,
    loginForm,
    chargeForm,
    recordForm,
    mobileTab,
    isMobileLayout,
    stationQuery,
    stationFilter,
    setMobileTab,
    login,
    logout,
    refreshOverview,
    loadAccount,
    loadChargeStatus,
    loadStations,
    submitCharge,
    refreshAfterPayment,
    submitRecords,
    applyRecordPreset,
    setStationFilter,
    resetStationFilters,
    toggleStation,
    expandAllStations,
    collapseAllStations,
  };
}

function getTabForTarget(targetId: string): MobileTab | null {
  switch (targetId) {
    case 'login-view':
      return 'login';
    case 'dashboard-view':
    case 'account-section':
    case 'charge-status-section':
      return 'overview';
    case 'charge-section':
    case 'recharge-section':
      return 'charge';
    case 'records-section':
      return 'records';
    case 'stations-section':
      return 'stations';
    case 'tools-section':
      return 'more';
    case 'hero-section':
      return 'welcome';
    default:
      return null;
  }
}
