import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/registros': 'Registros',
  '/admin/empresas': 'Empresas',
  '/admin/conductores': 'Conductores',
  '/admin/rutas': 'Rutas',
  '/admin/novedades': 'Tipos de Novedades',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const title = pageTitles[location.pathname] || 'TransControl';

  return (
    <div className="min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
