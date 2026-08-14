import { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './ReceiptPrint.module.scss';

const PAYMENT_METHOD_LABELS = {
  cash: 'Tunai',
  debit_card: 'Kartu Debit',
  credit_card: 'Kartu Kredit',
  qris: 'QRIS',
};

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Printed via window.print() (@media print), never raw ESC/POS commands —
// see 06-design-system.md "Struk/Invoice Cetak". `active` gates the
// `print-only` class so it doesn't print alongside another print component
// mounted on the same page.
export default function ReceiptPrint({ invoice, active }) {
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    api
      .get('/clinic-profile')
      .then(({ data }) => setClinic(data.data))
      .catch(() => {});
  }, []);

  return (
    <div className={`${active ? 'print-only' : ''} ${styles.receipt}`}>
      <div className={styles.center}>
        <div className={styles.clinicName}>{clinic?.name || 'Medicalsia'}</div>
        <div>{clinic?.address}</div>
        <div>{clinic?.phone}</div>
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <span>No. Invoice</span>
        <span>{invoice.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div className={styles.row}>
        <span>Tanggal</span>
        <span>{formatDateTime(invoice.paid_at || invoice.created_at)}</span>
      </div>
      <div className={styles.row}>
        <span>Pasien</span>
        <span>{invoice.patient_name}</span>
      </div>
      {invoice.doctor_name && (
        <div className={styles.row}>
          <span>Dokter</span>
          <span>{invoice.doctor_name}</span>
        </div>
      )}
      <div className={styles.row}>
        <span>Kasir</span>
        <span>{invoice.cashier_name || '-'}</span>
      </div>

      <div className={styles.divider} />

      {invoice.items.map((item) => (
        <div key={item.id} className={styles.itemRow}>
          <div className={styles.itemDescription}>
            <span>{item.description}</span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
          <div className={styles.itemMeta}>
            {item.quantity} x {formatCurrency(item.price)}
          </div>
        </div>
      ))}

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>Total</span>
        <span>{formatCurrency(invoice.total_amount)}</span>
      </div>
      <div className={styles.row}>
        <span>Metode Bayar</span>
        <span>{PAYMENT_METHOD_LABELS[invoice.payment_method] || '-'}</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.footer}>Terima kasih atas kunjungan Anda</div>
      <div className={styles.footer}>Semoga lekas sembuh</div>
    </div>
  );
}
