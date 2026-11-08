import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Button, Field, Screen } from '../components/ui';
import { createClient, getClient, updateClient } from '../db/clients';
import { isISODate } from '../domain/date';
import { refreshMeetingReminders } from '../services/meetings';
import type { NewClient } from '../domain/types';
import { spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ClientForm'>;

export default function ClientFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const clientId = route.params?.clientId;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: clientId ? 'Edit client' : 'New client' });
    if (clientId) {
      getClient(clientId).then((c) => {
        if (!c) return;
        setName(c.name);
        setPhone(c.phone ?? '');
        setAddress(c.address ?? '');
        setDob(c.dob ?? '');
        setNomineeName(c.nomineeName ?? '');
        setNomineeRelation(c.nomineeRelation ?? '');
        setNotes(c.notes ?? '');
      });
    }
  }, [clientId, navigation]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the policyholder name.');
      return;
    }
    if (dob.trim() && !isISODate(dob.trim())) {
      Alert.alert('Invalid date', 'Date of birth must be in YYYY-MM-DD format.');
      return;
    }
    const data: NewClient = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      dob: dob.trim() || null,
      nomineeName: nomineeName.trim() || null,
      nomineeRelation: nomineeRelation.trim() || null,
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      if (clientId) {
        await updateClient(clientId, data);
        await refreshMeetingReminders();
      } else await createClient(data);
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
        <Field label="Full name *" value={name} onChangeText={setName} placeholder="e.g. Ramesh Sharma" />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10-digit mobile number"
        />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Residential address"
          multiline
        />
        <Field
          label="Date of birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={setDob}
          placeholder="1985-06-01"
          autoCapitalize="none"
        />
        <Field label="Nominee name" value={nomineeName} onChangeText={setNomineeName} placeholder="Nominee" />
        <Field
          label="Nominee relation"
          value={nomineeRelation}
          onChangeText={setNomineeRelation}
          placeholder="e.g. Spouse, Son"
        />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Any extra details" multiline />
        <Button title={saving ? 'Saving…' : 'Save client'} onPress={save} loading={saving} />
      </ScrollView>
    </Screen>
  );
}
