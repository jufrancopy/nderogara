'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Package, Eye } from 'lucide-react'
import api from '@/lib/api'
import { formatPrice } from '@/lib/formatters'

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
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [showOfertasModal, setShowOfertasModal] = useState(false)
  const [ofertasProveedor, setOfertasProveedor] = useState<any[]>([])
  const [loadingOfertas, setLoadingOfertas] = useState(false)

  useEffect(() => {
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      const response = await api.get('/proveedores')
      setProveedores(response.data.data?.filter((p: any) => p && p.nombre) || [])
    } catch (error) {
      console.error('Error fetching proveedores:', error)
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

  const filteredProveedores = proveedores.filter(proveedor =>
    (proveedor.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          {/* Search Bar */}
          <div className="mb-6">
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVerOfertas(proveedor)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
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
                          Registrado: {new Date(proveedor.createdAt).toLocaleDateString('es-PY')}
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

                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Actualizado: {new Date(oferta.updatedAt).toLocaleDateString('es-PY')}
                          </p>
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
    </div>
  )
}
