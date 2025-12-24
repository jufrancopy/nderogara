'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Package, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatPrice } from '@/lib/formatters'
import { API_BASE_URL } from '@/lib/api'

interface Proveedor {
  id: string
  nombre: string
  email?: string
  telefono?: string
  ciudad?: string
  departamento?: string
  createdAt: string
  _count?: {
    ofertas: number
  }
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'ofertas' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [showOfertasModal, setShowOfertasModal] = useState(false)
  const [ofertasProveedor, setOfertasProveedor] = useState<any[]>([])
  const [loadingOfertas, setLoadingOfertas] = useState(false)

  // Estados para agregar ofertas
  const [showAddOfertaModal, setShowAddOfertaModal] = useState(false)
  const [selectedProveedorForOferta, setSelectedProveedorForOferta] = useState<Proveedor | null>(null)
  const [addOfertaForm, setAddOfertaForm] = useState({
    materialId: '',
    precio: '',
    marca: '',
    tipoCalidad: 'COMUN' as 'COMUN' | 'PREMIUM' | 'INDUSTRIAL' | 'ARTESANAL',
    comisionPorcentaje: '0',
    stock: true,
    observaciones: '',
    imagenUrl: ''
  })
  const [loadingAddOferta, setLoadingAddOferta] = useState(false)

  // Estados para editar ofertas
  const [showEditOfertaModal, setShowEditOfertaModal] = useState(false)
  const [selectedOfertaForEdit, setSelectedOfertaForEdit] = useState<any>(null)
  const [editOfertaForm, setEditOfertaForm] = useState({
    precio: '',
    marca: '',
    tipoCalidad: 'COMUN' as 'COMUN' | 'PREMIUM' | 'INDUSTRIAL' | 'ARTESANAL',
    comisionPorcentaje: '0',
    stock: true,
    observaciones: '',
    imagenUrl: ''
  })
  const [loadingEditOferta, setLoadingEditOferta] = useState(false)

  // Estados adicionales
  const [materiales, setMateriales] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [showGallery, setShowGallery] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Estado para modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ofertaToDelete, setOfertaToDelete] = useState<any>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  useEffect(() => {
    fetchProveedores()
    fetchMateriales()
    fetchGaleria()
  }, [])

  const fetchGaleria = async () => {
    try {
      const response = await api.get('/upload/galeria')
      setGaleria(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar galería:', error)
      setGaleria([])
    }
  }

  const fetchMateriales = async () => {
    try {
      const response = await api.get('/materiales')
      setMateriales(response.data.data?.filter((m: any) => m && m.nombre) || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
    }
  }

  const fetchProveedores = async () => {
    try {
      // Temporarily use debug endpoint to test
      const response = await api.get('/proveedor/debug')
      setProveedores(response.data.data?.filter((p: any) => p && p.nombre) || [])
    } catch (error) {
      console.error('Error fetching proveedores:', error)
      // Fallback to authenticated endpoint
      try {
        const response = await api.get('/proveedores')
        setProveedores(response.data.data?.filter((p: any) => p && p.nombre) || [])
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerOfertas = async (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setLoadingOfertas(true)
    setShowOfertasModal(true)

    try {
      // Obtener todas las ofertas del proveedor
      const response = await api.get(`/proveedor/${proveedor.id}/ofertas`)
      setOfertasProveedor(response.data.data || [])
    } catch (error) {
      console.error('Error fetching ofertas:', error)
      setOfertasProveedor([])
    } finally {
      setLoadingOfertas(false)
    }
  }

  const handleAgregarOferta = (proveedor: Proveedor) => {
    setSelectedProveedorForOferta(proveedor)
    setAddOfertaForm({
      materialId: '',
      precio: '',
      marca: '',
      tipoCalidad: 'COMUN',
      comisionPorcentaje: '0',
      stock: true,
      observaciones: '',
      imagenUrl: ''
    })
    setShowAddOfertaModal(true)
  }

  const handleEditarOferta = (oferta: any) => {
    setSelectedOfertaForEdit(oferta)
    setEditOfertaForm({
      precio: oferta.precio ? Number(oferta.precio).toLocaleString('es-PY') : '',
      marca: oferta.marca || '',
      tipoCalidad: oferta.tipoCalidad || 'COMUN',
      comisionPorcentaje: oferta.comisionPorcentaje?.toString() || '0',
      stock: oferta.stock !== false,
      observaciones: oferta.observaciones || '',
      imagenUrl: oferta.imagenUrl || ''
    })
    setShowEditOfertaModal(true)
  }

  const handleEliminarOferta = (oferta: any) => {
    setOfertaToDelete(oferta)
    setShowDeleteModal(true)
  }

  const confirmDeleteOferta = async () => {
    if (!ofertaToDelete) return

    setLoadingDelete(true)
    try {
      await api.delete(`/admin/ofertas/${ofertaToDelete.id}`)
      toast.success('Oferta eliminada exitosamente')

      // Recargar las ofertas del proveedor actual
      if (selectedProveedor) {
        const response = await api.get(`/proveedor/${selectedProveedor.id}/ofertas`)
        setOfertasProveedor(response.data.data || [])
      }

      // Recargar lista de proveedores para actualizar conteos
      fetchProveedores()

      setShowDeleteModal(false)
      setOfertaToDelete(null)
    } catch (error: any) {
      console.error('Error deleting oferta:', error)
      toast.error(error.response?.data?.error || 'Error al eliminar la oferta')
    } finally {
      setLoadingDelete(false)
    }
  }

  const filteredProveedores = proveedores
    .filter(proveedor =>
      (proveedor.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proveedor.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proveedor.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.nombre || ''
          bValue = b.nombre || ''
          break
        case 'ofertas':
          aValue = a._count?.ofertas || 0
          bValue = b._count?.ofertas || 0
          break
        case 'date':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando proveedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
                <p className="text-sm text-gray-600">Gestiona proveedores y sus ofertas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search and Sort Controls */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar proveedores por nombre, ciudad o email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Sort Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'ofertas' | 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="name">Nombre</option>
                  <option value="ofertas">Cantidad de Ofertas</option>
                  <option value="date">Fecha de Registro</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Ascendente
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Descendente
                    </>
                  )}
                </button>
              </div>

              <div className="text-sm text-gray-500">
                {filteredProveedores.length} proveedor{filteredProveedores.length !== 1 ? 'es' : ''} encontrado{filteredProveedores.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Proveedores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {proveedores.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Proveedores Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {proveedores.filter(p => p._count?.ofertas && p._count.ofertas > 0).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Proveedores con Ofertas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {proveedores.filter(p => p._count?.ofertas && p._count.ofertas > 0).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proveedores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProveedores.map((proveedor) => (
              <div key={proveedor.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <button
                        onClick={() => handleVerOfertas(proveedor)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver Ofertas
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {proveedor.nombre}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-600">
                      {proveedor.ciudad && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">📍</span>
                          {proveedor.ciudad}
                          {proveedor.departamento && `, ${proveedor.departamento}`}
                        </div>
                      )}

                      {proveedor.telefono && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">📞</span>
                          {proveedor.telefono}
                        </div>
                      )}

                      {proveedor.email && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">✉️</span>
                          <span className="truncate">{proveedor.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-sm text-gray-600">
                            {proveedor._count?.ofertas || 0} ofertas
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Registrado: {proveedor.createdAt ? new Date(proveedor.createdAt).toLocaleDateString('es-PY') : `Fecha no disponible (${typeof proveedor.createdAt})`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProveedores.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron proveedores</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Prueba con otros términos de búsqueda.' : 'Comienza creando proveedores para gestionar ofertas.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Ofertas del Proveedor */}
      {showOfertasModal && selectedProveedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Ofertas de {selectedProveedor.nombre}</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedProveedor.ciudad && `📍 ${selectedProveedor.ciudad}`}
                    {selectedProveedor.telefono && ` • 📞 ${selectedProveedor.telefono}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAgregarOferta(selectedProveedor)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Oferta
                  </button>
                  <button
                    onClick={() => {
                      setShowOfertasModal(false)
                      setSelectedProveedor(null)
                      setOfertasProveedor([])
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {loadingOfertas ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando ofertas...</p>
                </div>
              ) : ofertasProveedor.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ofertas registradas</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este proveedor aún no tiene ofertas disponibles.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ofertasProveedor.map((oferta: any) => (
                    <div key={oferta.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          {(() => {
                            const isBlobUrl = oferta.imagenUrl?.startsWith('blob:');

                            if (oferta.imagenUrl && !isBlobUrl) {
                              return (
                                <img
                                  src={oferta.imagenUrl.startsWith('http')
                                    ? oferta.imagenUrl
                                    : `${process.env.NEXT_PUBLIC_API_URL}${oferta.imagenUrl}`}
                                  alt={oferta.material?.nombre || 'Material'}
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-xs text-gray-500">Sin imagen</span></div>';
                                    }
                                  }}
                                />
                              );
                            } else {
                              return (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-gray-500">Sin imagen</span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {oferta.material?.nombre || 'Material desconocido'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {oferta.material?.unidad || 'Sin unidad'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Precio:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(oferta.precio)}
                          </span>
                        </div>

                        {oferta.marca && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Marca:</span>
                            <span className="text-sm font-medium text-gray-900">{oferta.marca}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Calidad:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            oferta.tipoCalidad === 'PREMIUM' ? 'bg-yellow-100 text-yellow-800' :
                            oferta.tipoCalidad === 'INDUSTRIAL' ? 'bg-blue-100 text-blue-800' :
                            oferta.tipoCalidad === 'ARTESANAL' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {oferta.tipoCalidad}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Stock:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            oferta.stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {oferta.stock ? 'Disponible' : 'Sin stock'}
                          </span>
                        </div>

                        {oferta.comisionPorcentaje > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Comisión:</span>
                            <span className="text-sm font-medium text-blue-600">
                              {oferta.comisionPorcentaje}%
                            </span>
                          </div>
                        )}

                        {oferta.observaciones && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600">{oferta.observaciones}</p>
                          </div>
                        )}

                        <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
                          <p className="text-xs text-gray-500">
                            Actualizado: {oferta.updatedAt ? new Date(oferta.updatedAt).toLocaleDateString('es-PY') : 'Fecha no disponible'}
                          </p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditarOferta(oferta)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Editar oferta"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleEliminarOferta(oferta)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Eliminar oferta"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowOfertasModal(false)
                    setSelectedProveedor(null)
                    setOfertasProveedor([])
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar oferta */}
      {showAddOfertaModal && selectedProveedorForOferta && (
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
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Proveedor Seleccionado</h3>
                <div className="flex items-center">
                  <div className="font-semibold text-blue-900">{selectedProveedorForOferta.nombre}</div>
                  {selectedProveedorForOferta.ciudad && (
                    <div className="text-sm text-blue-700 ml-2">📍 {selectedProveedorForOferta.ciudad}</div>
                  )}
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material *
                  </label>
                  <select
                    value={addOfertaForm.materialId}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, materialId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar material</option>
                    {materiales.map((material: any) => (
                      <option key={material.id} value={material.id}>
                        {material.nombre} ({material.unidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (₲) *
                  </label>
                  <input
                    type="text"
                    value={addOfertaForm.precio}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = parseInt(value) || 0
                      setAddOfertaForm(prev => ({ ...prev, precio: numValue.toLocaleString('es-PY') }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={addOfertaForm.marca}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Marca del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Calidad
                  </label>
                  <select
                    value={addOfertaForm.tipoCalidad}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, tipoCalidad: e.target.value as 'COMUN' | 'PREMIUM' | 'INDUSTRIAL' | 'ARTESANAL' }))}
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
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={addOfertaForm.comisionPorcentaje}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, comisionPorcentaje: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de la Oferta
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
                              setAddOfertaForm(prev => ({ ...prev, imagenUrl: url }));
                            }
                          }}
                          className="hidden"
                          id="add-oferta-image-upload"
                        />
                        <label
                          htmlFor="add-oferta-image-upload"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                        >
                          📎 Seleccionar imagen...
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (galeria.length === 0) {
                            fetchGaleria();
                          }
                          setShowGallery(!showGallery);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
                      >
                        🖼️ Galería
                      </button>
                    </div>
                    {addOfertaForm.imagenUrl && (
                      <img src={addOfertaForm.imagenUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                    )}

                    {/* Galería de imágenes */}
                    {showGallery && (
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                        <h4 className="font-medium mb-3">Seleccionar de Galería</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {galeria.map((img: any) => (
                            <div
                              key={img.filename}
                              onClick={() => {
                                const fullUrl = img.url.startsWith('http')
                                  ? img.url
                                  : `${API_BASE_URL}${img.url}`;
                                setAddOfertaForm(prev => ({ ...prev, imagenUrl: fullUrl }));
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={addOfertaForm.observaciones}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="add-oferta-stock"
                    checked={addOfertaForm.stock}
                    onChange={(e) => setAddOfertaForm(prev => ({ ...prev, stock: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="add-oferta-stock" className="ml-2 block text-sm text-gray-900">
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
                    type="button"
                    onClick={async () => {
                      if (!addOfertaForm.materialId || !addOfertaForm.precio) {
                        toast.error('Por favor completa los campos requeridos')
                        return
                      }

                      setLoadingAddOferta(true)
                      try {
                        await api.post(`/admin/materiales/${addOfertaForm.materialId}/ofertas`, {
                          proveedorId: selectedProveedorForOferta.id,
                          precio: parseFloat(addOfertaForm.precio.replace(/\./g, '').replace(',', '.')),
                          marca: addOfertaForm.marca,
                          tipoCalidad: addOfertaForm.tipoCalidad,
                          comisionPorcentaje: parseFloat(addOfertaForm.comisionPorcentaje) || 0,
                          stock: addOfertaForm.stock,
                          observaciones: addOfertaForm.observaciones,
                          imagenUrl: addOfertaForm.imagenUrl
                        })

                        toast.success('Oferta agregada exitosamente')
                        setShowAddOfertaModal(false)

                        // Recargar ofertas del proveedor si el modal está abierto
                        if (selectedProveedor && selectedProveedor.id === selectedProveedorForOferta.id) {
                          const response = await api.get(`/proveedor/${selectedProveedor.id}/ofertas`)
                          setOfertasProveedor(response.data.data || [])
                        }

                        fetchProveedores()
                      } catch (error: any) {
                        console.error('Error adding oferta:', error)
                        toast.error(error.response?.data?.error || 'Error al agregar oferta')
                      } finally {
                        setLoadingAddOferta(false)
                      }
                    }}
                    disabled={loadingAddOferta}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {loadingAddOferta ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💰</span>
                        Agregar Oferta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar oferta */}
      {showEditOfertaModal && selectedOfertaForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Editar Oferta</h2>
                <button
                  onClick={() => setShowEditOfertaModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Oferta Seleccionada</h3>
                <div className="flex items-center">
                  <div className="font-semibold text-blue-900">{selectedOfertaForEdit.material?.nombre || 'Material'}</div>
                  <div className="text-sm text-blue-700 ml-2">- {formatPrice(selectedOfertaForEdit.precio)}</div>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (₲) *
                  </label>
                  <input
                    type="text"
                    value={editOfertaForm.precio}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = parseInt(value) || 0
                      setEditOfertaForm(prev => ({ ...prev, precio: numValue.toLocaleString('es-PY') }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={editOfertaForm.marca}
                    onChange={(e) => setEditOfertaForm(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Marca del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Calidad
                  </label>
                  <select
                    value={editOfertaForm.tipoCalidad}
                    onChange={(e) => setEditOfertaForm(prev => ({ ...prev, tipoCalidad: e.target.value as 'COMUN' | 'PREMIUM' | 'INDUSTRIAL' | 'ARTESANAL' }))}
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
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editOfertaForm.comisionPorcentaje}
                    onChange={(e) => setEditOfertaForm(prev => ({ ...prev, comisionPorcentaje: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen de la Oferta
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
                              setEditOfertaForm(prev => ({ ...prev, imagenUrl: url }));
                            }
                          }}
                          className="hidden"
                          id="edit-oferta-image-upload"
                        />
                        <label
                          htmlFor="edit-oferta-image-upload"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                        >
                          📎 Seleccionar imagen...
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (galeria.length === 0) {
                            fetchGaleria();
                          }
                          setShowGallery(!showGallery);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
                      >
                        🖼️ Galería
                      </button>
                    </div>
                    {editOfertaForm.imagenUrl && (
                      <img src={editOfertaForm.imagenUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                    )}

                    {/* Galería de imágenes */}
                    {showGallery && (
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                        <h4 className="font-medium mb-3">Seleccionar de Galería</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {galeria.map((img: any) => (
                            <div
                              key={img.filename}
                              onClick={() => {
                                const fullUrl = img.url.startsWith('http')
                                  ? img.url
                                  : `${API_BASE_URL}${img.url}`;
                                setEditOfertaForm(prev => ({ ...prev, imagenUrl: fullUrl }));
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={editOfertaForm.observaciones}
                    onChange={(e) => setEditOfertaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit-oferta-stock"
                    checked={editOfertaForm.stock}
                    onChange={(e) => setEditOfertaForm(prev => ({ ...prev, stock: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit-oferta-stock" className="ml-2 block text-sm text-gray-900">
                    Disponible en stock
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditOfertaModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editOfertaForm.precio) {
                        toast.error('Por favor ingresa un precio')
                        return
                      }

                      setLoadingEditOferta(true)
                      try {
                        // Subir imagen si hay un archivo seleccionado (blob URL)
                        let finalImageUrl = editOfertaForm.imagenUrl

                        if (selectedFile && editOfertaForm.imagenUrl?.startsWith('blob:')) {
                          const formData = new FormData()
                          formData.append('file', selectedFile)

                          const uploadResponse = await api.post('/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          })

                          if (uploadResponse.data.success) {
                            finalImageUrl = uploadResponse.data.data.url
                          } else {
                            throw new Error('Error al subir la imagen')
                          }
                        }

                        await api.put(`/admin/ofertas/${selectedOfertaForEdit.id}`, {
                          precio: parseFloat(editOfertaForm.precio.replace(/\./g, '').replace(',', '.')),
                          marca: editOfertaForm.marca,
                          tipoCalidad: editOfertaForm.tipoCalidad,
                          comisionPorcentaje: parseFloat(editOfertaForm.comisionPorcentaje) || 0,
                          stock: editOfertaForm.stock,
                          observaciones: editOfertaForm.observaciones,
                          imagenUrl: finalImageUrl
                        })

                        toast.success('Oferta actualizada exitosamente')
                        setShowEditOfertaModal(false)
                        setSelectedFile(null) // Limpiar archivo seleccionado

                        // Recargar ofertas si el modal está abierto
                        if (selectedProveedor) {
                          const response = await api.get(`/proveedor/${selectedProveedor.id}/ofertas`)
                          setOfertasProveedor(response.data.data || [])
                        }
                      } catch (error: any) {
                        console.error('Error updating oferta:', error)
                        toast.error(error.response?.data?.error || 'Error al actualizar oferta')
                      } finally {
                        setLoadingEditOferta(false)
                      }
                    }}
                    disabled={loadingEditOferta}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {loadingEditOferta ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💾</span>
                        Actualizar Oferta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar oferta con DaisyUI */}
      {showDeleteModal && ofertaToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">⚠️ Confirmar Eliminación</h3>
            <p className="py-4">
              ¿Estás seguro de que quieres eliminar la oferta de <strong>{ofertaToDelete.material?.nombre || 'este material'}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false)
                  setOfertaToDelete(null)
                }}
                disabled={loadingDelete}
              >
                Cancelar
              </button>
              <button
                className="btn btn-error"
                onClick={confirmDeleteOferta}
                disabled={loadingDelete}
              >
                {loadingDelete ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
