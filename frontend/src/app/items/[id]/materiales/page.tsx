'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link' 
import { ArrowLeft, Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatPrice } from '@/lib/formatters'

interface Item {
  id: string
  nombre: string
  unidadMedida: string
  materialesPorItem: MaterialPorItem[]
}

interface MaterialPorItem {
  id: string
  cantidadPorUnidad: number
  observaciones?: string
  material: {
    id: string
    nombre: string
    unidad: string
    precioUnitario: number
  }
}

interface Material {
  id: string
  nombre: string
  unidad: string
  precioBase?: number
  ofertas?: Array<{
    precio: number
    proveedor: {
      nombre: string
    }
  }>
}

export default function MaterialesItemPage() {
  const params = useParams()
  const itemId = params.id as string
  
  const [item, setItem] = useState<Item | null>(null)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    materialId: string
    materialNombre: string
  }>({ isOpen: false, materialId: '', materialNombre: '' })
  const [editingMaterial, setEditingMaterial] = useState<{
    id: string
    cantidadPorUnidad: number
    observaciones: string
  } | null>(null)

  // Estados para búsqueda y paginación
  const [materialSearchTerm, setMaterialSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Detectar si viene desde proyecto
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const fromProyecto = searchParams.get('from') === 'proyecto'
  const proyectoId = searchParams.get('proyectoId')

  useEffect(() => {
    fetchItem()
    fetchMateriales()
  }, [itemId])

  // Efecto para resetear página cuando se busca
  useEffect(() => {
    setCurrentPage(1)
  }, [materialSearchTerm])

  // Filtrar materiales del item
  const filteredMaterialesPorItem = item?.materialesPorItem.filter(materialItem =>
    materialItem.material.nombre.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
    materialItem.observaciones?.toLowerCase().includes(materialSearchTerm.toLowerCase())
  ) || []

  // Paginación
  const totalPages = Math.ceil(filteredMaterialesPorItem.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMaterialesPorItem = filteredMaterialesPorItem.slice(startIndex, endIndex)

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${itemId}`)
      setItem(response.data.data)
    } catch (error) {
      console.error('Error fetching item:', error)
      toast.error('Error al cargar el item')
    } finally {
      setLoading(false)
    }
  }

  const fetchMateriales = async () => {
    try {
      const response = await api.get('/materiales')
      setMateriales(response.data.data || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial || !cantidad) return

    try {
      await api.post(`/items/${itemId}/materiales`, {
        materialId: selectedMaterial.id,
        cantidadPorUnidad: Number(cantidad),
        observaciones: observaciones || undefined
      })

      toast.success('Material agregado exitosamente')
      setShowAddForm(false)
      setSelectedMaterial(null)
      setSearchTerm('')
      setCantidad('')
      setObservaciones('')
      fetchItem() // Recargar item
    } catch (error: any) {
      console.error('Error adding material:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar material'
      toast.error(errorMessage)
    }
  }

  const handleDeleteClick = (materialId: string, materialNombre: string) => {
    setDeleteDialog({
      isOpen: true,
      materialId,
      materialNombre
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/items/${itemId}/materiales/${deleteDialog.materialId}`)
      toast.success('Material removido exitosamente')
      fetchItem()
    } catch (error: any) {
      console.error('Error removing material:', error)
      const errorMessage = error.response?.data?.error || 'Error al remover material'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, materialId: '', materialNombre: '' })
  }

  const handleEditClick = (materialItem: MaterialPorItem) => {
    setEditingMaterial({
      id: materialItem.material.id,
      cantidadPorUnidad: materialItem.cantidadPorUnidad,
      observaciones: materialItem.observaciones || ''
    })
  }

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial) return

    try {
      await api.put(`/items/${itemId}/materiales/${editingMaterial.id}`, {
        cantidadPorUnidad: editingMaterial.cantidadPorUnidad,
        observaciones: editingMaterial.observaciones || undefined
      })
      
      toast.success('Material actualizado exitosamente')
      setEditingMaterial(null)
      fetchItem()
    } catch (error: any) {
      console.error('Error updating material:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar material'
      toast.error(errorMessage)
    }
  }



  const getUnidadLabel = (unidad: string) => {
    const labels: { [key: string]: string } = {
      'M2': 'm²',
      'M3': 'm³',
      'ML': 'ml',
      'KG': 'kg',
      'BOLSA': 'bolsa',
      'UNIDAD': 'unidad',
      'LOTE': 'lote',
      'GLOBAL': 'global'
    }
    return labels[unidad] || unidad
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href={fromProyecto && proyectoId ? `/proyectos/${proyectoId}` : "/items"}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Materiales del Item</h2>
                <p className="text-gray-600">{item?.nombre}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#38603B] text-white px-3 py-1 rounded text-sm transition-colors flex items-center hover:bg-[#2d4a2f] sm:px-4 sm:py-2 lg:px-4 lg:py-2"
              title="Agregar Material"
            >
              <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline ml-2">Agregar Material</span>
            </button>
          </div>

          {/* Add Material Form */}
          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Material</h3>
              <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar material..."
                      required
                    />
                    {selectedMaterial && (
                      <div className="absolute right-2 top-2 text-sm text-gray-600">
                        ✓
                      </div>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {materiales
                        .filter(m =>
                          !item?.materialesPorItem.some(mpi => mpi.material.id === m.id) &&
                          m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map(material => (
                          <div
                            key={material.id}
                            onClick={() => {
                              setSelectedMaterial(material)
                              setSearchTerm(material.nombre)
                              setShowDropdown(false)
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {material.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getUnidadLabel(material.unidad)}
                                  {material.precioBase && (
                                    <span className="ml-2 text-blue-600">
                                      • ₲ {Number(material.precioBase).toLocaleString('es-PY')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {material.precioBase && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  📊 Base
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      {materiales.filter(m =>
                        !item?.materialesPorItem.some(mpi => mpi.material.id === m.id) &&
                        m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No se encontraron materiales
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad por {item && getUnidadLabel(item.unidadMedida)}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Opcional"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          {item?.materialesPorItem && item.materialesPorItem.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar materiales en este item..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={materialSearchTerm}
                  onChange={(e) => setMaterialSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Materials List */}
          <div className="bg-white shadow rounded-lg">
            {!item?.materialesPorItem.length ? (
              <div className="p-6 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay materiales asociados a este item</p>
                <p className="text-sm text-gray-400 mt-2">
                  Agrega materiales para crear la matriz de costos
                </p>
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
                        Cantidad por {item && getUnidadLabel(item.unidadMedida)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo por {item && getUnidadLabel(item.unidadMedida)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observaciones
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentMaterialesPorItem.map((materialItem) => (
                      <tr key={materialItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {materialItem.material.nombre}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getUnidadLabel(materialItem.material.unidad)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMaterial?.id === materialItem.material.id ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editingMaterial.cantidadPorUnidad}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                cantidadPorUnidad: Number(e.target.value)
                              })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            materialItem.cantidadPorUnidad
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(materialItem.material.precioUnitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(materialItem.material.precioUnitario * materialItem.cantidadPorUnidad)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingMaterial?.id === materialItem.material.id ? (
                            <input
                              type="text"
                              value={editingMaterial.observaciones}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                observaciones: e.target.value
                              })}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Observaciones"
                            />
                          ) : (
                            materialItem.observaciones || '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {editingMaterial?.id === materialItem.material.id ? (
                              <>
                                <button 
                                  onClick={handleUpdateMaterial}
                                  className="text-green-600 hover:text-green-800 mr-2"
                                  title="Guardar"
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => setEditingMaterial(null)}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleEditClick(materialItem)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteClick(materialItem.material.id, materialItem.material.nombre)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación - Footer de la tabla */}
            {filteredMaterialesPorItem.length > itemsPerPage && (
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
                        <span className="font-medium">{Math.min(endIndex, filteredMaterialesPorItem.length)}</span>
                        {' '}de{' '}
                        <span className="font-medium">{filteredMaterialesPorItem.length}</span>
                        {' '}resultados
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
                          <ChevronLeft className="h-5 w-5" />
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
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Remover Material"
        message={`¿Estás seguro de que quieres remover "${deleteDialog.materialNombre}" de este item?`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}
