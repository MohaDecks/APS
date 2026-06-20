import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ActivityIndicator, Image, TextInput, ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import { playSuccessSound } from '../lib/sound';
import { resolveAssetUrl } from '../lib/api';
import { receiptActionLabel, copyReceiptText, triggerReceiptDownloadSync, getReceiptFilename } from '../lib/receipt';
import { BRAND_RED, BRAND_RED_LIGHT, CHECKOUT_BTN } from '../lib/brand';
import { useBranding } from '../hooks/useBranding';
import ReceiptTicket from './ReceiptTicket';

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

function DialogBrandMark({ success, error }) {
  const branding = useBranding();

  if (success) {
    return (
      <View style={[styles.brandMarkRing, styles.brandMarkRingSuccess]}>
        <Text style={styles.brandMarkCheck}>✓</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.brandMarkRing, styles.brandMarkRingError]}>
        <Text style={styles.brandMarkCheck}>✕</Text>
      </View>
    );
  }

  if (branding.logoUrl) {
    return (
      <View style={styles.brandMarkRing}>
        <Image
          source={{ uri: branding.logoUrl }}
          style={styles.brandMarkLogo}
          resizeMode="contain"
          accessibilityLabel={branding.facilityName}
        />
      </View>
    );
  }

  return (
    <View style={styles.brandMarkRing}>
      <Text style={styles.brandMarkLetter}>D</Text>
    </View>
  );
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
      <DialogBrandMark success={isSuccess} />
      <Text style={styles.dialogTitle}>{isSuccess ? 'Checked In!' : 'Confirm Check In'}</Text>
      <Text style={styles.dialogSub}>
        {isSuccess ? 'Vehicle is now on premises' : 'This vehicle will be registered on premises'}
      </Text>

      <View style={styles.plateCard}>
        <Text style={styles.plateLabel}>PLATE</Text>
        <Text style={styles.plateText}>{plate}</Text>
      </View>

      {isSuccess ? (
        <TouchableOpacity style={[styles.primaryBtn, styles.brandBtn]} onPress={onDone}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.brandBtn, loading && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Confirm Check In</Text>
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
      <DialogBrandMark />
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
        style={[styles.primaryBtn, styles.checkoutBtn, !canConfirm && styles.btnDisabled]}
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

export function CheckOutSuccessDialog({
  visible, invoice, onDownload, onDone, downloading, receiptReady = true, receiptPreparing = false,
}) {
  useEffect(() => {
    if (visible) playSuccessSound();
  }, [visible]);

  if (!invoice) return null;

  return (
    <SlideUpDialog visible={visible} variant="sheet" dismissOnBackdrop={false}>
      <ScrollView
        style={styles.checkoutScroll}
        contentContainerStyle={styles.checkoutScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReceiptTicket invoice={invoice} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.primaryBtn, styles.payBtn, (downloading || (receiptPreparing && !receiptReady)) && styles.btnDisabled]}
        onPress={onDownload}
        disabled={downloading || (receiptPreparing && !receiptReady)}
      >
        {downloading ? (
          <ActivityIndicator color="#fff" />
        ) : !receiptReady && receiptPreparing ? (
          <Text style={styles.primaryBtnText}>Preparing receipt…</Text>
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSavePng = () => {
    if (!invoice || saving) return;
    if (dataUrl) {
      triggerReceiptDownloadSync(dataUrl, getReceiptFilename(invoice));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    setSaving(true);
    setSaving(false);
  };

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

  if (!invoice && !dataUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewCard}>
          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent}>
            {dataUrl ? (
              <Image source={{ uri: dataUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : invoice ? (
              <ReceiptTicket invoice={invoice} />
            ) : null}
          </ScrollView>
          {invoice && (
            <>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.payBtn, styles.previewCopyBtn, saving && styles.btnDisabled]}
                onPress={handleSavePng}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {saved ? 'Saved!' : receiptActionLabel()}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.previewCopyBtn, copying && styles.btnDisabled, { backgroundColor: '#333' }]}
                onPress={handleCopy}
                disabled={copying}
              >
                {copying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{copied ? 'Copied!' : 'Copy receipt text'}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
      <DialogBrandMark error />
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
      <Text style={styles.pillLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.pillValue, accent && styles.pillValueAccent]}>{value}</Text>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginBottom: 20,
  },
  dialogWide: { maxWidth: 540 },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconRingError: { backgroundColor: BRAND_RED_LIGHT, borderWidth: 0 },
  brandMarkRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BRAND_RED_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  brandMarkRingSuccess: {
    backgroundColor: BRAND_RED_LIGHT,
  },
  brandMarkRingError: {
    backgroundColor: BRAND_RED_LIGHT,
  },
  brandMarkLogo: {
    width: 84,
    height: 84,
  },
  brandMarkLetter: {
    fontSize: 32,
    fontWeight: '900',
    color: BRAND_RED,
  },
  brandMarkCheck: {
    fontSize: 36,
    fontWeight: '800',
    color: BRAND_RED,
  },
  iconBig: { fontSize: 32 },
  dialogTitle: { fontSize: 24, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  dialogSub: { fontSize: 15, color: '#8e8e93', marginTop: 6, marginBottom: 22, textAlign: 'center' },
  plateCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 0,
    ...cardShadow,
  },
  plateLabel: { fontSize: 11, color: '#aeaeb2', letterSpacing: 2, fontWeight: '600' },
  plateText: { fontSize: 38, fontWeight: '900', letterSpacing: 4, marginTop: 12, fontFamily: mono, color: '#111' },
  infoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
  pill: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 0,
    ...cardShadow,
  },
  pillLabel: { fontSize: 11, color: '#aeaeb2', fontWeight: '600', letterSpacing: 1 },
  pillValue: { fontSize: 18, fontWeight: '700', marginTop: 8, color: '#111' },
  pillValueAccent: { color: BRAND_RED },
  primaryBtn: {
    backgroundColor: CHECKOUT_BTN,
    borderRadius: 999,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 4,
  },
  brandBtn: { backgroundColor: BRAND_RED, borderRadius: 18 },
  checkoutBtn: { backgroundColor: CHECKOUT_BTN },
  dangerBtn: { backgroundColor: BRAND_RED },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ghostBtn: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  ghostBtnText: { color: '#8e8e93', fontSize: 16, fontWeight: '500' },
  payTitle: { fontSize: 11, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', letterSpacing: 1.2, alignSelf: 'flex-start', marginBottom: 10 },
  payEmpty: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16, width: '100%' },
  payRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 18 },
  payCard: {
    flex: 1,
    height: 88,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    ...cardShadow,
  },
  payCardSelected: { borderColor: BRAND_RED, backgroundColor: BRAND_RED_LIGHT },
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
  payBtn: { backgroundColor: BRAND_RED },
  checkoutScroll: { maxHeight: 440, width: '100%', marginBottom: 12 },
  checkoutScrollContent: { paddingBottom: 4 },
  paidWith: { width: '100%', alignItems: 'center', marginBottom: 12 },
  paidLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  paidBadge: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_RED_LIGHT, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
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
  successFeeValue: { fontSize: 26, fontWeight: '800', color: BRAND_RED },
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
