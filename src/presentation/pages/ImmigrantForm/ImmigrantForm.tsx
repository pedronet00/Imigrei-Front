import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useImmigrants } from '../../contexts/ImmigrantContext';
import { useToast } from '../../components/ui/Toast';
import type { Immigrant, Address, Gender, MaritalStatus, EntryMeans, ReferralSource } from '../../../domain/entities/Immigrant';
import {
  CPF_STATUS_CONCLUIDO,
  CPF_STATUS_OPTIONS,
  TRAVEL_DOCUMENT_OPTIONS,
} from '../../constants/immigrantOptions';
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

const RNM_FEE_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
].map((s) => ({ value: s, label: s }));

type FormData = Omit<Immigrant, 'id' | 'createdAt' | 'updatedAt'>;

const emptyAddress: Address = {
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
};

const digitsOf = (value?: string) => (value || '').replace(/\D/g, '');

// Espelha as regras de Imigrante.Validate() no back-end
const isAddressComplete = (a?: Address) =>
  !!a &&
  /^\d{5}-?\d{3}$/.test(a.zipCode) &&
  !!a.street.trim() &&
  Number(digitsOf(a.number)) > 0 &&
  !!a.neighborhood.trim() &&
  !!a.city.trim() &&
  !!a.state;

const isAddressEmpty = (a?: Address) =>
  !a ||
  [a.zipCode, a.street, a.number, a.complement, a.neighborhood, a.city, a.state].every(
    (v) => !(v || '').trim()
  );

// Endereço é opcional: vazio é aceito, mas se começou a preencher precisa estar completo
const isAddressValid = (a?: Address) => isAddressEmpty(a) || isAddressComplete(a);

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
  brazilAddress: { ...emptyAddress },
  workAddress: { ...emptyAddress },
  phone: '',
  referralSource: 'semear' as ReferralSource,
  mainLanguage: '',
  cpfStatus: 1,
  rnmFeePaid: true,
  travelDocumentType: 0,
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
  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      getById(id).then((data) => {
        if (data) {
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = data;
          setForm({
            ...emptyForm,
            ...rest,
            // <input type="date"> só aceita YYYY-MM-DD; a API devolve 2003-04-01T00:00:00
            birthDate: rest.birthDate.slice(0, 10),
            entryDate: rest.entryDate.slice(0, 10),
            workAddress: { ...emptyAddress, ...rest.workAddress },
          });
        }
      }).catch((err) => {
        console.error('Falha ao carregar imigrante:', err);
        showToast('error', 'Erro ao carregar imigrante', err instanceof Error ? err.message : undefined);
      });
    }
  }, [id, getById, showToast]);

  const updateField = (field: keyof FormData, value: FormData[keyof FormData]) => {
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

      if (isEdit) {
        await update(id!, data);
        showToast('success', 'Cadastro atualizado', `${form.fullName} foi atualizado com sucesso.`);
      } else {
        await create(data);
        showToast('success', 'Cadastro realizado', `${form.fullName} foi cadastrado com sucesso.`);
      }
      navigate('/imigrantes');
    } catch (err) {
      console.error('Falha ao salvar imigrante:', err);
      showToast(
        'error',
        isEdit ? 'Erro ao atualizar cadastro' : 'Erro ao cadastrar',
        err instanceof Error && !(err instanceof TypeError)
          ? err.message
          : 'Não foi possível conectar ao servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return (
          !!form.fullName.trim() &&
          !!form.motherName.trim() &&
          !!form.fatherName.trim() &&
          !!form.nationality.trim() &&
          !!form.birthCity.trim() &&
          !!form.birthDate &&
          !!form.mainLanguage?.trim() &&
          !!form.occupation.trim() &&
          (form.cpfStatus !== CPF_STATUS_CONCLUIDO || digitsOf(form.cpf).length === 11)
        );
      case 1:
        return (
          !!form.travelDocumentIssuerCountry?.trim() &&
          !!form.travelDocumentNumber?.trim() &&
          !!form.entryDate &&
          !!form.entryState &&
          !!form.entryCity.trim()
        );
      case 2:
        return isAddressValid(form.brazilAddress) && isAddressValid(form.workAddress);
      case 3: {
        const phoneDigits = digitsOf(form.phone).length;
        return (
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) &&
          phoneDigits >= 10 &&
          phoneDigits <= 11
        );
      }
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

  const formatCEP = (value: string) =>
    value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

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

  const renderAddressFields = (
    type: 'brazilAddress' | 'workAddress',
    complementPlaceholder: string
  ) => {
    const address = form[type] ?? emptyAddress;
    return (
      <>
        <Input
          label="CEP"
          value={address.zipCode}
          onChange={(e) => updateAddress(type, 'zipCode', formatCEP((e.target as HTMLInputElement).value))}
          placeholder="00000-000"
        />
        <Input
          label="Rua"
          value={address.street}
          onChange={(e) => updateAddress(type, 'street', (e.target as HTMLInputElement).value)}
          placeholder="Nome da rua/avenida"
        />
        <Input
          label="Número"
          inputMode="numeric"
          value={address.number}
          onChange={(e) => updateAddress(type, 'number', digitsOf((e.target as HTMLInputElement).value))}
          placeholder="Nº"
        />
        <Input
          label="Complemento"
          value={address.complement || ''}
          onChange={(e) => updateAddress(type, 'complement', (e.target as HTMLInputElement).value)}
          placeholder={complementPlaceholder}
        />
        <Input
          label="Bairro"
          value={address.neighborhood}
          onChange={(e) => updateAddress(type, 'neighborhood', (e.target as HTMLInputElement).value)}
          placeholder="Bairro"
        />
        <Input
          label="Cidade"
          value={address.city}
          onChange={(e) => updateAddress(type, 'city', (e.target as HTMLInputElement).value)}
          placeholder="Cidade"
        />
        <Select
          label="Estado"
          options={STATES}
          value={address.state}
          onChange={(e) => updateAddress(type, 'state', e.target.value)}
          placeholder="UF"
        />
      </>
    );
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
                required
                value={form.motherName}
                onChange={(e) => updateField('motherName', (e.target as HTMLInputElement).value)}
                placeholder="Nome da mãe"
              />
              <Input
                label="Nome do Pai"
                required
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
                required
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
                label="Idioma Principal"
                required
                value={form.mainLanguage || ''}
                onChange={(e) => updateField('mainLanguage', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Espanhol, Crioulo haitiano..."
              />
              <Input
                label="Ocupação Principal"
                required
                value={form.occupation}
                onChange={(e) => updateField('occupation', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Engenheiro, Professor..."
              />
              <Select
                label="Status de Emissão do CPF"
                options={CPF_STATUS_OPTIONS}
                value={String(form.cpfStatus ?? 1)}
                onChange={(e) => updateField('cpfStatus', Number(e.target.value))}
              />
              <Input
                label="CPF"
                required={form.cpfStatus === CPF_STATUS_CONCLUIDO}
                value={form.cpf}
                onChange={(e) =>
                  updateField('cpf', formatCPF((e.target as HTMLInputElement).value))
                }
                placeholder="000.000.000-00"
              />
              <Select
                label="Taxa do RNM paga?"
                options={RNM_FEE_OPTIONS}
                value={String(form.rnmFeePaid ?? true)}
                onChange={(e) => updateField('rnmFeePaid', e.target.value === 'true')}
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
              <div className={styles.sectionLabel}>Documento de Viagem</div>
              <Select
                label="Tipo de Documento"
                required
                options={TRAVEL_DOCUMENT_OPTIONS}
                value={String(form.travelDocumentType ?? 0)}
                onChange={(e) => updateField('travelDocumentType', Number(e.target.value))}
              />
              <Input
                label="Número do Documento"
                required
                value={form.travelDocumentNumber || ''}
                onChange={(e) => updateField('travelDocumentNumber', (e.target as HTMLInputElement).value)}
                placeholder="Número do documento"
              />
              <Input
                label="País Emissor do Documento"
                required
                value={form.travelDocumentIssuerCountry || ''}
                onChange={(e) => updateField('travelDocumentIssuerCountry', (e.target as HTMLInputElement).value)}
                placeholder="Ex: Venezuela, Haiti..."
              />

              <div className={styles.sectionDivider} />

              <div className={styles.sectionLabel}>Chegada</div>
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
              Opcional. Se preenchido, informe o endereço completo.
            </p>
            <div className={styles.fieldGrid}>
              <div className={styles.sectionLabel}>Endereço Residencial</div>
              {renderAddressFields('brazilAddress', 'Apto, bloco...')}

              <div className={styles.sectionDivider} />

              <div className={styles.sectionLabel}>Endereço do Trabalho</div>
              {renderAddressFields('workAddress', 'Sala, andar...')}
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
                required
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
