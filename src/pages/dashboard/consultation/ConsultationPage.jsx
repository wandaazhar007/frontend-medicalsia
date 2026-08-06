import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { getAppointment, updateAppointmentStatus } from '../../../services/appointments';
import { getPatient } from '../../../services/patients';
import { createMedicalRecord } from '../../../services/medicalRecords';
import { createPrescription } from '../../../services/prescriptions';
import { listMedicines } from '../../../services/medicines';
import { useDebounce } from '../../../hooks/useDebounce';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import styles from './ConsultationPage.module.scss';

export default function ConsultationPage() {
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
      setRecordError('Gagal menyimpan rekam medis. Pastikan akun ini berrole dokter.');
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
      setPrescriptionError('Gagal menyimpan resep.');
    } finally {
      setIsSavingPrescription(false);
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
        <h1 className={styles.title}>Konsultasi — {appointment.patient_name}</h1>
        <span className={styles.subtitle}>
          No. Antrian {appointment.queue_number || '-'} · {appointment.doctor_name || 'Dokter belum ditentukan'}
        </span>
        {patient.allergies && <p className={styles.allergies}>Alergi: {patient.allergies}</p>}
      </div>

      <Card>
        <span className={styles.sectionTitle}>Catatan Konsultasi</span>
        <form className={styles.form} onSubmit={handleSaveRecord}>
          {recordError && <div className={styles.error}>{recordError}</div>}
          {savedRecord && <div className={styles.success}>Rekam medis tersimpan.</div>}
          <Input id="complaint" label="Keluhan" value={complaint} onChange={(e) => setComplaint(e.target.value)} disabled={Boolean(savedRecord)} />
          <Input id="diagnosis" label="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} disabled={Boolean(savedRecord)} />
          <Input id="notes" label="Catatan" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={Boolean(savedRecord)} />
          {!savedRecord && (
            <div className={styles.actions}>
              <Button type="submit" disabled={isSavingRecord}>
                {isSavingRecord ? 'Menyimpan...' : 'Simpan Rekam Medis'}
              </Button>
            </div>
          )}
        </form>
      </Card>

      {savedRecord && (
        <Card>
          <span className={styles.sectionTitle}>Resep</span>
          {prescriptionError && <div className={styles.error}>{prescriptionError}</div>}
          {prescriptionSaved ? (
            <div className={styles.success}>Resep tersimpan.</div>
          ) : (
            <>
              <div className={styles.medicineSearch}>
                <Input
                  placeholder="Cari nama obat..."
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />
                {medicineResults.length > 0 && (
                  <div className={styles.results}>
                    {medicineResults.map((medicine) => (
                      <button key={medicine.id} type="button" className={styles.resultItem} onClick={() => addToCart(medicine)}>
                        <span className={styles.resultInfo}>
                          {medicine.name} ({medicine.unit})
                          {medicine.stock_qty <= 0 && <Badge variant="danger">Stok Habis</Badge>}
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
                      {item.name} {item.stock_qty <= 0 && <Badge variant="danger">Stok Habis</Badge>}
                    </div>
                    <div className={styles.cartItemFields}>
                      <Input
                        placeholder="Dosis (mis. 3x sehari)"
                        value={item.dosage}
                        onChange={(e) => updateCartItem(item.medicine_id, 'dosage', e.target.value)}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateCartItem(item.medicine_id, 'quantity', parseInt(e.target.value, 10) || 1)}
                      />
                      <Input
                        placeholder="Instruksi (mis. Setelah makan)"
                        value={item.instructions}
                        onChange={(e) => updateCartItem(item.medicine_id, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => removeFromCart(item.medicine_id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}

              {cart.length > 0 && (
                <div className={styles.actions}>
                  <Button onClick={handleSavePrescription} disabled={isSavingPrescription}>
                    {isSavingPrescription ? 'Menyimpan...' : 'Simpan Resep'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleFinish}>
          <CheckCircle2 size={16} />
          Selesai Konsultasi
        </Button>
      </div>
    </div>
  );
}
