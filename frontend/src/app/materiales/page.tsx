'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatPrice } from '@/lib/formatters'

interface Material {
  id: string
  nombre: string
  descripcion?: string
  unidad: string
  imagenUrl?: string
  categoria?: {
    nombre: string
  }
  precioBase?: number
  ofertas?: Array<{
    id: string
    precio: number
    tipoCalidad: string
    marca?: string
    stock: boolean
    proveedor: {
      nombre: string
      logo?: string
      ciudad?: string
      departamento?: string
      latitud?: number
      longitud?: number
      distancia?: number
      distanciaFormateada?: string
    }
  }>
  precioPersonalizado?: number
  usuarioId?: string
}

export default function MaterialesPage() {
  const router = useRouter()
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [user, setUser] = useState<any>(null)
  const itemsPerPage = 10
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    materialId: string
    materialNombre: string
  }>({ isOpen: false, materialId: '', materialNombre: '' })
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [priceUpdateMaterial, setPriceUpdateMaterial] = useState<Material | null>(null)
  const [newPrice, setNewPrice] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
      return
    }
    fetchMateriales()
  }, [router])

  const fetchMateriales = async () => {
    try {
      const response = await api.get('/materiales')
      setMateriales(response.data.data || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
      toast.error('Error al cargar los materiales')
    } finally {
      setLoading(false)
    }
  }

  const filteredMateriales = materiales.filter(material =>
    material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMateriales = filteredMateriales.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])



  const handleDeleteClick = (materialId: string, materialNombre: string) => {
    setDeleteDialog({
      isOpen: true,
      materialId,
      materialNombre
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      // Encontrar el material para determinar su propiedad
      const materialToDelete = materiales.find(m => m.id === deleteDialog.materialId)

      if (!materialToDelete) {
        toast.error('Material no encontrado')
        return
      }

      // Determinar el endpoint correcto basado en la propiedad del material
      // Si usuarioId es null = material del catálogo (admin)
      // Si usuarioId tiene valor = material de proveedor
      const endpoint = materialToDelete.usuarioId === null
        ? `/admin/materiales/${deleteDialog.materialId}`
        : `/proveedor/materiales/${deleteDialog.materialId}`

      console.log('Material usuarioId:', materialToDelete.usuarioId)
      console.log('Using endpoint:', endpoint)

      await api.delete(endpoint)
      toast.success('Material eliminado exitosamente')
      fetchMateriales() // Recargar la lista
    } catch (error: any) {
      console.error('Error deleting material:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar el material'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, materialId: '', materialNombre: '' })
  }

  const handleShowDetail = (material: Material) => {
    setSelectedMaterial(material)
  }

  const handlePriceUpdateClick = (material: Material) => {
    setPriceUpdateMaterial(material)
    setNewPrice(material.precioPersonalizado?.toString() || material.ofertas?.[0]?.precio?.toString() || '')
  }

  const handlePriceUpdateConfirm = async () => {
    if (!priceUpdateMaterial || !newPrice) return

    try {
      await api.put(`/materiales/${priceUpdateMaterial.id}`, {
        precioPersonalizado: parseFloat(newPrice)
      })
      toast.success('Precio actualizado exitosamente')
      fetchMateriales()
      setPriceUpdateMaterial(null)
      setNewPrice('')
    } catch (error: any) {
      console.error('Error updating price:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar el precio'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Materiales</h2>
            {user?.rol !== 'CLIENTE' && (
              <Link
                href="/materiales/nuevo"
                className="bg-[#38603B] text-white px-3 py-1 rounded text-sm transition-colors flex items-center hover:bg-[#2d4a2f] sm:px-4 sm:py-2 lg:px-4 lg:py-2"
                title="Nuevo Material"
              >
                <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline ml-2">Nuevo Material</span>
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar materiales..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Materials Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando materiales...</p>
              </div>
            ) : filteredMateriales.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No se encontraron materiales</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      {user?.rol !== 'CLIENTE' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMateriales.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center mr-3 cursor-pointer"
                                 onClick={() => handleShowDetail(material)}>
                              {material.imagenUrl ? (
                                <img
                                  src={material.imagenUrl}
                                  alt={material.nombre}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-400 text-xs">Sin imagen</span>'
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">Sin imagen</span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                   onClick={() => handleShowDetail(material)}>
                                {material.nombre}
                              </div>
                              {material.ofertas && material.ofertas.length > 0 && (
                                <div className="text-xs text-gray-500">
                                  {material.ofertas.length} {material.ofertas.length === 1 ? 'proveedor' : 'proveedores'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.categoria?.nombre || 'Sin categoría'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.unidad}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {material.ofertas && material.ofertas.length > 0 ? (
                            <div className="text-sm font-medium text-green-600">
                              Desde {formatPrice(material.ofertas[0].precio)}
                            </div>
                          ) : material.precioPersonalizado ? (
                            <div className="text-sm font-medium text-blue-600">
                              {formatPrice(material.precioPersonalizado)}
                              <span className="text-xs text-gray-500 ml-1">(Personalizado)</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Sin precio</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            material.usuarioId === null
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {material.usuarioId === null ? 'Catálogo' : 'Proveedor'}
                          </span>
                        </td>
                        {user?.rol !== 'CLIENTE' && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/materiales/editar/${material.id}`}
                                className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-sm"
                                title="Editar"
                              >
                                ✏️
                              </Link>
                              <button
                                onClick={() => handlePriceUpdateClick(material)}
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-sm"
                                title="Actualizar precio"
                              >
                                💰
                              </button>
                              <button
                                onClick={() => handleDeleteClick(material.id, material.nombre)}
                                className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-sm"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Paginación - Footer de la tabla */}
            {filteredMateriales.length > itemsPerPage && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                              onClick={() => setCurrentPage(page)}
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
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
        </div>
      </main>

      {/* Material Detail Modal */}
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
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">{selectedMaterial.descripcion || 'Sin descripción'}</p>
                <div className="text-sm text-gray-500 mb-4">
                  <span className="font-medium">Unidad:</span> {selectedMaterial.unidad}
                </div>
              </div>

              {selectedMaterial.ofertas && selectedMaterial.ofertas.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold mb-3">Ofertas Disponibles</h3>
                  <div className="space-y-3">
                    {selectedMaterial.ofertas.map((oferta) => (
                      <div key={oferta.id} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{oferta.proveedor.nombre}</div>
                            {oferta.marca && <div className="text-sm text-gray-500">{oferta.marca}</div>}
                            <div className="text-xs text-gray-400 mt-1">{oferta.tipoCalidad}</div>
                            {oferta.proveedor.ciudad && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {oferta.proveedor.ciudad}
                                {oferta.proveedor.departamento && `, ${oferta.proveedor.departamento}`}
                              </div>
                            )}
                            {oferta.proveedor.distanciaFormateada && (
                              <div className="text-xs text-blue-600 font-medium mt-1">
                                📏 {oferta.proveedor.distanciaFormateada} de distancia
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-green-600">{formatPrice(oferta.precio)}</div>
                            <div className="text-xs text-gray-500">
                              {oferta.stock ? '✅ En stock' : '❌ Sin stock'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedMaterial.precioPersonalizado ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Material Personalizado</div>
                  <div className="text-2xl font-bold text-blue-600">{formatPrice(selectedMaterial.precioPersonalizado)}</div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No hay ofertas disponibles para este material</div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
                {user?.rol !== 'CLIENTE' && (
                  <Link
                    href={`/materiales/editar/${selectedMaterial.id}`}
                    className="px-4 py-2 bg-[#38603B] text-white rounded hover:bg-[#2d4a2f] transition-colors"
                  >
                    Editar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Material"
        message={`¿Estás seguro de que quieres eliminar "${deleteDialog.materialNombre}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Price Update Modal */}
      {priceUpdateMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Actualizar Precio</h2>
                <button
                  onClick={() => setPriceUpdateMaterial(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-600 mb-2">Material: <strong>{priceUpdateMaterial.nombre}</strong></p>
                <div className="text-sm text-gray-500 mb-4">
                  Unidad: {priceUpdateMaterial.unidad}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Precio Personalizado (₲)
                </label>
                <input
                  type="number"
                  step="1"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el nuevo precio"
                  min="0"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setPriceUpdateMaterial(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePriceUpdateConfirm}
                  className="px-4 py-2 bg-[#38603B] text-white rounded hover:bg-[#2d4a2f] transition-colors"
                  disabled={!newPrice || parseFloat(newPrice) <= 0}
                >
                  Actualizar Precio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
