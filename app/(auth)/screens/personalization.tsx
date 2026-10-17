import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../../src/theme';
import { Button } from '../../../src/components';
import { CheckboxGroup } from '../../../src/components/CheckboxGroup';

const SUBJECTS = ['Matematică', 'Informatică', 'Fizică', 'Chimie', 'Biologie', 'Geografie', 'Istorie', 'Limba română', 'Limba engleză', 'Economie', 'Psihologie', 'Filozofie'];

const INTERESTS = ['Tehnologie', 'Artă', 'Sport', 'Muzică', 'Știință', 'Business', 'Medicină', 'Drept', 'Educație', 'Inginerie'];

const GRADES = [
  { label: 'Clasa a V-a', value: 'V' },
  { label: 'Clasa a VI-a', value: 'VI' },
  { label: 'Clasa a VII-a', value: 'VII' },
  { label: 'Clasa a VIII-a', value: 'VIII' },
  { label: 'Clasa a IX-a', value: 'IX' },
  { label: 'Clasa a X-a', value: 'X' },
  { label: 'Clasa a XI-a', value: 'XI' },
  { label: 'Clasa a XII-a', value: 'XII' },
  { label: 'Universitate', value: 'universitate' },
];

const COUNTIES = [
  'Alba', 'Arad', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brașov', 'Brăila', 'Buzău', 'Caraș-Severin', 'Călărași', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu', 'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț', 'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vaslui', 'Vâlcea', 'Vrancea',
];

const BUCHAREST_SECTORS = [
  'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6',
];

export default function PersonalizationScreen() {
  const [grade, setGrade] = useState('IX');
  const [county, setCounty] = useState('București');
  const [bucarestSector, setBucarestSector] = useState('Sector 1');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Informatică']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tehnologie']);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showCountyPicker, setShowCountyPicker] = useState(false);
  const [showSectorPicker, setShowSectorPicker] = useState(false);

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
        grade,
        county: county === 'București' ? `${county} - ${bucarestSector}` : county,
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

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Clasa</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowGradePicker(true)}
          >
            <Text style={styles.pickerText}>{GRADES.find(g => g.value === grade)?.label || 'Selectează clasa'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Județ</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCountyPicker(true)}
          >
            <Text style={styles.pickerText}>{county || 'Selectează județul'}</Text>
          </TouchableOpacity>
        </View>

        {county === 'București' && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Sector</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSectorPicker(true)}
            >
              <Text style={styles.pickerText}>{bucarestSector || 'Selectează sectorul'}</Text>
            </TouchableOpacity>
          </View>
        )}

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

      {/* Grade Picker Modal */}
      <Modal
        visible={showGradePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGradePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGradePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Selectează clasa</Text>
            <ScrollView style={styles.optionsList}>
              {GRADES.map((gradeOption) => (
                <TouchableOpacity
                  key={gradeOption.value}
                  style={styles.optionItem}
                  onPress={() => {
                    setGrade(gradeOption.value);
                    setShowGradePicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{gradeOption.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGradePicker(false)}
            >
              <Text style={styles.modalCloseText}>Anulează</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* County Picker Modal */}
      <Modal
        visible={showCountyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountyPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountyPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Selectează județul</Text>
            <ScrollView style={styles.optionsList}>
              {COUNTIES.map((countyName) => (
                <TouchableOpacity
                  key={countyName}
                  style={styles.optionItem}
                  onPress={() => {
                    setCounty(countyName);
                    setShowCountyPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{countyName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountyPicker(false)}
            >
              <Text style={styles.modalCloseText}>Anulează</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Sector Picker Modal */}
      <Modal
        visible={showSectorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSectorPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSectorPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Selectează sectorul</Text>
            <ScrollView style={styles.optionsList}>
              {BUCHAREST_SECTORS.map((sector) => (
                <TouchableOpacity
                  key={sector}
                  style={styles.optionItem}
                  onPress={() => {
                    setBucarestSector(sector);
                    setShowSectorPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{sector}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSectorPicker(false)}
            >
              <Text style={styles.modalCloseText}>Anulează</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginBottom: spacing.xl,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  pickerButton: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.dark.border,
    padding: spacing.md,
    minHeight: 50,
    justifyContent: 'center',
  },
  pickerText: {
    color: colors.dark.textPrimary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    padding: spacing.xl,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginBottom: spacing.lg,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  optionText: {
    color: colors.dark.textPrimary,
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.dark.primary,
    borderRadius: 12,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  button: {
    marginBottom: spacing.md,
  },
});
