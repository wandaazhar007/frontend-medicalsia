import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pill, PlusCircle } from 'lucide-react';
import { listMedicines, updateMedicine, updateMedicineStock } from '../../../services/medicines';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import Modal from '../../../components/Modal/Modal';
import styles from './MedicinesList.module.scss';

const LIMIT = 20;

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_STOCK_FORM = { change_qty: '', reason: 'restock' };

export default function MedicinesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK_FORM);
  const [stockError, setStockError] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function fetchMedicines() {
    setIsLoading(true);
    try {
      const data = await listMedicines({ page, limit: LIMIT, search: debouncedSearch });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMedicines();
    window.addEventListener('medicalsia:connection-restored', fetchMedicines);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchMedicines);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  async function handleToggleActive(medicine) {
    await updateMedicine(medicine.id, { is_active: !medicine.is_active });
    fetchMedicines();
  }

  function openStockModal(medicine) {
    setStockTarget(medicine);
    setStockForm(EMPTY_STOCK_FORM);
    setStockError('');
  }

  function closeStockModal() {
    setStockTarget(null);
  }

  async function handleStockSubmit(e) {
    e.preventDefault();
    setStockError('');

    const changeQty = parseInt(stockForm.change_qty, 10);
    if (!Number.isInteger(changeQty) || changeQty === 0) {
      setStockError(t('medicinesPage.list.stockQtyRequired'));
      return;
    }
    if (stockForm.reason === 'restock' && changeQty < 0) {
      setStockError(t('medicinesPage.list.restockMustBePositive'));
      return;
    }

    setIsSavingStock(true);
    try {
      await updateMedicineStock(stockTarget.id, { change_qty: changeQty, reason: stockForm.reason });
      closeStockModal();
      fetchMedicines();
    } catch (err) {
      setStockError(err?.response?.data?.error?.message || t('medicinesPage.list.stockSaveError'));
    } finally {
      setIsSavingStock(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('medicinesPage.list.title')}</h1>
        <Button onClick={() => navigate('/dashboard/medicines/new')}>
          <PlusCircle size={16} />
          {t('medicinesPage.list.addButton')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('medicinesPage.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        {isLoading && <span className={styles.loadingHint}>{t('medicinesPage.list.loading')}</span>}
      </div>

      {result.data.length === 0 && !isLoading ? (
        <EmptyState icon={Pill} message={t('medicinesPage.list.noResults')} />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('medicinesPage.list.columnName')}</th>
                  <th>{t('medicinesPage.list.columnUnit')}</th>
                  <th>{t('medicinesPage.list.columnPrice')}</th>
                  <th>{t('medicinesPage.list.columnStock')}</th>
                  <th>{t('medicinesPage.list.columnExpiry')}</th>
                  <th>{t('medicinesPage.list.columnStatus')}</th>
                  <th>{t('medicinesPage.list.columnAction')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((medicine) => {
                  const isLowStock = medicine.stock_qty <= medicine.min_stock_alert;
                  return (
                    <tr key={medicine.id}>
                      <td>{medicine.name}</td>
                      <td>{medicine.unit}</td>
                      <td>{formatCurrency(medicine.price)}</td>
                      <td>
                        <div className={styles.stockCell}>
                          <span>{medicine.stock_qty}</span>
                          {isLowStock && <Badge variant={medicine.stock_qty === 0 ? 'danger' : 'warning'}>{t('medicinesPage.list.lowStock')}</Badge>}
                        </div>
                      </td>
                      <td>{formatDate(medicine.expiry_date)}</td>
                      <td><Badge variant={medicine.is_active ? 'success' : 'danger'}>{medicine.is_active ? t('medicinesPage.list.active') : t('medicinesPage.list.inactive')}</Badge></td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button variant="secondary" onClick={() => navigate(`/dashboard/medicines/${medicine.id}/edit`)}>{t('medicinesPage.list.edit')}</Button>
                          <Button variant="secondary" onClick={() => openStockModal(medicine)}>{t('medicinesPage.list.adjustStock')}</Button>
                          <Button variant={medicine.is_active ? 'danger' : 'ghost'} onClick={() => handleToggleActive(medicine)}>
                            {medicine.is_active ? t('medicinesPage.list.deactivate') : t('medicinesPage.list.activate')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <Modal isOpen={Boolean(stockTarget)} onClose={closeStockModal} title={stockTarget ? t('medicinesPage.list.stockModalTitle', { name: stockTarget.name }) : ''}>
        {stockTarget && (
          <form className={styles.modalForm} onSubmit={handleStockSubmit}>
            {stockError && <div className={styles.error}>{stockError}</div>}
            <p>{t('medicinesPage.list.currentStock')}: <strong>{stockTarget.stock_qty} {stockTarget.unit}</strong></p>
            <Select
              id="stock_reason"
              label={t('medicinesPage.list.reasonLabel')}
              value={stockForm.reason}
              onChange={(e) => setStockForm((prev) => ({ ...prev, reason: e.target.value }))}
            >
              <option value="restock">{t('medicinesPage.list.reasonRestock')}</option>
              <option value="adjustment">{t('medicinesPage.list.reasonAdjustment')}</option>
            </Select>
            <Input
              id="stock_change_qty"
              type="number"
              label={stockForm.reason === 'restock' ? t('medicinesPage.list.restockQtyLabel') : t('medicinesPage.list.adjustmentQtyLabel')}
              value={stockForm.change_qty}
              onChange={(e) => setStockForm((prev) => ({ ...prev, change_qty: e.target.value }))}
              placeholder={stockForm.reason === 'adjustment' ? t('medicinesPage.list.adjustmentQtyPlaceholder') : undefined}
              required
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={isSavingStock}>{isSavingStock ? t('medicinesPage.list.saving') : t('medicinesPage.list.save')}</Button>
              <Button type="button" variant="ghost" onClick={closeStockModal}>{t('medicinesPage.list.cancel')}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
