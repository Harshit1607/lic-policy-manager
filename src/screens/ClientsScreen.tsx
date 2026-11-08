import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, EmptyState, Screen } from '../components/ui';
import { listClients } from '../db/clients';
import type { Client } from '../domain/types';
import { colors, radius, spacing } from '../theme';
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
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Search by name or phone"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            load(t);
          }}
        />
        <Button title="+ Add" onPress={() => navigation.navigate('ClientForm')} style={styles.addBtn} />
      </View>
      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={clients.length === 0 ? styles.flexGrow : { paddingVertical: spacing.sm }}
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No matches' : 'No clients yet'}
            subtitle={search ? 'Try a different name or phone.' : 'Tap “+ Add” to register your first client.'}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.phone || 'No phone on file'}</Text>
            </View>
          </TouchableOpacity>
        )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  rowBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
