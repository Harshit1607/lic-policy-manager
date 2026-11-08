import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { PolicyRow } from '../components/PolicyRow';
import { Button, EmptyState, HeaderBlock, IconButton, Row, Screen, SearchField } from '../components/ui';
import { loadPoliciesWithStatus } from '../services/queries';
import type { PolicyWithStatus } from '../services/aggregate';
import { spacing } from '../theme';
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
      <HeaderBlock style={styles.header}>
        <Row style={styles.searchRow}>
          <SearchField
            placeholder="Search policy no, name or plan"
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              load(t);
            }}
          />
          <IconButton
            icon="plus"
            accessibilityLabel="Add policy"
            onPress={() => navigation.navigate('PolicyForm')}
            size={46}
          />
        </Row>
      </HeaderBlock>
      <FlatList
        data={policies}
        keyExtractor={(p) => String(p.policy.id)}
        contentContainerStyle={policies.length === 0 ? styles.flexGrow : styles.list}
        ListEmptyComponent={
          search ? (
            <EmptyState illustration="noResults" title="No matches" subtitle="Try a different search term." />
          ) : (
            <EmptyState
              illustration="documents"
              title="No policies yet"
              subtitle="Add a client, then register their policies."
            >
              <Button title="Add policy" onPress={() => navigation.navigate('PolicyForm')} />
            </EmptyState>
          )
        }
        renderItem={({ item }) => <PolicyRow item={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.lg },
  searchRow: { gap: spacing.sm },
  flexGrow: { flexGrow: 1, justifyContent: 'center' },
  list: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
});
