import type { PolicyStatus } from './domain/types';

export const colors = {
  primary: '#0B6E4F',
  primaryDark: '#075239',
  primaryLight: '#E6F4EE',
  accent: '#C79A3A',
  background: '#F4F6F5',
  surface: '#FFFFFF',
  border: '#E1E5E3',
  text: '#1A2420',
  textMuted: '#6B7A73',
  danger: '#C0392B',
  warning: '#D68910',
  success: '#1E8449',
  info: '#2874A6',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const statusColor: Record<PolicyStatus, string> = {
  active: colors.success,
  due_soon: colors.info,
  overdue: colors.warning,
  lapsed: colors.danger,
  fully_paid: colors.primary,
  matured: colors.textMuted,
};
