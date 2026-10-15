import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useImmigrants } from '../../contexts/ImmigrantContext';
import { useToast } from '../../components/ui/Toast';
import type { Immigrant, Gender, MaritalStatus, EntryMeans, ReferralSource } from '../../../domain/entities/Immigrant';
import styles from './ImmigrantForm.module.css';

const STEPS = [
  { label: 'Dados Pessoais', key: 'personal' },
  { label: 'Entrada no Brasil', key: 'entry' },
  { label: 'Endereço', key: 'address' },
  { label: 'Contato', key: 'contact' },
];

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Não informado' },
];

const MARITAL_OPTIONS = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' },
  { value: 'separado', label: 'Separado(a)' },
];

const ENTRY_MEANS_OPTIONS = [
  { value: 'aereo', label: 'Aéreo' },
  { value: 'terrestre', label: 'Terrestre' },
  { value: 'maritimo', label: 'Marítimo' },
  { value: 'fluvial', label: 'Fluvial' },
];

const REFERRAL_OPTIONS = [
  { value: 'policia_federal', label: 'Polícia Federal' },
  { value: 'semear', label: 'Semear' },
  { value: 'tv', label: 'TV' },
  { value: 'internet', label: 'Internet' },
  { value: 'amigos_familia', label: 'Amigos/Família' },
  { value: 'igreja', label: 'Igreja' },
  { value: 'ong', label: 'ONG' },
  { value: 'outro', label: 'Outro' },
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
].map((s) => ({ value: s, label: s }));

type FormData = Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>;

const emptyForm: FormData = {
  fullName: '',
  motherName: '',
  fatherName: '',
  nationality: '',
  birthCity: '',
  birthDate: '',
  gender: 'nao_informado' as Gender,
  maritalStatus: 'solteiro' as MaritalStatus,
  email: '',
  occupation: '',
  cpf: '',
  entryDate: '',
  entryState: '',
  entryMeans: 'terrestre' as EntryMeans,
  entryCity: '',
  brazilAddress: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  },
  phone: '',
  referralSource: 'semear' as ReferralSource,
  mainLanguage: '',
  cpfStatus: 1,
  rnmFeePaid: true,
  travelDocumentType: 1,
  travelDocumentIssuerCountry: '',
  travelDocumentNumber: '',
};

export function ImmigrantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, create, update } = useImmigrants();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [hasWork, setHasWork] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      getById(id).then((data) => {
        if (data) {
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = data;
          setForm(rest);
          if (data.workAddress) setHasWork(true);
        }
      });
    }
  }, [id, getById]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (type: 'brazilAddress' | 'workAddress', field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: { ...(prev[type] || {}), [field]: value },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { ...form };
      if (!hasWork) {
        delete (data as any).workAddress;
      }

      if (isEdit) {
        await update(id!, data);
        showToast('success', 'Cadastro atualizado', `${form.fullName} foi atualizado com sucesso.`);
      } else {
        await create(data);
        showToast('success', 'Cadastro realizado', `${form.fullName} foi cadastrado com sucesso.`);
      }
      navigate('/imigrantes');
    } catch {
      showToast('error', 'Erro', 'Ocorreu um erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return form.fullName && form.nationality && form.birthDate;
      case 1:
        return form.entryDate && form.entryState && form.entryCity;
      case 2:
        return form.brazilAddress.street && form.brazilAddress.city && form.brazilAddress.state;
      case 3:
        return form.phone;
      default:
        return true;
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <PageContainer title={isEdit ? 'Editar Cadastro' : 'Novo Cadastro'}>
      <div className={styles.header}>
        <Link to="/imigrantes" className={styles.backLink}>
          <ArrowLeft size={16} />
          Voltar para lista
        </Link>
      </div>

      {/* Steps indicator */}
      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'initial', gap: '8px' }}>
            <div
              className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.completed : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => i < step && setStep(i)}
            >
              <span className={styles.stepNumber}>
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepDivider} ${i < step ? styles.completed : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className={styles.card}>
        {/* Step 0: Dados Pessoais */}
        {step === 0 && (
          <>
            <h3 className={styles.cardTitle}>Dados Pessoais</h3>
            <p className={styles.cardDescription}>
              Informações básicas de identificação do imigrante.
            </p>
            <div className={styles.fieldGrid}>
              <div className={styles.fieldFull}>
                <Input
                  label="Nome Completo"
                  required
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', (e.target as HTMLInputElement).value)}
                  placeholder="Nome completo do imigrante"
                />
              </div>
              <Input
                label="Nome da Mãe"
                value={form.motherName}
                onChange={(e) => updateField('motherName', (e.target as HTMLInputElement).value)}
                placeholder="Nome da mãe"
              />
              <Input
                label="Nome do Pai"
                value={form.fatherName}
                onChange={(e) => updateField('fatherName', (e.target as HTMLInputElement).value)}
                placeholder="Nome do pai"
              />
              <Input
                label="País de Nacionalidade"
                required
                value={form.nationality}
                onChange={(e) => updateField('nationality', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Venezuela, Haiti..."
              />
              <Input
                label="Cidade de Nascimento"
                value={form.birthCity}
                onChange={(e) => updateField('birthCity', (e.target as HTMLInputElement).value)}
                placeholder="Cidade de nascimento"
              />
              <Input
                label="Data de Nascimento"
                type="date"
                required
                value={form.birthDate}
                onChange={(e) => updateField('birthDate', (e.target as HTMLInputElement).value)}
              />
              <Select
                label="Sexo"
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
              />
              <Select
                label="Estado Civil"
                options={MARITAL_OPTIONS}
                value={form.maritalStatus}
                onChange={(e) => updateField('maritalStatus', e.target.value)}
              />
              <Input
                label="Ocupação Principal"
                value={form.occupation}
                onChange={(e) => updateField('occupation', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Engenheiro, Professor..."
              />
              <Input
                label="CPF"
                value={form.cpf}
                onChange={(e) =>
                  updateField('cpf', formatCPF((e.target as HTMLInputElement).value))
                }
                placeholder="000.000.000-00"
              />
            </div>
          </>
        )}

        {/* Step 1: Entrada no Brasil */}
        {step === 1 && (
          <>
            <h3 className={styles.cardTitle}>Entrada no Brasil</h3>
            <p className={styles.cardDescription}>
              Dados sobre a chegada ao território brasileiro.
            </p>
            <div className={styles.fieldGrid}>
              <Input
                label="Data de Entrada"
                type="date"
                required
                value={form.entryDate}
                onChange={(e) => updateField('entryDate', (e.target as HTMLInputElement).value)}
              />
              <Select
                label="Estado de Entrada"
                required
                options={STATES}
                value={form.entryState}
                onChange={(e) => updateField('entryState', e.target.value)}
                placeholder="Selecione o estado"
              />
              <Select
                label="Meio de Entrada"
                options={ENTRY_MEANS_OPTIONS}
                value={form.entryMeans}
                onChange={(e) => updateField('entryMeans', e.target.value)}
              />
              <Input
                label="Cidade de Entrada"
                required
                value={form.entryCity}
                onChange={(e) => updateField('entryCity', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Pacaraima, Guarulhos..."
              />
            </div>
          </>
        )}

        {/* Step 2: Endereço */}
        {step === 2 && (
          <>
            <h3 className={styles.cardTitle}>Endereço no Brasil</h3>
            <p className={styles.cardDescription}>
              Endereço residencial atual e, se aplicável, do trabalho.
            </p>
            <div className={styles.fieldGrid}>
              <div className={styles.sectionLabel}>Endereço Residencial</div>
              <Input
                label="Rua"
                required
                value={form.brazilAddress.street}
                onChange={(e) => updateAddress('brazilAddress', 'street', (e.target as HTMLInputElement).value)}
                placeholder="Nome da rua/avenida"
              />
              <Input
                label="Número"
                value={form.brazilAddress.number}
                onChange={(e) => updateAddress('brazilAddress', 'number', (e.target as HTMLInputElement).value)}
                placeholder="Nº"
              />
              <Input
                label="Complemento"
                value={form.brazilAddress.complement || ''}
                onChange={(e) => updateAddress('brazilAddress', 'complement', (e.target as HTMLInputElement).value)}
                placeholder="Apto, bloco..."
              />
              <Input
                label="Bairro"
                value={form.brazilAddress.neighborhood}
                onChange={(e) => updateAddress('brazilAddress', 'neighborhood', (e.target as HTMLInputElement).value)}
                placeholder="Bairro"
              />
              <Input
                label="Cidade"
                required
                value={form.brazilAddress.city}
                onChange={(e) => updateAddress('brazilAddress', 'city', (e.target as HTMLInputElement).value)}
                placeholder="Cidade"
              />
              <Select
                label="Estado"
                required
                options={STATES}
                value={form.brazilAddress.state}
                onChange={(e) => updateAddress('brazilAddress', 'state', e.target.value)}
                placeholder="UF"
              />
              <Input
                label="CEP"
                value={form.brazilAddress.zipCode}
                onChange={(e) => updateAddress('brazilAddress', 'zipCode', (e.target as HTMLInputElement).value)}
                placeholder="00000-000"
              />

              <div className={styles.sectionDivider} />

              <div className={styles.fieldFull}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasWork}
                    onChange={(e) => setHasWork(e.target.checked)}
                  />
                  Possui endereço de trabalho
                </label>
              </div>

              {hasWork && (
                <>
                  <div className={styles.sectionLabel}>Endereço do Trabalho</div>
                  <Input
                    label="Rua"
                    value={form.workAddress?.street || ''}
                    onChange={(e) => updateAddress('workAddress', 'street', (e.target as HTMLInputElement).value)}
                    placeholder="Nome da rua/avenida"
                  />
                  <Input
                    label="Número"
                    value={form.workAddress?.number || ''}
                    onChange={(e) => updateAddress('workAddress', 'number', (e.target as HTMLInputElement).value)}
                    placeholder="Nº"
                  />
                  <Input
                    label="Complemento"
                    value={form.workAddress?.complement || ''}
                    onChange={(e) => updateAddress('workAddress', 'complement', (e.target as HTMLInputElement).value)}
                    placeholder="Sala, andar..."
                  />
                  <Input
                    label="Bairro"
                    value={form.workAddress?.neighborhood || ''}
                    onChange={(e) => updateAddress('workAddress', 'neighborhood', (e.target as HTMLInputElement).value)}
                    placeholder="Bairro"
                  />
                  <Input
                    label="Cidade"
                    value={form.workAddress?.city || ''}
                    onChange={(e) => updateAddress('workAddress', 'city', (e.target as HTMLInputElement).value)}
                    placeholder="Cidade"
                  />
                  <Select
                    label="Estado"
                    options={STATES}
                    value={form.workAddress?.state || ''}
                    onChange={(e) => updateAddress('workAddress', 'state', e.target.value)}
                    placeholder="UF"
                  />
                </>
              )}
            </div>
          </>
        )}

        {/* Step 3: Contato */}
        {step === 3 && (
          <>
            <h3 className={styles.cardTitle}>Contato e Origem</h3>
            <p className={styles.cardDescription}>
              Informações de contato e como o imigrante chegou até nós.
            </p>
            <div className={styles.fieldGrid}>
              <Input
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', (e.target as HTMLInputElement).value)}
                placeholder="email@exemplo.com"
              />
              <Input
                label="Telefone"
                required
                value={form.phone}
                onChange={(e) =>
                  updateField('phone', formatPhone((e.target as HTMLInputElement).value))
                }
                placeholder="(00) 00000-0000"
              />
              <Select
                label="Como chegou até nós?"
                options={REFERRAL_OPTIONS}
                value={form.referralSource}
                onChange={(e) => updateField('referralSource', e.target.value)}
              />
              {form.referralSource === 'outro' && (
                <Input
                  label="Especifique"
                  value={form.referralSourceDetail || ''}
                  onChange={(e) => updateField('referralSourceDetail', (e.target as HTMLInputElement).value)}
                  placeholder="Descreva como chegou"
                />
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Voltar
              </Button>
            )}
          </div>
          <div className={styles.footerRight}>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} disabled={!canAdvance()}>
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Imigrante'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
