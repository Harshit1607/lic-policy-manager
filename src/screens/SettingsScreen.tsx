import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, KeyValue, Screen, SectionTitle } from '../components/ui';
import { listPolicies } from '../db/policies';
import { listAllPayments } from '../db/payments';
import { listClients } from '../db/clients';
import { commissionForAmount } from '../domain/premium';
import { formatCurrency } from '../domain/format';
import { exportJsonBackup, exportPoliciesCsv, importJsonBackup } from '../services/backup';
import { ensureNotificationSetup, rescheduleDueReminders } from '../services/notifications';
import { loadPoliciesWithStatus } from '../services/queries';
import { colors, spacing } from '../theme';

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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Card>
          <SectionTitle>Overview</SectionTitle>
          {totals ? (
            <>
              <KeyValue label="Clients" value={String(totals.clients)} />
              <KeyValue label="Policies" value={String(totals.policies)} />
              <KeyValue label="Payments recorded" value={String(totals.payments)} />
              <KeyValue label="Premium collected" value={formatCurrency(totals.collected)} />
              <KeyValue label="Commission earned" value={formatCurrency(totals.commission)} />
            </>
          ) : (
            <Text style={styles.muted}>Loading…</Text>
          )}
        </Card>

        <Card>
          <SectionTitle>Export &amp; backup</SectionTitle>
          <Text style={styles.muted}>
            Export your data to share or store. The JSON backup can be restored later; the CSV opens
            in Excel or Google Sheets.
          </Text>
          <View style={styles.btnStack}>
            <Button
              title="Export policies (CSV)"
              variant="secondary"
              loading={busy === 'csv'}
              onPress={() =>
                run('csv', async () => {
                  await exportPoliciesCsv();
                })
              }
            />
            <Button
              title="Backup all data (JSON)"
              variant="secondary"
              loading={busy === 'json'}
              onPress={() =>
                run('json', async () => {
                  await exportJsonBackup();
                })
              }
            />
            <Button
              title="Restore from JSON backup"
              variant="ghost"
              loading={busy === 'restore'}
              onPress={() =>
                Alert.alert(
                  'Restore backup?',
                  'This replaces all current data with the contents of the backup file.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Choose file',
                      onPress: () =>
                        run('restore', async () => {
                          const result = await importJsonBackup();
                          if (result) {
                            await load();
                            Alert.alert(
                              'Restore complete',
                              `${result.clients} clients, ${result.policies} policies and ${result.payments} payments restored.`,
                            );
                          }
                        }),
                    },
                  ],
                )
              }
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>Reminders</SectionTitle>
          <Text style={styles.muted}>
            Local notifications remind you a few days before each premium falls due. They work
            offline and send no data anywhere.
          </Text>
          <View style={styles.btnStack}>
            <Button
              title="Enable & refresh reminders"
              variant="secondary"
              loading={busy === 'notif'}
              onPress={() =>
                run('notif', async () => {
                  const granted = await ensureNotificationSetup();
                  if (!granted) {
                    Alert.alert('Permission needed', 'Enable notifications in system settings to get reminders.');
                    return;
                  }
                  const items = await loadPoliciesWithStatus();
                  const n = await rescheduleDueReminders(items);
                  Alert.alert('Reminders scheduled', `${n} upcoming premium reminder(s) set.`);
                })
              }
            />
          </View>
        </Card>

        <Card>
          <SectionTitle>About</SectionTitle>
          <Text style={styles.muted}>
            LIC Policy Manager keeps all data on this device only — no account, no cloud, no fees.
            Grace periods follow LIC rules (15 days monthly, 30 days otherwise).
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, lineHeight: 19 },
  btnStack: { gap: spacing.sm, marginTop: spacing.md },
});
