import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card/Card';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import LogoIcon from '../../components/LogoIcon/LogoIcon';
import Wordmark from '../../components/LogoIcon/Wordmark';
import styles from './Login.module.scss';

// Persists only the email across visits — never the password.
const REMEMBERED_EMAIL_KEY = 'medicalsia:login-email';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);
    localStorage.setItem(REMEMBERED_EMAIL_KEY, value);
  }

  function validate() {
    const errors = {};
    if (!email.trim()) {
      errors.email = t('login.emailRequired');
    } else if (!isValidEmail(email)) {
      errors.email = t('login.emailInvalid');
    }
    if (!password) {
      errors.password = t('login.passwordRequired');
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
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setFormError(t('login.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <LogoIcon variant="light" size={36} />
          <Wordmark variant="light" />
        </div>
        <p className={styles.subtitle}>{t('login.subtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.error}>{formError}</div>}
          <Input
            id="email"
            label={t('login.emailLabel')}
            type="email"
            value={email}
            onChange={handleEmailChange}
            error={fieldErrors.email}
          />
          <Input
            id="password"
            label={t('login.passwordLabel')}
            type={isPasswordVisible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            suffix={
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                tabIndex={-1}
                aria-label={isPasswordVisible ? t('login.hidePassword') : t('login.showPassword')}
              >
                {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <Button type="submit" disabled={isSubmitting}>
            <LogIn size={16} />
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
