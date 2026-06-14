import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ActivityIndicator,
} from 'react-native';

const mono = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

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

export function ConfirmCheckOutDialog({ visible, session, onConfirm, onCancel, loading }) {
  if (!session) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.dialog}>
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

          <TouchableOpacity
            style={[styles.primaryBtn, styles.dangerBtn, loading && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={loading}
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
});
