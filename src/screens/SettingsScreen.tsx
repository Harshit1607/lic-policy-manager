import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Icon } from '../components/Icon';
import {
  Card,
  CircleIcon,
  HeaderBlock,
  ListRow,
  Row,
  Screen,
  SectionTitle,
  StatTile,
} from '../components/ui';
import { listPolicies } from '../db/policies';
import { listAllPayments } from '../db/payments';
import { listClients } from '../db/clients';
import { commissionForAmount } from '../domain/premium';
import { formatCurrency } from '../domain/format';
import { exportJsonBackup, exportMeetingsCsv, exportPoliciesCsv, importJsonBackup } from '../services/backup';
import { refreshMeetingReminders } from '../services/meetings';
import { ensureNotificationSetup, rescheduleDueReminders } from '../services/notifications';
import { loadPoliciesWithStatus } from '../services/queries';
import { colors, IconName, spacing } from '../theme';

interface Totals {
  clients: number;
  policies: number;
  payments: number;
  commission: number;
  collected: number;
}

export default function SettingsScreen() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [clients, policies, payments] = await Promise.all([
      listClients(),
      listPolicies(),
      listAllPayments(),
    ]);
    const rateById = new Map(policies.map((p) => [p.id, p.commissionRate] as const));
    let commission = 0;
    let collected = 0;
    for (const pm of payments) {
      collected += pm.amount;
      const rate = rateById.get(pm.policyId) ?? 0;
      commission += commissionForAmount({ commissionRate: rate }, pm.amount);
    }
    setTotals({
      clients: clients.length,
      policies: policies.length,
      payments: payments.length,
      commission: Math.round(commission * 100) / 100,
      collected,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Something went wrong', String(e));
    } finally {
      setBusy(null);
    }
  };

  const restore = () =>
    Alert.alert('Restore backup?', 'This replaces all current data with the contents of the backup file.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Choose file',
        onPress: () =>
          run('restore', async () => {
            const result = await importJsonBackup();
            if (result) {
              await refreshMeetingReminders();
              await load();
              Alert.alert(
                'Restore complete',
                `${result.clients} clients, ${result.policies} policies, ${result.payments} payments and ${result.meetings} meetings restored.`,
              );
            }
          }),
      },
    ]);

  const refreshReminders = () =>
    run('notif', async () => {
      const granted = await ensureNotificationSetup();
      if (!granted) {
        Alert.alert('Permission needed', 'Enable notifications in system settings to get reminders.');
        return;
      }
      const items = await loadPoliciesWithStatus();
      const n = await rescheduleDueReminders(items);
      const m = await refreshMeetingReminders();
      Alert.alert('Reminders scheduled', `${n} premium reminder(s) and ${m} meeting reminder(s) set.`);
    });

  const busyIcon = (key: string, icon: IconName) =>
    busy === key ? <ActivityIndicator color={colors.black} /> : <CircleIcon name={icon} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <HeaderBlock decor="blob">
          <Text style={styles.kicker}>Agent overview</Text>
          <Text style={styles.collected}>{totals ? formatCurrency(totals.commission) : '—'}</Text>
          <Text style={styles.kicker}>commission earned</Text>
          <Row style={styles.stats}>
            <StatTile value={totals ? String(totals.clients) : '—'} label="clients" />
            <StatTile value={totals ? String(totals.policies) : '—'} label="policies" />
            <StatTile value={totals ? String(totals.payments) : '—'} label="payments" />
          </Row>
          <Text style={styles.collectedLine}>
            Premium collected {totals ? formatCurrency(totals.collected) : '—'}
          </Text>
        </HeaderBlock>

        <SectionTitle>Export &amp; backup</SectionTitle>
        <Text style={styles.muted}>
          The JSON backup can be restored later; the CSV opens in Excel or Google Sheets.
        </Text>
        <ListRow
          title="Export policies (CSV)"
          subtitle="Share a spreadsheet of every policy"
          leading={<Icon name="doc" size={22} />}
          trailing={busyIcon('csv', 'download')}
          onPress={() =>
            run('csv', async () => {
              await exportPoliciesCsv();
            })
          }
        />
        <ListRow
          title="Export meetings (CSV)"
          subtitle="Every meeting with outcome and notes"
          leading={<Icon name="calendar" size={22} />}
          trailing={busyIcon('mcsv', 'download')}
          onPress={() =>
            run('mcsv', async () => {
              await exportMeetingsCsv();
            })
          }
        />
        <ListRow
          title="Backup all data (JSON)"
          subtitle="Clients, policies, payments and meetings"
          leading={<Icon name="download" size={22} />}
          trailing={busyIcon('json', 'chevronRight')}
          onPress={() =>
            run('json', async () => {
              await exportJsonBackup();
            })
          }
        />
        <ListRow
          title="Restore from JSON backup"
          subtitle="Replaces all current data"
          leading={<Icon name="upload" size={22} />}
          trailing={busyIcon('restore', 'chevronRight')}
          onPress={restore}
        />

        <SectionTitle>Reminders</SectionTitle>
        <Text style={styles.muted}>
          Local notifications remind you a few days before each premium falls due and before each
          meeting. They work offline and send no data anywhere.
        </Text>
        <ListRow
          title="Enable & refresh reminders"
          subtitle="Schedule notifications for dues and meetings"
          leading={<Icon name="bell" size={22} />}
          trailing={busyIcon('notif', 'chevronRight')}
          onPress={refreshReminders}
        />

        <SectionTitle>About</SectionTitle>
        <Card>
          <Text style={styles.about}>
            LIC Policy Manager keeps all data on this device only — no account, no cloud, no fees. Grace
            periods follow LIC rules (15 days monthly, 30 days otherwise).
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.onBlackMuted, fontSize: 13, fontWeight: '700' },
  collected: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: spacing.xs },
  collectedLine: { color: colors.onBlackMuted, fontSize: 13, marginTop: spacing.sm },
  stats: { gap: spacing.sm, marginTop: spacing.md },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginHorizontal: spacing.lg },
  about: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
