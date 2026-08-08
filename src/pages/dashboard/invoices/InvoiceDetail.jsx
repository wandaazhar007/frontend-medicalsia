import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { getInvoice } from '../../../services/invoices';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import ReceiptPrint from '../../../components/ReceiptPrint/ReceiptPrint';
import styles from './InvoiceDetail.module.scss';

const STATUS_VARIANTS = { unpaid: 'warning', paid: 'success', cancelled: 'danger' };

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InvoiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  // A counter, not a boolean — clicking "Cetak Struk" again after the first
  // print must still change this value so the effect below fires again.
  const [printCount, setPrintCount] = useState(0);

  const statusLabels = {
    unpaid: t('invoicesPage.detail.statusUnpaid'),
    paid: t('invoicesPage.detail.statusPaid'),
    cancelled: t('invoicesPage.detail.statusCancelled'),
  };
  const paymentMethodLabels = {
    cash: t('invoicesPage.detail.methodCash'),
    debit_card: t('invoicesPage.detail.methodDebitCard'),
    credit_card: t('invoicesPage.detail.methodCreditCard'),
    qris: t('invoicesPage.detail.methodQris'),
  };

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
        <h1 className={styles.title}>{t('invoicesPage.list.title')} — {invoice.patient_name}</h1>
        {invoice.status === 'paid' && (
          <Button variant="secondary" onClick={() => setPrintCount((c) => c + 1)}>
            <Printer size={14} />
            {t('invoicesPage.detail.printReceipt')}
          </Button>
        )}
      </div>

      <Card>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>{t('invoicesPage.detail.patient')}</div>
            <div>{invoice.patient_name} ({invoice.patient_number})</div>
          </div>
          <div>
            <div className={styles.label}>{t('invoicesPage.detail.status')}</div>
            <div><Badge variant={STATUS_VARIANTS[invoice.status]}>{statusLabels[invoice.status]}</Badge></div>
          </div>
          <div>
            <div className={styles.label}>{t('invoicesPage.detail.paymentMethod')}</div>
            <div>{paymentMethodLabels[invoice.payment_method] || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('invoicesPage.detail.paidDate')}</div>
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
          <span>{t('invoicesPage.detail.total')}</span>
          <span>{formatCurrency(invoice.total_amount)}</span>
        </div>
      </Card>

      {invoice.shortfalls.length > 0 && (
        <Card>
          <div className={styles.label}>{t('invoicesPage.detail.shortfall')}</div>
          {invoice.shortfalls.map((shortfall) => (
            <div key={shortfall.id} className={styles.shortfallItem}>
              <span>{shortfall.medicine_name} — {t('invoicesPage.detail.shortfallLess')} {shortfall.qty_shortfall}x ({formatCurrency(shortfall.refund_amount)})</span>
              <Badge variant={shortfall.refund_status === 'completed' ? 'success' : 'warning'}>
                {shortfall.refund_status === 'completed' ? t('invoicesPage.detail.refundCompleted') : t('invoicesPage.detail.refundPending')}
              </Badge>
            </div>
          ))}
        </Card>
      )}

      <ReceiptPrint invoice={invoice} active={printCount > 0} />
    </div>
  );
}
