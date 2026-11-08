import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card, Field, Screen } from '../components/ui';
import { getPolicy } from '../db/policies';
import { countPayments, createPayment } from '../db/payments';
import { computePolicyStatus } from '../domain/premium';
import { isISODate, todayISO } from '../domain/date';
import { formatCurrency, formatDate } from '../domain/format';
import type { NewPayment } from '../domain/types';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PaymentForm'>;

export default function PaymentFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { policyId } = route.params;

  const [amount, setAmount] = useState('');
  const [paidDate, setPaidDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [lateFee, setLateFee] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<string>('');

  useEffect(() => {
    navigation.setOptions({ title: 'Record payment' });
    (async () => {
      const policy = await getPolicy(policyId);
      if (!policy) return;
      const paid = await countPayments(policyId);
      const summary = computePolicyStatus(policy, paid);
      setAmount(String(policy.premiumAmount));
      if (summary.nextDueDate) setDueDate(summary.nextDueDate);
      setInfo(
        summary.nextDueDate
          ? `This settles the premium due on ${formatDate(summary.nextDueDate)} (${formatCurrency(
              policy.premiumAmount,
            )}).`
          : 'All scheduled premiums are already paid.',
      );
    })();
  }, [policyId, navigation]);

  const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const save = async () => {
    if (!isISODate(paidDate.trim())) {
      Alert.alert('Invalid date', 'Paid date must be in YYYY-MM-DD format.');
      return;
    }
    if (dueDate.trim() && !isISODate(dueDate.trim())) {
      Alert.alert('Invalid date', 'Due date must be in YYYY-MM-DD format.');
      return;
    }
    const data: NewPayment = {
      policyId,
      amount: num(amount),
      paidDate: paidDate.trim(),
      dueDate: dueDate.trim() || null,
      receiptNumber: receiptNumber.trim() || null,
      lateFee: num(lateFee),
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      await createPayment(data);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        {info ? (
          <Card style={styles.infoCard}>
            <Text style={styles.infoText}>{info}</Text>
          </Card>
        ) : null}
        <Field
          label="Amount paid (₹) *"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="25000"
        />
        <Field
          label="Paid date (YYYY-MM-DD) *"
          value={paidDate}
          onChangeText={setPaidDate}
          autoCapitalize="none"
        />
        <Field
          label="Settles due date (YYYY-MM-DD)"
          value={dueDate}
          onChangeText={setDueDate}
          autoCapitalize="none"
          placeholder="Auto-filled with next due date"
        />
        <Field label="Receipt number" value={receiptNumber} onChangeText={setReceiptNumber} placeholder="Receipt #" />
        <Field label="Late fee (₹)" value={lateFee} onChangeText={setLateFee} keyboardType="numeric" placeholder="0" />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Any extra details" multiline />
        <Button title={saving ? 'Saving…' : 'Save payment'} onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: { marginHorizontal: 0, backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  infoText: { color: colors.primaryDark, fontSize: 13 },
});
