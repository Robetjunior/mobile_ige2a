import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { PaymentCard, useCardsStore } from '../stores/cardsStore';

interface CardItemProps {
  card: PaymentCard;
}

const brandColor: Record<string, string> = {
  visa: '#1A73E8',
  mastercard: '#EB001B',
  amex: '#2E77BB',
  elo: '#222222',
  hipercard: '#8C1B1B',
  diners: '#0069AA',
  discover: '#FF6000',
  unknown: COLORS.gray,
};

export const CardItem: React.FC<CardItemProps> = ({ card }) => {
  const { setDefault, remove, rename } = useCardsStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameLabel, setRenameLabel] = useState<string>(card.label || '');

  const title = useMemo(() => {
    return card.label?.trim().length ? card.label!.trim() : `Cartão •••• ${card.last4}`;
  }, [card.label, card.last4]);

  const expText = useMemo(() => {
    const mm = String(card.expMonth).padStart(2, '0');
    const yy = String(card.expYear % 100).padStart(2, '0');
    return `Vence em ${mm}/${yy}`;
  }, [card.expMonth, card.expYear]);

  const onRemove = async () => {
    Alert.alert('Remover cartão', 'Tem certeza que deseja remover este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await remove(card.id); } },
    ]);
  };

  const onSetDefault = async () => {
    await setDefault(card.id);
    setMenuOpen(false);
  };

  const onRenameConfirm = async () => {
    const value = (renameLabel || '').trim();
    await rename(card.id, value);
    setRenameVisible(false);
    setMenuOpen(false);
  };

  return (
    <View style={styles.container} accessibilityLabel={`Cartão ${title}`}>
      <View style={styles.headerRow}>
        <View style={styles.leftMeta}>
          <View style={[styles.brandIconWrap, { backgroundColor: `${brandColor[card.brand]}15` }]}> 
            <Ionicons name="card-outline" size={22} color={brandColor[card.brand]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.subRow}>
              <Text style={styles.subText} numberOfLines={1}>{expText}</Text>
              <Ionicons name="ellipse" size={6} color={COLORS.borderLight} style={{ marginHorizontal: 6 }} />
              <Text style={styles.subText} numberOfLines={1}>{card.holder}</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightActions}>
          {card.isDefault && (
            <View style={styles.defaultBadge} accessibilityLabel="Padrão">
              <Text style={styles.defaultText}>Padrão</Text>
            </View>
          )}
          <TouchableOpacity
            accessibilityLabel="Mais ações"
            style={styles.moreBtn}
            onPress={() => setMenuOpen(v => !v)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Ações rápidas */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onSetDefault} disabled={card.isDefault} accessibilityLabel={card.isDefault ? 'Cartão padrão' : 'Definir como padrão'}>
          <Ionicons name={card.isDefault ? 'checkmark-circle' : 'radio-button-on'} size={18} color={card.isDefault ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.actionText, card.isDefault && { color: COLORS.primary }]}>Definir padrão</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setRenameVisible(true)} accessibilityLabel="Renomear cartão">
          <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Renomear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onRemove} accessibilityLabel="Remover cartão">
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          <Text style={[styles.actionText, { color: COLORS.error }]}>Remover</Text>
        </TouchableOpacity>
      </View>

      {/* Menu simples inline */}
      {menuOpen && (
        <View style={styles.inlineMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={onSetDefault}>
            <Ionicons name="star-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.menuText}>Tornar padrão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setRenameVisible(true)}>
            <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.menuText}>Renomear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Remover</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal Renomear */}
      <Modal visible={renameVisible} transparent animationType="fade" onRequestClose={() => setRenameVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Renomear cartão</Text>
            <TextInput
              value={renameLabel}
              onChangeText={setRenameLabel}
              placeholder="Apelido (opcional)"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.modalInput}
              maxLength={24}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setRenameVisible(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSave]} onPress={onRenameConfirm}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    padding: SIZES.md,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.sm,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm as any,
    flex: 1,
    marginRight: SIZES.sm,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontMD,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSM,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm as any,
  },
  defaultBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultText: {
    color: '#1E40AF',
    fontSize: SIZES.fontXS,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  moreBtn: {
    padding: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.fontSM,
    fontWeight: '600',
  },
  inlineMenu: {
    marginTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  menuText: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontSM,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '86%',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: SIZES.fontMD,
    fontWeight: '700',
    marginBottom: SIZES.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusSM,
    paddingHorizontal: SIZES.sm,
    paddingVertical: 10,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: SIZES.md,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: SIZES.radiusSM,
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modalSave: {
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default CardItem;