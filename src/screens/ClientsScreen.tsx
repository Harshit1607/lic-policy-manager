import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Avatar, Button, EmptyState, HeaderBlock, IconButton, ListRow, Row, Screen, SearchField } from '../components/ui';
import { listClients } from '../db/clients';
import type { Client } from '../domain/types';
import { spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ClientsScreen() {
  const navigation = useNavigation<Nav>();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async (q: string) => {
    setClients(await listClients(q));
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
            placeholder="Search by name or phone"
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              load(t);
            }}
          />
          <IconButton
            icon="plus"
            accessibilityLabel="Add client"
            onPress={() => navigation.navigate('ClientForm')}
            size={46}
          />
        </Row>
      </HeaderBlock>
      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={clients.length === 0 ? styles.flexGrow : styles.list}
        ListEmptyComponent={
          search ? (
            <EmptyState illustration="noResults" title="No matches" subtitle="Try a different name or phone." />
          ) : (
            <EmptyState
              illustration="people"
              title="No clients yet"
              subtitle="Register a policyholder to start tracking their policies."
            >
              <Button title="Add client" onPress={() => navigation.navigate('ClientForm')} />
            </EmptyState>
          )
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.phone || 'No phone on file'}
            leading={<Avatar name={item.name} />}
            onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.lg },
  searchRow: { gap: spacing.sm },
  flexGrow: { flexGrow: 1, justifyContent: 'center' },
  list: { paddingVertical: spacing.md },
});
