import type {
  StationCardModel,
  StationFilter,
  StationOverview,
  StationSummary,
  StationSummaryCard,
} from '../types';
import { textOf } from './formatters';

export function buildStationKey(item: StationSummary): string {
  return textOf(item.rid ?? item.rname, '');
}

export function buildStationSummaryCards(overview: StationOverview | null): StationSummaryCard[] {
  if (!overview) {
    return [];
  }

  const totals = overview.totals || {};
  const locations = Array.isArray(overview.locations) ? overview.locations : [];
  const availableLocations = locations.filter((item) => Number(item.freeCount || 0) > 0).length;

  return [
    { label: '地点数', value: String(totals.locationCount ?? 0) },
    { label: '可用地点', value: String(availableLocations) },
    { label: '充电桩总数', value: String(totals.totalCount ?? 0) },
    { label: '空闲桩', value: String(totals.freeCount ?? 0) },
    { label: '充电中', value: String(totals.chargingCount ?? 0) },
    { label: '异常桩', value: String(totals.errorCount ?? 0) },
  ];
}

export function buildStationResultsMeta(
  visibleCount: number,
  totalCount: number,
  availableCount: number,
  query: string,
  filter: StationFilter,
): string {
  const queryText = query ? `搜索“${query}”` : '';
  const filterText = getStationFilterLabel(filter);
  const conditions = [queryText, filterText === '全部地点' ? '' : `筛选：${filterText}`].filter(
    Boolean,
  );
  const prefix = conditions.length ? `${conditions.join('，')}，` : '';

  return `${prefix}当前显示 ${visibleCount}/${totalCount} 个地点，其中有空位的地点共 ${availableCount} 个。`;
}

export function buildStationCardModels(
  overview: StationOverview | null,
  query: string,
  filter: StationFilter,
): {
  cards: StationCardModel[];
  availableCount: number;
  totalCount: number;
} {
  if (!overview) {
    return {
      cards: [],
      availableCount: 0,
      totalCount: 0,
    };
  }

  const locations = Array.isArray(overview.locations) ? overview.locations : [];
  const availableCount = locations.filter((item) => Number(item.freeCount || 0) > 0).length;
  const normalizedQuery = query.trim().toLowerCase();

  const cards = locations
    .filter((item) => {
      const piles = Array.isArray(item.piles) ? item.piles : [];
      const matchesQuery =
        !normalizedQuery ||
        String(item.rname || '').toLowerCase().includes(normalizedQuery) ||
        piles.some((pile) => String(pile.name || '').toLowerCase().includes(normalizedQuery));

      if (!matchesQuery) {
        return false;
      }

      if (filter === 'all') {
        return true;
      }
      if (filter === 'available') {
        return item.statusCode === 'available';
      }
      if (filter === 'busy') {
        return item.statusCode === 'busy' || item.statusCode === 'mixed';
      }
      if (filter === 'fault') {
        return item.statusCode === 'fault';
      }
      return true;
    })
    .sort(compareStations)
    .map((item) => {
      const id = buildStationKey(item);
      const piles = Array.isArray(item.piles) ? item.piles : [];

      return {
        ...item,
        id,
        previewText: buildStationPreview(item, piles.length),
      };
    });

  return {
    cards,
    availableCount,
    totalCount: locations.length,
  };
}

function buildStationPreview(item: StationSummary, pileCount: number): string {
  if (!pileCount) {
    return '暂无逐桩数据';
  }

  const parts = [
    Number(item.freeCount || 0) > 0 ? `空闲 ${item.freeCount} 根` : '',
    Number(item.chargingCount || 0) > 0 ? `充电中 ${item.chargingCount} 根` : '',
    Number(item.errorCount || 0) > 0 ? `异常 ${item.errorCount} 根` : '',
  ].filter(Boolean);

  if (!parts.length) {
    return `共 ${pileCount} 根充电桩`;
  }

  return parts.join(' / ');
}

function compareStations(left: StationSummary, right: StationSummary): number {
  const leftRank = getStationRank(left.statusCode);
  const rightRank = getStationRank(right.statusCode);
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

function getStationRank(statusCode: unknown): number {
  switch (statusCode) {
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

function getStationFilterLabel(filter: StationFilter): string {
  switch (filter) {
    case 'available':
      return '有空位';
    case 'busy':
      return '已占满';
    case 'fault':
      return '设备异常';
    case 'all':
    default:
      return '全部地点';
  }
}
