import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getMe, updateMe, uploadMyPhoto } from '../../../services/users';
import { formatPhoneNumber } from '../../../utils/phone';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import styles from './ProfilePage.module.scss';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB, matches the backend multer limit

export default function ProfilePage() {
  const { t } = useTranslation();
  const { updateLocalUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [photoError, setPhotoError] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await getMe();
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      } catch {
        setFormError(t('profilePage.loadError'));
      }
    }
    fetchProfile();
  }, []);

  function validate() {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = t('profilePage.fullNameRequired');
    }
    if (phone.trim()) {
      const digitCount = phone.replace(/\D/g, '').length;
      if (digitCount < 9 || digitCount > 13) {
        errors.phone = t('profilePage.phoneInvalid');
      }
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    try {
      const { data } = await updateMe({ full_name: fullName, phone: phone || null });
      setProfile(data);
      updateLocalUser({ full_name: data.full_name, phone: data.phone });
      setFormSuccess(t('profilePage.saveSuccess'));
    } catch {
      setFormError(t('profilePage.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // allow re-selecting the same file later

    setPhotoError('');

    if (!file.type.startsWith('image/')) {
      setPhotoError(t('profilePage.photoTypeError'));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError(t('profilePage.photoSizeError'));
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data } = await uploadMyPhoto(file);
      setProfile((current) => ({ ...current, photo_url: data.photo_url }));
      updateLocalUser({ photo_url: data.photo_url });
    } catch {
      setPhotoError(t('profilePage.photoUploadError'));
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('profilePage.title')}</h1>

      <Card className={styles.card}>
        <div className={styles.photoSection}>
          <div className={styles.avatar}>
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={t('profilePage.photoAlt')} className={styles.avatarImage} />
            ) : (
              <UserIcon size={32} className={styles.avatarPlaceholder} />
            )}
            {isUploadingPhoto && <div className={styles.avatarOverlay}>...</div>}
          </div>
          <div className={styles.photoActions}>
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}>
              <Camera size={14} />
              {isUploadingPhoto ? t('profilePage.uploading') : t('profilePage.changePhoto')}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className={styles.hiddenFileInput} onChange={handlePhotoChange} />
            {photoError && <span className={styles.photoError}>{photoError}</span>}
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}

          <Input
            id="fullName"
            label={t('profilePage.fullNameLabel')}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldErrors.fullName}
          />
          <Input
            id="phone"
            label={t('profilePage.phoneLabel')}
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            error={fieldErrors.phone}
          />

          <div className={styles.actions}>
            <Button type="submit" disabled={isSaving}>
              <Save size={14} />
              {isSaving ? t('profilePage.saving') : t('profilePage.saveChanges')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
