'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, LogOut, Menu, X, ChevronDown, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const toggleDropdown = (menu: string) => {
    setDropdownOpen(dropdownOpen === menu ? null : menu);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
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
            <nav className="hidden lg:flex gap-6">
              {/* Dashboard */}
              {user?.rol === 'ADMIN' && (
                <Link href="/admin/dashboard" className={`px-3 py-2 rounded ${pathname.startsWith('/admin/dashboard') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
              )}

              {/* Proyectos */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('proyectos')}
                  className="flex items-center gap-1 px-3 py-2 rounded text-gray-600 hover:text-gray-900"
                >
                  Proyectos
                  <ChevronDown className="h-4 w-4" />
                </button>
                {dropdownOpen === 'proyectos' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link href="/referencia" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                      📋 Referencia
                    </Link>
                    <Link href="/proyectos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                      🏗️ Gestionar
                    </Link>
                  </div>
                )}
              </div>

              {/* Construcción */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('construccion')}
                  className="flex items-center gap-1 px-3 py-2 rounded text-gray-600 hover:text-gray-900"
                >
                  Construcción
                  <ChevronDown className="h-4 w-4" />
                </button>
                {dropdownOpen === 'construccion' && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link href="/materiales" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                      🧱 Materiales
                    </Link>
                    <Link href="/items" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                      📦 Items
                    </Link>
                    {user?.rol === 'CONSTRUCTOR' && (
                      <Link href="/proveedor/materiales" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                        🏪 Mis Materiales
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Inmuebles - si es necesario */}
              {user?.rol === 'ADMIN' && (
                <Link href="/inmuebles" className={`px-3 py-2 rounded ${pathname.startsWith('/inmuebles') ? 'bg-yellow-50 text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  🏠 Inmuebles
                </Link>
              )}

              {/* Configuración - Solo para Admin */}
              {user?.rol === 'ADMIN' && (
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('configuracion')}
                    className="flex items-center gap-1 px-3 py-2 rounded text-gray-600 hover:text-gray-900"
                  >
                    Configuración
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {dropdownOpen === 'configuracion' && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <Link href="/admin/usuarios" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                        👥 Usuarios
                      </Link>
                      <Link href="/admin/materiales" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                        📚 Catálogo
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Menús específicos por rol */}
              {user?.rol === 'PROVEEDOR_MATERIALES' && (
                <>
                  <Link href="/proveedor/perfil" className={`px-3 py-2 rounded ${pathname === '/proveedor/perfil' ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Mi Perfil
                  </Link>
                  <Link href="/proveedor/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/proveedor/materiales') ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Mis Materiales
                  </Link>
                </>
              )}

              {user?.rol === 'PROVEEDOR_SERVICIOS' && (
                <>
                  <Link href="/items" className={`px-3 py-2 rounded ${pathname.startsWith('/items') ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Mis Servicios
                  </Link>
                  <Link href="/proveedor/materiales" className={`px-3 py-2 rounded ${pathname.startsWith('/proveedor') ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:text-gray-900'}`}>
                    Mis Materiales
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Usuario con dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('usuario')}
                className="flex items-center gap-2 px-3 py-2 rounded text-gray-600 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:block text-sm font-medium">{user?.name || user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {dropdownOpen === 'usuario' && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
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
                  <Link href="/proveedor/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={closeDropdown}>
                    👤 Perfil
                  </Link>
                  <button
                    onClick={() => {
                      closeDropdown();
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Salir
                  </button>
                </div>
              )}
            </div>

            <div className="lg:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white max-h-96 overflow-y-auto">
            <div className="px-4 py-2 space-y-2">
              {/* Dashboard */}
              {user?.rol === 'ADMIN' && (
                <Link href="/admin/dashboard" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                  📊 Dashboard
                </Link>
              )}

              {/* Proyectos */}
              <div className="border-b border-gray-100 pb-2 mb-2">
                <div className="font-medium text-gray-900 text-sm mb-1">🏗️ Proyectos</div>
                <div className="pl-4 space-y-1">
                  <Link href="/referencia" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    📋 Referencia
                  </Link>
                  <Link href="/proyectos" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    🏗️ Gestionar
                  </Link>
                </div>
              </div>

              {/* Construcción */}
              <div className="border-b border-gray-100 pb-2 mb-2">
                <div className="font-medium text-gray-900 text-sm mb-1">🔨 Construcción</div>
                <div className="pl-4 space-y-1">
                  <Link href="/materiales" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    🧱 Materiales
                  </Link>
                  <Link href="/items" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    📦 Items
                  </Link>
                  {user?.rol === 'CONSTRUCTOR' && (
                    <Link href="/proveedor/materiales" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                      🏪 Mis Materiales
                    </Link>
                  )}
                </div>
              </div>

              {/* Inmuebles */}
              {user?.rol === 'ADMIN' && (
                <Link href="/inmuebles" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                  🏠 Inmuebles
                </Link>
              )}

              {/* Configuración */}
              {user?.rol === 'ADMIN' && (
                <div className="border-b border-gray-100 pb-2 mb-2">
                  <div className="font-medium text-gray-900 text-sm mb-1">⚙️ Configuración</div>
                  <div className="pl-4 space-y-1">
                    <Link href="/admin/usuarios" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                      👥 Usuarios
                    </Link>
                    <Link href="/admin/materiales" className="block py-1 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                      📚 Catálogo
                    </Link>
                  </div>
                </div>
              )}

              {/* Menús específicos por rol */}
              {user?.rol === 'PROVEEDOR_MATERIALES' && (
                <>
                  <Link href="/proveedor/perfil" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    👤 Mi Perfil
                  </Link>
                  <Link href="/proveedor/materiales" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    📦 Mis Materiales
                  </Link>
                </>
              )}

              {user?.rol === 'PROVEEDOR_SERVICIOS' && (
                <>
                  <Link href="/items" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    🔧 Mis Servicios
                  </Link>
                  <Link href="/proveedor/materiales" className="block py-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                    📦 Mis Materiales
                  </Link>
                </>
              )}

              {/* Usuario */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <div>
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
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
                <Link href="/proveedor/perfil" className="block py-2 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
                  👤 Perfil
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
