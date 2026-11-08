import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PolicyRow } from '../components/PolicyRow';
import {
  Avatar,
  Button,
  Card,
  HeaderBlock,
  KeyValue,
  Row,
  Screen,
  SectionHeader,
} from '../components/ui';
import { deleteClient, getClient } from '../db/clients';
import { listPoliciesForClient } from '../db/policies';
import { withStatus, PolicyWithStatus } from '../services/aggregate';
import { callClient, whatsAppClient } from '../services/contact';
import { formatCurrency, formatDate } from '../domain/format';
import type { Client } from '../domain/types';
import { colors, spacing } from '../theme';
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
    navigation.setOptions({ title: 'Client' });
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

  const totalSA = policies.reduce((acc, p) => acc + p.policy.sumAssured, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <HeaderBlock style={styles.profile}>
          <View style={styles.profileInner}>
            <Avatar name={client.name} size={84} />
            <Text style={styles.name}>{client.name}</Text>
            {client.phone ? <Text style={styles.phone}>{client.phone}</Text> : null}
          </View>
        </HeaderBlock>

        <Card style={styles.summaryPill}>
          <Text style={styles.summaryText}>
            {policies.length} polic{policies.length === 1 ? 'y' : 'ies'} · SA {formatCurrency(totalSA)}
          </Text>
        </Card>

        {client.phone ? (
          <Row style={styles.contactRow}>
            <Button
              title="Call"
              icon="phone"
              chevron={false}
              onPress={() => callClient(client.phone!)}
              style={styles.flexBtn}
            />
            <Button
              title="WhatsApp"
              icon="chat"
              variant="secondary"
              onPress={() => whatsAppClient(client.phone!)}
              style={styles.flexBtn}
            />
          </Row>
        ) : null}

        <SectionHeader
          title={`Policies (${policies.length})`}
          actionLabel="Add policy"
          onAction={() => navigation.navigate('PolicyForm', { clientId })}
        />
        {policies.length === 0 ? (
          <Text style={styles.noPolicy}>No policies yet for this client.</Text>
        ) : (
          policies.map((item) => <PolicyRow key={item.policy.id} item={item} showClient={false} />)
        )}

        <SectionHeader title="Details" />
        <Card>
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
          {!client.phone && !client.dob && !client.address && !client.nomineeName && !client.notes ? (
            <Text style={styles.muted}>No extra details saved.</Text>
          ) : null}
          <Row style={styles.editRow}>
            <Button
              title="Edit"
              icon="edit"
              variant="secondary"
              chevron={false}
              onPress={() => navigation.navigate('ClientForm', { clientId })}
              style={styles.flexBtn}
            />
            <Button title="Delete" variant="danger" onPress={confirmDelete} style={styles.flexBtn} />
          </Row>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { paddingBottom: spacing.xxl + spacing.lg },
  profileInner: { alignItems: 'center' },
  name: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: spacing.md, textAlign: 'center' },
  phone: { color: colors.onBlackMuted, fontSize: 14, marginTop: 2 },
  summaryPill: {
    marginTop: -spacing.xl,
    marginHorizontal: spacing.xxl + spacing.lg,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  summaryText: { fontSize: 15, fontWeight: '800', color: colors.text },
  contactRow: { gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.md },
  editRow: { gap: spacing.sm, marginTop: spacing.lg },
  flexBtn: { flex: 1 },
  muted: { color: colors.textMuted },
  noPolicy: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.sm },
});
