'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search, Edit, Trash2, Package, Calculator } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatPrice } from '@/lib/formatters'

interface Item {
  id: string
  nombre: string
  descripcion?: string
  unidadMedida: string
  manoObraUnitaria?: number
  notasGenerales?: string
  esActivo: boolean
  _count?: {
    materialesPorItem: number
  }
  createdAt: string
}

export default function ItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    itemId: string
    itemNombre: string
  }>({ isOpen: false, itemId: '', itemNombre: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
      return
    }
    fetchItems()
  }, [router])

  const fetchItems = async () => {
    try {
      const response = await api.get('/items')
      setItems(response.data.data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Error al cargar los items')
      // Mock data como fallback
      setItems([
        {
          id: '1',
          nombre: 'Pared de Ladrillo 0.15m',
          descripcion: 'Construcción de pared de ladrillo común de 15cm',
          unidadMedida: 'M2',
          manoObraUnitaria: 25000,
          esActivo: true,
          _count: { materialesPorItem: 4 },
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClick = (itemId: string, itemNombre: string) => {
    setDeleteDialog({
      isOpen: true,
      itemId,
      itemNombre
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/items/${deleteDialog.itemId}`)
      toast.success('Item eliminado exitosamente')
      fetchItems()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar el item'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, itemId: '', itemNombre: '' })
  }

  const formatPriceOrDefault = (price?: number) => {
    if (!price) return 'No definido'
    return formatPrice(price)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Items de Construcción</h2>
            {user?.rol !== 'CLIENTE' && (
              <Link
                href="/items/nuevo"
                className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Item
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No se encontraron items</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <li key={item.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.nombre}
                          </h3>
                          {user?.rol !== 'CLIENTE' && (
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/items/${item.id}/materiales`}
                                className="text-purple-600 hover:text-purple-800"
                                title="Gestionar materiales"
                              >
                                <Package className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/items/${item.id}/calcular`}
                                className="text-green-600 hover:text-green-800"
                                title="Calcular costo"
                              >
                                <Calculator className="h-4 w-4" />
                              </Link>
                              <Link href={`/items/editar/${item.id}`} className="text-blue-600 hover:text-blue-800">
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(item.id, item.nombre)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {item.descripcion && (
                          <p className="text-sm text-gray-600 mb-2">{item.descripcion}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Unidad:</span> {getUnidadLabel(item.unidadMedida)}
                          </div>
                          <div>
                            <span className="font-medium">Mano de Obra:</span> {formatPriceOrDefault(item.manoObraUnitaria)}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            <span>{item._count?.materialesPorItem || 0} materiales</span>
                          </div>
                          <div>
                            <span className="font-medium">Estado:</span> 
                            <span className="ml-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Activo
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Item"
        message={`¿Estás seguro de que quieres eliminar "${deleteDialog.itemNombre}"? Esta acción también eliminará todas las relaciones con materiales y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}
