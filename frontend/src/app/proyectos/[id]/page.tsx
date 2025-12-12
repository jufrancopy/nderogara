'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, ArrowLeft, Edit, Calendar, MapPin, User, 
  Phone, Mail, DollarSign, Ruler, FileText, Package,
  Calculator, Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import api, { API_BASE_URL } from '@/lib/api'
import { formatPrice } from '@/lib/formatters'
import jsPDF from 'jspdf'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

export default function ProyectoDetallePage() {
  const params = useParams()
  const proyectoId = params.id as string
  
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [materialesPorItem, setMaterialesPorItem] = useState<Record<string, any[]>>({})
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [modalPagosProyecto, setModalPagosProyecto] = useState<{
    isOpen: boolean
    etapas: any[]
  }>({ isOpen: false, etapas: [] })

  useEffect(() => {
    fetchProyecto()
    fetchItems()
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
      console.error('Error fetching proyecto:; error)
      toast.error('Error al cargar el proyecto')
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async () => {
    try {
      const response = await api.get('/items')
      setItems(response.data.data || [])
    } catch (error) {
      console.error('Error fetching items:; error)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !cantidad) return

    try {
      await api.post(`/proyectos/${proyectoId}/presupuesto`, {
        itemId: selectedItem,
        cantidadMedida: Number(cantidad)
      })
      
      toast.success('Item agregado al presupuesto')
      setShowAddForm(false)
      setSelectedItem('')
      setCantidad('')
      fetchProyecto() // Recargar proyecto
    } catch (error: any) {
      console.error('Error adding item:; error)
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
      doc.text('INFORME DE COSTOS DE OBRA; 20, 30)
      
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
          doc.text('Materiales:; 25, yPos)
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
      console.error('Error generating PDF:; error)
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
      console.error('Error removing item:; error)
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
      'M2': 'm²; 'M3': 'm³; 'ML': 'ml; 'KG': 'kg',
      'BOLSA': 'bolsa; 'UNIDAD': 'unidad; 'LOTE': 'lote; 'GLOBAL': 'global'
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
      console.error('Error fetching etapas y pagos:; error)
      toast.error('Error al cargar el histórico de pagos')
    }
  }

  const cerrarModalPagosProyecto = () => {
    setModalPagosProyecto({ isOpen: false, etapas: [] })
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

    const nextSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % imagenes.length);
    };

    const prevSlide = () => {
      setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    };

    return (
      <div className="relative">
        <div className="aspect-[16/9] bg-gray-200 overflow-hidden rounded-lg">
          <img 
            src={`${API_BASE_URL}${imagenes[currentIndex]}`}
            alt={`Plano ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setModalImage(`${API_BASE_URL}${imagenes[currentIndex]}`)}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href="/proyectos"
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold text-gray-900 mr-3">{proyecto.nombre}</h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[proyecto.estado as keyof typeof estadoColors]}`}>
                    {estadoLabels[proyecto.estado as keyof typeof estadoLabels]}
                  </span>
                </div>
                {proyecto.descripcion && (
                  <p className="text-gray-600 mt-1">{proyecto.descripcion}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/proyectos/${proyecto.id}/obra`}
                className="text-white px-4 py-2 rounded-md transition-colors flex items-center"
                style={{backgroundColor: '#38603B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Monitoreo de Obra
              </Link>
              <button
                onClick={() => abrirModalPagosProyecto()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                💰 Histórico de Pagos
              </button>
              <button
                onClick={generarPDFCostos}
                className="text-white px-4 py-2 rounded-md transition-colors flex items-center"
                style={{backgroundColor: '#B99742'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7D4C3A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B99742'}
              >
                <FileText className="h-4 w-4 mr-2" />
                Descargar Costos PDF
              </button>
              <Link
                href={`/proyectos/editar/${proyecto.id}`}
                className="text-white px-4 py-2 rounded-md transition-colors flex items-center"
                style={{backgroundColor: '#633722'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#633722'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Proyecto
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información del Proyecto */}
            <div className="lg:col-span-2 space-y-6">
              {/* Planos del Proyecto */}
              {proyecto.imagenUrl && (() => {
                try {
                  const imagenes = JSON.parse(proyecto.imagenUrl);
                  if (Array.isArray(imagenes) && imagenes.length > 0) {
                    return (
                      <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Planos del Proyecto</h3>
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
                        src={`${API_BASE_URL}${proyecto.imagenUrl}`} 
                        alt={proyecto.nombre}
                        className="w-full h-64 object-cover rounded-lg cursor-pointer"
                        onClick={() => setModalImage(`${API_BASE_URL}${proyecto.imagenUrl}`)}
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Detalles Generales */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Información General
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Presupuesto */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Presupuesto
                  </h3>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                    style={{backgroundColor: '#38603B'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Item
                  </button>
                </div>

                {/* Add Item Form */}
                {showAddForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Agregar Item al Presupuesto</h4>
                    <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item
                        </label>
                        <select
                          value={selectedItem}
                          onChange={(e) => setSelectedItem(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        >
                          <option value="">Seleccionar item</option>
                          {items
                            .filter(item => !proyecto?.presupuestoItems?.some(pi => pi.item.id === item.id))
                            .map(item => (
                              <option key={item.id} value={item.id}>
                                {item.nombre} ({getUnidadLabel(item.unidadMedida)})
                              </option>
                            ))}
                        </select>
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
                          onClick={() => setShowAddForm(false)}
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
                  <div className="space-y-4">
                    {proyecto.presupuestoItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg">
                        {/* Header del acordeón */}
                        <div 
                          className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
                          onClick={() => toggleItemExpansion(item.id)}
                        >
                          <div className="flex items-center space-x-4 flex-1">
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
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Materiales utilizados:</h5>
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
                              <p className="text-sm text-gray-500 italic">No hay materiales asociados a este item</p>
                            )}
                          </div>
                        )}
                      </div>
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
                    <span className="text-sm text-gray-600">Costo Total:</span>
                    <span className="font-medium">{formatPrice(calcularCostoTotal())}</span>
                  </div>
                  
                  {proyecto.margenGanancia && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Margen ({proyecto.margenGanancia}%):</span>
                        <span className="font-medium">
                          {formatPrice(calcularCostoTotal() * (proyecto.margenGanancia / 100))}
                        </span>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">Precio Final:</span>
                          <span className="font-bold text-lg">
                            {formatPrice(calcularCostoTotal() * (1 + (proyecto.margenGanancia / 100)))}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ×
            </button>
            <img
              src={modalImage}
              alt="Plano ampliado"
              className="max-w-full max-h-full object-contain"
            />
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
                            {etapa.estado.replace('_; ' ')}
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
