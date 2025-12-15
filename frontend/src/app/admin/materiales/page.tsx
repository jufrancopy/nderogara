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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materiales.map((material: any) => (
                <div key={material.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {material.imagenUrl && (
                    <img
                      src={material.imagenUrl}
                      alt={material.nombre}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{material.nombre}</h3>
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        Base
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {material.descripcion || 'Sin descripción'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">{material.categoria?.nombre}</span>
                      <span className="text-sm text-gray-500">{material.unidad}</span>
                    </div>

                    <div className="mb-4">
                      <span className="text-lg font-medium text-gray-600">
                        {material.ofertas?.length || 0} oferta{material.ofertas?.length !== 1 ? 's' : ''} disponible{material.ofertas?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/materiales/editar/${material.id}`}
                        className="flex-1 bg-[#38603B] text-white px-4 py-2 rounded text-center hover:bg-[#2d4a2f] transition"
                      >
                        ✏️ Editar
                      </Link>
                      <button
                        onClick={() => setSelectedMaterial(material)}
                        className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded hover:bg-gray-100 transition text-sm"
                        title="Ver ofertas"
                      >
                        👁️ Ver Ofertas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
