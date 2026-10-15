import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/panel.module.css';

const EMPTY_FORM = { current: '', next: '', confirmation: '' };

export function Account() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mismatch = !!form.confirmation && form.next !== form.confirmation;
  const canSubmit = !!form.current && !!form.next && !!form.confirmation && !mismatch;

  const update = (field: keyof typeof EMPTY_FORM) => (e: { target: EventTarget }) =>
    setForm((prev) => ({ ...prev, [field]: (e.target as HTMLInputElement).value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      await changePassword(form.current, form.next, form.confirmation);
      setForm(EMPTY_FORM);
      showToast('success', 'Senha alterada');
    } catch (err) {
      setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message
        : 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Minha conta">
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Dados da conta</h2>
          </div>
          <dl className={styles.details}>
            <dt>Nome</dt>
            <dd>{user?.name}</dd>
            <dt>E-mail</dt>
            <dd>{user?.email}</dd>
            <dt>Perfil</dt>
            <dd>{user?.roles?.length ? user.roles.join(', ') : user?.role || '—'}</dd>
          </dl>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Alterar senha</h2>
            <p className={styles.cardDescription}>
              Informe a senha atual e escolha uma nova.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.fullRow}>
                <Input
                  label="Senha atual"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.current}
                  onChange={update('current')}
                />
              </div>
              <Input
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                required
                value={form.next}
                onChange={update('next')}
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirmation}
                onChange={update('confirmation')}
                error={mismatch ? 'As senhas não conferem' : undefined}
              />
            </div>
            {error && (
              <p className={styles.muted} style={{ color: 'var(--status-error)', marginTop: 12 }}>
                {error}
              </p>
            )}
            <div className={styles.formActions}>
              <Button type="submit" loading={saving} disabled={!canSubmit}>
                <KeyRound size={15} />
                Alterar senha
              </Button>
            </div>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
