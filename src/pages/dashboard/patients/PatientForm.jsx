import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Save, X } from 'lucide-react';
import { createPatient, getPatient, updatePatient } from '../../../services/patients';
import { listWilayah } from '../../../services/wilayah';
import { formatPhoneNumber } from '../../../utils/phone';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import AutosuggestInput from '../../../components/AutosuggestInput/AutosuggestInput';
import FieldHint from '../../../components/FieldHint/FieldHint';
import Button from '../../../components/Button/Button';
import PatientCard from '../../../components/PatientCard/PatientCard';
import styles from './PatientForm.module.scss';

const EMPTY_FORM = {
  full_name: '',
  nik: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  village: '',
  district: '',
  city: '',
  province: '',
  postal_code: '',
  allergies: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOB_DISPLAY_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const REQUIRED_FIELDS = ['full_name', 'nik', 'dob', 'phone', 'email', 'address', 'village', 'district', 'city', 'province'];

// Draft persistence only applies to the create form — edit always hydrates
// from the server on mount, so a stale localStorage draft would just flash
// briefly before being overwritten by the fetched patient.
const DRAFT_STORAGE_KEY = 'medicalsia_patient_form_draft';
const EMPTY_WILAYAH_KODE = { province: null, city: null, district: null, village: null };

function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearDraft() {
  window.localStorage.removeItem(DRAFT_STORAGE_KEY);
}

// Formats as the user types into DD/MM/YYYY.
function formatDobInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

function isValidDobDate(display) {
  const match = DOB_DISPLAY_PATTERN.exec(display);
  if (!match) return false;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isoToDisplayDob(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function displayDobToIso(display) {
  const match = DOB_DISPLAY_PATTERN.exec(display);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export default function PatientForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(() => (isEdit ? EMPTY_FORM : loadDraft()?.form || EMPTY_FORM));
  // kode (wilayah region code) of whichever suggestion was last picked per
  // field — used both to filter the next field's suggestions (province ->
  // city -> district -> village) and to gate that next field: it stays
  // disabled until its parent has an actual pick, not just typed text (a
  // typo like "Jawa Bara" must not leave city/district/village pickable).
  // The form itself always stores plain text. Persisted alongside the form
  // draft so a restored draft doesn't re-lock city/district/village fields
  // that already have a value picked before the refresh.
  const [wilayahKode, setWilayahKode] = useState(() => (isEdit ? EMPTY_WILAYAH_KODE : loadDraft()?.wilayahKode || EMPTY_WILAYAH_KODE));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Populated after a successful create — drives the optional print-card step.
  const [createdPatient, setCreatedPatient] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getPatient(id).then(({ data }) => {
      setForm({
        full_name: data.full_name || '',
        nik: data.nik || '',
        dob: data.dob ? isoToDisplayDob(data.dob) : '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        village: data.village || '',
        district: data.district || '',
        city: data.city || '',
        province: data.province || '',
        postal_code: data.postal_code || '',
        allergies: data.allergies || '',
      });
    });
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ form, wilayahKode }));
  }, [isEdit, form, wilayahKode]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handlePhoneChange(e) {
    setForm((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }));
  }

  function handleNikChange(e) {
    setForm((prev) => ({ ...prev, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }));
  }

  function handleDobChange(e) {
    setForm((prev) => ({ ...prev, dob: formatDobInput(e.target.value) }));
  }

  // Picking a suggestion at one level clears the levels below it, since
  // they no longer necessarily belong to the newly picked parent.
  function handleProvinceSelect(item) {
    setForm((prev) => ({ ...prev, province: item.nama, city: '', district: '', village: '', postal_code: '' }));
    setWilayahKode({ province: item.kode, city: null, district: null, village: null });
  }

  function handleCitySelect(item) {
    setForm((prev) => ({ ...prev, city: item.nama, district: '', village: '', postal_code: '' }));
    setWilayahKode((prev) => ({ ...prev, city: item.kode, district: null, village: null }));
  }

  function handleDistrictSelect(item) {
    setForm((prev) => ({ ...prev, district: item.nama, village: '', postal_code: '' }));
    setWilayahKode((prev) => ({ ...prev, district: item.kode, village: null }));
  }

  function handleVillageSelect(item) {
    setForm((prev) => ({ ...prev, village: item.nama, postal_code: item.kode_pos || '' }));
    setWilayahKode((prev) => ({ ...prev, village: item.kode }));
  }

  // Typing on a field (as opposed to picking a suggestion) invalidates
  // whatever was picked there before, so every field below it locks again
  // until the user picks a real suggestion — otherwise a typo like "Jawa
  // Bara" would leave city/district/village still pickable against the old
  // (or no) province.
  function handleProvinceChange(e) {
    setForm((prev) => ({ ...prev, province: e.target.value, city: '', district: '', village: '', postal_code: '' }));
    setWilayahKode({ province: null, city: null, district: null, village: null });
  }

  function handleCityChange(e) {
    setForm((prev) => ({ ...prev, city: e.target.value, district: '', village: '', postal_code: '' }));
    setWilayahKode((prev) => ({ ...prev, city: null, district: null, village: null }));
  }

  function handleDistrictChange(e) {
    setForm((prev) => ({ ...prev, district: e.target.value, village: '', postal_code: '' }));
    setWilayahKode((prev) => ({ ...prev, district: null, village: null }));
  }

  function handleVillageChange(e) {
    setForm((prev) => ({ ...prev, village: e.target.value, postal_code: '' }));
    setWilayahKode((prev) => ({ ...prev, village: null }));
  }

  function validate() {
    const errors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!form[field].trim()) {
        errors[field] = t('patients.form.fieldRequired');
      }
    });
    if (form.email && !errors.email && !EMAIL_PATTERN.test(form.email)) {
      errors.email = t('patients.form.emailInvalid');
    }
    if (form.phone && !errors.phone) {
      const digitCount = form.phone.replace(/\D/g, '').length;
      if (digitCount < 9 || digitCount > 13) {
        errors.phone = t('patients.form.phoneInvalid');
      }
    }
    if (form.dob && !errors.dob && !isValidDobDate(form.dob)) {
      errors.dob = t('patients.form.dobInvalid');
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = { ...form, dob: form.dob ? displayDobToIso(form.dob) : null };
      if (isEdit) {
        await updatePatient(id, payload);
        navigate(`/dashboard/patients/${id}`);
      } else {
        const { data } = await createPatient(payload);
        clearDraft();
        setCreatedPatient(data);
      }
    } catch {
      setError(t('patients.form.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCityDisabled = !isEdit && !wilayahKode.province;
  const isDistrictDisabled = !isEdit && !wilayahKode.city;
  const isVillageDisabled = !isEdit && !wilayahKode.district;
  const isPostalCodeDisabled = !isEdit && !wilayahKode.village;

  if (createdPatient) {
    return (
      <div className={styles.wrapper}>
        <Card className={styles.successPanel}>
          <p>
            {t('patients.form.registeredPart1')} <strong>{createdPatient.full_name}</strong> {t('patients.form.registeredPart2')}{' '}
            <strong>{createdPatient.patient_number}</strong>.
          </p>
          <PatientCard patient={createdPatient} />
          <div className={styles.actions}>
            <Button onClick={() => window.print()}>{t('patients.form.printCard')}</Button>
            <Button variant="secondary" onClick={() => navigate(`/dashboard/patients/${createdPatient.id}`)}>
              {t('patients.form.skip')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{isEdit ? t('patients.form.editTitle') : t('patients.form.addTitle')}</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.cardsGrid}>
          <Card>
            <div className={styles.cardBody}>
              <div className={styles.section}>
                <span className={styles.sectionTitle}>{t('patients.form.sectionPersonal')}</span>
                <Input
                  id="full_name"
                  label={t('patients.form.fullName')}
                  value={form.full_name}
                  onChange={handleChange('full_name')}
                  error={fieldErrors.full_name}
                />
                <div className={styles.grid}>
                  <Input
                    id="nik"
                    label={t('patients.form.nik')}
                    inputMode="numeric"
                    maxLength={16}
                    value={form.nik}
                    onChange={handleNikChange}
                    error={fieldErrors.nik}
                  />
                  <Input
                    id="dob"
                    label={t('patients.form.dob')}
                    type="text"
                    inputMode="numeric"
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    value={form.dob}
                    onChange={handleDobChange}
                    error={fieldErrors.dob}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <span className={styles.sectionTitle}>{t('patients.form.sectionContact')}</span>
                <div className={styles.grid}>
                  <Input
                    id="phone"
                    label={t('patients.form.phone')}
                    type="tel"
                    placeholder="0812-3456-7890"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    error={fieldErrors.phone}
                  />
                  <Input
                    id="email"
                    label={t('patients.form.email')}
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={handleChange('email')}
                    error={fieldErrors.email}
                  />
                </div>
              </div>

              <div className={styles.section}>
                <span className={styles.sectionTitle}>{t('patients.form.sectionHealth')}</span>
                <Input id="allergies" label={t('patients.form.allergies')} value={form.allergies} onChange={handleChange('allergies')} />
              </div>
            </div>
          </Card>

          <Card>
            <div className={styles.cardBody}>
              <div className={styles.section}>
                <span className={styles.sectionTitle}>{t('patients.form.sectionAddress')}</span>
                <Input
                  id="address"
                  label={t('patients.form.address')}
                  value={form.address}
                  onChange={handleChange('address')}
                  error={fieldErrors.address}
                />
                <div className={styles.grid}>
                  <AutosuggestInput
                    id="province"
                    label={t('patients.form.province')}
                    value={form.province}
                    onChange={handleProvinceChange}
                    onSuggestionSelect={handleProvinceSelect}
                    loadSuggestions={(query) => listWilayah({ level: 1, search: query, limit: 40 }).then((res) => res.data)}
                    error={fieldErrors.province}
                  />
                  <FieldHint show={isCityDisabled} message={t('patients.form.hintNeedProvince')}>
                    <AutosuggestInput
                      id="city"
                      label={t('patients.form.city')}
                      value={form.city}
                      onChange={handleCityChange}
                      onSuggestionSelect={handleCitySelect}
                      loadSuggestions={(query) => listWilayah({ level: 2, parent: wilayahKode.province || '', search: query }).then((res) => res.data)}
                      disabled={isCityDisabled}
                      error={fieldErrors.city}
                    />
                  </FieldHint>
                </div>
                <div className={styles.grid3}>
                  <FieldHint show={isDistrictDisabled} message={t('patients.form.hintNeedCity')}>
                    <AutosuggestInput
                      id="district"
                      label={t('patients.form.district')}
                      value={form.district}
                      onChange={handleDistrictChange}
                      onSuggestionSelect={handleDistrictSelect}
                      loadSuggestions={(query) => listWilayah({ level: 3, parent: wilayahKode.city || '', search: query }).then((res) => res.data)}
                      disabled={isDistrictDisabled}
                      error={fieldErrors.district}
                    />
                  </FieldHint>
                  <FieldHint show={isVillageDisabled} message={t('patients.form.hintNeedDistrict')}>
                    <AutosuggestInput
                      id="village"
                      label={t('patients.form.village')}
                      value={form.village}
                      onChange={handleVillageChange}
                      onSuggestionSelect={handleVillageSelect}
                      loadSuggestions={(query) => listWilayah({ level: 4, parent: wilayahKode.district || '', search: query }).then((res) => res.data)}
                      disabled={isVillageDisabled}
                      error={fieldErrors.village}
                    />
                  </FieldHint>
                  <FieldHint show={isPostalCodeDisabled} message={t('patients.form.hintNeedVillage')}>
                    <Input
                      id="postal_code"
                      label={t('patients.form.postalCode')}
                      value={form.postal_code}
                      onChange={handleChange('postal_code')}
                      disabled={isPostalCodeDisabled}
                    />
                  </FieldHint>
                </div>
              </div>

              <div className={styles.actions}>
                <Button type="submit" disabled={isSubmitting}>
                  <Save size={14} />
                  {isSubmitting ? t('patients.form.saving') : t('patients.form.save')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                  <X size={14} />
                  {t('patients.form.cancel')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
