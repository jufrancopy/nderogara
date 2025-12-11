'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (pathname === '/') return null;

  // Si no hay usuario, mostrar navbar básico en inmuebles y login
  if (!user && (pathname.startsWith('/inmuebles') || pathname === '/login')) {
    return (
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-4">
            <div className="flex items-center">
              <img
                src="http://localhost:3001/uploads/logo.jpg"
                alt="Nde Rogara"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="ml-4 text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #38603B, #B99742)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Nde Rogara</h1>
            </div>
            <div className="flex gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2">
                Iniciar Sesión
              </Link>
              <Link href="/login" className="text-white px-4 py-2 rounded-lg" style={{backgroundColor: '#38603B'}}>
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Si no hay usuario en otras páginas, redirigir a login
  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-4">
          <div className="flex items-center gap-8">
            <Link href="/proyectos" className="flex items-center">
              <img
                src="http://localhost:3001/uploads/logo.jpg"
                alt="Nde Rogara"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="ml-2 text-xl font-bold text-gray-900">Nde Rogara</span>
            </Link>
            <nav className="flex gap-4">
              {user?.rol === 'PROVEEDOR_MATERIALES' ? (
                <Link href="/proveedor/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/proveedor') ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  Mis Materiales
                </Link>
              ) : (
                <>
                  <Link href="/proyectos" className={`px-3 py-2 rounded ${pathname.startsWith('/proyectos') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Proyectos
                  </Link>
                  <Link href="/referencia" className={`px-3 py-2 rounded ${pathname.startsWith('/referencia') ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Referencia
                  </Link>
                  <Link href="/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/materiales') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Materiales
                  </Link>
                  <Link href="/items" className={`px-3 py-2 rounded ${pathname.startsWith('/items') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Items
                  </Link>
                  <Link href="/inmuebles" className={`px-3 py-2 rounded ${pathname.startsWith('/inmuebles') ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Inmuebles
                  </Link>
                  {user?.rol === 'ADMIN' && (
                    <Link href="/admin/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/admin') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
                      Catálogo
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
              {user?.rol === 'ADMIN' && (
                <div className="text-xs text-orange-600 font-semibold">★ Admin</div>
              )}
              {user?.rol === 'PROVEEDOR_MATERIALES' && (
                <div className="text-xs text-purple-600 font-semibold">📦 Proveedor</div>
              )}
              {user?.rol === 'PROVEEDOR_SERVICIOS' && (
                <div className="text-xs text-green-600 font-semibold">🔧 Servicios</div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
