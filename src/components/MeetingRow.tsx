import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { MeetingWithMeta } from '../db/meetings';
import { meetingStart, meetingWhenLabel, purposeLabel } from '../domain/meetings';
import { colors, radius } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { Icon } from './Icon';
import { CircleIcon, ListRow } from './ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Calendar-style date block: black for upcoming, outlined for past or done. */
function DateBlock({ meeting, filled }: { meeting: MeetingWithMeta; filled: boolean }) {
  const start = meetingStart(meeting);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return (
    <View style={[styles.block, filled ? styles.blockFilled : styles.blockOutline]}>
      <Text style={[styles.blockMonth, filled && styles.onBlack]}>{start ? months[start.getMonth()] : '—'}</Text>
      <Text style={[styles.blockDay, filled && styles.onBlack]}>{start ? start.getDate() : ''}</Text>
    </View>
  );
}

export function MeetingRow({ meeting, showPerson = true }: { meeting: MeetingWithMeta; showPerson?: boolean }) {
  const navigation = useNavigation<Nav>();
  const upcoming = !meeting.done && (meetingStart(meeting)?.getTime() ?? 0) >= Date.now();
  const title = showPerson ? (meeting.personName ?? 'Meeting') : purposeLabel(meeting.purpose);
  const subtitle = [meetingWhenLabel(meeting), showPerson ? purposeLabel(meeting.purpose) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      meta={meeting.done ? (meeting.outcome ? `Done · ${meeting.outcome}` : 'Done') : meeting.place}
      leading={<DateBlock meeting={meeting} filled={upcoming} />}
      trailing={
        meeting.done ? (
          <View style={styles.doneMark}>
            <Icon name="check" size={14} strokeWidth={2.6} color={colors.textMuted} />
          </View>
        ) : (
          <CircleIcon name="chevronRight" />
        )
      }
      onPress={() => navigation.navigate('MeetingDetail', { meetingId: meeting.id })}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    width: 46,
    height: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockFilled: { backgroundColor: colors.black },
  blockOutline: { borderWidth: 1.2, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  blockMonth: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.6 },
  blockDay: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: -1 },
  onBlack: { color: colors.white },
  doneMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
