import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { getInvoice } from '../../../services/invoices';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import ReceiptPrint from '../../../components/ReceiptPrint/ReceiptPrint';
import styles from './InvoiceDetail.module.scss';

const STATUS_LABELS = { unpaid: 'Belum Bayar', paid: 'Lunas', cancelled: 'Dibatalkan' };
const STATUS_VARIANTS = { unpaid: 'warning', paid: 'success', cancelled: 'danger' };
const PAYMENT_METHOD_LABELS = { cash: 'Tunai', debit_card: 'Kartu Debit', credit_card: 'Kartu Kredit', qris: 'QRIS' };

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  // A counter, not a boolean — clicking "Cetak Struk" again after the first
  // print must still change this value so the effect below fires again.
  const [printCount, setPrintCount] = useState(0);

  async function fetchInvoice() {
    const { data } = await getInvoice(id);
    setInvoice(data);
  }

  useEffect(() => {
    fetchInvoice();
    window.addEventListener('medicalsia:connection-restored', fetchInvoice);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchInvoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (printCount > 0) window.print();
  }, [printCount]);

  if (!invoice) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Invoice — {invoice.patient_name}</h1>
        {invoice.status === 'paid' && (
          <Button variant="secondary" onClick={() => setPrintCount((c) => c + 1)}>
            <Printer size={16} />
            Cetak Struk
          </Button>
        )}
      </div>

      <Card>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>Pasien</div>
            <div>{invoice.patient_name} ({invoice.patient_number})</div>
          </div>
          <div>
            <div className={styles.label}>Status</div>
            <div><Badge variant={STATUS_VARIANTS[invoice.status]}>{STATUS_LABELS[invoice.status]}</Badge></div>
          </div>
          <div>
            <div className={styles.label}>Metode Pembayaran</div>
            <div>{PAYMENT_METHOD_LABELS[invoice.payment_method] || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Tanggal Lunas</div>
            <div>{formatDateTime(invoice.paid_at)}</div>
          </div>
        </div>

        {invoice.items.map((item) => (
          <div key={item.id} className={styles.itemRow}>
            <span>{item.description} ({item.quantity}x)</span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}

        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </Card>

      {invoice.shortfalls.length > 0 && (
        <Card>
          <div className={styles.label}>Shortfall</div>
          {invoice.shortfalls.map((shortfall) => (
            <div key={shortfall.id} className={styles.shortfallItem}>
              <span>{shortfall.medicine_name} — kurang {shortfall.qty_shortfall}x ({formatCurrency(shortfall.refund_amount)})</span>
              <Badge variant={shortfall.refund_status === 'completed' ? 'success' : 'warning'}>
                {shortfall.refund_status === 'completed' ? 'Refund Selesai' : 'Refund Tertunda'}
              </Badge>
            </div>
          ))}
        </Card>
      )}

      <ReceiptPrint invoice={invoice} active={printActive} />
    </div>
  );
}
