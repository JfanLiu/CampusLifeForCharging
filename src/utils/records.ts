import type {
  RecordCardModel,
  RecordEntry,
  RecordFact,
  RecordHighlight,
} from '../types';
import { formatDecimal, parseEmbeddedNumber, textOf } from './formatters';

export function summarizeRecords(records: RecordEntry[]): {
  count: number;
  totalPriceText: string;
  totalQuantityText: string;
} {
  let totalPrice = 0;
  let totalQuantity = 0;
  let hasPrice = false;
  let hasQuantity = false;

  records.forEach((record) => {
    const price = extractRecordMetric(record, ['price', 'money', 'amount', 'fee', '费用', '金额']);
    const quantity = extractRecordMetric(record, ['quantity', 'power', '电量', '用电']);

    if (price != null) {
      totalPrice += price;
      hasPrice = true;
    }

    if (quantity != null) {
      totalQuantity += quantity;
      hasQuantity = true;
    }
  });

  return {
    count: records.length,
    totalPriceText: hasPrice ? `${formatDecimal(totalPrice)} 元` : '-',
    totalQuantityText: hasQuantity ? `${formatDecimal(totalQuantity)} 度` : '-',
  };
}

export function buildRecordCardModel(record: RecordEntry, index: number): RecordCardModel {
  const usedKeys = new Set<string>();
  const startTime = consumeRecordField(record, usedKeys, [
    'bgtime',
    'begintime',
    'starttime',
    'start',
    '开始时间',
  ]);
  const endTime = consumeRecordField(record, usedKeys, [
    'edtime',
    'endtime',
    'stoptime',
    'end',
    '结束时间',
  ]);
  const position = consumeRecordField(record, usedKeys, [
    'position',
    'place',
    'location',
    'addr',
    '地点',
    '位置',
    '房间',
  ]);
  const status = consumeRecordField(record, usedKeys, ['chargestatus', 'status', '状态']);
  const price = consumeRecordField(record, usedKeys, [
    'price',
    'money',
    'amount',
    'fee',
    '费用',
    '金额',
  ]);
  const quantity = consumeRecordField(record, usedKeys, [
    'quantity',
    'power',
    'electricity',
    '电量',
    '用电',
  ]);
  const duration = consumeRecordField(record, usedKeys, ['duration', '时长']);
  const device = consumeRecordField(record, usedKeys, [
    'jacountname',
    'jacountno',
    'device',
    'meter',
    '电表',
    '设备',
  ]);
  const pile = consumeRecordField(record, usedKeys, [
    'qrcode',
    'pile',
    'charger',
    'terminal',
    '桩',
    '枪',
  ]);
  const order = consumeRecordField(record, usedKeys, [
    'orderno',
    'orderid',
    'serial',
    '流水',
    '订单',
  ]);

  const title = textOf(position?.value ?? device?.value ?? startTime?.value, `记录 ${index + 1}`);
  const subtitleParts: string[] = [];
  if (startTime?.value) {
    subtitleParts.push(`开始 ${startTime.value}`);
  }
  if (endTime?.value) {
    subtitleParts.push(`结束 ${endTime.value}`);
  }
  if (position?.value && title !== position.value) {
    subtitleParts.push(position.value);
  }

  const highlights = [
    buildRecordHighlight('费用', price?.value, 'accent'),
    buildRecordHighlight('电量', quantity?.value, 'teal'),
    buildRecordHighlight('时长', duration?.value, 'neutral'),
  ].filter(Boolean) as RecordHighlight[];

  const facts = [
    buildRecordFact('设备', device?.value),
    buildRecordFact('充电桩', pile?.value),
    buildRecordFact('订单', order?.value),
    buildRecordFact(
      '结束时间',
      endTime?.value && !subtitleParts.includes(`结束 ${endTime.value}`) ? endTime.value : '',
    ),
  ].filter(Boolean) as RecordFact[];

  return {
    title,
    subtitle: subtitleParts.join(' · ') || '查看这次充电详情',
    timeText: textOf(startTime?.value, `第 ${index + 1} 条`),
    statusText: textOf(status?.value, ''),
    tone: getRecordTone(status?.value),
    highlights,
    facts,
  };
}

function buildRecordHighlight(
  label: string,
  value: string | undefined,
  tone: 'accent' | 'teal' | 'neutral',
): RecordHighlight | null {
  if (!value) {
    return null;
  }

  return {
    label,
    value: String(value),
    tone,
  };
}

function buildRecordFact(label: string, value: string | undefined): RecordFact | null {
  if (!value) {
    return null;
  }

  return {
    label,
    value: String(value),
  };
}

function consumeRecordField(
  record: RecordEntry,
  usedKeys: Set<string>,
  candidates: string[],
): { key: string; value: string } | null {
  const entries = Object.entries(record || {});

  for (const candidate of candidates) {
    const match = entries.find(
      ([key, value]) =>
        !usedKeys.has(key) &&
        value != null &&
        String(value).trim() !== '' &&
        matchRecordKey(key, candidate),
    );

    if (!match) {
      continue;
    }

    const [key, value] = match;
    usedKeys.add(key);
    return {
      key,
      value: String(value),
    };
  }

  return null;
}

function matchRecordKey(key: string, candidate: string): boolean {
  const normalizedKey = normalizeRecordKey(key);
  const normalizedCandidate = normalizeRecordKey(candidate);
  return (
    normalizedKey === normalizedCandidate ||
    normalizedKey.startsWith(normalizedCandidate) ||
    normalizedKey.includes(normalizedCandidate)
  );
}

function normalizeRecordKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/gu, '');
}

function getRecordTone(statusText: unknown): 'accent' | 'teal' | 'danger' | 'neutral' {
  const value = String(statusText || '').toLowerCase();

  if (!value) {
    return 'neutral';
  }
  if (/完成|成功|结束|正常|finish|done|success/u.test(value)) {
    return 'teal';
  }
  if (/异常|失败|中断|故障|取消|fault|fail|cancel/u.test(value)) {
    return 'danger';
  }
  if (/充电|进行|等待|running|active|charging/u.test(value)) {
    return 'accent';
  }

  return 'neutral';
}

function extractRecordMetric(record: RecordEntry, keyTokens: string[]): number | null {
  const entries = Object.entries(record);
  for (const [key, value] of entries) {
    const keyText = String(key || '').toLowerCase();
    const matched = keyTokens.some((token) =>
      keyText.includes(String(token).toLowerCase()),
    );
    if (!matched) {
      continue;
    }

    const parsed = parseEmbeddedNumber(value);
    if (parsed != null) {
      return parsed;
    }
  }

  return null;
}
