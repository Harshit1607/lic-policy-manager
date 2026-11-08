import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, IconName, radius, softShadow, spacing, statusStyle } from '../theme';
import { statusLabel } from '../domain/premium';
import type { PolicyStatus } from '../domain/types';
import { Icon } from './Icon';
import { Illustration, IllustrationName } from './Illustration';

export function Screen({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

/** Rounded white card with a thin black outline and a soft shadow. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

/** Section heading with an optional inline action on the right. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.sectionAction} accessibilityRole="button">
          <Icon name="plus" size={16} strokeWidth={2.4} />
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field({ label, style, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <Label>{label}</Label>
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.textFaint} {...props} />
    </View>
  );
}

/** Pill-shaped search field with a search icon, as used on list headers. */
export function SearchField(props: TextInputProps) {
  return (
    <View style={styles.search}>
      <TextInput
        style={styles.searchInput}
        placeholderTextColor={colors.textFaint}
        returnKeyType="search"
        {...props}
      />
      <Icon name="search" size={20} />
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'inverse';

/**
 * Primary: filled black with a right chevron. Secondary: black outline.
 * Danger: outline with a trash icon (no red). Ghost: text only.
 * Inverse: white fill for use on black blocks.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  chevron,
  disabled,
  loading,
  compact,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  chevron?: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const filled = variant === 'primary';
  const fg = filled ? colors.white : colors.black;
  const showChevron = chevron ?? variant === 'primary';
  const leadIcon = icon ?? (variant === 'danger' ? 'trash' : undefined);
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        compact && styles.buttonCompact,
        filled && styles.buttonPrimary,
        (variant === 'secondary' || variant === 'danger') && styles.buttonOutline,
        variant === 'inverse' && styles.buttonInverse,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leadIcon ? <Icon name={leadIcon} size={18} color={fg} /> : null}
          <Text
            style={[styles.buttonText, compact && styles.buttonTextCompact, { color: fg }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {showChevron ? (
            <View style={styles.buttonChevron}>
              <Icon name="chevronRight" size={18} color={fg} strokeWidth={2.4} />
            </View>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

/** Round icon-only button: filled black or outlined. */
export function IconButton({
  icon,
  onPress,
  filled,
  size = 40,
  accessibilityLabel,
  style,
}: {
  icon: IconName;
  onPress: () => void;
  filled?: boolean;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2 },
        filled ? styles.iconButtonFilled : styles.iconButtonOutline,
        style,
      ]}
    >
      <Icon name={icon} size={size * 0.48} color={filled ? colors.white : colors.black} />
    </TouchableOpacity>
  );
}

/** Small outlined circle holding an icon, used as the trailing affordance on rows. */
export function CircleIcon({ name, inverted }: { name: IconName; inverted?: boolean }) {
  return (
    <View style={[styles.circleIcon, inverted && styles.circleIconInverted]}>
      <Icon name={name} size={14} strokeWidth={2.6} color={inverted ? colors.white : colors.black} />
    </View>
  );
}

/**
 * Outlined list row: optional leading element, bold title, small grey
 * subtitle, and a circular icon (chevron by default) at the right.
 */
export function ListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  children,
  style,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const body = (
    <View style={[styles.card, styles.listRow, style]}>
      <View style={styles.listRowMain}>
        {leading ? <View style={styles.listRowLeading}>{leading}</View> : null}
        <View style={styles.listRowBody}>
          <Text style={styles.listRowTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.listRowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {meta ? (
            <Text style={styles.listRowSubtitle} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        <View style={styles.listRowTrailing}>{trailing ?? <CircleIcon name="chevronRight" />}</View>
      </View>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} accessibilityRole="button">
      {body}
    </TouchableOpacity>
  );
}

/** Status badge: emphasis by fill/outline weight and icon rather than colour. */
export function StatusBadge({ status, onBlack }: { status: PolicyStatus; onBlack?: boolean }) {
  const { variant, icon } = statusStyle[status];
  // On a black block the scheme inverts: the heaviest state becomes a white fill.
  let fg: string;
  let shape: StyleProp<ViewStyle>;
  if (onBlack) {
    fg = variant === 'solid' ? colors.black : variant === 'soft' ? colors.onBlackMuted : colors.white;
    shape = [
      styles.badgeOnBlack,
      variant === 'solid' && styles.badgeOnBlackSolid,
      variant === 'strong' && styles.badgeOnBlackStrong,
      variant === 'soft' && styles.badgeOnBlackSoft,
    ];
  } else {
    fg = variant === 'solid' ? colors.white : variant === 'soft' ? colors.textMuted : colors.black;
    shape = [
      variant === 'solid' && styles.badgeSolid,
      variant === 'strong' && styles.badgeStrong,
      variant === 'outline' && styles.badgeOutline,
      variant === 'soft' && styles.badgeSoft,
    ];
  }
  return (
    <View style={[styles.badge, shape]}>
      <Icon name={icon} size={12} strokeWidth={2.6} color={fg} />
      <Text
        style={[
          styles.badgeText,
          { color: fg },
          (variant === 'solid' || variant === 'strong') && styles.badgeTextHeavy,
        ]}
      >
        {statusLabel(status)}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  illustration,
  children,
}: {
  title: string;
  subtitle?: string;
  illustration?: IllustrationName;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      {illustration ? <Illustration name={illustration} width={220} /> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.emptyActions}>{children}</View> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Label>{label}</Label> : null}
      <View style={styles.segmented}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function KeyValue({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={[styles.kvValue, strong && styles.kvValueStrong]}>{value}</Text>
    </View>
  );
}

/** Circular initials avatar (light grey disc with dark initials). */
export function Avatar({ name, size = 44, inverted }: { name: string; size?: number; inverted?: boolean }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
        inverted && styles.avatarInverted,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }, inverted && styles.avatarTextInverted]}>
        {initials(name)}
      </Text>
    </View>
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

/** Thin progress bar (black fill on a light grey track). */
export function ProgressBar({
  value,
  onBlack,
  style,
}: {
  value: number;
  onBlack?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.barTrack, onBlack && styles.barTrackOnBlack, style]}>
      <View
        style={[styles.barFill, onBlack && styles.barFillOnBlack, { width: `${pct * 100}%` }]}
      />
    </View>
  );
}

/** Large circular progress ring with the percentage in the middle. */
export function ProgressRing({
  value,
  size = 112,
  stroke = 9,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.black}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringValue}>{Math.round(pct * 100)}%</Text>
      {caption ? <Text style={styles.ringCaption}>{caption}</Text> : null}
    </View>
  );
}

/**
 * Solid black header block with rounded lower corners and organic blob /
 * wavy line-art decoration behind its content.
 */
export function HeaderBlock({
  children,
  style,
  decor = 'waves',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  decor?: 'waves' | 'blob';
}) {
  return (
    <View style={[styles.headerBlock, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMaxYMax slice">
          {decor === 'blob' ? (
            <Path
              d="M250 0c40 10 70 40 110 30v170H210c-30-20-10-60 20-80s10-60 20-120Z"
              fill={colors.decorOnBlack}
            />
          ) : (
            <Path
              d="M300 -10c-40 30 10 70-30 100s-20 70 20 110h80V-10Z"
              fill={colors.decorOnBlack}
            />
          )}
          <Path
            d="M-10 150c50-40 90 20 140-10s80-60 120-30 70 40 120 0"
            stroke={colors.inkSoft}
            strokeWidth={1.4}
            fill="none"
          />
          <Path
            d="M-10 172c50-36 100 18 150-10s80-50 120-24 70 34 110 4"
            stroke={colors.inkSoft}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}

/** Outlined stat tile: big number with a small grey caption. */
export function StatTile({
  value,
  label,
  style,
  small,
}: {
  value: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  return (
    <View style={[styles.card, styles.statTile, style]}>
      <Text style={[styles.statValue, small && styles.statValueSmall]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1.2,
    borderColor: colors.outline,
    ...softShadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  sectionHeaderTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.outline,
  },
  sectionActionText: { fontSize: 13, fontWeight: '700', color: colors.text },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.xs },
  fieldWrap: { marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    height: 46,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
  button: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 38, paddingHorizontal: spacing.md },
  buttonPrimary: { backgroundColor: colors.black },
  buttonOutline: { backgroundColor: colors.surface, borderWidth: 1.4, borderColor: colors.outline },
  buttonInverse: { backgroundColor: colors.white },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  buttonTextCompact: { fontSize: 13 },
  buttonChevron: { marginLeft: 'auto' },
  disabled: { opacity: 0.45 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  iconButtonFilled: { backgroundColor: colors.black },
  iconButtonOutline: { backgroundColor: colors.surface, borderWidth: 1.4, borderColor: colors.outline },
  circleIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleIconInverted: { backgroundColor: colors.black },
  listRow: { paddingVertical: spacing.md, marginVertical: 6 },
  listRowMain: { flexDirection: 'row', alignItems: 'center' },
  listRowLeading: { marginRight: spacing.md },
  listRowBody: { flex: 1 },
  listRowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  listRowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  listRowTrailing: { marginLeft: spacing.sm, alignItems: 'flex-end' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeSolid: { backgroundColor: colors.black },
  badgeStrong: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.outline },
  badgeOutline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.outline },
  badgeSoft: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  badgeOnBlack: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.white },
  badgeOnBlackSolid: { backgroundColor: colors.white },
  badgeOnBlackStrong: { borderWidth: 2 },
  badgeOnBlackSoft: { borderColor: colors.onBlackMuted },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextHeavy: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  emptyActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center' },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  kvLabel: { fontSize: 14, color: colors.textMuted },
  kvValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  kvValueStrong: { fontWeight: '800' },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.black },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.text },
  segmentTextActive: { color: colors.white, fontWeight: '700' },
  avatar: { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarInverted: { backgroundColor: colors.black },
  avatarText: { color: colors.black, fontWeight: '800' },
  avatarTextInverted: { color: colors.white },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' },
  barTrackOnBlack: { backgroundColor: colors.inkSoft },
  barFill: { height: '100%', backgroundColor: colors.black, borderRadius: 3 },
  barFillOnBlack: { backgroundColor: colors.white },
  ringValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  ringCaption: { fontSize: 10, color: colors.textMuted, marginTop: -2 },
  headerBlock: {
    backgroundColor: colors.black,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  statTile: { flex: 1, alignItems: 'center', marginHorizontal: 0, paddingVertical: spacing.md },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statValueSmall: { fontSize: 16 },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
});
