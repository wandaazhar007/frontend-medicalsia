import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Ban, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react';
import { createDoctorSchedule, deleteDoctorSchedule, listDoctorSchedules, updateDoctorSchedule } from '../../../services/doctorSchedules';
import { getBookingDoctors } from '../../../services/publicBooking';
import { useDebounce } from '../../../hooks/useDebounce';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import Modal from '../../../components/Modal/Modal';
import TableSkeleton from '../../../components/TableSkeleton/TableSkeleton';
import styles from './DoctorSchedulesPage.module.scss';

const DAY_KEYS = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'];

const EMPTY_FORM = { doctor_id: '', day_of_week: '1', start_time: '08:00', end_time: '12:00', slot_minutes: '15' };

const SKELETON_COLUMNS = [
  { width: '65%' },
  { width: '50%' },
  { width: '55%' },
  { width: '45%' },
  { width: '40%', variant: 'badge' },
  { width: '60%' },
];

export default function DoctorSchedulesPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const isSearching = search.trim() !== debouncedSearch.trim();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const dayLabels = DAY_KEYS.map((key) => t(`doctorSchedulesPage.${key}`));

  const filteredSchedules = schedules.filter((schedule) =>
    schedule.doctor_name.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
  );

  async function fetchDoctors() {
    // Public booking-doctors endpoint, not GET /users (owner/admin-only —
    // this page's schedule form needs the doctor list regardless of role).
    const { data } = await getBookingDoctors();
    setDoctors(data);
  }

  async function fetchSchedules() {
    setIsLoading(true);
    try {
      const { data } = await listDoctorSchedules();
      setSchedules(data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
  }, []);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function openCreateModal() {
    setEditingSchedule(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setIsModalOpen(true);
  }

  function openEditModal(schedule) {
    setEditingSchedule(schedule);
    setForm({
      doctor_id: schedule.doctor_id,
      day_of_week: String(schedule.day_of_week),
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      slot_minutes: String(schedule.slot_minutes),
    });
    setFieldErrors({});
    setFormError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function validate() {
    const errors = {};
    if (!form.doctor_id) {
      errors.doctor_id = t('doctorSchedulesPage.selectDoctorRequired');
    }
    if (!form.start_time) {
      errors.start_time = t('doctorSchedulesPage.fieldRequired');
    }
    if (!form.end_time) {
      errors.end_time = t('doctorSchedulesPage.fieldRequired');
    }
    if (form.start_time && form.end_time && !errors.end_time && form.start_time >= form.end_time) {
      errors.end_time = t('doctorSchedulesPage.endTimeAfterStart');
    }
    const slotMinutes = parseInt(form.slot_minutes, 10);
    if (!form.slot_minutes || Number.isNaN(slotMinutes) || slotMinutes <= 0) {
      errors.slot_minutes = t('doctorSchedulesPage.slotMinutesInvalid');
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
      const payload = {
        day_of_week: parseInt(form.day_of_week, 10),
        start_time: form.start_time,
        end_time: form.end_time,
        slot_minutes: parseInt(form.slot_minutes, 10),
      };
      if (editingSchedule) {
        await updateDoctorSchedule(editingSchedule.id, payload);
      } else {
        await createDoctorSchedule({ ...payload, doctor_id: form.doctor_id });
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch {
      setFormError(t('doctorSchedulesPage.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function activateSchedule(schedule) {
    await updateDoctorSchedule(schedule.id, { is_active: true });
    fetchSchedules();
  }

  async function confirmDeactivate() {
    await updateDoctorSchedule(deactivateTarget.id, { is_active: false });
    setDeactivateTarget(null);
    fetchSchedules();
  }

  function openDeleteModal(schedule) {
    setDeleteError('');
    setDeleteTarget(schedule);
  }

  async function confirmDelete() {
    setDeleteError('');
    setIsDeleting(true);
    try {
      await deleteDoctorSchedule(deleteTarget.id);
      setDeleteTarget(null);
      fetchSchedules();
    } catch {
      setDeleteError(t('doctorSchedulesPage.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('doctorSchedulesPage.title')}</h1>
        <Button onClick={openCreateModal}>
          <Plus size={14} />
          {t('doctorSchedulesPage.addSchedule')}
        </Button>
      </div>

      <div className={styles.searchRow}>
        <Input placeholder={t('doctorSchedulesPage.searchDoctorPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!isLoading && !isSearching && filteredSchedules.length === 0 ? (
        <EmptyState message={search ? t('doctorSchedulesPage.noResultsSearch') : t('doctorSchedulesPage.empty')} />
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('doctorSchedulesPage.columnDoctor')}</th>
                <th>{t('doctorSchedulesPage.columnDay')}</th>
                <th>{t('doctorSchedulesPage.columnTime')}</th>
                <th>{t('doctorSchedulesPage.columnSlotDuration')}</th>
                <th>{t('doctorSchedulesPage.columnStatus')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isSearching ? (
                <TableSkeleton rows={6} columns={SKELETON_COLUMNS} />
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.doctor_name}</td>
                    <td>{dayLabels[schedule.day_of_week]}</td>
                    <td>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</td>
                    <td>{schedule.slot_minutes} {t('doctorSchedulesPage.minutes')}</td>
                    <td><Badge variant={schedule.is_active ? 'success' : 'danger'}>{schedule.is_active ? t('doctorSchedulesPage.active') : t('doctorSchedulesPage.inactive')}</Badge></td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button variant="secondary" onClick={() => openEditModal(schedule)}>
                          <Pencil size={14} />
                          {t('doctorSchedulesPage.edit')}
                        </Button>
                        <Button
                          variant={schedule.is_active ? 'dangerOutline' : 'ghost'}
                          onClick={() => (schedule.is_active ? setDeactivateTarget(schedule) : activateSchedule(schedule))}
                        >
                          {schedule.is_active ? <Ban size={14} /> : <Power size={14} />}
                          {schedule.is_active ? t('doctorSchedulesPage.deactivate') : t('doctorSchedulesPage.activate')}
                        </Button>
                        {!schedule.has_appointments && (
                          <Button variant="dangerOutline" onClick={() => openDeleteModal(schedule)}>
                            <Trash2 size={14} />
                            {t('doctorSchedulesPage.delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchedule ? t('doctorSchedulesPage.editScheduleModalTitle') : t('doctorSchedulesPage.addScheduleModalTitle')}
      >
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.error}>{formError}</div>}
          <div className={styles.grid}>
            <Select
              id="doctor_id"
              label={t('doctorSchedulesPage.doctorLabel')}
              value={form.doctor_id}
              onChange={handleChange('doctor_id')}
              disabled={Boolean(editingSchedule)}
              error={fieldErrors.doctor_id}
            >
              <option value="">{t('doctorSchedulesPage.selectDoctorPlaceholder')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
              ))}
            </Select>
            <Select id="day_of_week" label={t('doctorSchedulesPage.dayLabel')} value={form.day_of_week} onChange={handleChange('day_of_week')}>
              {dayLabels.map((label, index) => (
                <option key={label} value={index}>{label}</option>
              ))}
            </Select>
          </div>
          <div className={styles.grid}>
            <Input
              id="start_time"
              label={t('doctorSchedulesPage.startTimeLabel')}
              type="time"
              value={form.start_time}
              onChange={handleChange('start_time')}
              error={fieldErrors.start_time}
            />
            <Input
              id="end_time"
              label={t('doctorSchedulesPage.endTimeLabel')}
              type="time"
              value={form.end_time}
              onChange={handleChange('end_time')}
              error={fieldErrors.end_time}
            />
            <Input
              id="slot_minutes"
              label={t('doctorSchedulesPage.slotDurationLabel')}
              type="number"
              min="5"
              step="5"
              value={form.slot_minutes}
              onChange={handleChange('slot_minutes')}
              error={fieldErrors.slot_minutes}
            />
          </div>
          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting}>
              <Save size={14} />
              {isSubmitting ? t('doctorSchedulesPage.saving') : t('doctorSchedulesPage.save')}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              <X size={14} />
              {t('doctorSchedulesPage.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deactivateTarget)} onClose={() => setDeactivateTarget(null)} title={t('doctorSchedulesPage.deactivateConfirmTitle')}>
        <p className={styles.modalText}>
          <Trans
            i18nKey="doctorSchedulesPage.deactivateConfirmText"
            values={{ name: deactivateTarget?.doctor_name }}
            components={{ bold: <strong className={styles.deactivateName} /> }}
          />
        </p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setDeactivateTarget(null)}>
            <X size={14} />
            {t('doctorSchedulesPage.cancel')}
          </Button>
          <Button type="button" variant="dangerOutline" onClick={confirmDeactivate}>
            <Ban size={14} />
            {t('doctorSchedulesPage.deactivate')}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={t('doctorSchedulesPage.deleteConfirmTitle')}>
        {deleteError && <div className={styles.error}>{deleteError}</div>}
        <p className={styles.modalText}>
          <Trans
            i18nKey="doctorSchedulesPage.deleteConfirmText"
            values={{ name: deleteTarget?.doctor_name }}
            components={{ bold: <strong className={styles.deactivateName} /> }}
          />
        </p>
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
            <X size={14} />
            {t('doctorSchedulesPage.cancel')}
          </Button>
          <Button type="button" variant="danger" disabled={isDeleting} onClick={confirmDelete}>
            <Trash2 size={14} />
            {t('doctorSchedulesPage.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
