import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Field, Screen, Segmented } from '../components/ui';
import { listClients } from '../db/clients';
import { createMeeting, getMeeting, updateMeeting } from '../db/meetings';
import { listPoliciesForClient, PolicyWithMeta } from '../db/policies';
import { todayISO } from '../domain/date';
import {
  DEFAULT_REMINDER_MINUTES,
  MEETING_PURPOSES,
  MeetingPurpose,
  meetingStart,
  NewMeeting,
  REMINDER_OPTIONS,
} from '../domain/meetings';
import type { Client } from '../domain/types';
import { ensureNotificationSetup } from '../services/notifications';
import { refreshMeetingReminders } from '../services/meetings';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'MeetingForm'>;

/** Picker value for "not a client yet". */
const PROSPECT = 'prospect';
const NO_POLICY = 'none';

export default function MeetingFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const meetingId = route.params?.meetingId;

  const [clients, setClients] = useState<Client[]>([]);
  const [who, setWho] = useState<string>(
    route.params?.clientId ? String(route.params.clientId) : PROSPECT,
  );
  const [prospectName, setProspectName] = useState('');
  const [prospectPhone, setProspectPhone] = useState('');
  const [policies, setPolicies] = useState<PolicyWithMeta[]>([]);
  const [policy, setPolicy] = useState<string>(
    route.params?.policyId ? String(route.params.policyId) : NO_POLICY,
  );
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [purpose, setPurpose] = useState<MeetingPurpose>('new_policy');
  const [reminder, setReminder] = useState<string>(String(DEFAULT_REMINDER_MINUTES));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: meetingId ? 'Edit meeting' : 'New meeting' });
    listClients().then((list) => {
      setClients(list);
      // Default to the first client when there is one and nothing was preset.
      if (!meetingId && !route.params?.clientId && list.length > 0) setWho(String(list[0].id));
    });
    if (meetingId) {
      getMeeting(meetingId).then((m) => {
        if (!m) return;
        setWho(m.clientId ? String(m.clientId) : PROSPECT);
        setProspectName(m.prospectName ?? '');
        setProspectPhone(m.prospectPhone ?? '');
        setPolicy(m.policyId ? String(m.policyId) : NO_POLICY);
        setDate(m.date);
        setTime(m.time);
        setPlace(m.place ?? '');
        setPurpose(m.purpose);
        setReminder(String(m.reminderMinutes));
        setNotes(m.notes ?? '');
      });
    }
  }, [meetingId, navigation, route.params?.clientId]);

  // Policies of the selected client, for the optional link.
  useEffect(() => {
    if (who === PROSPECT) {
      setPolicies([]);
      setPolicy(NO_POLICY);
      return;
    }
    listPoliciesForClient(Number(who)).then((list) => {
      setPolicies(list);
      setPolicy((current) =>
        current === NO_POLICY || list.some((p) => String(p.id) === current) ? current : NO_POLICY,
      );
    });
  }, [who]);

  const save = async () => {
    const isProspect = who === PROSPECT;
    if (isProspect && !prospectName.trim()) {
      Alert.alert('Name required', 'Pick a client, or type the name of the person you are meeting.');
      return;
    }
    if (!meetingStart({ date: date.trim(), time: time.trim() })) {
      Alert.alert('Invalid date or time', 'Use YYYY-MM-DD for the date and 24-hour HH:MM for the time, e.g. 16:30.');
      return;
    }
    const data: NewMeeting = {
      clientId: isProspect ? null : Number(who),
      prospectName: isProspect ? prospectName.trim() : null,
      prospectPhone: isProspect ? prospectPhone.trim() || null : null,
      policyId: !isProspect && policy !== NO_POLICY ? Number(policy) : null,
      date: date.trim(),
      time: time.trim(),
      place: place.trim() || null,
      purpose,
      notes: notes.trim() || null,
      reminderMinutes: Number(reminder),
    };
    setSaving(true);
    try {
      if (meetingId) await updateMeeting(meetingId, data);
      else await createMeeting(data);
      // Ask for notification permission when the agent first sets a reminder.
      await ensureNotificationSetup().catch(() => false);
      await refreshMeetingReminders();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', String(e));
    } finally {
      setSaving(false);
    }
  };

  const whoOptions = [
    ...clients.map((c) => ({ value: String(c.id), label: c.name })),
    { value: PROSPECT, label: 'Someone new (prospect)' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Segmented label="Meeting with *" value={who} options={whoOptions} onChange={setWho} />
        {who === PROSPECT ? (
          <>
            <Field
              label="Name *"
              value={prospectName}
              onChangeText={setProspectName}
              placeholder="Prospect's full name"
            />
            <Field
              label="Phone"
              value={prospectPhone}
              onChangeText={setProspectPhone}
              keyboardType="phone-pad"
              placeholder="10-digit mobile number"
            />
          </>
        ) : policies.length > 0 ? (
          <Segmented
            label="Related policy (optional)"
            value={policy}
            options={[
              { value: NO_POLICY, label: 'None' },
              ...policies.map((p) => ({ value: String(p.id), label: p.policyNumber })),
            ]}
            onChange={setPolicy}
          />
        ) : null}

        <Field
          label="Date (YYYY-MM-DD) *"
          value={date}
          onChangeText={setDate}
          placeholder="2026-11-20"
          autoCapitalize="none"
        />
        <Field
          label="Time (24-hour HH:MM) *"
          value={time}
          onChangeText={setTime}
          placeholder="16:30"
          autoCapitalize="none"
        />
        <Field label="Place" value={place} onChangeText={setPlace} placeholder="e.g. Client's home, branch office" />
        <Segmented
          label="Purpose"
          value={purpose}
          options={MEETING_PURPOSES}
          onChange={setPurpose}
        />
        <Segmented
          label="Remind me"
          value={reminder}
          options={REMINDER_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
          onChange={setReminder}
        />
        <Text style={styles.hint}>A notification on this phone; nothing is sent to the client.</Text>
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Agenda, documents to bring…" multiline />
        <Button title={saving ? 'Saving…' : 'Save meeting'} onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: colors.textMuted, fontSize: 12, marginTop: -spacing.xs, marginBottom: spacing.md },
});
