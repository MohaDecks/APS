import { View, Text, Image, StyleSheet } from 'react-native';
import { formatETB, formatDuration, resolveAssetUrl } from '../lib/api';
import { BRAND_NAME } from '../lib/brand';
import {
  getFacilityInfo,
  formatReceiptTime12,
  formatReceiptDateLine,
  getBarcodeBars,
  getFacilityLogoUri,
} from '../lib/receipt';

function Barcode({ code }) {
  const bars = getBarcodeBars(code);
  return (
    <View style={styles.barcode}>
      {bars.map(({ h, w }, i) => (
        <View key={i} style={[styles.bar, { height: h, width: w }]} />
      ))}
    </View>
  );
}

function PaymentBadge({ invoice }) {
  const uri = resolveAssetUrl(invoice.payment_method_logo_url);
  if (uri) {
    return <Image source={{ uri }} style={styles.payLogo} resizeMode="contain" />;
  }
  if (invoice.payment_method_icon) {
    return <Text style={styles.payIcon}>{invoice.payment_method_icon}</Text>;
  }
  return null;
}

export default function ReceiptTicket({ invoice }) {
  if (!invoice) return null;

  const { name, contact } = getFacilityInfo(invoice);
  const ticket = invoice.invoice_number || '0000000';
  const logoUri = getFacilityLogoUri(invoice);
  const hasLogo = Boolean(logoUri);

  return (
    <View style={styles.ticket}>
      {hasLogo ? (
        <View style={styles.heroWide}>
          <Image source={{ uri: logoUri }} style={styles.brandLogoWide} resizeMode="contain" />
        </View>
      ) : null}

      <Text style={styles.title}>PARKING RECEIPT</Text>
      <View style={styles.rule} />

      {!hasLogo ? <Text style={styles.center}>{name || BRAND_NAME}</Text> : null}
      <Text style={styles.center}>{contact}</Text>
      <Text style={styles.ticketNo}>Ticket#: {ticket}</Text>

      <View style={styles.colsOuter}>
        <View style={styles.cols}>
          <View style={styles.col}>
            <Text style={styles.lbl}>Entry Time</Text>
            <Text style={styles.val}>{formatReceiptTime12(invoice.entry_time)}</Text>
            <Text style={styles.val}>{formatReceiptDateLine(invoice.entry_time)}</Text>
            <Text style={[styles.lbl, styles.lblGap]}>Duration</Text>
            <Text style={styles.val}>{formatDuration(invoice.duration_minutes)}</Text>
          </View>
          <View style={[styles.col, styles.colRight]}>
            <Text style={styles.lbl}>Exit Time</Text>
            <Text style={styles.val}>{formatReceiptTime12(invoice.exit_time)}</Text>
            <Text style={styles.val}>{formatReceiptDateLine(invoice.exit_time)}</Text>
            <Text style={[styles.lbl, styles.lblGap, styles.right]}>PAID:</Text>
            <Text style={[styles.paidVal, styles.right]}>{formatETB(invoice.total_fee)}</Text>
          </View>
        </View>
      </View>

      {invoice.payment_method_name ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Payment: {invoice.payment_method_name}</Text>
          <PaymentBadge invoice={invoice} />
        </View>
      ) : null}

      <Text style={styles.thanks}>THANK YOU AND DRIVE SAFELY</Text>
      <Barcode code={ticket} />
    </View>
  );
}

const INK = '#111111';
const BORDER = '#dc2626';

const styles = StyleSheet.create({
  ticket: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 6,
  },
  heroWide: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogoWide: { width: 220, height: 180, maxWidth: '100%' },
  title: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: INK,
    marginBottom: 10,
  },
  rule: {
    height: 1.5,
    backgroundColor: INK,
    marginBottom: 14,
  },
  center: {
    textAlign: 'center',
    fontSize: 13,
    color: INK,
    lineHeight: 20,
  },
  ticketNo: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: INK,
    marginTop: 10,
    marginBottom: 4,
  },
  colsOuter: {
    marginVertical: 16,
    paddingHorizontal: 8,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: INK,
  },
  cols: {
    flexDirection: 'row',
    minHeight: 150,
  },
  col: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  colRight: {},
  lbl: {
    fontSize: 13,
    fontWeight: '800',
    color: INK,
    marginBottom: 4,
  },
  lblGap: { marginTop: 16 },
  val: {
    fontSize: 13,
    fontWeight: '500',
    color: INK,
    marginBottom: 2,
  },
  right: { textAlign: 'right' },
  paidVal: {
    fontSize: 16,
    fontWeight: '800',
    color: INK,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  payLogo: { width: 28, height: 28, borderRadius: 6 },
  payIcon: { fontSize: 18 },
  thanks: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: INK,
    marginTop: 4,
    marginBottom: 12,
  },
  barcode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 44,
    gap: 2,
  },
  bar: {
    backgroundColor: INK,
  },
});
