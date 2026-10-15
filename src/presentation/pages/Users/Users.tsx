import { useState, type FormEvent } from 'react';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/panel.module.css';

const EMPTY_FORM = { name: '', email: '', password: '', confirmation: '', role: '' };

const ROLE_OPTIONS = [
  { value: '', label: 'Padrão do sistema' },
  { value: 'Administrador', label: 'Administrador' },
];

export function Users() {
  const { isAdmin, registerUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isAdmin) {
    return (
      <PageContainer title="Usuários">
        <EmptyState
          icon={<ShieldAlert size={48} />}
          title="Acesso restrito"
          description="Somente administradores podem gerenciar usuários."
        />
      </PageContainer>
    );
  }

  const mismatch = !!form.confirmation && form.password !== form.confirmation;
  const canSubmit =
    !!form.name.trim() && !!form.email.trim() && !!form.password && !!form.confirmation && !mismatch;

  const update = (field: keyof typeof EMPTY_FORM) => (e: { target: EventTarget }) =>
    setForm((prev) => ({ ...prev, [field]: (e.target as HTMLInputElement).value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const created = await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        passwordConfirmation: form.confirmation,
        role: form.role || undefined,
      });
      setForm(EMPTY_FORM);
      showToast('success', 'Usuário cadastrado', `${created.name} já pode acessar o sistema.`);
    } catch (err) {
      setError(err instanceof Error && !(err instanceof TypeError)
        ? err.message
        : 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Usuários">
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Cadastrar usuário</h2>
            <p className={styles.cardDescription}>
              Crie o acesso de um novo membro da equipe.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <Input
                label="Nome"
                required
                autoComplete="off"
                value={form.name}
                onChange={update('name')}
              />
              <Input
                label="E-mail"
                type="email"
                required
                autoComplete="off"
                value={form.email}
                onChange={update('email')}
              />
              <Input
                label="Senha"
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
              />
              <Input
                label="Confirmar senha"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmation}
                onChange={update('confirmation')}
                error={mismatch ? 'As senhas não conferem' : undefined}
              />
              <Select
                label="Perfil"
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              />
            </div>
            {error && (
              <p className={styles.muted} style={{ color: 'var(--status-error)', marginTop: 12 }}>
                {error}
              </p>
            )}
            <div className={styles.formActions}>
              <Button type="submit" loading={saving} disabled={!canSubmit}>
                <UserPlus size={15} />
                Cadastrar
              </Button>
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Usuários cadastrados</h2>
          </div>
          <p className={styles.muted}>A listagem de usuários estará disponível em breve.</p>
        </section>
      </div>
    </PageContainer>
  );
}
