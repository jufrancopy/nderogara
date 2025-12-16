'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/components/PageLoader';
import { API_BASE_URL } from '@/lib/api';
import { formatPrice } from '@/lib/formatters';
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  Plus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalMaterialesCatalogo: number;
    totalMaterialesProveedores: number;
    totalMateriales: number;
    totalProveedores: number;
    totalConstructores: number;
    totalClientes: number;
    totalUsuarios: number;
    totalProyectos: number;
  };
  materialesPorCategoria: Array<{
    id: string;
    nombre: string;
    _count: { materiales: number };
  }>;
  ofertasRecientes: Array<{
    id: string;
    precio: number;
    material: { nombre: string };
    proveedor: { usuario: { name: string } };
    createdAt: string;
  }>;
  todosLosMateriales: Array<{
    id: string;
    nombre: string;
    precio?: number;
    usuarioId?: string;
    usuario?: { name: string };
    empresa?: string;
    categoria: { nombre: string };
    ofertas: Array<{ precio: number }>;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'ADMIN') {
      router.push('/proyectos');
      return;
    }

    fetchDashboard();
  }, []);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar materiales por término de búsqueda
  const filteredMateriales = data?.todosLosMateriales.filter(material =>
    material.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.categoria.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.usuario?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Paginación
  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMateriales = filteredMateriales.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) return <PageLoader />;

  if (!data) return <div>Error al cargar datos</div>;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-2">Vista general del sistema y gestión de materiales</p>
            </div>
            <Link
              href="/admin/materiales/nuevo"
              className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Material Catálogo
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Materiales Catálogo</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalMaterialesCatalogo}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Materiales Proveedores</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalMaterialesProveedores}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalUsuarios}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalProyectos}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Materiales por Categoría */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Materiales por Categoría</h2>
              </div>
              <div className="space-y-3">
                {data.materialesPorCategoria.map((categoria) => (
                  <div key={categoria.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{categoria.nombre}</span>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(categoria._count.materiales / data.stats.totalMateriales) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{categoria._count.materiales}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ofertas Recientes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Activity className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Ofertas Recientes</h2>
              </div>
              <div className="space-y-3">
                {data.ofertasRecientes.map((oferta) => (
                  <div key={oferta.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{oferta.material.nombre}</p>
                      <p className="text-xs text-gray-500">{oferta.proveedor.usuario.name}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatPrice(oferta.precio)}</span>
                  </div>
                ))}
                {data.ofertasRecientes.length === 0 && (
                  <p className="text-gray-500 text-sm">No hay ofertas recientes</p>
                )}
              </div>
            </div>
          </div>

          {/* Todos los Materiales */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Todos los Materiales</h2>
                </div>
                <span className="text-sm text-gray-500">
                  Mostrando {startIndex + 1}-{Math.min(endIndex, filteredMateriales.length)} de {filteredMateriales.length} materiales
                  {searchTerm && (
                    <span> (filtrados de {data.stats.totalMateriales} totales)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar materiales por nombre, categoría, empresa o propietario..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredMateriales.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchTerm ? 'No se encontraron materiales que coincidan con la búsqueda' : 'No hay materiales registrados'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-blue-600 hover:text-blue-700 underline"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ofertas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentMateriales.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{material.nombre}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.categoria.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.empresa || 'Sistema'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              material.usuarioId
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {material.usuarioId ? 'Proveedor' : 'Catálogo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {material.ofertas.length > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  setShowOffersModal(true);
                                }}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {material.ofertas.length} - Oferta{material.ofertas.length !== 1 ? 's' : ''}
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Sin ofertas
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {material.usuarioId ? material.usuario?.name : 'Sistema'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMateriales.length)} de {filteredMateriales.length} resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Anterior</span>
                            ‹
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              const distance = Math.abs(page - currentPage);
                              return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                            })
                            .map((page, index, array) => (
                              <div key={page} className="flex items-center">
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => goToPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === currentPage
                                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              </div>
                            ))}
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Siguiente</span>
                            ›
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Ofertas */}
      {showOffersModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ofertas para {selectedMaterial.nombre}</h3>
                <p className="text-sm text-gray-500">{selectedMaterial.categoria.nombre}</p>
              </div>
              <button
                onClick={() => {
                  setShowOffersModal(false);
                  setSelectedMaterial(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {selectedMaterial.ofertas && selectedMaterial.ofertas.length > 0 ? (
                <div className="space-y-3">
                  {selectedMaterial.ofertas.map((oferta: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatPrice(oferta.precio)}</p>
                          <p className="text-xs text-gray-500">Oferta de precio</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">Proveedor</p>
                        <p className="text-xs text-gray-500">{selectedMaterial.usuario?.name || 'Sistema'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay ofertas disponibles para este material</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Total de ofertas: <span className="font-medium">{selectedMaterial.ofertas?.length || 0}</span>
                </p>
                <button
                  onClick={() => {
                    setShowOffersModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
