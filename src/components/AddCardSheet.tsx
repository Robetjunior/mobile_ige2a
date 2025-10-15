import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useCardsStore, NewCardInput } from '../stores/cardsStore';
import { detectBrand, formatPanWithMask, validatePanAndBrand, formatExpToMonthYear, isExpValid, isExpSoon, validateCVC, validateHolderName, formatCPFMask, sanitizeDigits, validateCPF } from '../utils/cardValidation';

interface AddCardSheetProps {
  visible: boolean;
  onClose: () => void;
}

const brandIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Ionicons não possui logos de bandeira; usamos ícone genérico
  visa: 'card-outline',
  mastercard: 'card-outline',
  amex: 'card-outline',
  elo: 'card-outline',
  hipercard: 'card-outline',
  diners: 'card-outline',
  discover: 'card-outline',
  unknown: 'card-outline',
};

export const AddCardSheet: React.FC<AddCardSheetProps> = ({ visible, onClose }) => {
  const { add } = useCardsStore();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [cpf, setCpf] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Clear sensitive inputs when closing
      setNumber('');
      setCvc('');
      setExp('');
      setHolder('');
      setCpf('');
      setMakeDefault(false);
    }
  }, [visible]);

  const brand = useMemo(() => detectBrand(number), [number]);
  const maskedNumber = useMemo(() => formatPanWithMask(number, brand), [number, brand]);

  const expParsed = useMemo(() => formatExpToMonthYear(exp), [exp]);
  const expValid = useMemo(() => (expParsed ? isExpValid(expParsed.expMonth, expParsed.expYear) : false), [expParsed]);
  const expSoon = useMemo(() => (expParsed ? isExpSoon(expParsed.expMonth, expParsed.expYear) : false), [expParsed]);
  const panValid = useMemo(() => validatePanAndBrand(number).valid, [number]);
  const cvcValid = useMemo(() => validateCVC(cvc, brand), [cvc, brand]);
  const holderValid = useMemo(() => validateHolderName(holder), [holder]);

  const cpfMasked = useMemo(() => formatCPFMask(cpf), [cpf]);
  const cpfValid = useMemo(() => (sanitizeDigits(cpf).length ? validateCPF(cpf) : true), [cpf]);

  const allValid = panValid && expValid && cvcValid && holderValid && cpfValid;

  const handleSave = async () => {
    if (!allValid || !expParsed) return;
    try {
      setIsSaving(true);
      const payload: NewCardInput = {
        number,
        holder,
        exp,
        cvc,
        cpf,
        makeDefault,
      };
      await add(payload);
      Alert.alert('Sucesso', 'Cartão adicionado');
      // Clear sensitive data and close
      setNumber(''); setCvc(''); setExp(''); setHolder(''); setCpf(''); setMakeDefault(false);
      onClose();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao adicionar cartão');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.sheetTitle}>Adicionar cartão</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar" accessibilityHint="Fecha o formulário">
              <Ionicons name="close" size={SIZES.iconMD} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Número (PAN) */}
          <Text style={styles.label}>Número do cartão</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={maskedNumber}
              onChangeText={(t) => setNumber(t)}
              keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' }) as any}
              placeholder="#### #### #### ####"
              style={[styles.input, !panValid && number ? styles.inputError : null]}
              accessibilityLabel="Número do cartão"
              accessibilityHint="Digite o número do cartão"
            />
            <Ionicons name={brandIconMap[brand]} size={SIZES.iconMD} color={COLORS.textSecondary} />
          </View>
          {!panValid && !!number && (<Text style={styles.errorText}>Número inválido</Text>)}

          {/* Titular */}
          <Text style={styles.label}>Nome impresso no cartão</Text>
          <TextInput
            value={holder}
            onChangeText={(t) => setHolder(t.toUpperCase())}
            placeholder="JOSE ROBERTO"
            style={[styles.input, !holderValid && holder ? styles.inputError : null]}
            accessibilityLabel="Nome do titular"
            accessibilityHint="Digite nome e sobrenome"
          />
          {!holderValid && !!holder && (<Text style={styles.errorText}>Informe nome e sobrenome válidos</Text>)}

          {/* Validade */}
          <Text style={styles.label}>Validade (MM/YY)</Text>
          <TextInput
            value={exp}
            onChangeText={(t) => {
              const only = t.replace(/[^\d/]/g, '');
              let v = only.replace(/(\d{2})(\d)/, '$1/$2');
              v = v.slice(0, 5);
              setExp(v);
            }}
            placeholder="MM/YY"
            style={[styles.input, !expValid && exp ? styles.inputError : null]}
            accessibilityLabel="Validade"
            accessibilityHint="Digite mês e ano"
          />
          {expParsed && expSoon && (<Text style={styles.warnText}>Atenção: expira em breve</Text>)}
          {!expValid && !!exp && (<Text style={styles.errorText}>Validade inválida</Text>)}

          {/* CVC */}
          <Text style={styles.label}>CVC/CVV</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={cvc}
              onChangeText={(t) => setCvc(t.replace(/\D+/g, '').slice(0, brand === 'amex' ? 4 : 3))}
              placeholder={brand === 'amex' ? '4 dígitos' : '3 dígitos'}
              secureTextEntry
              style={[styles.input, !cvcValid && cvc ? styles.inputError : null]}
              keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' }) as any}
              accessibilityLabel="Código de segurança"
              accessibilityHint="3 ou 4 dígitos"
            />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajuda" onPress={() => Alert.alert('Ajuda', 'O CVC/CVV fica no verso do cartão.')}>
              <Ionicons name="help-circle-outline" size={SIZES.iconMD} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {!cvcValid && !!cvc && (<Text style={styles.errorText}>CVC inválido</Text>)}

          {/* CPF (opcional) */}
          <Text style={styles.label}>CPF do titular (opcional)</Text>
          <TextInput
            value={cpfMasked}
            onChangeText={(t) => setCpf(t)}
            placeholder="###.###.###-##"
            keyboardType={Platform.select({ ios: 'number-pad', android: 'numeric', default: 'numeric' }) as any}
            style={[styles.input, !cpfValid && cpf ? styles.inputError : null]}
            accessibilityLabel="CPF (opcional)"
            accessibilityHint="Digite o CPF com 11 dígitos"
          />
          {!cpfValid && !!cpf && (<Text style={styles.errorText}>CPF inválido</Text>)}

          {/* Toggle default */}
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Definir como padrão</Text>
            <Switch value={makeDefault} onValueChange={setMakeDefault} />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose} accessibilityLabel="Cancelar">
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, (!allValid || isSaving) ? styles.btnDisabled : null]}
              onPress={handleSave}
              disabled={!allValid || isSaving}
              accessibilityLabel="Salvar cartão"
            >
              <Text style={styles.btnPrimaryText}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    padding: SIZES.lg,
    borderTopLeftRadius: SIZES.radiusXL,
    borderTopRightRadius: SIZES.radiusXL,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  sheetTitle: { fontSize: SIZES.fontXL, color: COLORS.textPrimary, fontWeight: '700' },
  label: { fontSize: SIZES.fontSM, color: COLORS.textSecondary, marginTop: SIZES.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundSecondary,
    marginRight: SIZES.sm,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { color: COLORS.error, fontSize: SIZES.fontXS, marginTop: SIZES.xs },
  warnText: { color: COLORS.warning, fontSize: SIZES.fontXS, marginTop: SIZES.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SIZES.md },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: SIZES.sm, marginTop: SIZES.lg },
  btn: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusMD },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: COLORS.border },
  btnPrimaryText: { color: COLORS.background, fontWeight: '700' },
  btnSecondaryText: { color: COLORS.textPrimary, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
});

export default AddCardSheet;