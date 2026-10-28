import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import styles from './Login.module.css';

export function Login() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Erro ao fazer login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoWrapper}>
              <img className={styles.logo} src="/images/imigrei-icone.svg" alt="Imigrei" />
            </div>
            <h1 className={styles.title}>Bem-vindo ao Imigrei</h1>
            <p className={styles.subtitle}>
              Sistema de Gestão de Imigrantes
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorMsg}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              icon={<Mail size={16} />}
              required
            />

            <div>
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                icon={<Lock size={16} />}
                required
              />
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
