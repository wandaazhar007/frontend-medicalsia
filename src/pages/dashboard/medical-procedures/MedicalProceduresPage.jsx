import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, Pencil, Plus, Power, Save, Stethoscope, X } from 'lucide-react';
import { createMedicalProcedure, listMedicalProcedures, updateMedicalProcedure } from '../../../services/medicalProcedures';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import Pagination from '../../../components/Pagination/Pagination';
import EmptyState from '../../../components/EmptyState/EmptyState';
import Modal from '../../../components/Modal/Modal';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import styles from './MedicalProceduresPage.module.scss';

const LIMIT = 20;
const EMPTY_FORM = { name: '', price: '' };

const SKELETON_COLUMNS = [
  { width: '60%' },
  { width: '40%' },
  { width: '35%', variant: 'badge' },
  { width: '55%' },
];

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

export default function MedicalProceduresPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { page: 1, limit: LIMIT, total_items: 0, total_pages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const isSearching = search.trim() !== debouncedSearch.trim();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function fetchProcedures() {
    setIsLoading(true);
    try {
      const data = await listMedicalProcedures({ page, limit: LIMIT, search: debouncedSearch });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProcedures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function openCreateModal() {
    setEditingProcedure(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(procedure) {
    setEditingProcedure(procedure);
    setForm({ name: procedure.name, price: String(procedure.price) });
    setFieldErrors({});
    setFormError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = t('medicalProceduresPage.fieldRequired');
    }
    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price < 0) {
      errors.price = t('medicalProceduresPage.priceInvalid');
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = { name: form.name.trim(), price: Number(form.price) };
      if (editingProcedure) {
        await updateMedicalProcedure(editingProcedure.id, payload);
      } else {
        await createMedicalProcedure(payload);
      }
      setIsModalOpen(false);
      fetchProcedures();
    } catch {
      setFormError(t('medicalProceduresPage.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function activateProcedure(procedure) {
    await updateMedicalProcedure(procedure.id, { is_active: true });
    fetchProcedures();
  }

  async function confirmDeactivate() {
    await updateMedicalProcedure(deactivateTarget.id, { is_active: false });
    setDeactivateTarget(null);
    fetchProcedures();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('medicalProceduresPage.title')}</h1>
        <Button onClick={openCreateModal}>
          <Plus size={14} />
          {t('medicalProceduresPage.addButton')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('medicalProceduresPage.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!isLoading && !isSearching && result.data.length === 0 ? (
        <EmptyState icon={Stethoscope} message={search ? t('medicalProceduresPage.noResultsSearch') : t('medicalProceduresPage.empty')} />
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('medicalProceduresPage.columnName')}</th>
                  <th>{t('medicalProceduresPage.columnPrice')}</th>
                  <th>{t('medicalProceduresPage.columnStatus')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading || isSearching ? (
                  <TableSkeleton rows={6} columns={SKELETON_COLUMNS} />
                ) : (
                  result.data.map((procedure) => (
                    <tr key={procedure.id}>
                      <td>{procedure.name}</td>
                      <td>{formatCurrency(procedure.price)}</td>
                      <td><Badge variant={procedure.is_active ? 'success' : 'danger'}>{procedure.is_active ? t('medicalProceduresPage.active') : t('medicalProceduresPage.inactive')}</Badge></td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button variant="secondary" onClick={() => openEditModal(procedure)}>
                            <Pencil size={14} />
                            {t('medicalProceduresPage.edit')}
                          </Button>
                          <Button
                            variant={procedure.is_active ? 'dangerOutline' : 'ghost'}
                            onClick={() => (procedure.is_active ? setDeactivateTarget(procedure) : activateProcedure(procedure))}
                          >
                            {procedure.is_active ? <Ban size={14} /> : <Power size={14} />}
                            {procedure.is_active ? t('medicalProceduresPage.deactivate') : t('medicalProceduresPage.activate')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProcedure ? t('medicalProceduresPage.editModalTitle') : t('medicalProceduresPage.addModalTitle')}
      >
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.error}>{formError}</div>}
          <Input
            id="procedure_name"
            label={t('medicalProceduresPage.nameLabel')}
            value={form.name}
            onChange={handleChange('name')}
            error={fieldErrors.name}
          />
          <Input
            id="procedure_price"
            type="number"
            min="0"
            label={t('medicalProceduresPage.priceLabel')}
            value={form.price}
            onChange={handleChange('price')}
            error={fieldErrors.price}
          />
          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={14} />
              {isSubmitting ? t('medicalProceduresPage.saving') : t('medicalProceduresPage.save')}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              <X size={14} />
              {t('medicalProceduresPage.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deactivateTarget)} onClose={() => setDeactivateTarget(null)} title={t('medicalProceduresPage.deactivateConfirmTitle')}>
        <p className={styles.modalText}>{t('medicalProceduresPage.deactivateConfirmText', { name: deactivateTarget?.name })}</p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setDeactivateTarget(null)}>
            <X size={14} />
            {t('medicalProceduresPage.cancel')}
          </Button>
          <Button type="button" variant="dangerOutline" onClick={confirmDeactivate}>
            <Ban size={14} />
            {t('medicalProceduresPage.deactivate')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
