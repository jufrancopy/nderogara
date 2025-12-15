'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/components/PageLoader';
import { API_BASE_URL } from '@/lib/api';

export default function AdminMaterialesPage() {
  const router = useRouter();
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [deleteMaterialData, setDeleteMaterialData] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'ADMIN') {
      router.push('/proyectos');
      return;
    }

    fetchMateriales();
  }, []);

  const fetchMateriales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/materiales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMateriales(data.data);
      }
    } catch (error) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, esActivo: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const material = materiales.find((m: any) => m.id === id) as any;
      if (!material) return;

      await fetch(`${API_BASE_URL}/admin/materiales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: material.nombre,
          descripcion: material.descripcion,
          unidad: material.unidad,
          categoriaId: material.categoria?.id || material.categoriaId,
          imagenUrl: material.imagenUrl,
          esActivo: !esActivo
        })
      });

      fetchMateriales();
    } catch (error) {
      console.error('Error al actualizar material:', error);
    }
  };

  const handleDeleteClick = (material: any) => {
    setDeleteMaterialData(material);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMaterialData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/materiales/${deleteMaterialData.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchMateriales();
        setDeleteMaterialData(null);
      } else {
        console.error('Error al eliminar el material');
      }
    } catch (error) {
      console.error('Error al eliminar material:', error);
    } finally {
      setDeleteMaterialData(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteMaterialData(null);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catálogo de Materiales Base</h1>
              <p className="text-gray-600 mt-2">Gestiona los materiales base para que los proveedores creen ofertas</p>
            </div>
            <Link
              href="/admin/materiales/nuevo"
              className="bg-[#38603B] text-white px-6 py-3 rounded-lg hover:bg-[#2d4a2f] transition flex items-center"
            >
              + Nuevo Material Base
            </Link>
          </div>

          {materiales.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No hay materiales en el catálogo</p>
              <p className="text-gray-400 text-sm">
                Los proveedores podrán crear ofertas basadas en estos materiales
              </p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material Base
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ofertas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materiales.map((material: any) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {material.imagenUrl && (
                              <img
                                src={material.imagenUrl.startsWith('http') ? material.imagenUrl : `${API_BASE_URL}${material.imagenUrl}`}
                                alt={material.nombre}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{material.nombre}</div>
                              <div className="text-sm text-gray-500">{material.descripcion || 'Sin descripción'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.categoria?.nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.unidad}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {material.ofertas?.length || 0} oferta{material.ofertas?.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            material.esActivo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {material.esActivo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              href={`/admin/materiales/editar/${material.id}`}
                              className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded text-sm"
                              title="Editar material"
                            >
                              ✏️
                            </Link>
                            <button
                              onClick={() => setSelectedMaterial(material)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-sm"
                              title="Ver ofertas"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => toggleActivo(material.id, material.esActivo)}
                              className={`px-2 py-1 rounded text-sm ${
                                material.esActivo
                                  ? 'text-gray-600 hover:text-gray-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={material.esActivo ? 'Desactivar' : 'Activar'}
                            >
                              {material.esActivo ? '🚫' : '✅'}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(material)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-sm"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMaterial.nombre}</h2>
                <button 
                  onClick={() => setSelectedMaterial(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {selectedMaterial.imagenUrl && (
                <div className="mb-6">
                  <img 
                    src={selectedMaterial.imagenUrl}
                    alt={selectedMaterial.nombre}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Descripción:</span>
                  <p className="text-gray-600 mt-1">{selectedMaterial.descripcion || 'Sin descripción'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">Unidad:</span>
                    <p className="text-gray-600">{selectedMaterial.unidad}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Categoría:</span>
                    <p className="text-gray-600">{selectedMaterial.categoria?.nombre}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Ofertas de Proveedores ({selectedMaterial.ofertas?.length || 0})</h3>
                  {selectedMaterial.ofertas && selectedMaterial.ofertas.length > 0 ? (
                    <div className="space-y-2">
                      {selectedMaterial.ofertas.map((oferta: any) => (
                        <div key={oferta.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold">{oferta.proveedor.nombre}</div>
                              {oferta.marca && <div className="text-sm text-gray-500">{oferta.marca}</div>}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">₲{oferta.precio.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Comisión: {oferta.comisionPorcentaje}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay ofertas disponibles</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button 
                  onClick={() => setSelectedMaterial(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {deleteMaterialData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  ¿Estás seguro de que quieres eliminar el material <strong className="text-gray-900">"{deleteMaterialData.nombre}"</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta acción no se puede deshacer. El material será eliminado permanentemente y todas sus ofertas asociadas.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={handleDeleteCancel}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  onClick={handleDeleteConfirm}
                >
                  <span className="mr-2">🗑️</span>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
