import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Button,
  Card,
  HeaderBlock,
  KeyValue,
  ListRow,
  Row,
  Screen,
  SectionHeader,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { deleteMeeting, getMeeting, MeetingWithMeta, setMeetingDone } from '../db/meetings';
import { formatDate } from '../domain/format';
import { meetingStart, meetingWhenLabel, purposeLabel, reminderLabel, timeLabel } from '../domain/meetings';
import { callClient, meetingReminderMessage, whatsAppClient } from '../services/contact';
import { refreshMeetingReminders } from '../services/meetings';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MeetingDetail'>;

export default function MeetingDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { meetingId } = route.params;
  const [meeting, setMeeting] = useState<MeetingWithMeta | null>(null);
  const [missing, setMissing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const m = await getMeeting(meetingId);
    setMeeting(m);
    setMissing(!m);
  }, [meetingId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const markDone = async (done: boolean) => {
    setBusy(true);
    try {
      await setMeetingDone(meetingId, done, done ? outcome.trim() || null : null);
      await refreshMeetingReminders();
      setClosing(false);
      setOutcome('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete meeting?', 'The meeting and its reminder will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeeting(meetingId);
          await refreshMeetingReminders();
          navigation.goBack();
        },
      },
    ]);
  };

  if (missing) {
    return (
      <Screen>
        <Text style={styles.missing}>This meeting no longer exists.</Text>
      </Screen>
    );
  }
  if (!meeting) return <Screen />;

  const name = meeting.personName ?? 'Client';
  const when = meetingWhenLabel(meeting);
  const isPast = (meetingStart(meeting)?.getTime() ?? 0) < Date.now();
  const message = meetingReminderMessage({
    name,
    when: `on ${formatDate(meeting.date)} at ${timeLabel(meeting.time)}`,
    place: meeting.place,
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <HeaderBlock>
          <View style={[styles.pill, !!meeting.done && styles.pillDone]}>
            <Icon
              name={meeting.done ? 'checkCircle' : 'calendar'}
              size={13}
              strokeWidth={2.4}
              color={meeting.done ? colors.black : colors.white}
            />
            <Text style={[styles.pillText, !!meeting.done && styles.pillTextDone]}>
              {meeting.done ? 'Done' : isPast ? 'Past · not marked done' : 'Upcoming'}
            </Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.when}>{when}</Text>
          <Text style={styles.sub}>
            {purposeLabel(meeting.purpose)}
            {meeting.place ? ` · ${meeting.place}` : ''}
          </Text>
          {!meeting.clientId ? <Text style={styles.sub}>Prospect · not a client yet</Text> : null}
        </HeaderBlock>

        {meeting.personPhone ? (
          <Row style={styles.actionRow}>
            <Button
              title="Call"
              icon="phone"
              chevron={false}
              onPress={() => callClient(meeting.personPhone!)}
              style={styles.flex}
            />
            <Button
              title="WhatsApp"
              icon="chat"
              variant="secondary"
              onPress={() => whatsAppClient(meeting.personPhone!, message)}
              style={styles.flex}
            />
          </Row>
        ) : null}

        {meeting.done ? (
          <Card>
            <KeyValue label="Outcome" value={meeting.outcome || '—'} strong />
            <Button
              title="Mark as not done"
              variant="secondary"
              chevron={false}
              loading={busy}
              onPress={() => markDone(false)}
              style={styles.cardBtn}
            />
          </Card>
        ) : closing ? (
          <Card>
            <Text style={styles.label}>Outcome (optional)</Text>
            <TextInput
              style={styles.input}
              value={outcome}
              onChangeText={setOutcome}
              placeholder="e.g. Collected premium, client will decide next week"
              placeholderTextColor={colors.textFaint}
              multiline
              autoFocus
            />
            <Row style={styles.closeRow}>
              <Button title="Cancel" variant="secondary" chevron={false} onPress={() => setClosing(false)} style={styles.flex} />
              <Button title="Mark done" loading={busy} onPress={() => markDone(true)} style={styles.flex} />
            </Row>
          </Card>
        ) : (
          <View style={styles.actionRow}>
            <Button title="Mark done" icon="check" onPress={() => setClosing(true)} />
          </View>
        )}

        {meeting.clientId ? (
          <>
            <SectionHeader title="Client" />
            <ListRow
              title={name}
              subtitle={meeting.personPhone ?? 'No phone on file'}
              onPress={() => navigation.navigate('ClientDetail', { clientId: meeting.clientId! })}
            />
          </>
        ) : null}
        {meeting.policyId && meeting.policyNumber ? (
          <ListRow
            title={`Policy ${meeting.policyNumber}`}
            subtitle="Linked policy"
            onPress={() => navigation.navigate('PolicyDetail', { policyId: meeting.policyId! })}
          />
        ) : null}

        <SectionHeader title="Details" />
        <Card>
          <KeyValue label="Date" value={formatDate(meeting.date)} />
          <KeyValue label="Time" value={timeLabel(meeting.time)} />
          <KeyValue label="Purpose" value={purposeLabel(meeting.purpose)} />
          {meeting.place ? <KeyValue label="Place" value={meeting.place} /> : null}
          <KeyValue label="Reminder" value={meeting.done ? 'Off (done)' : reminderLabel(meeting.reminderMinutes)} />
          {meeting.notes ? <KeyValue label="Notes" value={meeting.notes} /> : null}
          <Row style={styles.editRow}>
            <Button
              title="Edit"
              icon="edit"
              variant="secondary"
              chevron={false}
              onPress={() => navigation.navigate('MeetingForm', { meetingId })}
              style={styles.flex}
            />
            <Button title="Delete" variant="danger" onPress={confirmDelete} style={styles.flex} />
          </Row>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { color: colors.textMuted, margin: spacing.xl, textAlign: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pillDone: { backgroundColor: colors.white },
  pillText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  pillTextDone: { color: colors.black },
  name: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: spacing.md },
  when: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.xs },
  sub: { color: colors.onBlackMuted, fontSize: 14, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md },
  flex: { flex: 1 },
  cardBtn: { marginTop: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 70,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
  },
  closeRow: { gap: spacing.sm, marginTop: spacing.md },
  editRow: { gap: spacing.sm, marginTop: spacing.lg },
});
