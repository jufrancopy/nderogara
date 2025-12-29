'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, ArrowLeft, Edit, Calendar, MapPin, User,
  Phone, Mail, DollarSign, Ruler, FileText, Package,
  Calculator, Plus, GripVertical
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { API_BASE_URL } from '@/lib/api'
import { formatPrice } from '@/lib/formatters'
import jsPDF from 'jspdf'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Proyecto {
  id: string
  nombre: string
  descripcion?: string
  superficieTotal?: number
  direccion?: string
  fechaInicio?: string
  fechaFinEstimada?: string
  estado: string
  margenGanancia?: number
  moneda: string
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
  encargadoNombre?: string
  encargadoTelefono?: string
  imagenUrl?: string
  usuario?: {
    name: string
    email: string
    telefono?: string
  }
  presupuestoItems?: PresupuestoItem[]
  cotizaciones?: Cotizacion[]
  createdAt: string
  updatedAt: string
}

interface PresupuestoItem {
  id: string
  cantidadMedida: number
  costoMateriales: number
  costoManoObra: number
  costoTotal: number
  esDinamico?: boolean
  item: {
    id: string
    nombre: string
    unidadMedida: string
  }
}

interface Cotizacion {
  id: string
  version: number
  nombre: string
  costoTotal: number
  esActiva: boolean
  createdAt: string
}

interface Financiacion {
  id: string
  monto: number
  fecha: string
  fuente: string
  descripcion?: string
}

interface Item {
  id: string
  nombre: string
  unidadMedida: string
  manoObraUnitaria?: number
}

const estadoColors = {
  PLANIFICACION: 'bg-gray-100 text-gray-800',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  PAUSADO: 'bg-yellow-100 text-yellow-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800'
}

const estadoLabels = {
  PLANIFICACION: 'Planificación',
  EN_PROGRESO: 'En Progreso',
  PAUSADO: 'Pausado',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado'
}

interface SortableItemProps {
  item: PresupuestoItem
  index: number
  expandedItem: string | null
  toggleItemExpansion: (itemId: string) => void
  handleRemoveItem: (itemId: string) => void
  setPagoModal: React.Dispatch<React.SetStateAction<{
    isOpen: boolean
    presupuestoItem?: any
    pagos?: any[]
  }>>
  materialesPorItem: Record<string, any[]>
  getUnidadLabel: (unidad: string) => string
  formatPrice: (price: number) => string
  API_BASE_URL: string
  proyectoId: string
  onItemUpdate: () => void
  calcularCostoTotalItem: (item: PresupuestoItem, materialesPorItem: Record<string, any[]>) => number
}

// Función para calcular el costo total de un item incluyendo materiales asociados
const calcularCostoTotalItem = (item: PresupuestoItem, materialesPorItem: Record<string, any[]>) => {
  // Costo base del item
  let costoTotal = Number(item.costoTotal)

  // Agregar costos de materiales asociados
  const materialesItem = materialesPorItem[item.item.id] || []
  const costoMaterialesAsociados = materialesItem.reduce((sum: number, materialItem: any) => {
    // Prioridad: precio específico de la oferta seleccionada → precio base del material
    const precioUnitario = Number(materialItem.precioUnitario || materialItem.material?.precioUnitario || 0)
    const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad || 0)

    // Costo = precio_unitario * cantidad_por_unidad (sin multiplicar por cantidad del item)
    return sum + (precioUnitario * cantidadPorUnidad)
  }, 0)

  return costoTotal + costoMaterialesAsociados
}

function SortableItem({
  item,
  index,
  expandedItem,
  toggleItemExpansion,
  handleRemoveItem,
  setPagoModal,
  materialesPorItem,
  getUnidadLabel,
  formatPrice,
  API_BASE_URL,
  proyectoId,
  onItemUpdate,
  calcularCostoTotalItem
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Header del acordeón */}
      <div
        className="px-4 sm:px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => toggleItemExpansion(item.id)}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              {/* Drag Handle - Solo desktop */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded hidden sm:block"
                title="Arrastrar para reordenar"
              >
                <GripVertical className="h-4 w-4 text-gray-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 flex items-center flex-wrap">
                    <span className="truncate">{item.item.nombre}</span>
                    {item.esDinamico && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                        Dinámico
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {item.cantidadMedida} {getUnidadLabel(item.item.unidadMedida)}
                  </p>
                </div>
              </div>

              {/* Precio - Desktop */}
              <div className="hidden sm:block text-right ml-2 flex-shrink-0">
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(calcularCostoTotalItem(item, materialesPorItem))}
                </p>
                <div className="text-sm text-gray-500">
                  {item.esDinamico ? (
                    'Pagos incrementales'
                  ) : (
                    <div className="space-y-1">
                      <div>Mano de obra: {formatPrice(Number(item.costoTotal))}</div>
                      <div>Materiales: {formatPrice(calcularCostoTotalItem(item, materialesPorItem) - Number(item.costoTotal))}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Flecha expandir/colapsar */}
              <span className="text-gray-400 text-lg ml-2 flex-shrink-0">
                {expandedItem === item.id ? '▼' : '▶'}
              </span>
            </div>
          </div>

          {/* Precio - Mobile */}
          <div className="flex sm:hidden justify-between items-center">
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(calcularCostoTotalItem(item, materialesPorItem))}
            </div>
            <div className="text-xs text-gray-500">
              {item.esDinamico ? 'Pagos incrementales' : 'Costo fijo'}
            </div>
          </div>

          {/* Botones - Desktop */}
          <div className="hidden sm:flex items-center gap-3 justify-end">
            {item.esDinamico && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const response = await api.get(`/proyectos/${proyectoId}/presupuesto/${item.id}/pagos`)
                    const pagos = response.data.data || []
                    let costoActual = item.costoTotal
                    if (item.esDinamico) {
                      const totalPagosAprobados = pagos
                        .filter((p: any) => p.estado === 'APROBADO')
                        .reduce((sum: number, p: any) => sum + Number(p.montoPagado), 0)
                      costoActual = totalPagosAprobados
                    }
                    const itemActualizado = { ...item, costoTotal: costoActual }
                    setPagoModal({ isOpen: true, presupuestoItem: itemActualizado, pagos })
                  } catch (error) {
                    console.error('Error loading pagos:', error)
                    setPagoModal({ isOpen: true, presupuestoItem: item, pagos: [] })
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors font-medium"
                title="Gestionar pagos"
              >
                💰 Pagar
              </button>
            )}

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.esDinamico || false}
                onChange={async (e) => {
                  e.stopPropagation()
                  try {
                    await api.put(`/proyectos/${proyectoId}/presupuesto/${item.id}`, {
                      cantidadMedida: item.cantidadMedida,
                      esDinamico: e.target.checked
                    })
                    toast.success(`Item ${e.target.checked ? 'configurado como' : 'configurado como'} costo ${e.target.checked ? 'dinámico' : 'fijo'}`)
                    onItemUpdate()
                  } catch (error) {
                    console.error('Error updating item:', error)
                    toast.error('Error al actualizar el item')
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600 font-medium">Dinámico</span>
            </label>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveItem(item.item.id)
              }}
              className="border border-red-300 text-red-600 hover:bg-red-50 transition-colors p-2 rounded font-medium"
              title="Eliminar item"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Botones - Mobile */}
          <div className="flex sm:hidden items-center justify-between">
            <div className="flex items-center gap-3">
              {item.esDinamico && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      const response = await api.get(`/proyectos/${proyectoId}/presupuesto/${item.id}/pagos`)
                      const pagos = response.data.data || []
                      let costoActual = item.costoTotal
                      if (item.esDinamico) {
                        const totalPagosAprobados = pagos
                          .filter((p: any) => p.estado === 'APROBADO')
                          .reduce((sum: number, p: any) => sum + Number(p.montoPagado), 0)
                        costoActual = totalPagosAprobados
                      }
                      const itemActualizado = { ...item, costoTotal: costoActual }
                      setPagoModal({ isOpen: true, presupuestoItem: itemActualizado, pagos })
                    } catch (error) {
                      console.error('Error loading pagos:', error)
                      setPagoModal({ isOpen: true, presupuestoItem: item, pagos: [] })
                    }
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors font-medium"
                  title="Gestionar pagos"
                >
                  💰 Pagar
                </button>
              )}

              <label className="flex items-center cursor-pointer" title="Marcar como dinámico">
                <input
                  type="checkbox"
                  checked={item.esDinamico || false}
                  onChange={async (e) => {
                    e.stopPropagation()
                    try {
                      await api.put(`/proyectos/${proyectoId}/presupuesto/${item.id}`, {
                        cantidadMedida: item.cantidadMedida,
                        esDinamico: e.target.checked
                      })
                      toast.success(`Item ${e.target.checked ? 'configurado como' : 'configurado como'} costo ${e.target.checked ? 'dinámico' : 'fijo'}`)
                      onItemUpdate()
                    } catch (error) {
                      console.error('Error updating item:', error)
                      toast.error('Error al actualizar el item')
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-600 font-medium">Dinámico</span>
              </label>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveItem(item.item.id)
              }}
              className="border border-red-300 text-red-600 hover:bg-red-50 transition-colors p-2 rounded font-medium"
              title="Eliminar item"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido expandible - Materiales */}
      {expandedItem === item.id && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">Materiales utilizados:</h5>
            <Link
              href={`/items/${item.item.id}/materiales?from=proyecto&proyectoId=${proyectoId}`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <Package className="h-4 w-4 mr-1" />
              Gestionar Materiales
            </Link>
          </div>
          {materialesPorItem[item.item.id]?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materialesPorItem[item.item.id].map((materialItem: any) => (
                <div key={materialItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    {materialItem.material.imagenUrl && (
                      <img
                        src={materialItem.material.imagenUrl}
                        alt={materialItem.material.nombre}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {materialItem.material.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {materialItem.cantidadPorUnidad} {getUnidadLabel(materialItem.material.unidad)} por {getUnidadLabel(item.item.unidadMedida)}
                      </p>
                      {materialItem.material.marca && (
                        <p className="text-xs text-blue-600 font-medium">
                          {materialItem.material.marca}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(Number(materialItem.precioUnitario || materialItem.material?.precioUnitario || 0))}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {formatPrice(Number(materialItem.precioUnitario || materialItem.material?.precioUnitario || 0) * Number(materialItem.cantidadPorUnidad) * Number(item.cantidadMedida))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 italic mb-3">No hay materiales asociados a este item</p>
              <p className="text-xs text-gray-400 mb-3">
                Agrega materiales del catálogo con precio base para estimaciones iniciales
              </p>
              <Link
                href={`/items/${item.item.id}/materiales`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Materiales
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente para mostrar el historial de pagos de un item
function PagoHistorialItem({
  presupuestoItemId,
  proyectoId,
  pagosIniciales,
  setModalComprobante
}: {
  presupuestoItemId: string
  proyectoId: string
  pagosIniciales?: any[]
  setModalComprobante: (url: string | null) => void
}) {
  const [pagos, setPagos] = useState<any[]>(pagosIniciales || [])
  const [loading, setLoading] = useState(!pagosIniciales)

  useEffect(() => {
    // Si ya tenemos pagos iniciales, no cargar desde API
    if (pagosIniciales) {
      setLoading(false)
      return
    }

    const fetchPagos = async () => {
      try {
        const response = await api.get(`/proyectos/${proyectoId}/presupuesto/${presupuestoItemId}/pagos`)
        setPagos(response.data.data || [])
      } catch (error) {
        console.error('Error fetching pagos:', error)
        setPagos([])
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [presupuestoItemId, proyectoId, pagosIniciales])

  if (loading) {
    return <div className="text-center py-4">Cargando historial...</div>
  }

  if (pagos.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-sm">No hay pagos registrados para este item</p>
      </div>
    )
  }

  const totalPagado = pagos
    .filter(p => p.estado === 'APROBADO')
    .reduce((sum, p) => sum + Number(p.montoPagado), 0)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
        <span className="text-sm font-medium text-blue-900">Total pagado:</span>
        <span className="text-lg font-bold text-blue-600">{formatPrice(totalPagado)}</span>
      </div>

      {pagos.map((pago: any) => (
        <div key={pago.id} className="border rounded-lg p-3 bg-white">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {formatPrice(pago.montoPagado)}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pago.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                  pago.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pago.estado}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(pago.fechaPago).toLocaleDateString('es-PY')}
              </p>
              {pago.notas && (
                <p className="text-sm text-gray-600 mt-2">{pago.notas}</p>
              )}
            </div>
          </div>

          {pago.comprobanteUrl && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-600 text-sm font-medium">Comprobante:</span>
                {pago.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                  <span className="text-red-600 text-sm">📄 PDF</span>
                ) : (
                  <span className="text-green-600 text-sm">🖼️ Imagen</span>
                )}
              </div>
              {pago.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg border-2 border-dashed border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                     onClick={() => window.open(`${API_BASE_URL}${pago.comprobanteUrl}`, '_blank')}>
                  <div className="text-center">
                    <div className="text-red-500 text-2xl mb-1">📄</div>
                    <p className="text-red-700 text-sm font-medium">Click para ver PDF</p>
                    <p className="text-red-500 text-xs">Abrirá en nueva pestaña</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <img
                    src={`${API_BASE_URL}${pago.comprobanteUrl}`}
                    alt="Comprobante de pago"
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                    onClick={() => setModalComprobante && setModalComprobante(`${API_BASE_URL}${pago.comprobanteUrl}`)}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Componente para el formulario de pago
function PagoFormItem({
  presupuestoItemId,
  proyectoId,
  costoTotal,
  onPagoSuccess
}: {
  presupuestoItemId: string
  proyectoId: string
  costoTotal: number
  onPagoSuccess: () => void
}) {
  const [montoPago, setMontoPago] = useState('')
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  // Calcular cuánto se ha pagado ya
  const [pagosExistentes, setPagosExistentes] = useState<any[]>([])
  const totalPagado = pagosExistentes
    .filter(p => p.estado === 'APROBADO')
    .reduce((sum, p) => sum + Number(p.montoPagado), 0)
  const pendientePago = costoTotal - totalPagado

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await api.get(`/proyectos/${proyectoId}/presupuesto/${presupuestoItemId}/pagos`)
        setPagosExistentes(response.data.data || [])
      } catch (error) {
        console.error('Error fetching pagos existentes:', error)
      }
    }
    fetchPagos()
  }, [presupuestoItemId, proyectoId])

  const handleMontoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value

    // Si el campo está vacío, mostrar 0
    if (!value) {
      setMontoPago('')
      return
    }

    // Permitir solo números
    value = value.replace(/[^\d]/g, '')

    // Si después de limpiar no hay valor, mostrar vacío
    if (!value) {
      setMontoPago('')
      return
    }

    // Para items dinámicos, no hay límite de pago
    const numericValue = parseInt(value, 10)
    // Solo validar límite para items no dinámicos
    // if (!presupuestoItem?.esDinamico && numericValue > pendientePago) {
    //   toast.error(`El monto no puede exceder ${formatPrice(pendientePago)}`)
    //   return
    // }

    setMontoPago(value)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setComprobanteFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comprobanteFile) {
      toast.error('Debes subir un comprobante de pago')
      return
    }
    if (!montoPago || parseFloat(montoPago) <= 0) {
      toast.error('Debes ingresar un monto válido')
      return
    }

    setLoading(true)
    try {
      // Subir comprobante
      const formData = new FormData()
      formData.append('file', comprobanteFile)

      const uploadResponse = await fetch(`${API_BASE_URL}/upload/comprobante`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Error al subir comprobante')
      }

      const uploadData = await uploadResponse.json()
      if (!uploadData.data?.url) {
        throw new Error('Respuesta del servidor inválida')
      }

      // Crear pago
      await api.post(`/proyectos/${proyectoId}/presupuesto/${presupuestoItemId}/pagos`, {
        montoPagado: parseFloat(montoPago),
        comprobanteUrl: uploadData.data.url,
        notas: notas || undefined
      })

      toast.success('Pago registrado exitosamente')
      onPagoSuccess()

      // Limpiar formulario
      setMontoPago('')
      setComprobanteFile(null)
      setPreviewUrl('')
      setNotas('')

    } catch (error: any) {
      console.error('Error creating pago:', error)
      toast.error(error.response?.data?.error || 'Error al registrar pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto a Pagar (₲)
          </label>
          <input
            type="text"
            value={montoPago ? parseFloat(montoPago).toLocaleString('es-PY') : ''}
            onChange={handleMontoChange}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Máximo pendiente: {formatPrice(pendientePago)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprobante de Pago
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {previewUrl && (
        <div className="mt-2">
          {comprobanteFile?.type.startsWith('image/') ? (
            <img src={previewUrl} alt="Comprobante" className="w-32 h-32 object-cover rounded border" />
          ) : (
            <div className="w-32 h-32 bg-gray-200 rounded border flex items-center justify-center">
              <span className="text-sm text-gray-600">📄 PDF</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas adicionales sobre este pago..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Registrando...' : `Registrar Pago de ${montoPago ? formatPrice(parseFloat(montoPago)) : '₲0'}`}
      </button>
    </form>
  )
}

export default function ProyectoDetallePage() {
  const params = useParams()
  const proyectoId = params.id as string
  
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchItemTerm, setSearchItemTerm] = useState('')
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [cantidad, setCantidad] = useState('')
  const [esDinamico, setEsDinamico] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [materialesPorItem, setMaterialesPorItem] = useState<Record<string, any[]>>({})
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [modalPagosProyecto, setModalPagosProyecto] = useState<{
    isOpen: boolean
    etapas: any[]
  }>({ isOpen: false, etapas: [] })
  const [financiaciones, setFinanciaciones] = useState<Financiacion[]>([])
  const [presupuestoTotal, setPresupuestoTotal] = useState(0)
  const [showFinanciacionForm, setShowFinanciacionForm] = useState(false)
  const [financiacionForm, setFinanciacionForm] = useState({
    monto: '',
    fuente: '',
    descripcion: ''
  })
  const [financiacionToDelete, setFinanciacionToDelete] = useState<any>(null)



  // Estado para modal de pagos por item
  const [pagoModal, setPagoModal] = useState<{
    isOpen: boolean
    presupuestoItem?: any
    pagos?: any[]
    loading?: boolean
  }>({ isOpen: false, loading: false })

  // Estado para modal de imagen ampliada dentro del modal de pagos
  const [modalComprobante, setModalComprobante] = useState<string | null>(null)

  // Configuración de drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Función para manejar el final del arrastre
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = proyecto?.presupuestoItems?.findIndex((item) => item.id === active.id)
      const newIndex = proyecto?.presupuestoItems?.findIndex((item) => item.id === over.id)

      if (oldIndex !== undefined && newIndex !== undefined && proyecto?.presupuestoItems) {
        const newItems = arrayMove(proyecto.presupuestoItems, oldIndex, newIndex)

        // Actualizar el estado local inmediatamente para mejor UX
        setProyecto({
          ...proyecto,
          presupuestoItems: newItems
        })

        // Guardar el nuevo orden en la base de datos
        try {
          const itemIds = newItems.map(item => item.id)
          await api.put(`/proyectos/${proyectoId}/presupuesto/reordenar`, {
            itemIds
          })
          // No mostrar toast de éxito para no interrumpir la experiencia
        } catch (error) {
          console.error('Error saving order:', error)
          // Revertir el cambio si falla la API
          toast.error('Error al guardar el orden')
          fetchProyecto() // Recargar para revertir
        }
      }
    }
  }

  // Efecto para manejar la tecla Escape en los modales
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (modalComprobante) {
          setModalComprobante(null)
        } else if (modalImage) {
          setModalImage(null)
        }
      }
    }

    if (modalImage || modalComprobante) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [modalImage, modalComprobante])

  useEffect(() => {
    fetchProyecto()
    fetchItems()

    // Solo cargar financiaciones si el usuario no es cliente
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    const isCliente = user?.rol === 'CLIENTE'

    if (!isCliente) {
      fetchFinanciaciones()
    }
  }, [proyectoId])

  const fetchProyecto = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyectoData = response.data.data

      // Para items dinámicos, obtener el costo actual (suma de pagos)
      if (proyectoData.presupuestoItems) {
        const itemsConCostoActualizado = await Promise.all(
          proyectoData.presupuestoItems.map(async (item: any) => {
            if (item.esDinamico) {
              try {
                // Obtener pagos del item dinámico para calcular costo actual
                const pagosResponse = await api.get(`/proyectos/${proyectoId}/presupuesto/${item.id}/pagos`)
                const pagos = pagosResponse.data.data || []
                const costoActual = pagos
                  .filter((p: any) => p.estado === 'APROBADO')
                  .reduce((sum: number, p: any) => sum + Number(p.montoPagado), 0)

                return {
                  ...item,
                  costoTotal: costoActual
                }
              } catch (error) {
                console.error(`Error fetching pagos for item ${item.id}:`, error)
                return item
              }
            }
            return item
          })
        )

        proyectoData.presupuestoItems = itemsConCostoActualizado
      }

      setProyecto(proyectoData)

      // Obtener materiales para cada item del presupuesto
      if (proyectoData.presupuestoItems) {
        const materialesPromises = proyectoData.presupuestoItems.map(async (presupuestoItem: any) => {
          try {
            const itemResponse = await api.get(`/items/${presupuestoItem.item.id}`)
            return {
              itemId: presupuestoItem.item.id,
              materiales: itemResponse.data.data.materialesPorItem || []
            }
          } catch (error) {
            console.error(`Error fetching materiales for item ${presupuestoItem.item.id}:`, error)
            return {
              itemId: presupuestoItem.item.id,
              materiales: []
            }
          }
        })

        const materialesResults = await Promise.all(materialesPromises)
        const materialesMap = materialesResults.reduce((acc, result) => {
          acc[result.itemId] = result.materiales
          return acc
        }, {} as Record<string, any[]>)

        setMaterialesPorItem(materialesMap)
      }
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      toast.error('Error al cargar el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await api.get('/items')
      // Cuando no se usan parámetros de paginación, los items vienen directamente en data.items
      const data = response.data.data
      setItems(data.items || data || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !cantidad) return

    try {
      await api.post(`/proyectos/${proyectoId}/presupuesto`, {
        itemId: selectedItem.id,
        cantidadMedida: Number(cantidad),
        esDinamico: esDinamico
      })

      toast.success('Item agregado al presupuesto')
      setShowAddForm(false)
      setSelectedItem(null)
      setSearchItemTerm('')
      setCantidad('')
      setEsDinamico(false)
      fetchProyecto() // Recargar proyecto
    } catch (error: any) {
      console.error('Error adding item:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar item'
      toast.error(errorMessage)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    setItemToDelete(itemId)
  }

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId)
  }

  const generarPDFCostos = async () => {
    try {
      const doc = new jsPDF()
      const fechaActual = new Date().toLocaleDateString('es-PY')
      
      // Título
      doc.setFontSize(20)
      doc.text('INFORME DE COSTOS DE OBRA', 20, 30)
      
      // Información del proyecto
      doc.setFontSize(12)
      doc.text(`Proyecto: ${proyecto?.nombre || 'N/A'}`, 20, 50)
      doc.text(`Constructor: ${proyecto?.usuario?.name || 'N/A'}`, 20, 60)
      doc.text(`Fecha del informe: ${fechaActual}`, 20, 70)
      
      let yPos = 90
      let costoTotalProyecto = 0
      
      // Procesar cada item del presupuesto
      for (const presupuestoItem of proyecto?.presupuestoItems || []) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 30
        }
        
        // Título del item
        doc.setFontSize(14)
        doc.text(`ITEM: ${presupuestoItem.item.nombre}`, 20, yPos)
        yPos += 10
        
        doc.setFontSize(10)
        doc.text(`Cantidad: ${presupuestoItem.cantidadMedida} ${getUnidadLabel(presupuestoItem.item.unidadMedida)}`, 25, yPos)
        yPos += 10
        
        // Mostrar materiales si están disponibles
        if (materialesPorItem[presupuestoItem.item.id]?.length > 0) {
          doc.text('Materiales:', 25, yPos)
          yPos += 8
          
          let costoMaterialesItem = 0
          
          materialesPorItem[presupuestoItem.item.id].forEach((materialItem: any) => {
            const costoUnitario = Number(materialItem.material.precioUnitario)
            const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad)
            const costoTotalMaterial = costoUnitario * cantidadPorUnidad * Number(presupuestoItem.cantidadMedida)
            
            costoMaterialesItem += costoTotalMaterial
            
            doc.text(`• ${materialItem.material.nombre}`, 30, yPos)
            doc.text(`${cantidadPorUnidad} ${getUnidadLabel(materialItem.material.unidad)} x ${formatPrice(costoUnitario)} = ${formatPrice(costoTotalMaterial)}`, 35, yPos + 6)
            yPos += 15
          })
          
          doc.text(`Subtotal Materiales: ${formatPrice(costoMaterialesItem)}`, 25, yPos)
          yPos += 8
        }
        
        // Costos del item
        const costoManoObra = Number(presupuestoItem.costoManoObra)
        const costoTotal = Number(presupuestoItem.costoTotal)
        
        doc.text(`Mano de Obra: ${formatPrice(costoManoObra)}`, 25, yPos)
        yPos += 8
        doc.setFontSize(12)
        doc.text(`TOTAL ITEM: ${formatPrice(costoTotal)}`, 25, yPos)
        yPos += 20
        
        costoTotalProyecto += costoTotal
        doc.setFontSize(10)
      }
      
      // Total general
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }
      
      doc.setFontSize(16)
      doc.text(`COSTO TOTAL DEL PROYECTO: ${formatPrice(costoTotalProyecto)}`, 20, yPos)
      
      // Margen de ganancia si existe
      if (proyecto?.margenGanancia) {
        const margen = costoTotalProyecto * (Number(proyecto.margenGanancia) / 100)
        const precioFinal = costoTotalProyecto + margen
        
        yPos += 15
        doc.setFontSize(12)
        doc.text(`Margen de ganancia (${proyecto.margenGanancia}%): ${formatPrice(margen)}`, 20, yPos)
        yPos += 10
        doc.setFontSize(16)
        doc.text(`PRECIO FINAL: ${formatPrice(precioFinal)}`, 20, yPos)
      }
      
      // Descargar
      doc.save(`Costos_${proyecto?.nombre?.replace(/\s+/g, '_')}_${fechaActual.replace(/\//g, '-')}.pdf`)
      toast.success('Informe de costos PDF descargado')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el informe de costos')
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      await api.delete(`/proyectos/${proyectoId}/presupuesto/${itemToDelete}`)
      toast.success('Item eliminado del presupuesto')
      fetchProyecto()
      setItemToDelete(null)
    } catch (error: any) {
      console.error('Error removing item:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar item'
      toast.error(errorMessage)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida'
    return new Date(dateString).toLocaleDateString('es-PY')
  }

  const getUnidadLabel = (unidad: string) => {
    const labels: { [key: string]: string } = {
      'M2': 'm²', 'M3': 'm³', 'ML': 'ml', 'KG': 'kg',
      'BOLSA': 'bolsa', 'UNIDAD': 'unidad', 'LOTE': 'lote', 'GLOBAL': 'global'
    }
    return labels[unidad] || unidad
  }

  const calcularCostoTotal = () => {
    if (!proyecto?.presupuestoItems) return 0

    return proyecto.presupuestoItems.reduce((total, item) => {
      // Costo base del item (mano de obra + materiales base)
      let costoItem = Number(item.costoTotal)

  // Agregar costos de materiales asociados (solo aquellos con precio específico establecido)
  const materialesItem = materialesPorItem[item.item.id] || []
  const costoMaterialesAsociados = materialesItem.reduce((sum: number, materialItem: any) => {
    // Solo incluir materiales que tienen precioUnitario establecido (ofertas seleccionadas)
    if (!materialItem.precioUnitario) return sum

    const precioUnitario = Number(materialItem.precioUnitario)
    const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad || 0)
    const cantidadItem = Number(item.cantidadMedida || 0)

    // Costo = precio_unitario * cantidad_por_unidad * cantidad_del_item_en_el_proyecto
    return sum + (precioUnitario * cantidadPorUnidad * cantidadItem)
  }, 0)

      return total + costoItem + costoMaterialesAsociados
    }, 0)
  }

  const abrirModalPagosProyecto = async () => {
    try {
      // Obtener todas las etapas del proyecto con sus pagos
      const etapasResponse = await api.get(`/proyectos/${proyectoId}/etapas`)
      const etapas = etapasResponse.data.data || []

      // Cargar pagos para cada etapa
      const etapasConPagos = await Promise.all(
        etapas.map(async (etapa: any) => {
          try {
            const pagosResponse = await api.get(`/proyectos/${proyectoId}/etapas/${etapa.id}/pagos`)
            return {
              ...etapa,
              pagos: pagosResponse.data.data || []
            }
          } catch (error) {
            console.error(`Error fetching pagos for etapa ${etapa.id}:`, error)
            return {
              ...etapa,
              pagos: []
            }
          }
        })
      )

      setModalPagosProyecto({
        isOpen: true,
        etapas: etapasConPagos
      })
    } catch (error) {
      console.error('Error fetching etapas y pagos:', error)
      toast.error('Error al cargar el histórico de pagos')
    }
  }

  const cerrarModalPagosProyecto = () => {
    setModalPagosProyecto({ isOpen: false, etapas: [] })
  }

  const fetchFinanciaciones = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}/financiaciones`)
      setFinanciaciones(response.data.data)

      // Calcular presupuesto total
      const responsePresupuesto = await api.get(`/proyectos/${proyectoId}/presupuesto-total`)
      setPresupuestoTotal(responsePresupuesto.data.data.presupuestoTotal)
    } catch (error: any) {
      console.error('Error fetching financiaciones:', error)
      // Si es 403 (CLIENTE intentando acceder), no mostrar error al usuario
      if (error.response?.status !== 403) {
        console.error('Error inesperado al obtener financiaciones:', error)
      }
      // Para CLIENTE, dejar valores por defecto (empty array y 0)
      setFinanciaciones([])
      setPresupuestoTotal(0)
    }
  }

  const handleAddFinanciacion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!financiacionForm.monto || !financiacionForm.fuente) return

    try {
      // Limpiar el monto formateado antes de enviar
      const montoLimpio = financiacionForm.monto.replace(/\./g, '').replace(',', '.')

      await api.post(`/proyectos/${proyectoId}/financiaciones`, {
        ...financiacionForm,
        monto: montoLimpio
      })
      toast.success('Financiación agregada exitosamente')
      setShowFinanciacionForm(false)
      setFinanciacionForm({ monto: '', fuente: '', descripcion: '' })
      fetchFinanciaciones()
    } catch (error: any) {
      console.error('Error adding financiacion:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar financiación'
      toast.error(errorMessage)
    }
  }

  const formatMontoInput = (value: string) => {
    // Remover todos los caracteres no numéricos excepto punto y coma
    const numericValue = value.replace(/[^\d.,]/g, '')

    // Convertir a número y formatear con separadores de miles
    const number = parseFloat(numericValue.replace(/\./g, '').replace(',', '.'))
    if (isNaN(number)) return ''

    return number.toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatMontoInput(e.target.value)
    setFinanciacionForm({...financiacionForm, monto: formattedValue})
  }

  const handleDeleteFinanciacion = async (financiacionId: string) => {
    try {
      await api.delete(`/financiaciones/${financiacionId}`)
      toast.success('Financiación eliminada exitosamente')
      fetchFinanciaciones()
    } catch (error: any) {
      console.error('Error deleting financiacion:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar financiación'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Proyecto no encontrado</p>
          <Link href="/proyectos" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Volver a proyectos
          </Link>
        </div>
      </div>
    )
  }

  // Componente del carrusel de planos
  const PlanosCarrusel = ({ imagenes }: { imagenes: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Validar que imagenes sea un array válido
    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return (
        <div className="aspect-[16/9] bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No hay imágenes disponibles</p>
        </div>
      );
    }

    const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % imagenes.length);
    };

    const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    };

    // Función para obtener la URL correcta de la imagen
    const getImageUrl = (imageUrl: string) => {
      // Si la URL ya es absoluta (empieza con http), úsala tal cual
      // Si es relativa, concaténala con API_BASE_URL
      return imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')
        ? imageUrl
        : `${API_BASE_URL}${imageUrl || ''}`;
    };

    const currentImageUrl = getImageUrl(imagenes[currentIndex]);

    return (
      <div className="relative">
        <div className="aspect-[16/9] bg-gray-200 overflow-hidden rounded-lg">
          <img
            src={currentImageUrl}
            alt={`Plano ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setModalImage(currentImageUrl)}
            onError={(e) => {
              console.error('Error loading image:', currentImageUrl);
              // Fallback si la imagen no carga
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE4QzE0IDE5LjEgMTMuMSAyMCAxMiAyMEMxMC45IDIwIDEwIDE5LjEgMTAgMThWNFMxMC45IDIgMTIgMlpNMTIgNUEuNS41IDAgMCAxIDExLjUgNUMxMS41IDQuNSAxMiA0LjUgMTIgNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
            }}
          />
        </div>

        {imagenes.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {imagenes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/60'
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {imagenes.length}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Link
                href="/proyectos"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center flex-wrap gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{proyecto.nombre}</h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[proyecto.estado as keyof typeof estadoColors]}`}>
                    {estadoLabels[proyecto.estado as keyof typeof estadoLabels]}
                  </span>
                </div>
                {proyecto.descripcion && (
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">{proyecto.descripcion}</p>
                )}
              </div>
            </div>

            {/* Botones - Siempre debajo en móvil, al lado en desktop */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end sm:mt-0">
              <Link
                href={`/proyectos/${proyecto.id}/obra`}
                className="text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md transition-colors flex items-center text-xs sm:text-sm"
                style={{backgroundColor: '#38603B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                title="Monitoreo de Obra"
              >
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Monitoreo</span>
                <span className="sm:hidden">Obra</span>
              </Link>
              <button
                onClick={() => abrirModalPagosProyecto()}
                className="bg-blue-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center text-xs sm:text-sm"
                title="Histórico de Pagos"
              >
                <span className="text-sm">💰</span>
                <span className="hidden sm:inline ml-1 sm:ml-2">Pagos</span>
              </button>
              <button
                onClick={generarPDFCostos}
                className="text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md transition-colors flex items-center text-xs sm:text-sm"
                style={{backgroundColor: '#B99742'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7D4C3A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B99742'}
                title="Descargar Costos PDF"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Costos</span>
                <span className="sm:hidden">PDF</span>
              </button>
              <Link
                href={`/proyectos/editar/${proyecto.id}`}
                className="text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-md transition-colors flex items-center text-xs sm:text-sm"
                style={{backgroundColor: '#633722'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                title="Editar Proyecto"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Editar</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información del Proyecto */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información General (con planos incluidos) */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Información General
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {proyecto.superficieTotal && (
                    <div className="flex items-center">
                      <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Superficie:</span>
                      <span className="ml-2 font-medium">{proyecto.superficieTotal} m²</span>
                    </div>
                  )}

                  {proyecto.direccion && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Dirección:</span>
                      <span className="ml-2 font-medium">{proyecto.direccion}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Inicio:</span>
                    <span className="ml-2 font-medium">{formatDate(proyecto.fechaInicio)}</span>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Fin estimado:</span>
                    <span className="ml-2 font-medium">{formatDate(proyecto.fechaFinEstimada)}</span>
                  </div>

                  {proyecto.margenGanancia && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Margen:</span>
                      <span className="ml-2 font-medium">{proyecto.margenGanancia}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Galería Completa de Planos */}
              {(() => {
                if (!proyecto.imagenUrl) {
                  return null; // No mostrar nada si no hay imágenes
                }

                try {
                  const imagenes = JSON.parse(proyecto.imagenUrl);

                  if (Array.isArray(imagenes) && imagenes.length > 0) {
                    return (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Galería Completa de Planos</h3>
                        <PlanosCarrusel imagenes={imagenes} />
                      </div>
                    );
                  }
                } catch (e) {
                  // Si no es JSON válido, mostrar como imagen única
                  return (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Imagen del Proyecto</h3>
                      <img
                        src={proyecto.imagenUrl}
                        alt={proyecto.nombre}
                        className="w-full h-64 object-cover rounded-lg cursor-pointer"
                        onClick={() => setModalImage(proyecto.imagenUrl || null)}
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Presupuesto */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Presupuesto
                  </h3>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="text-white px-3 py-1 rounded text-sm transition-colors flex items-center sm:px-3 sm:py-1 lg:px-3 lg:py-1"
                    style={{backgroundColor: '#38603B'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                    title="Agregar Item"
                  >
                    <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
                    <span className="hidden sm:inline ml-1">Agregar Item</span>
                  </button>
                </div>

                {/* Add Item Form */}
                {showAddForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Agregar Item al Presupuesto</h4>
                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchItemTerm}
                            onChange={(e) => {
                              setSearchItemTerm(e.target.value)
                              setShowItemDropdown(true)
                            }}
                            onFocus={() => setShowItemDropdown(true)}
                            onBlur={() => setTimeout(() => setShowItemDropdown(false), 200)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="Buscar item..."
                            required
                          />
                          {selectedItem && (
                            <div className="absolute right-2 top-2 text-sm text-gray-600">
                              ✓
                            </div>
                          )}
                        </div>

                        {showItemDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {Array.isArray(items) && items
                              .filter(item =>
                                !proyecto?.presupuestoItems?.some(pi => pi.item.id === item.id) &&
                                item.nombre.toLowerCase().includes(searchItemTerm.toLowerCase())
                              )
                              .map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setSelectedItem(item)
                                    setSearchItemTerm(item.nombre)
                                    setShowItemDropdown(false)
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {item.nombre}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {getUnidadLabel(item.unidadMedida)}
                                      </div>
                                    </div>
                                    {item.manoObraUnitaria && (
                                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        MO: ₲{Number(item.manoObraUnitaria).toLocaleString('es-PY')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {(Array.isArray(items) && items.filter(item =>
                              !proyecto?.presupuestoItems?.some(pi => pi.item.id === item.id) &&
                              item.nombre.toLowerCase().includes(searchItemTerm.toLowerCase())
                            ).length === 0) && (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No se encontraron items
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={cantidad}
                          onChange={(e) => setCantidad(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="1.0"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={esDinamico}
                            onChange={(e) => setEsDinamico(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Costo Dinámico (pagos incrementales)
                          </span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="submit"
                            className="text-white px-3 py-2 rounded text-sm transition-colors"
                            style={{backgroundColor: '#38603B'}}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                          >
                            Agregar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddForm(false)
                              setSelectedItem(null)
                              setSearchItemTerm('')
                              setCantidad('')
                              setEsDinamico(false)
                            }}
                            className="bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
                
                {!proyecto.presupuestoItems?.length ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay items en el presupuesto</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Agrega items de construcción para calcular el costo total
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tabla de Desglose de Costos */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Desglose de Costos por Item</h3>
                        <p className="text-sm text-gray-600 mt-1">Separación detallada entre mano de obra y materiales</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cantidad
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mano de Obra
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Materiales
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {proyecto.presupuestoItems.map((item) => {
                              // Calcular costos según el tipo de item
                              let costoManoObra, costoMateriales, costoTotal

                              if (item.esDinamico) {
                                // Para items dinámicos: el costoTotal es la suma de TODOS los pagos realizados
                                // Los pagos incluyen tanto mano de obra como materiales, pero mostramos los materiales asociados por separado
                                costoManoObra = Number(item.costoTotal) // Todos los pagos realizados (mano de obra + materiales incluidos en pagos)
                                costoMateriales = Math.max(0, calcularCostoTotalItem(item, materialesPorItem) - Number(item.costoTotal)) // Materiales asociados adicionales
                                costoTotal = costoManoObra + costoMateriales // Total incluyendo materiales asociados
                              } else {
                                // Para items fijos: separación clara entre mano de obra y materiales
                                costoManoObra = Number(item.costoManoObra || 0)
                                costoMateriales = Math.max(0, Number(item.costoTotal) - costoManoObra)
                                costoTotal = Number(item.costoTotal)
                              }

                              return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.item.nombre}
                                    </div>
                                    {item.esDinamico && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Dinámico
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.cantidadMedida} {getUnidadLabel(item.item.unidadMedida)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatPrice(costoManoObra)}
                                    {item.esDinamico && (
                                      <div className="text-xs text-gray-500">Pagos realizados</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatPrice(costoMateriales)}
                                    {item.esDinamico && costoMateriales === 0 && (
                                      <div className="text-xs text-gray-500">Incluido en pagos</div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {formatPrice(costoTotal)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                Total del Proyecto:
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                                {formatPrice(calcularCostoTotal())}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Lista Detallada de Items */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles de Items</h3>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={proyecto.presupuestoItems.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-4">
                            {proyecto.presupuestoItems.map((item, index) => (
                              <SortableItem
                                key={item.id}
                                item={item}
                                index={index}
                                expandedItem={expandedItem}
                                toggleItemExpansion={toggleItemExpansion}
                                handleRemoveItem={handleRemoveItem}
                                setPagoModal={setPagoModal}
                                materialesPorItem={materialesPorItem}
                                getUnidadLabel={getUnidadLabel}
                                formatPrice={formatPrice}
                                API_BASE_URL={API_BASE_URL}
                                proyectoId={proyectoId}
                                onItemUpdate={fetchProyecto}
                                calcularCostoTotalItem={calcularCostoTotalItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Información del Encargado */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Encargado de Obra
                </h3>
                
                {proyecto.encargadoNombre ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium">{proyecto.encargadoNombre}</p>
                    </div>
                    
                    {proyecto.encargadoTelefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{proyecto.encargadoTelefono}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay encargado asignado</p>
                )}
              </div>

              {/* Información del Cliente */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Cliente
                </h3>
                
                {proyecto.clienteNombre ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium">{proyecto.clienteNombre}</p>
                    </div>
                    
                    {proyecto.clienteTelefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{proyecto.clienteTelefono}</span>
                      </div>
                    )}
                    
                    {proyecto.clienteEmail && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{proyecto.clienteEmail}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No hay información del cliente</p>
                )}
              </div>

              {/* Resumen Financiero */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumen Financiero
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Costo Total del Proyecto:</span>
                    <span className="font-bold text-lg text-gray-900">{formatPrice(calcularCostoTotal())}</span>
                  </div>

                  {/* Solo mostrar margen si el usuario NO es cliente */}
                  {(() => {
                    // Verificar si el usuario actual es cliente
                    const userData = localStorage.getItem('user')
                    const user = userData ? JSON.parse(userData) : null
                    const isCliente = user?.rol === 'CLIENTE'

                    if (!isCliente && proyecto.margenGanancia) {
                      return (
                        <>
                          <div className="border-t pt-3 mt-3">
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                              Información del Constructor
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Margen ({proyecto.margenGanancia}%):</span>
                              <span className="font-medium">
                                {formatPrice(calcularCostoTotal() * (proyecto.margenGanancia / 100))}
                              </span>
                            </div>

                            <div className="flex justify-between mt-1">
                              <span className="text-sm font-medium text-gray-900">Precio Final:</span>
                              <span className="font-bold text-lg">
                                {formatPrice(calcularCostoTotal() * (1 + (proyecto.margenGanancia / 100)))}
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* Financiaciones del Proyecto - Solo para constructores */}
              {(() => {
                const userData = localStorage.getItem('user')
                const user = userData ? JSON.parse(userData) : null
                const isCliente = user?.rol === 'CLIENTE'

                if (!isCliente) {
                  return (
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Financiaciones
                      </h3>

                      <div className="space-y-4">
                        {/* Resumen del presupuesto */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">Presupuesto Total</p>
                              <p className="text-2xl font-bold text-green-900">{formatPrice(presupuestoTotal)}</p>
                            </div>
                            <button
                              onClick={() => setShowFinanciacionForm(true)}
                              className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center text-sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar
                            </button>
                          </div>
                          <p className="text-xs text-green-600 mt-2">
                            {financiaciones.length} fuente{financiaciones.length !== 1 ? 's' : ''} de financiamiento
                          </p>
                        </div>

                        {/* Lista de financiaciones */}
                        <div className="space-y-3">
                          {financiaciones.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm">No hay financiaciones registradas</p>
                              <button
                                onClick={() => setShowFinanciacionForm(true)}
                                className="mt-2 text-green-600 hover:text-green-700 underline text-sm"
                              >
                                Agregar primera financiación
                              </button>
                            </div>
                          ) : (
                            financiaciones.map((financiacion) => (
                              <div key={financiacion.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">{financiacion.fuente}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(financiacion.fecha).toLocaleDateString('es-PY')}
                                      </span>
                                    </div>
                                    {financiacion.descripcion && (
                                      <p className="text-sm text-gray-600">{financiacion.descripcion}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-lg font-bold text-green-600">{formatPrice(financiacion.monto)}</p>
                                    </div>
                                    <button
                                      onClick={() => setFinanciacionToDelete(financiacion)}
                                      className="text-red-600 hover:text-red-900 transition-colors p-1"
                                      title="Eliminar financiación"
                                    >
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Información del Constructor */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Constructor
                </h3>

                {proyecto.usuario && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium">{proyecto.usuario.name}</p>
                    </div>

                    {proyecto.usuario.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{proyecto.usuario.email}</span>
                      </div>
                    )}

                    {proyecto.usuario.telefono && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{proyecto.usuario.telefono}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Información del Sistema */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información</h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span>Creado:</span>
                    <span className="ml-2">{formatDate(proyecto.createdAt)}</span>
                  </div>
                  <div>
                    <span>Actualizado:</span>
                    <span className="ml-2">{formatDate(proyecto.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación para eliminar */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de eliminar este item del presupuesto?</p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => setItemToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-full p-4">
            {/* Botón de cerrar arriba a la derecha */}
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition-colors"
              title="Cerrar (Esc)"
            >
              ×
            </button>

            {/* Botón de cerrar abajo al centro */}
            <button
              onClick={() => setModalImage(null)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 hover:bg-black/70 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>

            <img
              src={modalImage}
              alt="Plano ampliado"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />

            {/* Overlay clickeable para cerrar */}
            <div
              className="absolute inset-0 -z-10 cursor-pointer"
              onClick={() => setModalImage(null)}
            />
          </div>
        </div>
      )}

      {/* Modal de agregar financiación */}
      {showFinanciacionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Agregar Financiación</h2>
                <button
                  onClick={() => setShowFinanciacionForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddFinanciacion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuente de Financiamiento *
                  </label>
                  <select
                    value={financiacionForm.fuente}
                    onChange={(e) => setFinanciacionForm({...financiacionForm, fuente: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar fuente</option>
                    <option value="Capital propio">Capital propio</option>
                    <option value="Préstamo bancario">Préstamo bancario</option>
                    <option value="Venta de activos">Venta de activos</option>
                    <option value="Inversión externa">Inversión externa</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="text"
                    value={financiacionForm.monto}
                    onChange={handleMontoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50.000.000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el monto con separadores de miles (ej: 50.000.000)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={financiacionForm.descripcion}
                    onChange={(e) => setFinanciacionForm({...financiacionForm, descripcion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detalles adicionales sobre esta financiación..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFinanciacionForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Agregar Financiación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pagos por item */}
      {pagoModal.isOpen && pagoModal.presupuestoItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pagos por Item</h2>
                  <p className="text-gray-600">{pagoModal.presupuestoItem.item.nombre}</p>
                </div>
                <button
                  onClick={() => setPagoModal({ isOpen: false })}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Información del item */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Costo Total:</span>
                    <p className="font-bold text-lg text-green-600">
                      {formatPrice(Number(pagoModal.presupuestoItem.costoTotal))}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cantidad:</span>
                    <p className="font-medium">
                      {pagoModal.presupuestoItem.cantidadMedida} {getUnidadLabel(pagoModal.presupuestoItem.item.unidadMedida)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Historial de pagos */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Pagos</h3>
                <div className="space-y-3">
                  <PagoHistorialItem
                    presupuestoItemId={pagoModal.presupuestoItem.id}
                    proyectoId={proyectoId}
                    pagosIniciales={pagoModal.pagos}
                    setModalComprobante={setModalComprobante}
                  />
                </div>
              </div>

              {/* Formulario para nuevo pago */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Nuevo Pago</h3>
                <PagoFormItem
                  presupuestoItemId={pagoModal.presupuestoItem.id}
                  proyectoId={proyectoId}
                  costoTotal={Number(pagoModal.presupuestoItem.costoTotal)}
                  onPagoSuccess={async () => {
                    try {
                      // Recargar pagos del item para actualizar el historial
                      const response = await api.get(`/proyectos/${proyectoId}/presupuesto/${pagoModal.presupuestoItem.id}/pagos`)
                      const pagosActualizados = response.data.data || []

                      // Calcular el nuevo costo total dinámico (solo para items dinámicos)
                      let nuevoCostoTotal = pagoModal.presupuestoItem.costoTotal
                      if (pagoModal.presupuestoItem.esDinamico) {
                        // Costo dinámico = suma de todos los pagos aprobados realizados
                        const totalPagosAprobados = pagosActualizados
                          .filter((p: any) => p.estado === 'APROBADO')
                          .reduce((sum: number, p: any) => sum + Number(p.montoPagado), 0)
                        nuevoCostoTotal = totalPagosAprobados
                      }

      // Actualizar el estado del modal con los nuevos pagos y costo actualizado
      setPagoModal(prev => ({
        ...prev,
        pagos: pagosActualizados,
        presupuestoItem: {
          ...prev.presupuestoItem,
          costoTotal: nuevoCostoTotal
        }
      }))

      // También actualizar el item en el estado global del proyecto
      setProyecto(prevProyecto => {
        if (!prevProyecto || !prevProyecto.presupuestoItems) return prevProyecto
        return {
          ...prevProyecto,
          presupuestoItems: prevProyecto.presupuestoItems.map(item =>
            item.id === pagoModal.presupuestoItem.id
              ? { ...item, costoTotal: nuevoCostoTotal }
              : item
          )
        }
      })

                      // Recargar datos del proyecto para actualizar costos en la lista principal
                      await fetchProyecto()

                      // Cerrar el modal después de procesar exitosamente el pago
                      setPagoModal({ isOpen: false })
                    } catch (error) {
                      console.error('Error recargando pagos:', error)
                      fetchProyecto() // Fallback
                    }
                  }}
                />
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setPagoModal({ isOpen: false })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de comprobante ampliado */}
      {modalComprobante && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="relative max-w-7xl max-h-full p-4">
            {/* Botón de cerrar arriba a la derecha */}
            <button
              onClick={() => setModalComprobante(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition-colors"
              title="Cerrar (Esc)"
            >
              ×
            </button>

            {/* Botón de cerrar abajo al centro */}
            <button
              onClick={() => setModalComprobante(null)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 hover:bg-black/70 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>

            <img
              src={modalComprobante}
              alt="Comprobante ampliado"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />

            {/* Overlay clickeable para cerrar */}
            <div
              className="absolute inset-0 -z-10 cursor-pointer"
              onClick={() => setModalComprobante(null)}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de financiación */}
      {financiacionToDelete && (
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
                  ¿Estás seguro de que quieres eliminar la financiación de <strong className="text-gray-900">"{financiacionToDelete.fuente}"</strong> por un monto de <strong className="text-gray-900">{formatPrice(financiacionToDelete.monto)}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta acción no se puede deshacer. La financiación será eliminada permanentemente del proyecto.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => setFinanciacionToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                  onClick={() => {
                    handleDeleteFinanciacion(financiacionToDelete.id);
                    setFinanciacionToDelete(null);
                  }}
                >
                  <span className="mr-2">🗑️</span>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de histórico de pagos del proyecto */}
      {modalPagosProyecto.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Histórico de Pagos</h2>
                  <p className="text-gray-600">{proyecto.nombre}</p>
                </div>
                <button
                  onClick={cerrarModalPagosProyecto}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {modalPagosProyecto.etapas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay etapas con pagos registrados</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {modalPagosProyecto.etapas.map((etapa: any) => (
                    <div key={etapa.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{etapa.nombre}</h3>
                          <p className="text-sm text-gray-600">Etapa {etapa.orden}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            etapa.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                            etapa.estado === 'EN_PROGRESO' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {etapa.estado.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {etapa.pagos.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No hay pagos registrados para esta etapa</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Agrupar pagos por item */}
                          {(() => {
                            const pagosPorItem: { [key: string]: typeof etapa.pagos } = {}

                            etapa.pagos.forEach((pago: any) => {
                              const itemKey = pago.item?.id || 'sin-item'
                              if (!pagosPorItem[itemKey]) {
                                pagosPorItem[itemKey] = []
                              }
                              pagosPorItem[itemKey].push(pago)
                            })

                            return Object.entries(pagosPorItem).map(([itemKey, pagosItem]) => {
                              // Calcular totales para este item en esta etapa
                              const totalPagadoAprobado = pagosItem
                                .filter((p: any) => p.estado === 'APROBADO')
                                .reduce((sum: number, p: any) => sum + Number(p.monto), 0)

                              const totalPagadoPendiente = pagosItem
                                .filter((p: any) => p.estado === 'PENDIENTE')
                                .reduce((sum: number, p: any) => sum + Number(p.monto), 0)

                              const totalPagado = totalPagadoAprobado + totalPagadoPendiente

                              const item = pagosItem[0]?.item

                              return (
                                <div key={itemKey} className="border rounded-lg p-4 bg-white">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h4 className="font-medium text-gray-900">
                                        {item ? item.nombre : 'Pagos varios'}
                                      </h4>
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <p>Total pagado: {formatPrice(totalPagado)}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {totalPagado > 0 && (
                                        <span className="text-green-600 font-medium text-sm">
                                          💰 {pagosItem.length} pago{pagosItem.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Lista de pagos del item */}
                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium text-gray-700">Historial de pagos:</h5>
                                    {pagosItem.map((pago: any) => (
                                      <div key={pago.id} className="bg-gray-50 rounded border p-3">
                                        <div className="flex justify-between items-center">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">
                                              {formatPrice(pago.monto)} - {new Date(pago.fechaPago).toLocaleDateString('es-PY')}
                                            </p>
                                            {pago.notas && (
                                              <p className="text-xs text-gray-600 mt-1">{pago.notas}</p>
                                            )}
                                          </div>
                                          <span className={`px-2 py-1 text-xs rounded-full ml-3 ${
                                            pago.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                                            pago.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {pago.estado}
                                          </span>
                                        </div>

                                        {pago.comprobanteUrl && (
                                          <div className="mt-2 flex items-center space-x-2">
                                            {pago.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                              <div className="flex items-center space-x-1 text-xs text-red-600">
                                                <span>📄</span>
                                                <a
                                                  href={`${API_BASE_URL}${pago.comprobanteUrl}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                  PDF
                                                </a>
                                              </div>
                                            ) : (
                                              <div className="flex items-center space-x-2">
                                                <img
                                                  src={`${API_BASE_URL}${pago.comprobanteUrl}`}
                                                  alt="Comprobante"
                                                  className="w-8 h-8 object-cover rounded border cursor-pointer"
                                                  onClick={() => window.open(`${API_BASE_URL}${pago.comprobanteUrl}`, '_blank')}
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                                <span className="text-green-600 text-xs">🖼️</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={cerrarModalPagosProyecto}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
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
