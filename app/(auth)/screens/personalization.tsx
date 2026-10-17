import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title } from '../../../src/theme';
import { Button, Input } from '../../../src/components';
import { FormField } from '../../../src/components/FormField';
import { CheckboxGroup } from '../../../src/components/CheckboxGroup';

const SUBJECTS = ['Matematică', 'Informatică', 'Fizică', 'Chimie', 'Biologie', 'Geografie', 'Istorie', 'Limba română', 'Limba engleză', 'Economie', 'Psihologie', 'Filozofie'];

const INTERESTS = ['Tehnologie', 'Artă', 'Sport', 'Muzică', 'Știință', 'Business', 'Medicină', 'Drept', 'Educație', 'Inginerie'];

export default function PersonalizationScreen() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('IX');
  const [county, setCounty] = useState('București');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Informatică']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tehnologie']);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleContinue = () => {
    // Store personalization data and navigate to register
    // Pass data via router params
    router.push({
      pathname: '/(auth)/screens/register',
      params: {
        name,
        grade,
        county,
        subjects: JSON.stringify(selectedSubjects),
        interests: JSON.stringify(selectedInterests),
      },
    } as any);
  };

  const subjectOptions = SUBJECTS.map(subject => ({
    id: subject,
    label: subject,
    checked: selectedSubjects.includes(subject),
  }));

  const interestOptions = INTERESTS.map(interest => ({
    id: interest,
    label: interest,
    checked: selectedInterests.includes(interest),
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Personalizare</Text>

        <FormField label="Nume">
          <Input
            placeholder="Numele tău"
            value={name}
            onChangeText={setName}
          />
        </FormField>

        <FormField label="Clasa">
          <Input
            placeholder="Selectează clasa"
            value={grade}
            onChangeText={setGrade}
          />
        </FormField>

        <FormField label="Județ">
          <Input
            placeholder="Selectează județul"
            value={county}
            onChangeText={setCounty}
          />
        </FormField>

        <CheckboxGroup
          label="Materii preferate"
          options={subjectOptions}
          onToggle={handleSubjectToggle}
          columns={2}
        />

        <CheckboxGroup
          label="Interese"
          options={interestOptions}
          onToggle={handleInterestToggle}
          columns={2}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Continuă"
            onPress={handleContinue}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xl,
    fontSize: 32,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  button: {
    marginBottom: spacing.md,
  },
});
