'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Si no hay usuario, mostrar navbar básico en inmuebles, login y referencia
  if (!user && (pathname.startsWith('/inmuebles') || pathname === '/login' || pathname.startsWith('/referencia'))) {
    return (
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-4">
            <Link href="/" className="flex items-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/logo.jpg`}
                alt="Nde Rogara"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  console.log('Error loading logo in login navbar:', e);
                  // e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="ml-4 text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #38603B, #B99742)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Nde Rogara</h1>
            </Link>
            <div className="hidden sm:flex gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2">
                Iniciar Sesión
              </Link>
              <Link href="/login" className="text-white px-4 py-2 rounded-lg" style={{backgroundColor: '#38603B'}}>
                Registrarse
              </Link>
            </div>
            <div className="sm:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="sm:hidden border-t bg-white">
              <div className="px-4 py-2 space-y-2">
                <Link href="/login" className="block text-gray-600 hover:text-gray-900 py-2">
                  Iniciar Sesión
                </Link>
                <Link href="/login" className="block text-white text-center py-2 rounded-lg" style={{backgroundColor: '#38603B'}}>
                  Registrarse
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Si no hay usuario en otras páginas, no mostrar navbar
  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-4">
          <div className="flex items-center gap-8">
            <Link href="/proyectos" className="flex items-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/logo.jpg`}
                alt="Nde Rogara"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="ml-2 text-xl font-bold text-gray-900">Nde Rogara</span>
            </Link>
            <nav className="hidden lg:flex gap-4">
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
                    <>
                      <Link href="/admin/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/admin/materiales') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
                        Catálogo
                      </Link>
                      <Link href="/admin/usuarios" className={`px-3 py-2 rounded ${pathname.startsWith('/admin/usuarios') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
                        Usuarios
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
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
              <span className="hidden sm:inline">Salir</span>
            </button>
            <div className="lg:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-2 space-y-2">
              {user?.rol === 'PROVEEDOR_MATERIALES' ? (
                <Link href="/proveedor/materiales" className="block py-2 text-gray-600">
                  Mis Materiales
                </Link>
              ) : (
                <>
                  <Link href="/proyectos" className="block py-2 text-gray-600">
                    Proyectos
                  </Link>
                  <Link href="/referencia" className="block py-2 text-gray-600">
                    Referencia
                  </Link>
                  <Link href="/materiales" className="block py-2 text-gray-600">
                    Materiales
                  </Link>
                  <Link href="/items" className="block py-2 text-gray-600">
                    Items
                  </Link>
                  <Link href="/inmuebles" className="block py-2 text-gray-600">
                    Inmuebles
                  </Link>
                  {user?.rol === 'ADMIN' && (
                    <>
                      <Link href="/admin/materiales" className="block py-2 text-gray-600">
                        Catálogo
                      </Link>
                      <Link href="/admin/usuarios" className="block py-2 text-gray-600">
                        Usuarios
                      </Link>
                    </>
                  )}
                </>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
                {user?.rol === 'ADMIN' && (
                  <div className="text-xs text-orange-600 font-semibold">★ Admin</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
