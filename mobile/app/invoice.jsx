import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import { formatETB, formatDuration } from '../src/lib/api';
import { theme } from '../src/lib/theme';

export default function Invoice() {
  const { data } = useLocalSearchParams();
  const router = useRouter();
  const invoice = data ? JSON.parse(data) : null;

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No invoice data</Text>
      </SafeAreaView>
    );
  }

  const handlePrint = async () => {
    if (Platform.OS === 'web') {
      window.print();
      return;
    }
    const html = `
      <html><body style="font-family: -apple-system, sans-serif; padding: 24px;">
        <h2 style="text-align:center">${invoice.facility_name}</h2>
        <p style="text-align:center;color:#888">PARKING RECEIPT</p>
        <hr/>
        <p>Invoice: ${invoice.invoice_number}</p>
        <p>Plate: <b>${invoice.plate}</b></p>
        <p>Entry: ${invoice.entry_time?.replace('T', ' ').slice(0, 19)}</p>
        <p>Exit: ${invoice.exit_time?.replace('T', ' ').slice(0, 19)}</p>
        <p>Duration: ${formatDuration(invoice.duration_minutes)}</p>
        <p>Rate: ${formatETB(invoice.hourly_rate)}/hr</p>
        <hr/>
        <p style="font-size:22px;font-weight:700">Total: ${formatETB(invoice.total_fee)}</p>
      </body></html>
    `;
    await Print.printAsync({ html });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Receipt</Text>

        <View style={styles.receipt}>
          <Text style={styles.facility}>{invoice.facility_name}</Text>
          <Text style={styles.receiptLabel}>PARKING RECEIPT</Text>

          <View style={styles.divider} />

          <Row label="Invoice" value={invoice.invoice_number} />
          <Row label="Plate" value={invoice.plate} bold mono />
          <Row label="Entry" value={invoice.entry_time?.replace('T', ' ').slice(0, 19)} />
          <Row label="Exit" value={invoice.exit_time?.replace('T', ' ').slice(0, 19)} />
          <Row label="Duration" value={formatDuration(invoice.duration_minutes)} />
          <Row label="Rate" value={`${formatETB(invoice.hourly_rate)}/hr`} />

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatETB(invoice.total_fee)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.8}>
          <Text style={styles.printBtnText}>Print Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold, mono }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { padding: theme.space.lg },
  emptyText: { textAlign: 'center', marginTop: 60, color: theme.label, fontFamily: theme.font },
  pageTitle: { fontSize: 34, fontWeight: '700', color: theme.dark, marginBottom: theme.space.lg, fontFamily: theme.font, letterSpacing: -0.5 },
  receipt: { backgroundColor: theme.surface, borderRadius: theme.radius.lg, padding: theme.space.lg },
  facility: { fontSize: 20, fontWeight: '700', textAlign: 'center', color: theme.dark, fontFamily: theme.font },
  receiptLabel: { fontSize: 11, color: theme.label, textAlign: 'center', marginTop: 4, letterSpacing: 1.5, fontWeight: '600', fontFamily: theme.font },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.separator, marginVertical: theme.space.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { fontSize: 15, color: theme.label, fontFamily: theme.font },
  rowValue: { fontSize: 15, color: theme.dark, fontFamily: theme.font },
  bold: { fontWeight: '700' },
  mono: { fontFamily: theme.mono, fontWeight: '700', letterSpacing: 1 },
  totalBox: {
    backgroundColor: theme.bg, borderRadius: theme.radius.md, padding: theme.space.md,
    marginTop: theme.space.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 15, color: theme.label, fontWeight: '600', fontFamily: theme.font },
  totalValue: { fontSize: 28, fontWeight: '700', color: theme.green, fontFamily: theme.font },
  printBtn: { backgroundColor: theme.blue, borderRadius: theme.radius.md, padding: 16, alignItems: 'center', marginTop: theme.space.lg },
  printBtnText: { color: '#fff', fontWeight: '600', fontSize: 17, fontFamily: theme.font },
  doneBtn: { padding: 16, alignItems: 'center', marginTop: theme.space.xs },
  doneBtnText: { fontSize: 17, fontWeight: '600', color: theme.blue, fontFamily: theme.font },
});
