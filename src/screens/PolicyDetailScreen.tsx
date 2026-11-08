import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, KeyValue, Row, Screen, SectionTitle, StatusBadge } from '../components/ui';
import { getClient } from '../db/clients';
import { deletePolicy, getPolicy, PolicyWithMeta } from '../db/policies';
import { deletePayment, listPayments } from '../db/payments';
import { computePolicyStatus, maturityDate, statusLabel, totalCommission } from '../domain/premium';
import { formatCurrency, formatDate } from '../domain/format';
import { callClient, premiumReminderMessage, whatsAppClient } from '../services/contact';
import type { Client, Payment, PolicyStatusSummary } from '../domain/types';
import { colors, radius, spacing, statusColor } from '../theme';
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={[styles.statusHeader, { backgroundColor: statusColor[summary.status] }]}>
          <Text style={styles.statusHeaderLabel}>{statusLabel(summary.status)}</Text>
          <Text style={styles.statusHeaderClient}>{policy.clientName}</Text>
          {summary.nextDueDate ? (
            <Text style={styles.statusHeaderDue}>
              Next premium {formatCurrency(policy.premiumAmount)} on {formatDate(summary.nextDueDate)}
            </Text>
          ) : (
            <Text style={styles.statusHeaderDue}>No further premium due</Text>
          )}
          {summary.overdueAmount > 0 ? (
            <Text style={styles.statusHeaderOverdue}>
              Overdue {formatCurrency(summary.overdueAmount)} ({summary.overdueCount} premium
              {summary.overdueCount === 1 ? '' : 's'})
            </Text>
          ) : null}
        </View>

        {client?.phone ? (
          <Row style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => callClient(client.phone!)}>
              <Text style={styles.contactText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactBtn, styles.whatsapp]}
              onPress={() => whatsAppClient(client.phone!, reminder)}
            >
              <Text style={styles.contactText}>WhatsApp reminder</Text>
            </TouchableOpacity>
          </Row>
        ) : null}

        <Card>
          <SectionTitle>Premium status</SectionTitle>
          <KeyValue label="Status" value={statusLabel(summary.status)} />
          <KeyValue label="Next due date" value={formatDate(summary.nextDueDate)} />
          <KeyValue label="Grace period ends" value={formatDate(summary.graceEndDate)} />
          <KeyValue
            label="Premiums paid"
            value={`${summary.paidCount} of ${summary.totalPremiums}`}
          />
          <KeyValue label="Overdue amount" value={formatCurrency(summary.overdueAmount)} />
        </Card>

        <Card>
          <SectionTitle>Policy details</SectionTitle>
          {policy.planName ? <KeyValue label="Plan" value={policy.planName} /> : null}
          {policy.planNumber ? <KeyValue label="Plan number" value={policy.planNumber} /> : null}
          <KeyValue label="Sum assured" value={formatCurrency(policy.sumAssured)} />
          <KeyValue
            label="Premium"
            value={`${formatCurrency(policy.premiumAmount)} · ${policy.premiumMode}`}
          />
          <KeyValue label="Commencement" value={formatDate(policy.commencementDate)} />
          <KeyValue label="Maturity" value={formatDate(maturityDate(policy))} />
          <KeyValue label="Policy term" value={`${policy.policyTermYears} years`} />
          <KeyValue label="Premium paying term" value={`${policy.premiumPayingTermYears} years`} />
          <KeyValue label="Commission rate" value={`${policy.commissionRate}%`} />
          <KeyValue label="Commission earned" value={formatCurrency(commission)} />
          {policy.notes ? <KeyValue label="Notes" value={policy.notes} /> : null}
        </Card>

        <Row style={styles.editRow}>
          <Button
            title="Edit"
            variant="secondary"
            onPress={() => navigation.navigate('PolicyForm', { policyId })}
            style={styles.flexBtn}
          />
          <Button title="Delete" variant="danger" onPress={confirmDeletePolicy} style={styles.flexBtn} />
        </Row>

        <Row style={styles.payHead}>
          <SectionTitle>Payments ({payments.length})</SectionTitle>
          <TouchableOpacity onPress={() => navigation.navigate('PaymentForm', { policyId })}>
            <Text style={styles.addPay}>+ Record payment</Text>
          </TouchableOpacity>
        </Row>

        {payments.length === 0 ? (
          <Text style={styles.noPay}>No payments recorded yet.</Text>
        ) : (
          payments.map((pm) => (
            <Card key={pm.id}>
              <Row style={styles.payRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payAmount}>{formatCurrency(pm.amount)}</Text>
                  <Text style={styles.paySub}>
                    Paid {formatDate(pm.paidDate)}
                    {pm.dueDate ? ` · for due ${formatDate(pm.dueDate)}` : ''}
                  </Text>
                  {pm.receiptNumber ? (
                    <Text style={styles.paySub}>Receipt {pm.receiptNumber}</Text>
                  ) : null}
                  {pm.lateFee > 0 ? (
                    <Text style={styles.paySub}>Late fee {formatCurrency(pm.lateFee)}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => confirmDeletePayment(pm.id)}>
                  <Text style={styles.deletePay}>Delete</Text>
                </TouchableOpacity>
              </Row>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusHeader: { padding: spacing.xl, margin: spacing.lg, borderRadius: radius.lg },
  statusHeaderLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusHeaderClient: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: spacing.xs },
  statusHeaderDue: { color: colors.white, fontSize: 14, marginTop: spacing.xs, opacity: 0.95 },
  statusHeaderOverdue: { color: colors.white, fontSize: 14, fontWeight: '800', marginTop: spacing.xs },
  contactRow: { gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  contactBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  whatsapp: { backgroundColor: '#25D366' },
  contactText: { color: colors.white, fontWeight: '700' },
  editRow: { gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  flexBtn: { flex: 1 },
  payHead: { justifyContent: 'space-between', alignItems: 'center', paddingRight: spacing.lg },
  addPay: { color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
  noPay: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  payRow: { justifyContent: 'space-between', alignItems: 'center' },
  payAmount: { fontSize: 16, fontWeight: '800', color: colors.text },
  paySub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  deletePay: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});
