import type { ChargeStatus, MonthValue } from '../types';

export function textOf(value: unknown, fallback = '-'): string {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized || fallback;
}

export function buildInitials(name: string | undefined): string {
  return String(name || 'CF').trim().slice(0, 2).toUpperCase();
}

export function getDefaultMonth(): MonthValue {
  const now = new Date();
  return {
    yy: String(now.getFullYear()),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
  };
}

export function getRelativeMonth(offset: number): MonthValue {
  const now = new Date();
  now.setDate(1);
  now.setMonth(now.getMonth() + offset);
  return {
    yy: String(now.getFullYear()),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
  };
}

export function isSameMonth(left: MonthValue, right: MonthValue): boolean {
  return left.yy === right.yy && left.mm === right.mm;
}

export function detectRecordPreset(month: MonthValue): '' | 'current' | 'previous' {
  if (isSameMonth(month, getRelativeMonth(0))) {
    return 'current';
  }
  if (isSameMonth(month, getRelativeMonth(-1))) {
    return 'previous';
  }
  return '';
}

export function parseEmbeddedNumber(value: unknown): number | null {
  const match = String(value ?? '')
    .replaceAll(',', '')
    .match(/-?\d+(?:\.\d+)?/u);

  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDecimal(value: number): string {
  return Number(value).toFixed(Math.abs(value) >= 10 ? 1 : 2).replace(/\.0$/u, '');
}

export function summarizeChargeStatus(status: ChargeStatus | null | undefined): {
  value: string;
  caption: string;
} {
  if (!status || !Object.keys(status).length) {
    return {
      value: '未充电',
      caption: '当前暂无充电记录',
    };
  }

  return {
    value: textOf(status.chargestatus, '进行中'),
    caption: textOf(status.position ?? status.bgtime, '设备状态已更新'),
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
