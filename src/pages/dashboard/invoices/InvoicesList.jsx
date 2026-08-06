import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt } from 'lucide-react';
import { listInvoices } from '../../../services/invoices';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import styles from './InvoicesList.module.scss';

const LIMIT = 20;

const STATUS_VARIANTS = { unpaid: 'warning', paid: 'success', cancelled: 'danger' };

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InvoicesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const statusLabels = {
    unpaid: t('invoicesPage.list.statusUnpaid'),
    paid: t('invoicesPage.list.statusPaid'),
    cancelled: t('invoicesPage.list.statusCancelled'),
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function fetchInvoices() {
    setIsLoading(true);
    try {
      const data = await listInvoices({ page, limit: LIMIT, search: debouncedSearch });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
    window.addEventListener('medicalsia:connection-restored', fetchInvoices);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchInvoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('invoicesPage.list.title')}</h1>

      <div className={styles.searchRow}>
        <Input placeholder={t('invoicesPage.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        {isLoading && <span className={styles.loadingHint}>{t('invoicesPage.list.loading')}</span>}
      </div>

      {result.data.length === 0 && !isLoading ? (
        <EmptyState icon={Receipt} message={t('invoicesPage.list.noResults')} />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('invoicesPage.list.columnPatient')}</th>
                  <th>{t('invoicesPage.list.columnTotal')}</th>
                  <th>{t('invoicesPage.list.columnMethod')}</th>
                  <th>{t('invoicesPage.list.columnStatus')}</th>
                  <th>{t('invoicesPage.list.columnDate')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((invoice) => (
                  <tr key={invoice.id} onClick={() => navigate(`/dashboard/invoices/${invoice.id}`)}>
                    <td>{invoice.patient_name}</td>
                    <td>{formatCurrency(invoice.total_amount)}</td>
                    <td>{invoice.payment_method || '-'}</td>
                    <td><Badge variant={STATUS_VARIANTS[invoice.status]}>{statusLabels[invoice.status]}</Badge></td>
                    <td>{formatDateTime(invoice.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={result.pagination.page}
            limit={result.pagination.limit}
            totalItems={result.pagination.total_items}
            totalPages={result.pagination.total_pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
