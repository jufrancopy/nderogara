'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/components/PageLoader';
import { API_BASE_URL } from '@/lib/api';
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'ADMIN') {
      router.push('/proyectos');
      return;
    }

    fetchDashboard();
  }, []);

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
                    <span className="text-sm font-bold text-green-600">₲{oferta.precio.toLocaleString('es-PY')}</span>
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
                  Mostrando {data.todosLosMateriales.length} de {data.stats.totalMateriales} materiales
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ofertas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propietario</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.todosLosMateriales.map((material) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {material.precio ? `₲${Number(material.precio).toLocaleString('es-PY')}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.ofertas.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.usuarioId ? material.usuario?.name : 'Sistema'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
