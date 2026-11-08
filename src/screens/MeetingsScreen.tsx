import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MeetingRow } from '../components/MeetingRow';
import { Button, EmptyState, HeaderBlock, Row, Screen, SectionTitle, StatTile } from '../components/ui';
import { listMeetings, MeetingWithMeta } from '../db/meetings';
import { groupMeetings, MeetingGroups, upcomingWithinDays } from '../domain/meetings';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MeetingsScreen() {
  const navigation = useNavigation<Nav>();
  const [groups, setGroups] = useState<MeetingGroups<MeetingWithMeta> | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listMeetings().then((all) => {
        setGroups(groupMeetings(all));
        setTodayCount(upcomingWithinDays(all, 0).length);
      });
    }, []),
  );

  if (!groups) return <Screen />;

  const total = groups.upcoming.length + groups.past.length + groups.done.length;
  const add = () => navigation.navigate('MeetingForm');

  if (total === 0) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.emptyScroll}>
          <EmptyState
            illustration="calendar"
            title="No meetings yet"
            subtitle="Plan visits to clients or prospects and get a reminder on this phone before each one."
          >
            <Button title="Add meeting" onPress={add} />
          </EmptyState>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <HeaderBlock>
          <Row style={styles.stats}>
            <StatTile value={String(todayCount)} label="today" />
            <StatTile value={String(groups.upcoming.length)} label="upcoming" />
            <StatTile value={String(groups.past.length)} label="to mark done" />
          </Row>
          <Button title="Add meeting" variant="inverse" icon="plus" chevron={false} onPress={add} style={styles.add} />
        </HeaderBlock>

        <SectionTitle>Upcoming</SectionTitle>
        {groups.upcoming.length === 0 ? (
          <Text style={styles.muted}>Nothing scheduled.</Text>
        ) : (
          groups.upcoming.map((m) => <MeetingRow key={m.id} meeting={m} />)
        )}

        {groups.past.length > 0 ? (
          <>
            <SectionTitle>Past · not marked done</SectionTitle>
            {groups.past.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </>
        ) : null}

        {groups.done.length > 0 ? (
          <View>
            <SectionTitle>Done</SectionTitle>
            {groups.done.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  stats: { gap: spacing.sm },
  add: { marginTop: spacing.md },
  muted: { color: colors.textMuted, marginHorizontal: spacing.lg, marginTop: spacing.xs },
});
