<script setup lang="ts">
import { computed, ref } from 'vue';
import ChargePanel from './components/ChargePanel.vue';
import DefinitionList from './components/DefinitionList.vue';
import HeroSection from './components/HeroSection.vue';
import LoginPanel from './components/LoginPanel.vue';
import MobileNav from './components/MobileNav.vue';
import OverviewPanel from './components/OverviewPanel.vue';
import RecordsPanel from './components/RecordsPanel.vue';
import StationsPanel from './components/StationsPanel.vue';
import ToastMessage from './components/ToastMessage.vue';
import { useCampusLifeApp } from './composables/useCampusLifeApp';
import { useScanner } from './composables/useScanner';
import type { MobileTab } from './types';

const {
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
  selectedStation,
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
  selectStation,
  clearStationSelection,
} = useCampusLifeApp();

const scannerVideo = ref<HTMLVideoElement | null>(null);
const {
  isOpen: scannerOpen,
  statusMessage: scannerStatusMessage,
  open: openScannerSession,
  close: closeScanner,
} = useScanner(scannerVideo, (code) => {
  chargeForm.qrcode = code.slice(-8);
  toast.show('已识别并回填二维码');
});

const dashboardHidden = computed(
  () =>
    isMobileLayout.value &&
    Boolean(session.value) &&
    !['overview', 'charge', 'records', 'more'].includes(mobileTab.value),
);
const hasStationOverview = computed(
  () => stationSummaryCards.value.length > 0 || stationView.value.totalCount > 0,
);

function navigateTo(targetId: string, tab: MobileTab) {
  if (tab === 'stations') {
    clearStationSelection();
  }
  setMobileTab(tab);
  scrollToSection(targetId);
}

async function handleLogout() {
  closeScanner();
  await logout();
  if (!session.value) {
    scrollToSection('login-view');
  }
}

async function openScanner() {
  try {
    await openScannerSession();
  } catch (error) {
    closeScanner();
    const message = error instanceof Error ? error.message : '无法打开摄像头';
    toast.show(message, 'error');
  }
}

function focusChargeInput() {
  const input = document.getElementById('charge-qrcode') as HTMLInputElement | null;
  input?.focus();
  input?.select();
  scrollToSection('charge-section');
}

function sectionHidden(tab: MobileTab): boolean {
  return isMobileLayout.value && mobileTab.value !== tab;
}

function handleSelectStation(stationId: string) {
  selectStation(stationId);
  scrollToSection('stations-section');
}

function handleClearStationSelection() {
  clearStationSelection();
  scrollToSection('stations-section');
}

function scrollToSection(targetId: string) {
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
</script>

<template>
  <div class="ambient ambient-a"></div>
  <div class="ambient ambient-b"></div>
  <div class="grid-lines"></div>

  <div class="page-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark">CF</div>
        <div>
          <p class="eyebrow">CampusLifeForCharging</p>
          <h1 class="topbar-title">校园充电 Web</h1>
        </div>
      </div>
      <div class="topbar-pill">
        <span class="topbar-dot"></span>
        <span>适合 iPhone 和手机浏览器日常使用的校园充电入口</span>
      </div>
    </header>

    <HeroSection
      v-if="!session"
      :class="{ hidden: sectionHidden('welcome') }"
      @navigate="navigateTo"
    />

    <main class="main-stack">
      <LoginPanel
        v-if="!session"
        :class="{ hidden: sectionHidden('login') }"
        :username="loginForm.username"
        :password="loginForm.password"
        :busy="busy.login"
        @update:username="loginForm.username = $event"
        @update:password="loginForm.password = $event"
        @submit="login"
      />

      <section
        id="dashboard-view"
        class="dashboard"
        :class="{ hidden: !session, 'mobile-dashboard-hidden': dashboardHidden }"
      >
        <OverviewPanel
          v-if="session"
          :class="{ 'mobile-panel-hidden': sectionHidden('overview') }"
          :profile="profile"
          :initials="profileInitials"
          :stats="dashboardStats"
          :refresh-busy="busy.overview"
          @logout="handleLogout"
          @refresh="refreshOverview"
          @navigate="navigateTo"
        />

        <div class="grid-two" :class="{ 'mobile-group-hidden': sectionHidden('overview') }">
          <section
            id="account-section"
            class="panel"
            :class="{ 'mobile-panel-hidden': sectionHidden('overview') }"
          >
            <div class="panel-head">
              <div>
                <p class="panel-kicker">账户</p>
                <h2>余额与账户信息</h2>
              </div>
              <button class="button button-secondary" type="button" :disabled="busy.account" @click="loadAccount(true)">
                {{ busy.account ? '刷新中...' : '刷新余额' }}
              </button>
            </div>
            <DefinitionList :rows="accountRows" />
          </section>

          <section
            id="charge-status-section"
            class="panel"
            :class="{ 'mobile-panel-hidden': sectionHidden('overview') }"
          >
            <div class="panel-head">
              <div>
                <p class="panel-kicker">充电状态</p>
                <h2>当前充电情况</h2>
              </div>
              <button
                class="button button-secondary"
                type="button"
                :disabled="busy.chargeStatus"
                @click="loadChargeStatus(true)"
              >
                {{ busy.chargeStatus ? '刷新中...' : '刷新状态' }}
              </button>
            </div>
            <DefinitionList :rows="chargeStatusRows" />
          </section>
        </div>

        <div class="grid-two" :class="{ 'mobile-group-hidden': sectionHidden('charge') }">
          <ChargePanel
            :class="{ 'mobile-panel-hidden': sectionHidden('charge') }"
            :qrcode="chargeForm.qrcode"
            :busy="busy.charge"
            :context-note="chargeContextNote"
            :quick-items="chargeQuickItems"
            @update:qrcode="chargeForm.qrcode = $event"
            @submit="submitCharge"
            @open-scanner="openScanner"
            @focus-input="focusChargeInput"
          />

          <section
            id="recharge-section"
            class="panel"
            :class="{ 'mobile-panel-hidden': sectionHidden('charge') }"
          >
            <div class="panel-head">
              <div>
                <p class="panel-kicker">充值</p>
                <h2>在官方 App 中完成充值</h2>
              </div>
              <button class="button button-secondary" type="button" :disabled="busy.payment" @click="refreshAfterPayment">
                {{ busy.payment ? '刷新中...' : '充值后刷新余额' }}
              </button>
            </div>
            <p class="panel-note">
              目前官方充值流程仍需要在官方 App 中完成。充值完成后回到这个网页，点击上方按钮刷新余额即可。
            </p>
            <div class="instruction-list">
              <div class="instruction-row">
                <span class="instruction-index">1</span>
                <div>
                  <strong>打开官方 App</strong>
                  <p>在官方 App 中完成充值。</p>
                </div>
              </div>
              <div class="instruction-row">
                <span class="instruction-index">2</span>
                <div>
                  <strong>充值完成后回到网页</strong>
                  <p>一般不需要重新登录，当前会话会继续保留。</p>
                </div>
              </div>
              <div class="instruction-row">
                <span class="instruction-index">3</span>
                <div>
                  <strong>点击刷新余额</strong>
                  <p>余额更新后，就可以继续查状态和充电。</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="grid-two">
          <RecordsPanel
            :class="{ 'mobile-panel-hidden': sectionHidden('records') }"
            :year="recordForm.yy"
            :month="recordForm.mm"
            :busy="busy.records"
            :active-preset="activeRecordPreset"
            :summary-cards="recordSummary"
            :record-cards="recordCards"
            @update:year="recordForm.yy = $event"
            @update:month="recordForm.mm = $event"
            @submit="submitRecords"
            @preset="applyRecordPreset"
          />

          <section
            id="tools-section"
            class="panel"
            :class="{ 'mobile-panel-hidden': sectionHidden('more') }"
          >
            <div class="panel-head">
              <div>
                <p class="panel-kicker">使用说明</p>
                <h2>常见问题</h2>
              </div>
            </div>
            <div class="advanced-grid">
              <article class="subpanel">
                <h3>扫码打不开怎么办？</h3>
                <p>如果浏览器支持网页扫码，会直接打开相机；如果不支持，请在充电页手动输入编号。</p>
              </article>
              <article class="subpanel">
                <h3>充值为什么不在网页里做？</h3>
                <p>目前官方充值流程仍然依赖官方 App，所以网页主要负责查询、查看状态和发起充电。</p>
              </article>
              <article class="subpanel">
                <h3>为什么要自己部署？</h3>
                <p>这是一个自部署网页方案，适合给自己和身边用 iPhone 的同学提供更方便的浏览器入口。</p>
              </article>
              <article class="subpanel">
                <h3>会话多久会失效？</h3>
                <p>默认会保留一段时间；如果你清理浏览器数据、主动退出，或者服务重启后未恢复会话，需要重新登录。</p>
              </article>
            </div>
          </section>
        </div>

        <section
          class="panel settings-panel"
          :class="{ 'mobile-panel-hidden': sectionHidden('more') }"
        >
          <div class="panel-head">
            <div>
              <p class="panel-kicker">项目与反馈</p>
              <h2>源码、反馈与使用建议</h2>
            </div>
          </div>
          <div class="toolbar toolbar-wrap">
            <button class="button button-danger" type="button" @click="handleLogout">
              退出登录
            </button>
            <a
              class="button button-secondary"
              href="https://github.com/JfanLiu/CampusLifeForCharging"
              target="_blank"
              rel="noreferrer"
            >
              源码仓库
            </a>
            <a
              class="button button-secondary"
              href="https://github.com/JfanLiu/CampusLifeForCharging/issues"
              target="_blank"
              rel="noreferrer"
            >
              问题反馈
            </a>
          </div>
        </section>
      </section>

      <StationsPanel
        :class="{ 'mobile-panel-hidden': sectionHidden('stations') }"
        :has-overview="hasStationOverview"
        :mobile-layout="isMobileLayout"
        :note="stationNote"
        :results-meta="stationResultsMeta"
        :summary-cards="stationSummaryCards"
        :cards="stationView.cards"
        :selected-station="selectedStation"
        :query="stationQuery"
        :active-filter="stationFilter"
        :loading="busy.stations"
        @refresh="loadStations(true)"
        @shortcut-available="setStationFilter('available')"
        @reset-filters="resetStationFilters"
        @update:query="stationQuery = $event"
        @set-filter="setStationFilter"
        @select-station="handleSelectStation"
        @clear-selection="handleClearStationSelection"
      />
    </main>

    <MobileNav
      :logged-in="Boolean(session)"
      :mobile-layout="isMobileLayout"
      :active-tab="mobileTab"
      @navigate="navigateTo"
    />
  </div>

  <div class="modal" :class="{ hidden: !scannerOpen }" :aria-hidden="!scannerOpen">
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <p class="panel-kicker">扫码</p>
          <h2>对准设备二维码</h2>
        </div>
        <button class="icon-button" type="button" aria-label="关闭扫码窗口" @click="closeScanner">
          ×
        </button>
      </div>
      <video id="scanner-video" ref="scannerVideo" autoplay muted playsinline></video>
      <p class="panel-note">{{ scannerStatusMessage }}</p>
    </div>
  </div>

  <ToastMessage :visible="toast.state.visible" :tone="toast.state.tone" :message="toast.state.message" />
</template>
