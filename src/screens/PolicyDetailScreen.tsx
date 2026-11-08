import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Button,
  Card,
  CircleIcon,
  HeaderBlock,
  KeyValue,
  ListRow,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../components/ui';
import { getClient } from '../db/clients';
import { deletePolicy, getPolicy, PolicyWithMeta } from '../db/policies';
import { deletePayment, listPayments } from '../db/payments';
import { computePolicyStatus, maturityDate, statusLabel, totalCommission } from '../domain/premium';
import { formatCurrency, formatDate } from '../domain/format';
import { callClient, premiumReminderMessage, whatsAppClient } from '../services/contact';
import type { Client, Payment, PolicyStatusSummary } from '../domain/types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PolicyDetail'>;

export default function PolicyDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { policyId } = route.params;

  const [policy, setPolicy] = useState<PolicyWithMeta | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PolicyStatusSummary | null>(null);

  const load = useCallback(async () => {
    const p = await getPolicy(policyId);
    setPolicy(p);
    if (!p) return;
    navigation.setOptions({ title: p.policyNumber });
    setClient(await getClient(p.clientId));
    const pays = await listPayments(policyId);
    setPayments(pays);
    setSummary(computePolicyStatus(p, pays.length));
  }, [policyId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDeletePolicy = () => {
    Alert.alert('Delete policy?', 'This removes the policy and its payment history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePolicy(policyId);
          navigation.goBack();
        },
      },
    ]);
  };

  const confirmDeletePayment = (id: number) => {
    Alert.alert('Delete payment?', 'This payment will be removed from the history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePayment(id);
          load();
        },
      },
    ]);
  };

  if (!policy || !summary) return <Screen />;

  const commission = totalCommission(policy, payments);
  const reminder = premiumReminderMessage({
    clientName: policy.clientName,
    policyNumber: policy.policyNumber,
    amount: formatCurrency(policy.premiumAmount),
    dueDate: formatDate(summary.nextDueDate),
  });
  const paidShare = summary.totalPremiums > 0 ? summary.paidCount / summary.totalPremiums : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <HeaderBlock>
          <StatusBadge status={summary.status} onBlack />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ClientDetail', { clientId: policy.clientId })}
          >
            <Text style={styles.client}>{policy.clientName}</Text>
          </TouchableOpacity>
          <Text style={styles.due}>
            {summary.nextDueDate
              ? `Next premium ${formatCurrency(policy.premiumAmount)} on ${formatDate(summary.nextDueDate)}`
              : 'No further premium due'}
          </Text>
          {summary.overdueAmount > 0 ? (
            <Text style={styles.overdue}>
              Overdue {formatCurrency(summary.overdueAmount)} ({summary.overdueCount} premium
              {summary.overdueCount === 1 ? '' : 's'})
            </Text>
          ) : null}
          <ProgressBar value={paidShare} onBlack style={styles.bar} />
          <Text style={styles.barLabel}>
            {summary.paidCount} of {summary.totalPremiums} premiums paid
          </Text>
        </HeaderBlock>

        <Row style={styles.actionRow}>
          <Button
            title="Record payment"
            onPress={() => navigation.navigate('PaymentForm', { policyId })}
            style={styles.flexBtn}
          />
        </Row>
        {client?.phone ? (
          <Row style={styles.actionRow}>
            <Button
              title="Call"
              icon="phone"
              variant="secondary"
              chevron={false}
              onPress={() => callClient(client.phone!)}
              style={styles.flexBtn}
            />
            <Button
              title="WhatsApp"
              icon="chat"
              variant="secondary"
              chevron={false}
              onPress={() => whatsAppClient(client.phone!, reminder)}
              style={styles.flexBtn}
            />
          </Row>
        ) : null}

        <SectionHeader title="Premium status" />
        <Card>
          <KeyValue label="Status" value={statusLabel(summary.status)} strong />
          <KeyValue label="Next due date" value={formatDate(summary.nextDueDate)} />
          <KeyValue label="Grace period ends" value={formatDate(summary.graceEndDate)} />
          <KeyValue label="Premiums paid" value={`${summary.paidCount} of ${summary.totalPremiums}`} />
          <KeyValue label="Overdue amount" value={formatCurrency(summary.overdueAmount)} strong />
        </Card>

        <SectionHeader title="Policy details" />
        <Card>
          {policy.planName ? <KeyValue label="Plan" value={policy.planName} /> : null}
          {policy.planNumber ? <KeyValue label="Plan number" value={policy.planNumber} /> : null}
          <KeyValue label="Sum assured" value={formatCurrency(policy.sumAssured)} strong />
          <KeyValue label="Premium" value={`${formatCurrency(policy.premiumAmount)} · ${policy.premiumMode}`} />
          <KeyValue label="Commencement" value={formatDate(policy.commencementDate)} />
          <KeyValue label="Maturity" value={formatDate(maturityDate(policy))} />
          <KeyValue label="Policy term" value={`${policy.policyTermYears} years`} />
          <KeyValue label="Premium paying term" value={`${policy.premiumPayingTermYears} years`} />
          <KeyValue label="Commission rate" value={`${policy.commissionRate}%`} />
          <KeyValue label="Commission earned" value={formatCurrency(commission)} strong />
          {policy.notes ? <KeyValue label="Notes" value={policy.notes} /> : null}
          <Row style={styles.editRow}>
            <Button
              title="Edit"
              icon="edit"
              variant="secondary"
              chevron={false}
              onPress={() => navigation.navigate('PolicyForm', { policyId })}
              style={styles.flexBtn}
            />
            <Button title="Delete" variant="danger" onPress={confirmDeletePolicy} style={styles.flexBtn} />
          </Row>
        </Card>

        <SectionHeader
          title={`Payments (${payments.length})`}
          actionLabel="Record"
          onAction={() => navigation.navigate('PaymentForm', { policyId })}
        />
        {payments.length === 0 ? (
          <Text style={styles.noPay}>No payments recorded yet.</Text>
        ) : (
          payments.map((pm) => (
            <ListRow
              key={pm.id}
              title={formatCurrency(pm.amount)}
              subtitle={`Paid ${formatDate(pm.paidDate)}${pm.dueDate ? ` · for due ${formatDate(pm.dueDate)}` : ''}`}
              meta={
                [
                  pm.receiptNumber ? `Receipt ${pm.receiptNumber}` : null,
                  pm.lateFee > 0 ? `Late fee ${formatCurrency(pm.lateFee)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || null
              }
              trailing={
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Delete payment"
                  onPress={() => confirmDeletePayment(pm.id)}
                  hitSlop={8}
                >
                  <View style={styles.trashWrap}>
                    <CircleIcon name="trash" />
                  </View>
                </TouchableOpacity>
              }
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  client: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: spacing.md },
  due: { color: colors.onBlackMuted, fontSize: 14, marginTop: spacing.xs },
  overdue: { color: colors.white, fontSize: 14, fontWeight: '800', marginTop: spacing.xs },
  bar: { marginTop: spacing.lg },
  barLabel: { color: colors.onBlackMuted, fontSize: 12, marginTop: spacing.xs },
  actionRow: { gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md },
  editRow: { gap: spacing.sm, marginTop: spacing.lg },
  flexBtn: { flex: 1 },
  noPay: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  trashWrap: { padding: 2 },
});
