import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useEffect } from 'react';
import { playSuccessSound } from '../lib/sound';
import { resolveAssetUrl } from '../lib/api';

const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

function PaymentLogo({ logoUrl, icon, size = 40, textStyle }) {
  const uri = resolveAssetUrl(logoUrl);
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: 8 }}
        resizeMode="contain"
      />
    );
  }
  return <Text style={textStyle}>{icon || '💳'}</Text>;
}

export function ConfirmCheckInDialog({ visible, plate, onConfirm, onCancel, loading }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dialog}>
          <View style={[styles.iconRing, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={styles.iconBig}>🚗</Text>
          </View>
          <Text style={styles.dialogTitle}>Confirm Check In</Text>
          <Text style={styles.dialogSub}>This vehicle will be registered on premises</Text>

          <View style={styles.plateCard}>
            <Text style={styles.plateLabel}>PLATE NUMBER</Text>
            <Text style={styles.plateText}>{plate}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>✓ Confirm Check In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCancel} disabled={loading}>
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmCheckOutDialog({
  visible,
  session,
  paymentMethods,
  selectedPaymentId,
  onSelectPayment,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!session) return null;

  const canConfirm = !!selectedPaymentId && !loading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.dialog, styles.dialogWide]}>
          <View style={[styles.iconRing, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={styles.iconBig}>🚗</Text>
          </View>
          <Text style={styles.dialogTitle}>Confirm Check Out</Text>
          <Text style={styles.dialogSub}>Vehicle is leaving the premises</Text>

          <View style={styles.plateCard}>
            <Text style={styles.plateLabel}>PLATE</Text>
            <Text style={styles.plateText}>{session.plate}</Text>
          </View>

          <View style={styles.infoRow}>
            <InfoPill label="Elapsed" value={session.elapsed} />
            <InfoPill label="Total Fee" value={session.feeLabel} accent />
          </View>

          <Text style={styles.payTitle}>Select payment method</Text>
          {paymentMethods.length === 0 ? (
            <Text style={styles.payEmpty}>No active payment methods. Ask admin to add them.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payScroll}>
              <View style={styles.payRow}>
                {paymentMethods.map((method) => {
                  const selected = selectedPaymentId === method.id;
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[styles.payCard, selected && styles.payCardSelected]}
                      onPress={() => onSelectPayment(method.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.payIcon, selected && styles.payIconSelected]}>
                        <PaymentLogo
                          logoUrl={method.logo_url}
                          icon={method.icon}
                          size={36}
                          textStyle={styles.payIconText}
                        />
                      </View>
                      <Text style={[styles.payName, selected && styles.payNameSelected]}>{method.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, styles.dangerBtn, !canConfirm && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={!canConfirm}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm Check Out</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onCancel} disabled={loading}>
            <Text style={styles.ghostBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function CheckOutSuccessDialog({ visible, invoice, onPrint, onDone }) {
  useEffect(() => {
    if (visible) playSuccessSound();
  }, [visible]);

  if (!invoice) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, styles.dialogWide]}>
          <View style={[styles.iconRing, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
            <Text style={[styles.iconBig, { fontSize: 36 }]}>✓</Text>
          </View>
          <Text style={styles.dialogTitle}>Payment Received!</Text>
          <Text style={styles.dialogSub}>Check-out completed successfully</Text>

          <View style={styles.plateCard}>
            <Text style={styles.plateLabel}>PLATE</Text>
            <Text style={styles.plateText}>{invoice.plate}</Text>
          </View>

          {invoice.payment_method_name && (
            <View style={styles.paidWith}>
              <Text style={styles.paidLabel}>Paid with</Text>
              <View style={styles.paidBadge}>
                <PaymentLogo
                  logoUrl={invoice.payment_method_logo_url}
                  icon={invoice.payment_method_icon}
                  size={28}
                  textStyle={styles.paidIcon}
                />
                <Text style={styles.paidName}>{invoice.payment_method_name}</Text>
              </View>
            </View>
          )}

          <View style={styles.successFeeBox}>
            <Text style={styles.successFeeLabel}>Total paid</Text>
            <Text style={styles.successFeeValue}>{invoice.total_fee != null ? `ETB ${Number(invoice.total_fee).toFixed(2)}` : '—'}</Text>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, styles.payBtn]} onPress={onPrint}>
            <Text style={styles.primaryBtnText}>Print Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onDone}>
            <Text style={styles.ghostBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function CheckInSuccessDialog({ visible, plate, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.iconRing, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
            <Text style={[styles.iconBig, { fontSize: 36 }]}>✓</Text>
          </View>
          <Text style={styles.dialogTitle}>Checked In!</Text>
          <Text style={styles.dialogSub}>Vehicle is now on premises</Text>
          <View style={styles.plateCard}>
            <Text style={styles.plateLabel}>PLATE</Text>
            <Text style={styles.plateText}>{plate}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={onClose}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function ErrorDialog({ visible, message, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={[styles.iconRing, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={[styles.iconBig, { color: '#ef4444' }]}>✕</Text>
          </View>
          <Text style={styles.dialogTitle}>Something went wrong</Text>
          <Text style={styles.dialogSub}>{message}</Text>
          <TouchableOpacity style={[styles.primaryBtn, styles.dangerBtn]} onPress={onClose}>
            <Text style={styles.primaryBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoPill({ label, value, accent }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, accent && { color: '#16a34a' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
    zIndex: 1,
  },
  dialogWide: { maxWidth: 380 },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBig: { fontSize: 32 },
  dialogTitle: { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  dialogSub: { fontSize: 14, color: '#888', marginTop: 6, marginBottom: 20, textAlign: 'center' },
  plateCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  plateLabel: { fontSize: 10, color: '#aaa', letterSpacing: 2, fontWeight: '700' },
  plateText: { fontSize: 32, fontWeight: '900', letterSpacing: 3, marginTop: 6, fontFamily: mono },
  infoRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 20 },
  pill: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  pillLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', textTransform: 'uppercase' },
  pillValue: { fontSize: 15, fontWeight: '700', marginTop: 4, color: '#222' },
  primaryBtn: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerBtn: { backgroundColor: '#ef4444' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  ghostBtnText: { color: '#888', fontSize: 15, fontWeight: '500' },
  payTitle: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 10 },
  payEmpty: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16, width: '100%' },
  payScroll: { width: '100%', marginBottom: 16, maxHeight: 110 },
  payRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  payCard: {
    width: 88,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  payCardSelected: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  payIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  payIconSelected: { borderColor: '#ef4444', backgroundColor: '#fff5f5' },
  payIconText: { fontSize: 18, fontWeight: '800' },
  payName: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  payNameSelected: { color: '#b91c1c' },
  payBtn: { backgroundColor: '#007AFF' },
  paidWith: { width: '100%', alignItems: 'center', marginBottom: 12 },
  paidLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  paidIcon: { fontSize: 18 },
  paidName: { fontSize: 15, fontWeight: '700', color: '#166534' },
  successFeeBox: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  successFeeLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  successFeeValue: { fontSize: 22, fontWeight: '800', color: '#16a34a' },
});
