import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Field, Label, Screen, Segmented } from '../components/ui';
import { listClients } from '../db/clients';
import { createPolicy, getPolicy, updatePolicy } from '../db/policies';
import { isISODate } from '../domain/date';
import type { Client, NewPolicy, PremiumMode } from '../domain/types';
import { PREMIUM_MODES } from '../domain/types';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PolicyForm'>;

const MODE_OPTIONS: { value: PremiumMode; label: string }[] = PREMIUM_MODES.map((m) => ({
  value: m,
  label: m.charAt(0).toUpperCase() + m.slice(1),
}));

export default function PolicyFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const policyId = route.params?.policyId;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<number | null>(route.params?.clientId ?? null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [planName, setPlanName] = useState('');
  const [planNumber, setPlanNumber] = useState('');
  const [sumAssured, setSumAssured] = useState('');
  const [commencementDate, setCommencementDate] = useState('');
  const [policyTermYears, setPolicyTermYears] = useState('');
  const [premiumPayingTermYears, setPremiumPayingTermYears] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumMode, setPremiumMode] = useState<PremiumMode>('yearly');
  const [commissionRate, setCommissionRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: policyId ? 'Edit policy' : 'New policy' });
    listClients().then(setClients);
    if (policyId) {
      getPolicy(policyId).then((p) => {
        if (!p) return;
        setClientId(p.clientId);
        setPolicyNumber(p.policyNumber);
        setPlanName(p.planName ?? '');
        setPlanNumber(p.planNumber ?? '');
        setSumAssured(String(p.sumAssured));
        setCommencementDate(p.commencementDate);
        setPolicyTermYears(String(p.policyTermYears));
        setPremiumPayingTermYears(String(p.premiumPayingTermYears));
        setPremiumAmount(String(p.premiumAmount));
        setPremiumMode(p.premiumMode);
        setCommissionRate(String(p.commissionRate));
        setNotes(p.notes ?? '');
      });
    }
  }, [policyId, navigation]);

  const num = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const save = async () => {
    if (!clientId) {
      Alert.alert('Client required', 'Please choose the policyholder.');
      return;
    }
    if (!policyNumber.trim()) {
      Alert.alert('Policy number required', 'Please enter the policy number.');
      return;
    }
    if (!isISODate(commencementDate.trim())) {
      Alert.alert('Invalid date', 'Commencement date must be in YYYY-MM-DD format.');
      return;
    }
    const data: NewPolicy = {
      clientId,
      policyNumber: policyNumber.trim(),
      planName: planName.trim() || null,
      planNumber: planNumber.trim() || null,
      sumAssured: num(sumAssured),
      commencementDate: commencementDate.trim(),
      policyTermYears: num(policyTermYears),
      premiumPayingTermYears: num(premiumPayingTermYears) || num(policyTermYears),
      premiumAmount: num(premiumAmount),
      premiumMode,
      commissionRate: num(commissionRate),
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      if (policyId) await updatePolicy(policyId, data);
      else await createPolicy(data);
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
        {!route.params?.clientId && !policyId ? (
          <View style={styles.clientPicker}>
            <Label>Policyholder *</Label>
            {clients.length === 0 ? (
              <Text style={styles.noClient}>Add a client first from the Clients tab.</Text>
            ) : (
              <View style={styles.chips}>
                {clients.map((c) => {
                  const active = c.id === clientId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setClientId(c.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        <Field
          label="Policy number *"
          value={policyNumber}
          onChangeText={setPolicyNumber}
          placeholder="e.g. 123456789"
          autoCapitalize="characters"
        />
        <Field label="Plan name" value={planName} onChangeText={setPlanName} placeholder="e.g. Jeevan Anand" />
        <Field label="Plan number" value={planNumber} onChangeText={setPlanNumber} placeholder="e.g. 815" />
        <Field
          label="Sum assured (₹)"
          value={sumAssured}
          onChangeText={setSumAssured}
          keyboardType="numeric"
          placeholder="500000"
        />
        <Field
          label="Commencement date (YYYY-MM-DD) *"
          value={commencementDate}
          onChangeText={setCommencementDate}
          placeholder="2020-04-10"
          autoCapitalize="none"
        />
        <Field
          label="Policy term (years)"
          value={policyTermYears}
          onChangeText={setPolicyTermYears}
          keyboardType="numeric"
          placeholder="20"
        />
        <Field
          label="Premium paying term (years)"
          value={premiumPayingTermYears}
          onChangeText={setPremiumPayingTermYears}
          keyboardType="numeric"
          placeholder="Defaults to policy term"
        />
        <Field
          label="Premium amount (₹)"
          value={premiumAmount}
          onChangeText={setPremiumAmount}
          keyboardType="numeric"
          placeholder="25000"
        />
        <Segmented label="Premium mode" value={premiumMode} options={MODE_OPTIONS} onChange={setPremiumMode} />
        <Field
          label="Commission rate (%)"
          value={commissionRate}
          onChangeText={setCommissionRate}
          keyboardType="numeric"
          placeholder="e.g. 5"
        />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Any extra details" multiline />
        <Button title={saving ? 'Saving…' : 'Save policy'} onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  clientPicker: { marginBottom: spacing.md },
  noClient: { color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.2,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.black },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white, fontWeight: '700' },
});
