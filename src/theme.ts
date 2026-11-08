import { Platform, ViewStyle } from 'react-native';
import type { PolicyStatus } from './domain/types';

/**
 * Strict monochrome palette. Every colour in the app comes from here: black,
 * white and greys only. Status and emphasis are expressed through weight,
 * filled vs outlined shapes and icons, never hue.
 */
export const colors = {
  black: '#111111',
  ink: '#1C1C1C',
  inkSoft: '#2B2B2B',
  text: '#111111',
  textMuted: '#6B6B6B',
  textFaint: '#9C9C9C',
  outline: '#111111',
  border: '#D9D9D9',
  divider: '#EBEBEB',
  track: '#E4E4E4',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F2',
  background: '#FAFAFA',
  white: '#FFFFFF',
  onBlackMuted: '#B5B5B5',
  decorOnBlack: '#2E2E2E',
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
  xl: 24,
  pill: 999,
};

export const type = {
  title: { fontSize: 22, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 17, fontWeight: '800' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.textMuted },
  tiny: { fontSize: 11, color: colors.textMuted },
};

/** Soft drop shadow used under outlined cards. */
export const softShadow: ViewStyle = Platform.select<ViewStyle>({
  android: { elevation: 3, shadowColor: colors.black },
  default: {
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
}) as ViewStyle;

export type BadgeVariant = 'solid' | 'strong' | 'outline' | 'soft';
export type IconName =
  | 'alert'
  | 'calendar'
  | 'chat'
  | 'check'
  | 'checkCircle'
  | 'chevronRight'
  | 'clock'
  | 'cog'
  | 'doc'
  | 'download'
  | 'edit'
  | 'flag'
  | 'home'
  | 'person'
  | 'phone'
  | 'plus'
  | 'bell'
  | 'search'
  | 'trash'
  | 'upload'
  | 'users';

/**
 * Status emphasis without colour: lapsed is filled black (heaviest), overdue
 * is a heavy outline, due-soon a regular outline, and settled/quiet states use
 * a soft grey outline. Each carries its own icon.
 */
export const statusStyle: Record<PolicyStatus, { variant: BadgeVariant; icon: IconName }> = {
  lapsed: { variant: 'solid', icon: 'alert' },
  overdue: { variant: 'strong', icon: 'alert' },
  due_soon: { variant: 'outline', icon: 'clock' },
  active: { variant: 'soft', icon: 'check' },
  fully_paid: { variant: 'soft', icon: 'checkCircle' },
  matured: { variant: 'soft', icon: 'flag' },
};
