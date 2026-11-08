import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Card, KeyValue, Row, Screen, SectionTitle, StatusBadge } from '../components/ui';
import { deleteClient, getClient } from '../db/clients';
import { listPoliciesForClient } from '../db/policies';
import { withStatus, PolicyWithStatus } from '../services/aggregate';
import { callClient, whatsAppClient } from '../services/contact';
import { formatCurrency, formatDate } from '../domain/format';
import type { Client } from '../domain/types';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ClientDetail'>;

export default function ClientDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { clientId } = route.params;
  const [client, setClient] = useState<Client | null>(null);
  const [policies, setPolicies] = useState<PolicyWithStatus[]>([]);

  const load = useCallback(async () => {
    const c = await getClient(clientId);
    setClient(c);
    navigation.setOptions({ title: c?.name ?? 'Client' });
    const pols = await listPoliciesForClient(clientId);
    setPolicies(pols.map((p) => withStatus(p)));
  }, [clientId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = () => {
    Alert.alert('Delete client?', 'This removes the client and all their policies and payments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteClient(clientId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!client) return <Screen />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Card>
          <Text style={styles.name}>{client.name}</Text>
          {client.phone ? (
            <Row style={styles.contactRow}>
              <TouchableOpacity style={styles.contactBtn} onPress={() => callClient(client.phone!)}>
                <Text style={styles.contactText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, styles.whatsapp]}
                onPress={() => whatsAppClient(client.phone!)}
              >
                <Text style={styles.contactText}>WhatsApp</Text>
              </TouchableOpacity>
            </Row>
          ) : null}
          {client.phone ? <KeyValue label="Phone" value={client.phone} /> : null}
          {client.dob ? <KeyValue label="Date of birth" value={formatDate(client.dob)} /> : null}
          {client.address ? <KeyValue label="Address" value={client.address} /> : null}
          {client.nomineeName ? (
            <KeyValue
              label="Nominee"
              value={`${client.nomineeName}${client.nomineeRelation ? ` (${client.nomineeRelation})` : ''}`}
            />
          ) : null}
          {client.notes ? <KeyValue label="Notes" value={client.notes} /> : null}
          <Row style={styles.editRow}>
            <Button
              title="Edit"
              variant="secondary"
              onPress={() => navigation.navigate('ClientForm', { clientId })}
              style={styles.flexBtn}
            />
            <Button title="Delete" variant="danger" onPress={confirmDelete} style={styles.flexBtn} />
          </Row>
        </Card>

        <Row style={styles.polHead}>
          <SectionTitle>Policies ({policies.length})</SectionTitle>
          <TouchableOpacity onPress={() => navigation.navigate('PolicyForm', { clientId })}>
            <Text style={styles.addPolicy}>+ Add policy</Text>
          </TouchableOpacity>
        </Row>

        {policies.length === 0 ? (
          <Text style={styles.noPolicy}>No policies yet for this client.</Text>
        ) : (
          policies.map(({ policy, summary }) => (
            <TouchableOpacity
              key={policy.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
            >
              <Card>
                <Row style={styles.cardHead}>
                  <Text style={styles.policyNo}>{policy.policyNumber}</Text>
                  <StatusBadge status={summary.status} />
                </Row>
                {policy.planName ? <Text style={styles.plan}>{policy.planName}</Text> : null}
                <Row style={styles.metaRow}>
                  <Text style={styles.meta}>SA {formatCurrency(policy.sumAssured)}</Text>
                  <Text style={styles.meta}>
                    {formatCurrency(policy.premiumAmount)} · {policy.premiumMode}
                  </Text>
                </Row>
                <Text style={styles.next}>
                  {summary.nextDueDate ? `Next due ${formatDate(summary.nextDueDate)}` : 'No premium due'}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  contactRow: { gap: spacing.sm, marginBottom: spacing.md },
  contactBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  whatsapp: { backgroundColor: '#25D366' },
  contactText: { color: colors.white, fontWeight: '700' },
  editRow: { gap: spacing.sm, marginTop: spacing.md },
  flexBtn: { flex: 1 },
  polHead: { justifyContent: 'space-between', alignItems: 'center', paddingRight: spacing.lg },
  addPolicy: { color: colors.primary, fontWeight: '700', marginTop: spacing.lg },
  noPolicy: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  cardHead: { justifyContent: 'space-between' },
  policyNo: { fontSize: 16, fontWeight: '700', color: colors.text },
  plan: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metaRow: { justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 13, color: colors.text },
  next: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
});
