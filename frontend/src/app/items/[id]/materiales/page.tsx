'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react'
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
  precioUnitario: number
}

export default function MaterialesItemPage() {
  const params = useParams()
  const itemId = params.id as string
  
  const [item, setItem] = useState<Item | null>(null)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    materialId: string
    materialNombre: string
  }>({ isOpen: false, materialId: '; materialNombre: '' })
  const [editingMaterial, setEditingMaterial] = useState<{
    id: string
    cantidadPorUnidad: number
    observaciones: string
  } | null>(null)

  useEffect(() => {
    fetchItem()
    fetchMateriales()
  }, [itemId])

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${itemId}`)
      setItem(response.data.data)
    } catch (error) {
      console.error('Error fetching item:; error)
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
      console.error('Error fetching materiales:; error)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial || !cantidad) return

    try {
      await api.post(`/items/${itemId}/materiales`, {
        materialId: selectedMaterial,
        cantidadPorUnidad: Number(cantidad),
        observaciones: observaciones || undefined
      })
      
      toast.success('Material agregado exitosamente')
      setShowAddForm(false)
      setSelectedMaterial('')
      setCantidad('')
      setObservaciones('')
      fetchItem() // Recargar item
    } catch (error: any) {
      console.error('Error adding material:; error)
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
      console.error('Error removing material:; error)
      const errorMessage = error.response?.data?.error || 'Error al remover material'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, materialId: '; materialNombre: '' })
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
      console.error('Error updating material:; error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar material'
      toast.error(errorMessage)
    }
  }



  const getUnidadLabel = (unidad: string) => {
    const labels: { [key: string]: string } = {
      'M2': 'm²; 'M3': 'm³; 'ML': 'ml; 'KG': 'kg',
      'BOLSA': 'bolsa; 'UNIDAD': 'unidad; 'LOTE': 'lote; 'GLOBAL': 'global'
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
                href="/items"
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Material
            </button>
          </div>

          {/* Add Material Form */}
          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Material</h3>
              <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar material</option>
                    {materiales
                      .filter(m => !item?.materialesPorItem.some(mpi => mpi.material.id === m.id))
                      .map(material => (
                        <option key={material.id} value={material.id}>
                          {material.nombre} ({getUnidadLabel(material.unidad)})
                        </option>
                      ))}
                  </select>
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
                    {item?.materialesPorItem.map((materialItem) => (
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
