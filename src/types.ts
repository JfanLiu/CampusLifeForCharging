export interface UserProfile {
  username?: string;
  phone?: string;
  avatar?: string;
}

export interface SessionPayload {
  loggedIn: boolean;
  userid?: number;
  profile?: UserProfile | null;
}

export interface MonthValue {
  yy: string;
  mm: string;
}

export type AccountInfo = Record<string, unknown>;
export type ChargeStatus = Record<string, unknown>;
export type RecordEntry = Record<string, unknown>;

export interface StationPile {
  name?: string;
  status?: string;
  note?: string;
  statusCode?: string;
  statusLabel?: string;
  raw?: unknown;
}

export interface StationSummary {
  rid?: string;
  rname?: string;
  chargingCount?: number;
  freeCount?: number;
  errorCount?: number;
  totalCount?: number;
  hasFree?: boolean;
  statusCode?: string;
  statusLabel?: string;
  piles?: StationPile[];
  raw?: unknown;
}

export interface StationTotals {
  locationCount?: number;
  chargingCount?: number;
  freeCount?: number;
  errorCount?: number;
  totalCount?: number;
}

export interface StationOverview {
  granularity?: string;
  note?: string;
  locations?: StationSummary[];
  totals?: StationTotals;
}

export interface BootstrapPayload {
  session: SessionPayload;
  account: AccountInfo | null;
  chargeStatus: ChargeStatus | null;
  records: RecordEntry[];
  stations: StationOverview | null;
  recordMonth: MonthValue;
}

export interface DefinitionRow {
  term: string;
  value: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  caption: string;
}

export interface ChargeQuickItem {
  label: string;
  value: string;
  tone: 'accent' | 'teal' | 'neutral';
}

export interface RecordHighlight {
  label: string;
  value: string;
  tone: 'accent' | 'teal' | 'neutral';
}

export interface RecordFact {
  label: string;
  value: string;
}

export interface RecordCardModel {
  title: string;
  subtitle: string;
  timeText: string;
  statusText: string;
  tone: 'accent' | 'teal' | 'danger' | 'neutral';
  highlights: RecordHighlight[];
  facts: RecordFact[];
}

export interface RecordSummaryCard {
  label: string;
  value: string;
  caption: string;
}

export interface StationSummaryCard {
  label: string;
  value: string;
}

export interface StationCardModel extends StationSummary {
  id: string;
  expanded: boolean;
  visiblePiles: StationPile[];
  previewText: string;
  canToggle: boolean;
}

export type StationFilter = 'all' | 'available' | 'busy' | 'fault';

export type MobileTab =
  | 'welcome'
  | 'login'
  | 'overview'
  | 'charge'
  | 'records'
  | 'stations'
  | 'more';

export interface ToastState {
  visible: boolean;
  message: string;
  tone: 'success' | 'error';
}

export interface BusyState {
  login: boolean;
  overview: boolean;
  account: boolean;
  chargeStatus: boolean;
  charge: boolean;
  records: boolean;
  stations: boolean;
  payment: boolean;
}
