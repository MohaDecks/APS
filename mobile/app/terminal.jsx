import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  RefreshControl, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api, { formatETB, clearAuth, getUser } from '../src/lib/api';
import { theme } from '../src/lib/theme';
import SwipeButton from '../src/components/SwipeButton';
import {
  ConfirmCheckOutDialog,
  CheckInBottomSheet,
  CheckOutSuccessDialog,
  ReceiptPreviewModal,
  ErrorDialog,
} from '../src/components/ParkingDialog';
import { downloadReceipt } from '../src/lib/receipt';
import { loadBranding } from '../src/lib/branding';
import { useBranding } from '../src/hooks/useBranding';
import { BRAND_RED, BRAND_RED_LIGHT } from '../src/lib/brand';

export default function Terminal() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [plate, setPlate] = useState('');
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swipeKey, setSwipeKey] = useState(0);
  const [checkoutSwipeKey, setCheckoutSwipeKey] = useState(0);

  const [checkInSheet, setCheckInSheet] = useState(null);

  const [pendingCheckOut, setPendingCheckOut] = useState(null);
  const [checkoutTarget, setCheckoutTarget] = useState(null);

  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showError, setShowError] = useState(false);

  const router = useRouter();
  const branding = useBranding();

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get('/parking/stats'),
        api.get('/parking/active'),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        await clearAuth();
        router.replace('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    getUser().then(setUser);
    loadBranding(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), loadBranding(true)]);
    setRefreshing(false);
  };

  const resetCheckInSwipe = () => setSwipeKey((k) => k + 1);

  const onCheckInSwipe = () => {
    if (!plate.trim()) return;
    setCheckInSheet({ plate: plate.trim().toUpperCase(), phase: 'confirm' });
  };

  const confirmCheckIn = async () => {
    if (!checkInSheet || checkInSheet.phase !== 'confirm' || loading) return;
    setLoading(true);
    try {
      await api.post('/parking/check-in', { plate: checkInSheet.plate });
      setPlate('');
      resetCheckInSwipe();
      setCheckInSheet({ plate: checkInSheet.plate, phase: 'success' });
      fetchData();
    } catch (err) {
      setCheckInSheet(null);
      resetCheckInSwipe();
      setErrorMsg(err.response?.data?.error || 'Check-in failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckIn = () => {
    setCheckInSheet(null);
    resetCheckInSwipe();
  };

  const doneCheckIn = () => {
    setCheckInSheet(null);
  };

  const selectForCheckout = (session) => {
    setCheckoutTarget({ ...session, feeLabel: formatETB(session.running_fee) });
    setCheckoutSwipeKey((k) => k + 1);
  };

  const onCheckOutSwipe = () => {
    if (!checkoutTarget) return;
    setSelectedPaymentId(null);
    setPaymentPhone('');
    setPendingCheckOut(checkoutTarget);
  };

  useEffect(() => {
    if (!pendingCheckOut) return;
    api.get('/payment-methods/active')
      .then(({ data }) => setPaymentMethods(data))
      .catch(() => setPaymentMethods([]));
  }, [pendingCheckOut]);

  const confirmCheckOut = async () => {
    if (!pendingCheckOut || !selectedPaymentId || paymentPhone.length !== 9 || loading) return;
    setLoading(true);
    const startedAt = Date.now();
    const waitMinLoading = () => {
      const remaining = 5000 - (Date.now() - startedAt);
      return remaining > 0 ? new Promise((resolve) => setTimeout(resolve, remaining)) : Promise.resolve();
    };
    try {
      const { data } = await api.post(`/parking/check-out/${pendingCheckOut.id}`, {
        payment_method_id: selectedPaymentId,
        payment_phone: `+251${paymentPhone}`,
      });
      await waitMinLoading();
      const phone = paymentPhone ? `+251${paymentPhone}` : '';
      setPendingCheckOut(null);
      setCheckoutTarget(null);
      setSelectedPaymentId(null);
      setPaymentPhone('');
      setCheckoutSwipeKey((k) => k + 1);
      setCompletedInvoice({ ...data.invoice, payment_phone: data.invoice.payment_phone || phone });
      setShowCheckoutSuccess(true);
      fetchData();
    } catch (err) {
      await waitMinLoading();
      setPendingCheckOut(null);
      setCheckoutTarget(null);
      setSelectedPaymentId(null);
      setPaymentPhone('');
      setCheckoutSwipeKey((k) => k + 1);
      setErrorMsg(err.response?.data?.error || 'Check-out failed');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckOut = () => {
    setPendingCheckOut(null);
    setSelectedPaymentId(null);
    setPaymentPhone('');
    setCheckoutSwipeKey((k) => k + 1);
  };

  const handleSelectPayment = (id) => {
    setSelectedPaymentId(id);
    setPaymentPhone('');
  };

  const handleDownloadReceipt = async () => {
    if (!completedInvoice || downloadingReceipt) return;
    setDownloadingReceipt(true);
    try {
      const result = await downloadReceipt(completedInvoice);
      if (result?.action === 'preview') {
        setReceiptPreview({
          dataUrl: result.dataUrl,
          invoice: completedInvoice,
        });
      }
      // saved / shared — PNG generated and file saved; no extra step needed
    } catch {
      setErrorMsg('Could not save receipt image. Try again.');
      setShowError(true);
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handleCheckoutDone = () => {
    setShowCheckoutSuccess(false);
    setCompletedInvoice(null);
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          {branding.logoUrl ? (
            <Image source={{ uri: branding.logoUrl }} style={styles.navLogo} resizeMode="contain" />
          ) : null}
          <View style={styles.navTextCol}>
            <Text style={styles.navTitle}>{branding.facilityName || 'Parking'}</Text>
            <Text style={styles.navSub}>{user?.name || user?.email || 'Operator'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          checkoutTarget && !pendingCheckOut && styles.scrollWithBar,
          pendingCheckOut && styles.scrollWithConfirm,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.blue} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Vehicles on premises</Text>
          <Text style={styles.heroNumber}>{stats?.currently_parked ?? 0}</Text>
          <View style={styles.heroMeta}>
            <MetaChip label="Today" value={stats ? formatETB(stats.today_revenue) : '—'} />
            <MetaChip label="Rate" value={stats ? `${stats.hourly_rate} ETB/hr` : '—'} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Check In</Text>
        <View style={styles.listGroup}>
          <View style={styles.checkInRow}>
            <TextInput
              style={styles.checkInPlateInput}
              value={plate}
              onChangeText={setPlate}
              placeholder="AA 12345"
              placeholderTextColor="#c7c7cc"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              textAlign="center"
              {...webInput}
            />
          </View>
          <View style={styles.checkInSwipe}>
            <SwipeButton
              label="Swipe to Check In"
              hint="Slide right to confirm"
              onComplete={onCheckInSwipe}
              disabled={!plate.trim() || !!checkInSheet}
              resetKey={`${swipeKey}-${plate}`}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>On Premises ({sessions.length})</Text>

        {sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            {branding.logoUrl ? (
              <Image source={{ uri: branding.logoUrl }} style={styles.emptyLogo} resizeMode="contain" />
            ) : (
              <View style={styles.emptyMark}>
                <Text style={styles.emptyMarkLetter}>D</Text>
              </View>
            )}
            <Text style={styles.emptyTitle}>No vehicles</Text>
            <Text style={styles.emptySub}>Check in a car to get started</Text>
          </View>
        ) : (
          <View style={styles.listGroup}>
            {sessions.map((item, idx) => {
              const selected = checkoutTarget?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listRow,
                    idx === 0 && styles.listRowFirst,
                    idx === sessions.length - 1 && styles.listRowLast,
                    selected && styles.listRowSelected,
                  ]}
                  onPress={() => selectForCheckout(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.listMain}>
                    <Text style={styles.listPlate}>{item.plate}</Text>
                    <Text style={styles.listFee}>{formatETB(item.running_fee)}</Text>
                  </View>
                  <View style={styles.listSub}>
                    <Text style={styles.listMeta}>{item.elapsed}</Text>
                    <Text style={styles.listMeta}>In {item.entry_time?.slice(11, 19)}</Text>
                  </View>
                  {!selected && <Text style={styles.chevron}>›</Text>}
                  {selected && <View style={styles.selectedDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {checkoutTarget && !pendingCheckOut && (
        <SafeAreaView style={styles.bottomSheet} edges={['bottom']}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetLabel}>Check Out</Text>
              <Text style={styles.sheetPlate}>{checkoutTarget.plate}</Text>
            </View>
            <TouchableOpacity style={styles.sheetClose} onPress={() => { setCheckoutTarget(null); setCheckoutSwipeKey((k) => k + 1); }}>
              <Text style={styles.sheetCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <SwipeButton
            label="Swipe to Check Out"
            hint="Slide right to confirm"
            color={BRAND_RED}
            hintColor="rgba(255,255,255,0.65)"
            completedColor={BRAND_RED}
            onComplete={onCheckOutSwipe}
            disabled={!!pendingCheckOut}
            resetKey={`${checkoutSwipeKey}-${checkoutTarget.id}`}
          />
        </SafeAreaView>
      )}

      <CheckInBottomSheet
        visible={!!checkInSheet}
        plate={checkInSheet?.plate}
        phase={checkInSheet?.phase || 'confirm'}
        loading={loading}
        onConfirm={confirmCheckIn}
        onCancel={cancelCheckIn}
        onDone={doneCheckIn}
      />
      <ConfirmCheckOutDialog
        visible={!!pendingCheckOut}
        session={pendingCheckOut}
        paymentMethods={paymentMethods}
        selectedPaymentId={selectedPaymentId}
        paymentPhone={paymentPhone}
        onSelectPayment={handleSelectPayment}
        onPhoneChange={setPaymentPhone}
        onConfirm={confirmCheckOut}
        onCancel={cancelCheckOut}
        loading={loading}
      />
      <CheckOutSuccessDialog
        visible={showCheckoutSuccess}
        invoice={completedInvoice}
        onDownload={handleDownloadReceipt}
        onDone={handleCheckoutDone}
        downloading={downloadingReceipt}
      />
      <ReceiptPreviewModal
        visible={!!receiptPreview}
        dataUrl={receiptPreview?.dataUrl}
        invoice={receiptPreview?.invoice}
        onClose={() => setReceiptPreview(null)}
      />
      <ErrorDialog visible={showError} message={errorMsg} onClose={() => setShowError(false)} />
    </SafeAreaView>
  );
}

function MetaChip({ label, value }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const webInput = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    backgroundColor: theme.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
  },
  navLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  navLogo: { width: 52, height: 44 },
  navTextCol: { flex: 1 },
  navTitle: { fontSize: 20, fontWeight: '700', color: theme.dark, fontFamily: theme.font, letterSpacing: -0.3 },
  navSub: { fontSize: 15, color: theme.label, marginTop: 2, fontFamily: theme.font },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND_RED_LIGHT,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: BRAND_RED, fontFamily: theme.font },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.space.md, paddingBottom: 32 },
  scrollWithBar: { paddingBottom: 180 },
  scrollWithConfirm: { paddingBottom: 32 },
  heroCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginTop: theme.space.sm,
    marginBottom: theme.space.lg,
    borderLeftWidth: 4,
    borderLeftColor: BRAND_RED,
  },
  heroLabel: { fontSize: 13, fontWeight: '600', color: theme.label, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: theme.font },
  heroNumber: { fontSize: 56, fontWeight: '700', color: BRAND_RED, marginTop: 4, fontFamily: theme.font, letterSpacing: -2 },
  heroMeta: { flexDirection: 'row', gap: 10, marginTop: theme.space.md },
  chip: { flex: 1, backgroundColor: theme.bg, borderRadius: theme.radius.sm, padding: theme.space.sm },
  chipLabel: { fontSize: 12, color: theme.label, fontWeight: '500', fontFamily: theme.font },
  chipValue: { fontSize: 17, fontWeight: '600', color: theme.dark, marginTop: 4, fontFamily: theme.font },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.space.xs,
    marginTop: theme.space.xs,
    marginLeft: 4,
    fontFamily: theme.font,
  },
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    marginBottom: theme.space.lg,
  },
  checkInRow: {
    paddingVertical: 28,
    paddingHorizontal: theme.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
    alignItems: 'center',
  },
  checkInPlateInput: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.dark,
    fontFamily: theme.mono,
    letterSpacing: 3,
    paddingVertical: 4,
    textAlign: 'center',
    width: '100%',
    ...webInput,
  },
  checkInSwipe: {
    paddingHorizontal: theme.space.md,
    paddingTop: 14,
    paddingBottom: 16,
  },
  plateInput: {
    backgroundColor: theme.bg,
    borderRadius: theme.radius.md,
    paddingVertical: 18,
    paddingHorizontal: theme.space.md,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
    color: theme.dark,
    fontFamily: theme.mono,
    marginBottom: theme.space.md,
    ...webInput,
  },
  listGroup: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.space.md,
  },
  listRow: {
    paddingVertical: 14,
    paddingHorizontal: theme.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separator,
    position: 'relative',
  },
  listRowFirst: {},
  listRowLast: { borderBottomWidth: 0 },
  listRowSelected: { backgroundColor: theme.redBg },
  listMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 28 },
  listPlate: { fontSize: 22, fontWeight: '700', color: theme.dark, fontFamily: theme.mono, letterSpacing: 1 },
  listFee: { fontSize: 17, fontWeight: '600', color: BRAND_RED, fontFamily: theme.font },
  listSub: { flexDirection: 'row', gap: 16, marginTop: 4, paddingRight: 28 },
  listMeta: { fontSize: 13, color: theme.label, fontFamily: theme.font },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
    fontSize: 22,
    color: theme.label,
    fontWeight: '300',
  },
  selectedDot: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.red,
  },
  emptyCard: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyLogo: { width: 80, height: 64, marginBottom: 16, opacity: 0.85 },
  emptyMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyMarkLetter: { fontSize: 28, fontWeight: '900', color: BRAND_RED },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: theme.dark, fontFamily: theme.font },
  emptySub: { fontSize: 15, color: theme.label, marginTop: 4, fontFamily: theme.font },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.separator,
    alignSelf: 'center',
    marginBottom: theme.space.sm,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.space.md },
  sheetLabel: { fontSize: 13, color: theme.label, fontWeight: '600', fontFamily: theme.font },
  sheetPlate: { fontSize: 24, fontWeight: '700', color: theme.dark, fontFamily: theme.mono, letterSpacing: 1, marginTop: 2 },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { fontSize: 14, color: theme.label, fontWeight: '600' },
});
