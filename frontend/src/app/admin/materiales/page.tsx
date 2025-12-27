'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLoader from '@/components/PageLoader';
import { API_BASE_URL } from '@/lib/api';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminMaterialesPage() {
  const router = useRouter();
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [deleteMaterialData, setDeleteMaterialData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para gestión de ofertas
  const [showAddOfertaModal, setShowAddOfertaModal] = useState(false);
  const [selectedMaterialForOferta, setSelectedMaterialForOferta] = useState<any>(null);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [ofertaForm, setOfertaForm] = useState({
    proveedorId: '',
    precio: '',
    tipoCalidad: 'COMUN',
    marca: '',
    comisionPorcentaje: '0',
    stock: true,
    observaciones: '',
    imagenUrl: ''
  });

  // Estados para gestión de imágenes
  const [galeria, setGaleria] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  // Estados para crear proveedores
  const [showCreateProveedorModal, setShowCreateProveedorModal] = useState(false);
  const [newProveedor, setNewProveedor] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    departamento: ''
  });

  // Estados para búsqueda de proveedores
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('');
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<any>(null);

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
      if (!material) {
        console.error('Material no encontrado:', id);
        return;
      }

      console.log('Cambiando estado de material:', material.nombre, 'de', esActivo, 'a', !esActivo);

      // Preparar datos para actualizar solo el estado activo
      const updateData = {
        esActivo: !esActivo
      };

      console.log('Enviando datos:', updateData);

      const response = await fetch(`${API_BASE_URL}/admin/materiales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        console.log('Material actualizado exitosamente');
        fetchMateriales();
      } else {
        const errorText = await response.text();
        console.error('Error del servidor:', response.status, errorText);
        toast.error('Error al cambiar el estado del material');
      }
    } catch (error) {
      console.error('Error al actualizar material:', error);
      toast.error('Error al cambiar el estado del material');
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

  // Filtrar materiales por término de búsqueda
  const filteredMateriales = materiales.filter((material: any) =>
    material.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.categoria?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.unidad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMateriales = filteredMateriales.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Funciones para gestión de ofertas
  const handleAddOferta = async (material: any) => {
    setSelectedMaterialForOferta(material);
    setOfertaForm({
      proveedorId: '',
      precio: '',
      tipoCalidad: 'COMUN',
      marca: '',
      comisionPorcentaje: '0',
      stock: true,
      observaciones: '',
      imagenUrl: ''
    });

    // Cargar proveedores
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/proveedores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProveedores(data.data);
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setProveedores([]);
    }

    setShowAddOfertaModal(true);
  };

  const handleOfertaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForOferta || !ofertaForm.proveedorId || !ofertaForm.precio) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/materiales/${selectedMaterialForOferta.id}/ofertas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ofertaForm)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Oferta agregada exitosamente');
        setShowAddOfertaModal(false);
        fetchMateriales(); // Recargar materiales con las nuevas ofertas
      } else {
        toast.error(data.error || 'Error al agregar oferta');
      }
    } catch (error) {
      console.error('Error al agregar oferta:', error);
      toast.error('Error al agregar oferta');
    }
  };

  // Función para cargar galería de imágenes
  const fetchGaleria = async () => {
    try {
      const response = await api.get('/upload/galeria');
      setGaleria(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar galería:', error);
      setGaleria([]);
    }
  };

  // Función para crear proveedores
  const handleCreateProveedor = async () => {
    try {
      const response = await api.post('/proveedores', newProveedor);
      const proveedorCreado = response.data.data;

      // Agregar el nuevo proveedor a la lista
      setProveedores(prev => [...prev, proveedorCreado]);

      // Seleccionar automáticamente el nuevo proveedor
      setOfertaForm(prev => ({ ...prev, proveedorId: proveedorCreado.id }));

      // Cerrar modal y resetear formulario
      setShowCreateProveedorModal(false);
      setNewProveedor({
        nombre: '',
        email: '',
        telefono: '',
        ciudad: '',
        departamento: ''
      });

      toast.success('Proveedor creado exitosamente');
    } catch (error: any) {
      console.error('Error creating proveedor:', error);
      const errorMessage = error.response?.data?.error || 'Error al crear proveedor';
      toast.error(`Error: ${errorMessage}`);
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
              className="bg-[#38603B] text-white px-3 py-1 rounded text-sm transition-colors flex items-center hover:bg-[#2d4a2f] sm:px-6 sm:py-3 lg:px-6 lg:py-3"
              title="Nuevo Material Base"
            >
              <span className="text-lg sm:text-base">+</span>
              <span className="hidden sm:inline ml-2">Nuevo Material Base</span>
            </Link>
          </div>

          {/* Barra de búsqueda */}
          {materiales.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar materiales por nombre, descripción, categoría o unidad..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {materiales.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No hay materiales en el catálogo</p>
              <p className="text-gray-400 text-sm">
                Los proveedores podrán crear ofertas basadas en estos materiales
              </p>
            </div>
          ) : filteredMateriales.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No se encontraron materiales que coincidan con la búsqueda</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Limpiar búsqueda
              </button>
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
                    {currentMateriales.map((material: any) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap max-w-xs">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                              {material.imagenUrl ? (
                                <img
                                  src={material.imagenUrl.startsWith('http') ? material.imagenUrl : `${API_BASE_URL}${material.imagenUrl}`}
                                  alt={material.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<span class="text-gray-400 text-xs">📷</span>';
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">📷</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{material.nombre}</div>
                              <div className="text-sm text-gray-500 truncate max-w-32" title={material.descripcion || 'Sin descripción'}>
                                {material.descripcion || 'Sin descripción'}
                              </div>
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
                              onClick={() => {
                                console.log('=== ABRIENDO MODAL DE OFERTAS ===');
                                console.log('Material seleccionado:', material);
                                console.log('ID del material:', material.id);
                                console.log('Ofertas del material:', material.ofertas);
                                console.log('Número de ofertas:', material.ofertas?.length || 0);
                                if (material.ofertas && material.ofertas.length > 0) {
                                  material.ofertas.forEach((oferta: any, index: number) => {
                                    console.log(`Oferta ${index + 1}:`, {
                                      id: oferta.id,
                                      precio: oferta.precio,
                                      marca: oferta.marca,
                                      proveedor: oferta.proveedor?.nombre
                                    });
                                  });
                                }
                                setSelectedMaterial(material);
                              }}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-sm"
                              title="Ver ofertas"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleAddOferta(material)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-sm"
                              title="Agregar oferta"
                            >
                              💰
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

              {/* Paginación - Footer de la tabla */}
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
                        Mostrando{' '}
                        <span className="font-medium">{startIndex + 1}</span>
                        {' '}a{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredMateriales.length)}</span>
                        {' '}de{' '}
                        <span className="font-medium">{filteredMateriales.length}</span>
                        {' '}resultados
                        {searchTerm && (
                          <span className="text-gray-500">
                            {' '}(filtrados de {materiales.length} totales)
                          </span>
                        )}
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

                        {/* Páginas */}
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

      {/* Modal para agregar oferta */}
      {showAddOfertaModal && selectedMaterialForOferta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Agregar Oferta</h2>
                <button
                  onClick={() => setShowAddOfertaModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Material Seleccionado</h3>
                <div className="flex items-center">
                  {selectedMaterialForOferta.imagenUrl && (
                    <img
                      src={selectedMaterialForOferta.imagenUrl.startsWith('http') ? selectedMaterialForOferta.imagenUrl : `${API_BASE_URL}${selectedMaterialForOferta.imagenUrl}`}
                      alt={selectedMaterialForOferta.nombre}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-blue-900">{selectedMaterialForOferta.nombre}</div>
                    <div className="text-sm text-blue-700">{selectedMaterialForOferta.unidad}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleOfertaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={proveedorSearchTerm}
                      onChange={(e) => {
                        setProveedorSearchTerm(e.target.value)
                        setShowProveedorDropdown(true)
                        if (selectedProveedor && e.target.value !== selectedProveedor.nombre) {
                          setSelectedProveedor(null)
                          setOfertaForm(prev => ({ ...prev, proveedorId: '' }))
                        }
                      }}
                      onFocus={() => setShowProveedorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowProveedorDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar proveedor..."
                      required
                    />
                    {selectedProveedor && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProveedor(null)
                          setProveedorSearchTerm('')
                          setOfertaForm(prev => ({ ...prev, proveedorId: '' }))
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}

                    {/* Dropdown de proveedores */}
                    {showProveedorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {proveedores
                          .filter(proveedor =>
                            proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                            proveedor.ciudad?.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                          )
                          .map((proveedor) => (
                            <div
                              key={proveedor.id}
                              onClick={() => {
                                setSelectedProveedor(proveedor)
                                setProveedorSearchTerm(proveedor.nombre)
                                setOfertaForm(prev => ({ ...prev, proveedorId: proveedor.id }))
                                setShowProveedorDropdown(false)
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{proveedor.nombre}</div>
                              {proveedor.ciudad && (
                                <div className="text-sm text-gray-500">📍 {proveedor.ciudad}</div>
                              )}
                              {proveedor.telefono && (
                                <div className="text-sm text-gray-500">📞 {proveedor.telefono}</div>
                              )}
                            </div>
                          ))}
                        {proveedores.filter(proveedor =>
                          proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                          proveedor.ciudad?.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            No se encontraron proveedores
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateProveedorModal(true)}
                    className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Crear nuevo proveedor"
                  >
                    + Crear Nuevo Proveedor
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (₲) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={ofertaForm.precio}
                    onChange={(e) => setOfertaForm({...ofertaForm, precio: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25000.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Calidad
                  </label>
                  <select
                    value={ofertaForm.tipoCalidad}
                    onChange={(e) => setOfertaForm({...ofertaForm, tipoCalidad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="COMUN">Común</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="ARTESANAL">Artesanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={ofertaForm.marca}
                    onChange={(e) => setOfertaForm({...ofertaForm, marca: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Marca del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ofertaForm.comisionPorcentaje}
                    onChange={(e) => setOfertaForm({...ofertaForm, comisionPorcentaje: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen del Producto
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              const url = URL.createObjectURL(file);
                              setCurrentImageUrl('');
                              setOfertaForm(prev => ({ ...prev, imagenUrl: url }));
                            }
                          }}
                          className="hidden"
                          id="oferta-image-upload"
                        />
                        <label
                          htmlFor="oferta-image-upload"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                        >
                          📎 Seleccionar imagen...
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          fetchGaleria();
                          setShowGallery(!showGallery);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
                      >
                        🖼️ Galería
                      </button>
                    </div>
                    {currentImageUrl || ofertaForm.imagenUrl ? (
                      <img
                        src={currentImageUrl || ofertaForm.imagenUrl}
                        alt="Vista previa"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    ) : null}

                    {/* Campo URL como opción adicional */}
                    <div className="border-t pt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        O especificar URL
                      </label>
                      <input
                        type="url"
                        value={ofertaForm.imagenUrl.startsWith('blob:') ? '' : ofertaForm.imagenUrl}
                        onChange={(e) => {
                          setOfertaForm(prev => ({ ...prev, imagenUrl: e.target.value }));
                          setSelectedFile(null);
                          setCurrentImageUrl('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                    </div>
                  </div>

                  {showGallery && (
                    <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto mt-3">
                      <h4 className="font-medium mb-3">Seleccionar de Galería</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {galeria.map((img: any) => (
                          <div
                            key={img.filename}
                            onClick={() => {
                              const fullUrl = img.url.startsWith('http')
                                ? img.url
                                : `${API_BASE_URL}${img.url}`;
                              setOfertaForm(prev => ({ ...prev, imagenUrl: fullUrl }));
                              setCurrentImageUrl(fullUrl);
                              setSelectedFile(null);
                              setShowGallery(false);
                            }}
                            className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden transition-colors"
                          >
                            <img src={`${API_BASE_URL}${img.url}`} alt={img.filename} className="w-full h-20 object-cover" />
                          </div>
                        ))}
                      </div>
                      {galeria.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">No hay imágenes en la galería</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={ofertaForm.observaciones}
                    onChange={(e) => setOfertaForm({...ofertaForm, observaciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stock"
                    checked={ofertaForm.stock}
                    onChange={(e) => setOfertaForm({...ofertaForm, stock: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="stock" className="ml-2 block text-sm text-gray-900">
                    Disponible en stock
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddOfertaModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                  >
                    <span className="mr-2">💰</span>
                    Agregar Oferta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear proveedor */}
      {showCreateProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Proveedor</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newProveedor.nombre}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Ferretería Central"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newProveedor.email}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contacto@proveedor.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={newProveedor.telefono}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+595 21 123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={newProveedor.ciudad}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Asunción"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={newProveedor.departamento}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Central"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProveedorModal(false)
                    setNewProveedor({
                      nombre: '',
                      email: '',
                      telefono: '',
                      ciudad: '',
                      departamento: ''
                    })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateProveedor}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Crear Proveedor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
