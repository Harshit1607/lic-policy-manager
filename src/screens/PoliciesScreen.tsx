import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Card, EmptyState, Row, Screen, StatusBadge } from '../components/ui';
import { formatCurrency, formatDate } from '../domain/format';
import { loadPoliciesWithStatus } from '../services/queries';
import type { PolicyWithStatus } from '../services/aggregate';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PoliciesScreen() {
  const navigation = useNavigation<Nav>();
  const [policies, setPolicies] = useState<PolicyWithStatus[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async (q: string) => {
    setPolicies(await loadPoliciesWithStatus(q));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
    }, [load, search]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Search policy no, name or plan"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            load(t);
          }}
        />
        <Button title="+ Add" onPress={() => navigation.navigate('PolicyForm')} style={styles.addBtn} />
      </View>
      <FlatList
        data={policies}
        keyExtractor={(p) => String(p.policy.id)}
        contentContainerStyle={policies.length === 0 ? styles.flexGrow : { paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No matches' : 'No policies yet'}
            subtitle={
              search ? 'Try a different search term.' : 'Add a client, then register their policies.'
            }
          />
        }
        renderItem={({ item }) => {
          const { policy, summary } = item;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
            >
              <Card>
                <Row style={styles.cardHead}>
                  <Text style={styles.policyNo}>{policy.policyNumber}</Text>
                  <StatusBadge status={summary.status} />
                </Row>
                <Text style={styles.client}>{policy.clientName}</Text>
                {policy.planName ? <Text style={styles.plan}>{policy.planName}</Text> : null}
                <Row style={styles.metaRow}>
                  <Text style={styles.meta}>SA {formatCurrency(policy.sumAssured)}</Text>
                  <Text style={styles.meta}>
                    {formatCurrency(policy.premiumAmount)} · {policy.premiumMode}
                  </Text>
                </Row>
                <Text style={styles.next}>
                  {summary.nextDueDate ? `Next due ${formatDate(summary.nextDueDate)}` : 'No premium due'}
                  {summary.overdueAmount > 0 ? `  ·  Overdue ${formatCurrency(summary.overdueAmount)}` : ''}
                </Text>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  search: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  addBtn: { paddingHorizontal: spacing.lg },
  flexGrow: { flexGrow: 1, justifyContent: 'center' },
  cardHead: { justifyContent: 'space-between' },
  policyNo: { fontSize: 16, fontWeight: '700', color: colors.text },
  client: { fontSize: 14, color: colors.text, marginTop: 2 },
  plan: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  metaRow: { justifyContent: 'space-between', marginTop: spacing.sm },
  meta: { fontSize: 13, color: colors.text },
  next: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
});
