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
  ofertas?: Array<{
    id: string
    precio: number
    tipoCalidad: string
    marca?: string
    stock: boolean
    proveedor: {
      nombre: string
      logo?: string
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
  }>({ isOpen: false, materialId: '; materialNombre: '' })
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
      console.error('Error fetching materiales:; error)
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
      await api.delete(`/materiales/${deleteDialog.materialId}`)
      toast.success('Material eliminado exitosamente')
      fetchMateriales() // Recargar la lista
    } catch (error: any) {
      console.error('Error deleting material:; error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar el material'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, materialId: '; materialNombre: '' })
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
      console.error('Error updating price:; error)
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
                className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Material
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
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
              <ul className="divide-y divide-gray-200">
                {paginatedMateriales.map((material) => (
                  <li key={material.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center">
                        {material.imagenUrl ? (
                          <img 
                            src={material.imagenUrl} 
                            alt={material.nombre}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-400 text-xs">Sin imagen</span>'
                            }}
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer mb-2"
                          onClick={() => handleShowDetail(material)}
                        >
                          {material.nombre}
                        </h3>
                        <div className="space-y-2">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Unidad:</span> {material.unidad}
                          </div>
                          {material.ofertas && material.ofertas.length > 0 ? (
                            <>
                              <div className="text-lg font-bold text-green-600">
                                Desde {formatPrice(material.ofertas[0].precio)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {material.ofertas.length} {material.ofertas.length === 1 ? 'proveedor' : 'proveedores'} disponibles
                              </div>
                            </>
                          ) : material.precioPersonalizado ? (
                            <div className="text-lg font-bold text-blue-600">
                              {formatPrice(material.precioPersonalizado)}
                              <span className="text-xs text-gray-500 ml-2">(Personalizado)</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Sin ofertas disponibles</div>
                          )}
                        </div>
                      </div>
                      {user?.rol !== 'CLIENTE' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePriceUpdateClick(material)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Actualizar precio"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(material.id, material.nombre)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {filteredMateriales.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredMateriales.length)} de {filteredMateriales.length} materiales
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
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
                          <div>
                            <div className="font-semibold text-gray-900">{oferta.proveedor.nombre}</div>
                            {oferta.marca && <div className="text-sm text-gray-500">{oferta.marca}</div>}
                            <div className="text-xs text-gray-400 mt-1">{oferta.tipoCalidad}</div>
                          </div>
                          <div className="text-right">
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
