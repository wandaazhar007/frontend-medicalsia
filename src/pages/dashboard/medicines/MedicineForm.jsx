import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createMedicine, getMedicine, updateMedicine } from '../../../services/medicines';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import styles from './MedicineForm.module.scss';

const EMPTY_FORM = { name: '', unit: '', price: '', stock_qty: '0', min_stock_alert: '10', expiry_date: '', is_active: true };

export default function MedicineForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getMedicine(id).then(({ data }) => {
      setForm({
        name: data.name,
        unit: data.unit,
        price: String(data.price),
        stock_qty: String(data.stock_qty),
        min_stock_alert: String(data.min_stock_alert ?? 10),
        expiry_date: data.expiry_date ? data.expiry_date.slice(0, 10) : '',
        is_active: data.is_active,
      });
    });
  }, [id, isEdit]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name || !form.unit || form.price === '') {
      setError(t('medicinesPage.form.requiredError'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await updateMedicine(id, {
          name: form.name,
          unit: form.unit,
          price: Number(form.price),
          min_stock_alert: Number(form.min_stock_alert),
          expiry_date: form.expiry_date || null,
          is_active: form.is_active,
        });
      } else {
        await createMedicine({
          name: form.name,
          unit: form.unit,
          price: Number(form.price),
          stock_qty: Number(form.stock_qty) || 0,
          min_stock_alert: Number(form.min_stock_alert),
          expiry_date: form.expiry_date || null,
        });
      }
      navigate('/dashboard/medicines');
    } catch {
      setError(t('medicinesPage.form.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{isEdit ? t('medicinesPage.form.editTitle') : t('medicinesPage.form.addTitle')}</h1>
      <Card>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.grid}>
            <Input id="name" label={t('medicinesPage.form.nameLabel')} value={form.name} onChange={handleChange('name')} required />
            <Input id="unit" label={t('medicinesPage.form.unitLabel')} placeholder={t('medicinesPage.form.unitPlaceholder')} value={form.unit} onChange={handleChange('unit')} required />
          </div>

          <div className={styles.grid}>
            <Input id="price" type="number" label={t('medicinesPage.form.priceLabel')} value={form.price} onChange={handleChange('price')} required />
            <Input id="min_stock_alert" type="number" label={t('medicinesPage.form.minStockLabel')} value={form.min_stock_alert} onChange={handleChange('min_stock_alert')} />
          </div>

          {!isEdit && (
            <div className={styles.grid}>
              <Input id="stock_qty" type="number" label={t('medicinesPage.form.initialStockLabel')} value={form.stock_qty} onChange={handleChange('stock_qty')} />
              <Input id="expiry_date" type="date" label={t('medicinesPage.form.expiryLabel')} value={form.expiry_date} onChange={handleChange('expiry_date')} />
            </div>
          )}

          {isEdit && (
            <>
              <Input id="expiry_date" type="date" label={t('medicinesPage.form.expiryLabel')} value={form.expiry_date} onChange={handleChange('expiry_date')} />
              <p className={styles.hint}>{t('medicinesPage.form.stockHint')}</p>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
                {t('medicinesPage.form.activeCheckbox')}
              </label>
            </>
          )}

          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('medicinesPage.form.saving') : t('medicinesPage.form.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>{t('medicinesPage.form.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
