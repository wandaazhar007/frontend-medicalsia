import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { getAppointment, updateAppointmentStatus } from '../../../services/appointments';
import { getPatient } from '../../../services/patients';
import { createMedicalRecord } from '../../../services/medicalRecords';
import { createPrescription } from '../../../services/prescriptions';
import { listMedicines } from '../../../services/medicines';
import { createProcedureRecord } from '../../../services/procedureRecords';
import { listMedicalProcedures } from '../../../services/medicalProcedures';
import { useDebounce } from '../../../hooks/useDebounce';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import styles from './ConsultationPage.module.scss';

export default function ConsultationPage() {
  const { t } = useTranslation();
  const { id: appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);

  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [recordError, setRecordError] = useState('');
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [prescriptionError, setPrescriptionError] = useState('');
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const debouncedMedicineSearch = useDebounce(medicineSearch, 400);

  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureResults, setProcedureResults] = useState([]);
  const [procedureCart, setProcedureCart] = useState([]);
  const [procedureError, setProcedureError] = useState('');
  const [isSavingProcedures, setIsSavingProcedures] = useState(false);
  const [proceduresSaved, setProceduresSaved] = useState(false);
  const debouncedProcedureSearch = useDebounce(procedureSearch, 400);

  useEffect(() => {
    getAppointment(appointmentId).then(({ data }) => {
      setAppointment(data);
      getPatient(data.patient_id).then(({ data: patientData }) => setPatient(patientData));
    });
  }, [appointmentId]);

  useEffect(() => {
    if (!debouncedMedicineSearch) {
      setMedicineResults([]);
      return;
    }
    listMedicines({ search: debouncedMedicineSearch, limit: 10 }).then(({ data }) => setMedicineResults(data));
  }, [debouncedMedicineSearch]);

  useEffect(() => {
    if (!debouncedProcedureSearch) {
      setProcedureResults([]);
      return;
    }
    listMedicalProcedures({ search: debouncedProcedureSearch, limit: 10 }).then(({ data }) => setProcedureResults(data));
  }, [debouncedProcedureSearch]);

  async function handleSaveRecord(e) {
    e.preventDefault();
    setRecordError('');
    setIsSavingRecord(true);
    try {
      const { data } = await createMedicalRecord({
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        complaint,
        diagnosis,
        notes,
      });
      setSavedRecord(data);
    } catch {
      setRecordError(t('consultationPage.recordError'));
    } finally {
      setIsSavingRecord(false);
    }
  }

  // Medicines out of stock stay fully selectable — the doctor's picker never
  // blocks on stock, only the cashier decides later (05-business-flow.md).
  function addToCart(medicine) {
    if (cart.some((item) => item.medicine_id === medicine.id)) return;
    setCart((prev) => [...prev, { medicine_id: medicine.id, name: medicine.name, stock_qty: medicine.stock_qty, dosage: '', quantity: 1, instructions: '' }]);
    setMedicineSearch('');
    setMedicineResults([]);
  }

  function updateCartItem(medicineId, field, value) {
    setCart((prev) => prev.map((item) => (item.medicine_id === medicineId ? { ...item, [field]: value } : item)));
  }

  function removeFromCart(medicineId) {
    setCart((prev) => prev.filter((item) => item.medicine_id !== medicineId));
  }

  async function handleSavePrescription() {
    setPrescriptionError('');
    setIsSavingPrescription(true);
    try {
      await createPrescription({
        medical_record_id: savedRecord.id,
        items: cart.map(({ medicine_id, dosage, quantity, instructions }) => ({ medicine_id, dosage, quantity, instructions })),
      });
      setPrescriptionSaved(true);
      setCart([]);
    } catch {
      setPrescriptionError(t('consultationPage.prescriptionError'));
    } finally {
      setIsSavingPrescription(false);
    }
  }

  function addProcedureToCart(procedure) {
    if (procedureCart.some((item) => item.medical_procedure_id === procedure.id)) return;
    setProcedureCart((prev) => [...prev, { medical_procedure_id: procedure.id, name: procedure.name, price: procedure.price, quantity: 1, notes: '' }]);
    setProcedureSearch('');
    setProcedureResults([]);
  }

  function updateProcedureCartItem(medicalProcedureId, field, value) {
    setProcedureCart((prev) => prev.map((item) => (item.medical_procedure_id === medicalProcedureId ? { ...item, [field]: value } : item)));
  }

  function removeProcedureFromCart(medicalProcedureId) {
    setProcedureCart((prev) => prev.filter((item) => item.medical_procedure_id !== medicalProcedureId));
  }

  async function handleSaveProcedures() {
    setProcedureError('');
    setIsSavingProcedures(true);
    try {
      await createProcedureRecord({
        medical_record_id: savedRecord.id,
        items: procedureCart.map(({ medical_procedure_id, quantity, notes }) => ({ medical_procedure_id, quantity, notes })),
      });
      setProceduresSaved(true);
      setProcedureCart([]);
    } catch {
      setProcedureError(t('consultationPage.procedureError'));
    } finally {
      setIsSavingProcedures(false);
    }
  }

  async function handleFinish() {
    await updateAppointmentStatus(appointmentId, 'completed');
    navigate('/dashboard/queue');
  }

  if (!appointment || !patient) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('consultationPage.title')} — {appointment.patient_name}</h1>
        <span className={styles.subtitle}>
          {t('consultationPage.queueNumber')} {appointment.queue_number || '-'} · {appointment.doctor_name || t('consultationPage.noDoctorAssigned')}
        </span>
        {patient.allergies && <p className={styles.allergies}>{t('consultationPage.allergies')}: {patient.allergies}</p>}
      </div>

      <Card>
        <span className={styles.sectionTitle}>{t('consultationPage.recordSectionTitle')}</span>
        <form className={styles.form} onSubmit={handleSaveRecord}>
          {recordError && <div className={styles.error}>{recordError}</div>}
          {savedRecord && <div className={styles.success}>{t('consultationPage.recordSaved')}</div>}
          <Input id="complaint" label={t('consultationPage.complaintLabel')} value={complaint} onChange={(e) => setComplaint(e.target.value)} disabled={Boolean(savedRecord)} />
          <Input id="diagnosis" label={t('consultationPage.diagnosisLabel')} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} disabled={Boolean(savedRecord)} />
          <Input id="notes" label={t('consultationPage.notesLabel')} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={Boolean(savedRecord)} />
          {!savedRecord && (
            <div className={styles.actions}>
              <Button type="submit" disabled={isSavingRecord}>
                {isSavingRecord ? t('consultationPage.saving') : t('consultationPage.saveRecord')}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {savedRecord && (
        <Card>
          <span className={styles.sectionTitle}>{t('consultationPage.prescriptionSectionTitle')}</span>
          {prescriptionError && <div className={styles.error}>{prescriptionError}</div>}
          {prescriptionSaved ? (
            <div className={styles.success}>{t('consultationPage.prescriptionSaved')}</div>
          ) : (
            <>
              <div className={styles.medicineSearch}>
                <Input
                  placeholder={t('consultationPage.medicineSearchPlaceholder')}
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />
                {medicineResults.length > 0 && (
                  <div className={styles.results}>
                    {medicineResults.map((medicine) => (
                      <button key={medicine.id} type="button" className={styles.resultItem} onClick={() => addToCart(medicine)}>
                        <span className={styles.resultInfo}>
                          {medicine.name} ({medicine.unit})
                          {medicine.stock_qty <= 0 && <Badge variant="danger">{t('consultationPage.outOfStock')}</Badge>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {cart.map((item) => (
                <div key={item.medicine_id} className={styles.cartItem}>
                  <div>
                    <div className={styles.cartItemName}>
                      {item.name} {item.stock_qty <= 0 && <Badge variant="danger">{t('consultationPage.outOfStock')}</Badge>}
                    </div>
                    <div className={styles.cartItemFields}>
                      <Input
                        placeholder={t('consultationPage.dosagePlaceholder')}
                        value={item.dosage}
                        onChange={(e) => updateCartItem(item.medicine_id, 'dosage', e.target.value)}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder={t('consultationPage.qtyPlaceholder')}
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.medicine_id, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                      <Input
                        placeholder={t('consultationPage.instructionsPlaceholder')}
                        value={item.instructions}
                        onChange={(e) => updateCartItem(item.medicine_id, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => removeFromCart(item.medicine_id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}

              {cart.length > 0 && (
                <div className={styles.actions}>
                  <Button onClick={handleSavePrescription} disabled={isSavingPrescription}>
                    {isSavingPrescription ? t('consultationPage.saving') : t('consultationPage.savePrescription')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {savedRecord && (
        <Card>
          <span className={styles.sectionTitle}>{t('consultationPage.procedureSectionTitle')}</span>
          {procedureError && <div className={styles.error}>{procedureError}</div>}
          {proceduresSaved ? (
            <div className={styles.success}>{t('consultationPage.procedureSaved')}</div>
          ) : (
            <>
              <div className={styles.medicineSearch}>
                <Input
                  placeholder={t('consultationPage.procedureSearchPlaceholder')}
                  value={procedureSearch}
                  onChange={(e) => setProcedureSearch(e.target.value)}
                />
                {procedureResults.length > 0 && (
                  <div className={styles.results}>
                    {procedureResults.map((procedure) => (
                      <button key={procedure.id} type="button" className={styles.resultItem} onClick={() => addProcedureToCart(procedure)}>
                        <span className={styles.resultInfo}>{procedure.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {procedureCart.map((item) => (
                <div key={item.medical_procedure_id} className={styles.cartItem}>
                  <div>
                    <div className={styles.cartItemName}>{item.name}</div>
                    <div className={styles.cartItemFields}>
                      <Input
                        type="number"
                        min="1"
                        placeholder={t('consultationPage.qtyPlaceholder')}
                        value={item.quantity}
                        onChange={(e) => updateProcedureCartItem(item.medical_procedure_id, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                      <Input
                        placeholder={t('consultationPage.procedureNotesPlaceholder')}
                        value={item.notes}
                        onChange={(e) => updateProcedureCartItem(item.medical_procedure_id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => removeProcedureFromCart(item.medical_procedure_id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}

              {procedureCart.length > 0 && (
                <div className={styles.actions}>
                  <Button onClick={handleSaveProcedures} disabled={isSavingProcedures}>
                    {isSavingProcedures ? t('consultationPage.saving') : t('consultationPage.saveProcedures')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleFinish}>
          <CheckCircle2 size={14} />
          {t('consultationPage.finishConsultation')}
        </Button>
      </div>
    </div>
  );
}
