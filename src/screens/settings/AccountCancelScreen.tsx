import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { COLORS, SIZES } from '../../constants';

const AccountCancelScreen: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);

  const proceed = () => {
    if (step === 1) {
      setStep(2);
    } else {
      Alert.alert('Account cancellation', 'Ainda não há API. Abrindo suporte...', [
        { text: 'OK', onPress: () => Linking.openURL('mailto:support@example.com') },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Cancellation</Text>
      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.text}>Esta ação é irreversível. Seus dados serão excluídos.</Text>
            <Text style={styles.text}>Confirme na próxima etapa para prosseguir.</Text>
          </>
        ) : (
          <>
            <Text style={styles.text}>Tem certeza que deseja cancelar sua conta?</Text>
            <Text style={styles.text}>Você precisará entrar em contato com o suporte.</Text>
          </>
        )}
      </View>
      <TouchableOpacity style={styles.btn} onPress={proceed}>
        <Text style={styles.btnText}>{step === 1 ? 'Continuar' : 'Confirmar cancelamento'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSecondary },
  title: { fontSize: SIZES.fontXL, fontWeight: '700', color: COLORS.textPrimary, padding: SIZES.md },
  card: { backgroundColor: COLORS.background, marginHorizontal: SIZES.md, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', padding: SIZES.md },
  text: { color: COLORS.textPrimary, marginBottom: SIZES.sm },
  btn: { marginTop: SIZES.lg, marginHorizontal: SIZES.md, backgroundColor: COLORS.error || '#ef4444', paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});

export default AccountCancelScreen;