import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ban, Pencil, Pill, PlusCircle, Power, PackagePlus, Save, Upload, X } from 'lucide-react';
import { createMedicine, listMedicines, updateMedicine, updateMedicineStock } from '../../../services/medicines';
import MedicineImportModal from './MedicineImportModal';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import Modal from '../../../components/Modal/Modal';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import styles from './MedicinesList.module.scss';

const LIMIT = 20;

const SKELETON_COLUMNS = [
  { width: '70%' },
  { width: '40%' },
  { width: '50%' },
  { width: '45%' },
  { width: '55%' },
  { width: '35%', variant: 'badge' },
  { width: '85%' },
];

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_STOCK_FORM = { change_qty: '', reason: 'restock' };

const EMPTY_ADD_FORM = { name: '', unit: '', price: '', stock_qty: '0', min_stock_alert: '10', expiry_date: '' };

// Strips everything but digits, then re-inserts thousand separator dots as
// the user types — e.g. "100000" -> "100.000".
function formatRupiahInput(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

function parseRupiahInput(value) {
  return Number(value.replace(/\D/g, '')) || 0;
}

export default function MedicinesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const isSearching = search !== debouncedSearch;

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK_FORM);
  const [stockError, setStockError] = useState('');
  const [isSavingStock, setIsSavingStock] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [addFieldErrors, setAddFieldErrors] = useState({});
  const [addFormError, setAddFormError] = useState('');
  const [isSavingAdd, setIsSavingAdd] = useState(false);

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

  function openAddModal() {
    setAddForm(EMPTY_ADD_FORM);
    setAddFieldErrors({});
    setAddFormError('');
    setIsAddModalOpen(true);
  }

  function closeAddModal() {
    setIsAddModalOpen(false);
  }

  function handleAddFieldChange(field) {
    return (e) => setAddForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validateAddForm() {
    const errors = {};
    if (!addForm.name.trim()) errors.name = t('medicinesPage.form.fieldRequired');
    if (!addForm.unit.trim()) errors.unit = t('medicinesPage.form.fieldRequired');
    const price = parseRupiahInput(addForm.price);
    if (!addForm.price || price <= 0) errors.price = t('medicinesPage.form.priceInvalid');
    return errors;
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setAddFormError('');

    const errors = validateAddForm();
    setAddFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingAdd(true);
    try {
      await createMedicine({
        name: addForm.name,
        unit: addForm.unit,
        price: parseRupiahInput(addForm.price),
        stock_qty: Number(addForm.stock_qty) || 0,
        min_stock_alert: Number(addForm.min_stock_alert) || 0,
        expiry_date: addForm.expiry_date || null,
      });
      closeAddModal();
      fetchMedicines();
    } catch {
      setAddFormError(t('medicinesPage.form.saveError'));
    } finally {
      setIsSavingAdd(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('medicinesPage.list.title')}</h1>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            <Upload size={14} />
            {t('medicinesPage.list.importButton')}
          </Button>
          <Button onClick={openAddModal}>
            <PlusCircle size={14} />
            {t('medicinesPage.list.addButton')}
          </Button>
        </div>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('medicinesPage.list.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!isLoading && !isSearching && result.data.length === 0 ? (
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
                {isLoading || isSearching ? (
                  <TableSkeleton rows={8} columns={SKELETON_COLUMNS} />
                ) : (
                  result.data.map((medicine) => {
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
                            <Button variant="secondary" onClick={() => navigate(`/dashboard/medicines/${medicine.id}/edit`)}>
                              <Pencil size={14} />
                              {t('medicinesPage.list.edit')}
                            </Button>
                            <Button variant="secondary" onClick={() => openStockModal(medicine)}>
                              <PackagePlus size={14} />
                              {t('medicinesPage.list.adjustStock')}
                            </Button>
                            <Button variant={medicine.is_active ? 'dangerOutline' : 'ghost'} onClick={() => handleToggleActive(medicine)}>
                              {medicine.is_active ? <Ban size={14} /> : <Power size={14} />}
                              {medicine.is_active ? t('medicinesPage.list.deactivate') : t('medicinesPage.list.activate')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && !isSearching && (
            <Pagination
              page={result.pagination.page}
              limit={result.pagination.limit}
              totalItems={result.pagination.total_items}
              totalPages={result.pagination.total_pages}
              onPageChange={setPage}
            />
          )}
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
              <Button type="submit" disabled={isSavingStock}>
                <Save size={14} />
                {isSavingStock ? t('medicinesPage.list.saving') : t('medicinesPage.list.save')}
              </Button>
              <Button type="button" variant="ghost" onClick={closeStockModal}>
                <X size={14} />
                {t('medicinesPage.list.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title={t('medicinesPage.form.addTitle')}>
        <form className={styles.modalForm} onSubmit={handleAddSubmit} noValidate>
          {addFormError && <div className={styles.error}>{addFormError}</div>}
          <Input
            id="add_name"
            label={t('medicinesPage.form.nameLabel')}
            value={addForm.name}
            onChange={handleAddFieldChange('name')}
            error={addFieldErrors.name}
          />
          <Input
            id="add_unit"
            label={t('medicinesPage.form.unitLabel')}
            placeholder={t('medicinesPage.form.unitPlaceholder')}
            value={addForm.unit}
            onChange={handleAddFieldChange('unit')}
            error={addFieldErrors.unit}
          />
          <Input
            id="add_price"
            type="text"
            inputMode="numeric"
            label={t('medicinesPage.form.priceLabel')}
            value={addForm.price}
            onChange={(e) => setAddForm((prev) => ({ ...prev, price: formatRupiahInput(e.target.value) }))}
            error={addFieldErrors.price}
          />
          <Input
            id="add_min_stock_alert"
            type="number"
            label={t('medicinesPage.form.minStockLabel')}
            value={addForm.min_stock_alert}
            onChange={handleAddFieldChange('min_stock_alert')}
          />
          <Input
            id="add_stock_qty"
            type="number"
            label={t('medicinesPage.form.initialStockLabel')}
            value={addForm.stock_qty}
            onChange={handleAddFieldChange('stock_qty')}
          />
          <Input
            id="add_expiry_date"
            type="date"
            label={t('medicinesPage.form.expiryLabel')}
            value={addForm.expiry_date}
            onChange={handleAddFieldChange('expiry_date')}
          />
          <div className={styles.actions}>
            <Button type="submit" disabled={isSavingAdd}>
              <Save size={14} />
              {isSavingAdd ? t('medicinesPage.form.saving') : t('medicinesPage.form.save')}
            </Button>
            <Button type="button" variant="secondary" onClick={closeAddModal}>
              <X size={14} />
              {t('medicinesPage.form.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <MedicineImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={fetchMedicines}
      />
    </div>
  );
}
