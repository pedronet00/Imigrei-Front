import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { Login } from '../pages/Login/Login';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { ImmigrantList } from '../pages/ImmigrantList/ImmigrantList';
import { ImmigrantForm } from '../pages/ImmigrantForm/ImmigrantForm';
import { ImmigrantDossier } from '../pages/ImmigrantDossier/ImmigrantDossier';
import { Reports } from '../pages/Reports/Reports';
import { Account } from '../pages/Account/Account';
import { Users } from '../pages/Users/Users';
import { ComingSoon } from '../pages/ComingSoon/ComingSoon';
import { MessagesSquare, FolderOpen } from 'lucide-react';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/imigrantes"
        element={
          <PrivateRoute>
            <ImmigrantList />
          </PrivateRoute>
        }
      />
      <Route
        path="/imigrantes/novo"
        element={
          <PrivateRoute>
            <ImmigrantForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/imigrantes/:id"
        element={
          <PrivateRoute>
            <ImmigrantDossier />
          </PrivateRoute>
        }
      />
      <Route
        path="/imigrantes/:id/editar"
        element={
          <PrivateRoute>
            <ImmigrantForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/atendimentos"
        element={
          <PrivateRoute>
            <ComingSoon
              title="Atendimentos"
              icon={<MessagesSquare size={48} />}
              description="Aqui você vai acompanhar os atendimentos de todos os imigrantes, com filtros por período e tipo de ação."
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/documentos"
        element={
          <PrivateRoute>
            <ComingSoon
              title="Documentos"
              icon={<FolderOpen size={48} />}
              description="Aqui você vai consultar todos os documentos enviados, com busca por imigrante e tipo de arquivo."
            />
          </PrivateRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <PrivateRoute>
            <Users />
          </PrivateRoute>
        }
      />
      <Route
        path="/minha-conta"
        element={
          <PrivateRoute>
            <Account />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
