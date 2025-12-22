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
  materialesPorItem: Record<string, any[]>
  getUnidadLabel: (unidad: string) => string
  formatPrice: (price: number) => string
  API_BASE_URL: string
  proyectoId: string
}

function SortableItem({
  item,
  index,
  expandedItem,
  toggleItemExpansion,
  handleRemoveItem,
  materialesPorItem,
  getUnidadLabel,
  formatPrice,
  API_BASE_URL,
  proyectoId
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
        className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
        onClick={() => toggleItemExpansion(item.id)}
      >
        <div className="flex items-center space-x-4 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>

          <div className="flex-1">
            <h4 className="text-lg font-medium text-gray-900">{item.item.nombre}</h4>
            <p className="text-sm text-gray-500">
              {item.cantidadMedida} {getUnidadLabel(item.item.unidadMedida)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(Number(item.costoTotal))}
            </p>
            <p className="text-sm text-gray-500">
              Mat: {formatPrice(Number(item.costoMateriales))} | MO: {formatPrice(Number(item.costoManoObra))}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveItem(item.item.id)
            }}
            className="text-red-600 hover:text-red-900 transition-colors p-1"
            title="Eliminar item"
          >
            ✕
          </button>
          <span className="text-gray-400">
            {expandedItem === item.id ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Contenido expandible - Materiales */}
      {expandedItem === item.id && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
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
                      {formatPrice(Number(materialItem.material.precioUnitario))}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {formatPrice(Number(materialItem.material.precioUnitario) * Number(materialItem.cantidadPorUnidad) * Number(item.cantidadMedida))}
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

  // Efecto para manejar la tecla Escape en el modal de imagen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modalImage) {
        setModalImage(null)
      }
    }

    if (modalImage) {
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
  }, [modalImage])

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
        cantidadMedida: Number(cantidad)
      })

      toast.success('Item agregado al presupuesto')
      setShowAddForm(false)
      setSelectedItem(null)
      setSearchItemTerm('')
      setCantidad('')
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
    return proyecto.presupuestoItems.reduce((total, item) => total + Number(item.costoTotal), 0)
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
                      <div className="flex items-end space-x-2">
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
                          }}
                          className="bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
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
                            materialesPorItem={materialesPorItem}
                            getUnidadLabel={getUnidadLabel}
                            formatPrice={formatPrice}
                            API_BASE_URL={API_BASE_URL}
                            proyectoId={proyectoId}
                          />
                        ))}

                        {/* Total */}
                        <div className="bg-gray-50 px-6 py-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-gray-900">Total del Proyecto:</span>
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(calcularCostoTotal())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </SortableContext>
                  </DndContext>
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
