import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { OptionCard } from '../components/OptionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import type { PatientProfile } from '../types';

function maskBirthDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) {
    return day;
  }

  if (digits.length <= 4) {
    return `${day}/${month}`;
  }

  return `${day}/${month}/${year}`;
}

function isCompleteBirthDate(value: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return false;
  }

  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function ProfileScreen({ initialEmail, onSave }: { initialEmail: string; onSave: (profile: PatientProfile) => void | Promise<void> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<PatientProfile['gender']>('prefer_not_to_say');
  const [usualOutOfBedTime, setUsualOutOfBedTime] = useState('07:00');
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenderSelectOpen, setIsGenderSelectOpen] = useState(false);

  const canContinue = Boolean(name.trim() && email.trim() && isCompleteBirthDate(birthDate) && usualOutOfBedTime.trim() && accepted && !isSaving);

  async function handleSaveProfile() {
    if (!canContinue) {
      return;
    }

    setIsSaving(true);

    try {
      await onSave({ name: name.trim(), email: email.trim(), birthDate, gender, usualOutOfBedTime, acceptedTermsAt: new Date().toISOString() });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Perfil inicial</Text>
        <Text style={styles.subtitle}>Precisamos destes dados para personalizar lembretes e relatórios.</Text>
        <GlassCard style={styles.card}>
          <TextInput style={styles.input} placeholder="Nome" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput
            style={styles.input}
            placeholder="Data de nascimento (DD/MM/AAAA)"
            placeholderTextColor={colors.textMuted}
            value={birthDate}
            onChangeText={(value) => setBirthDate(maskBirthDate(value))}
            keyboardType="number-pad"
            maxLength={10}
          />
          <Text style={styles.label}>Gênero</Text>
          <View style={styles.selectGroup}>
            <Pressable style={styles.selectBox} onPress={() => setIsGenderSelectOpen((value) => !value)}>
              <Text style={styles.selectText}>{getGenderLabel(gender)}</Text>
              <Text style={styles.selectArrow}>{isGenderSelectOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {isGenderSelectOpen ? (
              <View style={styles.selectOptions}>
                <OptionCard label="Masculino" selected={gender === 'male'} onPress={() => {
                  setGender('male');
                  setIsGenderSelectOpen(false);
                }} />
                <OptionCard label="Feminino" selected={gender === 'female'} onPress={() => {
                  setGender('female');
                  setIsGenderSelectOpen(false);
                }} />
                <OptionCard label="Prefiro não informar" selected={gender === 'prefer_not_to_say'} onPress={() => {
                  setGender('prefer_not_to_say');
                  setIsGenderSelectOpen(false);
                }} />
              </View>
            ) : null}
          </View>
          <Text style={styles.label}>Horário habitual de sair da cama</Text>
          <TextInput style={styles.input} placeholder="HH:mm" placeholderTextColor={colors.textMuted} value={usualOutOfBedTime} onChangeText={setUsualOutOfBedTime} />
          <OptionCard label="Li e aceito os termos de uso e privacidade" selected={accepted} onPress={() => setAccepted((value) => !value)} />
          <PrimaryButton
            label={isSaving ? 'Salvando...' : 'Salvar perfil'}
            disabled={!canContinue}
            onPress={handleSaveProfile}
          />
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

function getGenderLabel(gender: PatientProfile['gender']): string {
  if (gender === 'male') {
    return 'Masculino';
  }

  if (gender === 'female') {
    return 'Feminino';
  }

  return 'Prefiro nao informar';
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl, gap: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 23 },
  card: { gap: spacing.md },
  label: { color: colors.text, fontWeight: '800', marginTop: spacing.sm },
  input: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)' },
  selectGroup: { gap: spacing.sm },
  selectBox: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  selectArrow: { color: colors.cyan, fontSize: 14, fontWeight: '900' },
  selectOptions: { gap: spacing.sm },
});
