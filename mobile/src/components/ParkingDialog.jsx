import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ActivityIndicator, Image, TextInput, ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { playSuccessSound } from '../lib/sound';
import { resolveAssetUrl, formatETB, formatDuration } from '../lib/api';
import { receiptActionLabel, copyReceiptText } from '../lib/receipt';

const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
const webInput = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

const dialogShadow = Platform.select({
  web: { boxShadow: '0 28px 80px rgba(0,0,0,0.22), 0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 28,
  },
});

const sheetShadow = Platform.select({
  web: { boxShadow: '0 -12px 48px rgba(0,0,0,0.18), 0 -4px 16px rgba(0,0,0,0.08)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
  },
});

const cardShadow = Platform.select({
  web: { boxShadow: '0 6px 18px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

function SlideUpDialog({
  visible,
  onRequestClose,
  children,
  wide,
  dismissOnBackdrop = true,
  variant = 'center',
}) {
  const isSheet = variant === 'sheet';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onRequestClose}>
      <View style={[styles.overlay, isSheet && styles.overlaySheet]}>
        {dismissOnBackdrop && onRequestClose && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        )}
        <View
          style={[
            isSheet ? styles.dialogSheet : styles.dialog,
            !isSheet && wide && styles.dialogWide,
            isSheet ? styles.sheetShadow : dialogShadow,
          ]}
        >
          {isSheet && <View style={styles.sheetHandle} />}
          {children}
        </View>
      </View>
    </Modal>
  );
}

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

export function CheckInBottomSheet({ visible, plate, phase, loading, onConfirm, onCancel, onDone }) {
  const isSuccess = phase === 'success';

  useEffect(() => {
    if (visible && isSuccess) playSuccessSound();
  }, [visible, isSuccess]);

  if (!plate) return null;

  return (
    <SlideUpDialog
      visible={visible}
      variant="sheet"
      dismissOnBackdrop={!loading}
      onRequestClose={isSuccess ? onDone : loading ? undefined : onCancel}
    >
      <View style={[styles.iconRing, { backgroundColor: isSuccess ? '#dcfce7' : '#f0fdf4', borderColor: isSuccess ? '#86efac' : '#bbf7d0' }]}>
        <Text style={styles.iconBig}>{isSuccess ? '✓' : '🚗'}</Text>
      </View>
      <Text style={styles.dialogTitle}>{isSuccess ? 'Checked In!' : 'Confirm Check In'}</Text>
      <Text style={styles.dialogSub}>
        {isSuccess ? 'Vehicle is now on premises' : 'This vehicle will be registered on premises'}
      </Text>

      <View style={styles.plateCard}>
        <Text style={styles.plateLabel}>PLATE</Text>
        <Text style={styles.plateText}>{plate}</Text>
      </View>

      {isSuccess ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      ) : (
        <>
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
        </>
      )}
    </SlideUpDialog>
  );
}

export function ConfirmCheckInDialog(props) {
  return <CheckInBottomSheet {...props} phase="confirm" onDone={props.onCancel} />;
}

export function ConfirmCheckOutDialog({
  visible,
  session,
  paymentMethods,
  selectedPaymentId,
  paymentPhone,
  onSelectPayment,
  onPhoneChange,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!session) return null;

  const phoneValid = paymentPhone?.length === 9;
  const canConfirm = !!selectedPaymentId && phoneValid && !loading;

  return (
    <SlideUpDialog visible={visible} onRequestClose={loading ? undefined : onCancel} variant="sheet">
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
                <PaymentLogo
                  logoUrl={method.logo_url}
                  icon={method.icon}
                  size={56}
                  textStyle={styles.payIconText}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedPaymentId && (
        <View style={styles.phoneField}>
          <Text style={styles.phoneLabel}>Phone number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phonePrefix}>+251</Text>
            <TextInput
              style={styles.phoneInput}
              value={paymentPhone}
              onChangeText={(text) => onPhoneChange(text.replace(/\D/g, '').slice(0, 9))}
              placeholder="9XX XXX XXX"
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
              maxLength={9}
              editable={!loading}
              {...webInput}
            />
          </View>
        </View>
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
    </SlideUpDialog>
  );
}

export function CheckOutSuccessDialog({ visible, invoice, onDownload, onDone, downloading }) {
  useEffect(() => {
    if (visible) playSuccessSound();
  }, [visible]);

  if (!invoice) return null;

  return (
    <SlideUpDialog visible={visible} variant="sheet" dismissOnBackdrop={false}>
      <View style={[styles.iconRing, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
        <Text style={[styles.iconBig, { fontSize: 36 }]}>✓</Text>
      </View>
      <Text style={styles.dialogTitle}>Payment Received!</Text>
      <Text style={styles.dialogSub}>Check-out completed successfully</Text>

      <View style={styles.receiptBox}>
        <ReceiptRow label="Invoice" value={invoice.invoice_number} />
        <ReceiptRow label="Plate" value={invoice.plate} bold mono />
        <ReceiptRow label="Entry" value={invoice.entry_time?.replace('T', ' ').slice(0, 19)} />
        <ReceiptRow label="Exit" value={invoice.exit_time?.replace('T', ' ').slice(0, 19)} />
        <ReceiptRow label="Duration" value={formatDuration(invoice.duration_minutes)} />
        <ReceiptRow label="Rate" value={`${formatETB(invoice.hourly_rate)}/hr`} />
        {invoice.payment_method_name && (
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment</Text>
            <View style={styles.receiptPay}>
              <PaymentLogo
                logoUrl={invoice.payment_method_logo_url}
                icon={invoice.payment_method_icon}
                size={28}
                textStyle={styles.paidIcon}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.successFeeBox}>
        <Text style={styles.successFeeLabel}>Total paid</Text>
        <Text style={styles.successFeeValue}>{invoice.total_fee != null ? formatETB(invoice.total_fee) : '—'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, styles.payBtn, downloading && styles.btnDisabled]}
        onPress={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>{receiptActionLabel()}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={onDone}>
        <Text style={styles.ghostBtnText}>Done</Text>
      </TouchableOpacity>
    </SlideUpDialog>
  );
}

export function ReceiptPreviewModal({ visible, dataUrl, invoice, onClose }) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!invoice || copying) return;
    setCopying(true);
    try {
      await copyReceiptText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setCopying(false);
    }
  };

  if (!dataUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Receipt</Text>
          <Text style={styles.previewHint}>
            Touch and hold the image to save, or copy the receipt text below.
          </Text>
          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent}>
            <Image source={{ uri: dataUrl }} style={styles.previewImage} resizeMode="contain" />
          </ScrollView>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.previewCopyBtn, copying && styles.btnDisabled]}
            onPress={handleCopy}
            disabled={copying}
          >
            {copying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{copied ? 'Copied!' : 'Copy receipt text'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
            <Text style={styles.ghostBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function CheckInSuccessDialog(props) {
  return (
    <CheckInBottomSheet
      visible={props.visible}
      plate={props.plate}
      phase="success"
      loading={false}
      onConfirm={() => {}}
      onCancel={props.onClose}
      onDone={props.onClose}
    />
  );
}

export function ErrorDialog({ visible, message, onClose }) {
  return (
    <SlideUpDialog visible={visible} variant="sheet" onRequestClose={onClose}>
      <View style={[styles.iconRing, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
        <Text style={[styles.iconBig, { color: '#ef4444' }]}>✕</Text>
      </View>
      <Text style={styles.dialogTitle}>Something went wrong</Text>
      <Text style={styles.dialogSub}>{message}</Text>
      <TouchableOpacity style={[styles.primaryBtn, styles.dangerBtn]} onPress={onClose}>
        <Text style={styles.primaryBtnText}>OK</Text>
      </TouchableOpacity>
    </SlideUpDialog>
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

function ReceiptRow({ label, value, bold, mono }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptLabel}>{label}</Text>
      <Text style={[styles.receiptValue, bold && styles.receiptBold, mono && styles.receiptMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  overlaySheet: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 32,
    width: '96%',
    maxWidth: 520,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    zIndex: 1,
  },
  dialogSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
    marginBottom: 16,
  },
  dialogWide: { maxWidth: 540 },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBig: { fontSize: 40 },
  dialogTitle: { fontSize: 26, fontWeight: '800', color: '#111', letterSpacing: -0.3 },
  dialogSub: { fontSize: 16, color: '#888', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  plateCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...cardShadow,
  },
  plateLabel: { fontSize: 11, color: '#aaa', letterSpacing: 2, fontWeight: '700' },
  plateText: { fontSize: 40, fontWeight: '900', letterSpacing: 3, marginTop: 14, fontFamily: mono },
  infoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 22 },
  pill: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    ...cardShadow,
  },
  pillLabel: { fontSize: 11, color: '#aaa', fontWeight: '600', textTransform: 'uppercase' },
  pillValue: { fontSize: 19, fontWeight: '700', marginTop: 6, color: '#222' },
  primaryBtn: {
    backgroundColor: '#000',
    borderRadius: 18,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    ...cardShadow,
  },
  dangerBtn: { backgroundColor: '#f87171' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  ghostBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  ghostBtnText: { color: '#888', fontSize: 15, fontWeight: '500' },
  payTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 12 },
  payEmpty: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16, width: '100%' },
  payRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 16 },
  payCard: {
    flex: 1,
    height: 92,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    ...cardShadow,
  },
  payCardSelected: { borderColor: '#f87171', backgroundColor: '#fff5f5' },
  payIconText: { fontSize: 18, fontWeight: '800' },
  phoneField: { width: '100%', marginBottom: 16 },
  phoneLabel: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#eee',
    fontFamily: mono,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    fontFamily: mono,
    ...webInput,
  },
  payBtn: { backgroundColor: '#007AFF' },
  paidWith: { width: '100%', alignItems: 'center', marginBottom: 12 },
  paidLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  paidBadge: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  paidIcon: { fontSize: 18 },
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
    ...cardShadow,
  },
  successFeeLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  successFeeValue: { fontSize: 26, fontWeight: '800', color: '#16a34a' },
  receiptBox: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...cardShadow,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  receiptValue: { fontSize: 14, color: '#222', fontWeight: '600', maxWidth: '58%', textAlign: 'right' },
  receiptBold: { fontWeight: '800' },
  receiptMono: { fontFamily: mono, letterSpacing: 1 },
  receiptPay: { flexDirection: 'row', alignItems: 'center' },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    padding: 16,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '92%',
    ...dialogShadow,
  },
  previewTitle: { fontSize: 22, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 8 },
  previewHint: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  previewScroll: { maxHeight: 360, marginBottom: 12 },
  previewScrollContent: { alignItems: 'center' },
  previewImage: {
    width: '100%',
    height: 340,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  previewCopyBtn: { marginBottom: 4 },
});
