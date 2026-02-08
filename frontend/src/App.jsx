import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmpresasPage from './pages/EmpresasPage';
import ConductoresPage from './pages/ConductoresPage';
import RutasPage from './pages/RutasPage';
import NovedadesPage from './pages/NovedadesPage';
import RegistrosPage from './pages/RegistrosPage';
import FormularioPage from './pages/FormularioPage';

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente para redirigir si ya está autenticado
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Formulario público - Acceso sin autenticación */}
      <Route path="/" element={<FormularioPage />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="registros" element={<RegistrosPage />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="conductores" element={<ConductoresPage />} />
        <Route path="rutas" element={<RutasPage />} />
        <Route path="novedades" element={<NovedadesPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
