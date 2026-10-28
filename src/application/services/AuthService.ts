import { API_BASE_URL as API_ROOT_URL } from '../../infrastructure/http/apiBaseUrl';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roles: string[];
}

interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

interface UsuarioResponseDto {
  id: string;
  nome: string;
  email: string;
  perfis: string[];
}

interface AuthResponseDto {
  accessToken: string;
  expiraEm: string;
  refreshToken: string;
  usuario: UsuarioResponseDto;
  tokenType?: string | null;
}

const API_BASE_URL = `${API_ROOT_URL}/Auth`;

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const EXPIRES_AT_KEY = 'auth_expires_at';
const USER_KEY = 'auth_user';

function mapUsuarioToAuthUser(usuario: UsuarioResponseDto): AuthUser {
  return {
    id: usuario.id,
    name: usuario.nome,
    email: usuario.email,
    role: usuario.perfis[0] ?? '',
    roles: usuario.perfis,
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function storeSession(data: AuthResponseDto): AuthUser {
  const user = mapUsuarioToAuthUser(data.usuario);
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(EXPIRES_AT_KEY, data.expiraEm);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

// Shared across callers so several requests failing with 401 at once
// trigger a single POST /Auth/refresh
let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return false;
        storeSession((await response.json()) as AuthResponseDto);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function withAuthHeader(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

// fetch with the bearer token; on 401 refreshes the session once and resends the request
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const sentToken = getAccessToken();
  const response = await fetch(url, withAuthHeader(init, sentToken));
  if (response.status !== 401) return response;

  // Another request may have already refreshed the token meanwhile
  const currentToken = getAccessToken();
  if (currentToken && currentToken !== sentToken) {
    return fetch(url, withAuthHeader(init, currentToken));
  }

  if (!(await refreshSession())) return response;
  return fetch(url, withAuthHeader(init, getAccessToken()));
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role?: string;
}

// Reads ProblemDetails / ValidationProblemDetails into a single message
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (body?.errors && typeof body.errors === 'object') {
      const messages = Object.values(body.errors as Record<string, string[]>).flat();
      if (messages.length > 0) return messages.join(' ');
    }
    return body?.detail || body?.title || fallback;
  } catch {
    return fallback;
  }
}

async function authorizedPost(path: string, payload: unknown): Promise<Response> {
  return authFetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }),
      });
    } catch {
      return {
        success: false,
        error: 'Não foi possível conectar ao servidor. Tente novamente.',
      };
    }

    if (response.status === 401 || response.status === 400) {
      let detail: string | undefined;
      try {
        detail = (await response.json())?.detail;
      } catch {
        detail = undefined;
      }
      return { success: false, error: detail || 'E-mail ou senha inválidos.' };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ao fazer login (HTTP ${response.status}).`,
      };
    }

    const data = (await response.json()) as AuthResponseDto;
    const user = storeSession(data);

    return { success: true, user, token: data.accessToken };
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirmation: string
  ): Promise<void> {
    const response = await authorizedPost('alterar-senha', {
      senhaAtual: currentPassword,
      novaSenha: newPassword,
      confirmacaoNovaSenha: newPasswordConfirmation,
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, `Erro ao alterar a senha (HTTP ${response.status}).`)
      );
    }
  }

  // Creates another user; the tokens returned for the new account are discarded
  // so the current session is kept.
  async registerUser(data: RegisterUserData): Promise<AuthUser> {
    const response = await authorizedPost('registrar', {
      nome: data.name,
      email: data.email,
      senha: data.password,
      confirmacaoSenha: data.passwordConfirmation,
      perfil: data.role || null,
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, `Erro ao cadastrar usuário (HTTP ${response.status}).`)
      );
    }
    const body = (await response.json()) as AuthResponseDto;
    return mapUsuarioToAuthUser(body.usuario);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getStoredUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    if (!getAccessToken()) return false;
    // An expired access token is renewed on the first 401, as long as there is a refresh token
    if (localStorage.getItem(REFRESH_TOKEN_KEY)) return true;
    const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() > Date.now();
  }
}
