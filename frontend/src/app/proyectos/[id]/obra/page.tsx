'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, ArrowLeft, Plus, CheckCircle, Clock, AlertTriangle,
  Package, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatPrice } from '@/lib/formatters'
import jsPDF from 'jspdf'

interface Etapa {
  id: string
  nombre: string
  descripcion?: string
  orden: number
  fechaInicioPlaneada?: string
  fechaFinPlaneada?: string
  fechaInicioReal?: string
  fechaFinReal?: string
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'ATRASADA' | 'CANCELADA'
  observaciones?: string
  materialesExtra: MaterialExtra[]
}

interface MaterialExtra {
  id: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
  motivo?: string
  material: {
    nombre: string
    unidad: string
  }
}

interface Proyecto {
  id: string
  nombre: string
  estado: string
}

export default function MonitoreoObraPage() {
  const params = useParams()
  const proyectoId = params.id as string
  
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProyecto()
    fetchEtapas()
  }, [proyectoId])

  const fetchProyecto = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}`)
      setProyecto(response.data.data)
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      toast.error('Error al cargar el proyecto')
    }
  }

  const fetchEtapas = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}/etapas`)
      setEtapas(response.data.data || [])
    } catch (error) {
      console.error('Error fetching etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularProgreso = () => {
    if (etapas.length === 0) return 0
    const completadas = etapas.filter(e => e.estado === 'COMPLETADA').length
    return Math.round((completadas / etapas.length) * 100)
  }

  const getEstadoColor = (etapa: Etapa) => {
    switch (etapa.estado) {
      case 'COMPLETADA': return 'bg-green-100 text-green-800'
      case 'EN_PROGRESO': return 'bg-blue-100 text-blue-800'
      case 'ATRASADA': return 'bg-red-100 text-red-800'
      case 'PENDIENTE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (etapa: Etapa) => {
    switch (etapa.estado) {
      case 'COMPLETADA': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'EN_PROGRESO': return <Clock className="h-5 w-5 text-blue-600" />
      case 'ATRASADA': return <AlertTriangle className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const crearBorradorEtapas = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyecto = response.data.data
      const items = proyecto.presupuestoItems || []
      
      if (items.length === 0) {
        toast.error('No hay items en el proyecto para crear etapas')
        return
      }

      // Crear etapas automáticamente
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        await api.post(`/proyectos/${proyectoId}/etapas`, {
          nombre: item.item.nombre,
          descripcion: `Etapa de construcción para ${item.item.nombre}`,
          orden: i + 1
        })
      }

      toast.success(`Se crearon ${items.length} etapas automáticamente`)
      fetchEtapas()
    } catch (error) {
      console.error('Error creating borrador:', error)
      toast.error('Error al crear el borrador de etapas')
    }
  }

  const [etapaToDelete, setEtapaToDelete] = useState<string | null>(null)

  const eliminarEtapa = (etapaId: string) => {
    setEtapaToDelete(etapaId)
  }

  const generarPDFCostos = async () => {
    try {
      // Obtener datos completos del proyecto con materiales
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyectoCompleto = response.data.data
      
      const doc = new jsPDF()
      const fechaActual = new Date().toLocaleDateString('es-PY')
      
      // Título
      doc.setFontSize(20)
      doc.text('INFORME DE COSTOS DE OBRA', 20, 30)
      
      // Información del proyecto
      doc.setFontSize(12)
      doc.text(`Proyecto: ${proyecto?.nombre || 'N/A'}`, 20, 50)
      doc.text(`Fecha del informe: ${fechaActual}`, 20, 60)
      
      let yPos = 80
      let costoTotalProyecto = 0
      
      // Obtener materiales para cada item
      for (const presupuestoItem of proyectoCompleto.presupuestoItems || []) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 30
        }
        
        // Título del item
        doc.setFontSize(14)
        doc.text(`ITEM: ${presupuestoItem.item.nombre}`, 20, yPos)
        yPos += 10
        
        doc.setFontSize(10)
        doc.text(`Cantidad: ${presupuestoItem.cantidadMedida} ${presupuestoItem.item.unidadMedida}`, 25, yPos)
        yPos += 10
        
        // Obtener materiales del item
        try {
          const itemResponse = await api.get(`/items/${presupuestoItem.item.id}`)
          const itemCompleto = itemResponse.data.data
          
          if (itemCompleto.materialesPorItem?.length > 0) {
            doc.text('Materiales:', 25, yPos)
            yPos += 8
            
            let costoMaterialesItem = 0
            
            itemCompleto.materialesPorItem.forEach((materialItem: any) => {
              const costoUnitario = Number(materialItem.material.precioUnitario)
              const cantidadPorUnidad = Number(materialItem.cantidadPorUnidad)
              const costoTotalMaterial = costoUnitario * cantidadPorUnidad * Number(presupuestoItem.cantidadMedida)
              
              costoMaterialesItem += costoTotalMaterial
              
              doc.text(`• ${materialItem.material.nombre}`, 30, yPos)
              doc.text(`${cantidadPorUnidad} ${materialItem.material.unidad} x ${formatPrice(costoUnitario)} = ${formatPrice(costoTotalMaterial)}`, 35, yPos + 6)
              yPos += 15
            })
            
            doc.text(`Subtotal Materiales: ${formatPrice(costoMaterialesItem)}`, 25, yPos)
            yPos += 8
          }
        } catch (error) {
          console.error('Error fetching item materials:', error)
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
      if (proyectoCompleto.margenGanancia) {
        const margen = costoTotalProyecto * (Number(proyectoCompleto.margenGanancia) / 100)
        const precioFinal = costoTotalProyecto + margen
        
        yPos += 15
        doc.setFontSize(12)
        doc.text(`Margen de ganancia (${proyectoCompleto.margenGanancia}%): ${formatPrice(margen)}`, 20, yPos)
        yPos += 10
        doc.setFontSize(16)
        doc.text(`PRECIO FINAL: ${formatPrice(precioFinal)}`, 20, yPos)
      }
      
      // Descargar
      doc.save(`Costos_Obra_${proyecto?.nombre?.replace(/\s+/g, '_')}_${fechaActual.replace(/\//g, '-')}.pdf`)
      toast.success('Informe de costos PDF descargado')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el informe de costos')
    }
  }

  const generarPDF = () => {
    const doc = new jsPDF()
    const fechaActual = new Date().toLocaleDateString('es-PY')
    
    // Título
    doc.setFontSize(20)
    doc.text('INFORME DE ESTADO DE OBRA', 20, 30)
    
    // Información del proyecto
    doc.setFontSize(12)
    doc.text(`Proyecto: ${proyecto?.nombre || 'N/A'}`, 20, 50)
    doc.text(`Fecha del informe: ${fechaActual}`, 20, 60)
    doc.text(`Progreso general: ${progreso}%`, 20, 70)
    
    // Resumen
    const completadas = etapas.filter(e => e.estado === 'COMPLETADA').length
    const enProgreso = etapas.filter(e => e.estado === 'EN_PROGRESO').length
    const pendientes = etapas.filter(e => e.estado === 'PENDIENTE').length
    const atrasadas = etapas.filter(e => e.estado === 'ATRASADA').length
    
    doc.text('RESUMEN DE ETAPAS:', 20, 90)
    doc.text(`• Completadas: ${completadas}`, 25, 100)
    doc.text(`• En progreso: ${enProgreso}`, 25, 110)
    doc.text(`• Pendientes: ${pendientes}`, 25, 120)
    doc.text(`• Atrasadas: ${atrasadas}`, 25, 130)
    
    // Detalle de etapas
    doc.text('DETALLE DE ETAPAS:', 20, 150)
    
    let yPos = 160
    etapas.forEach((etapa, index) => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 30
      }
      
      doc.setFontSize(11)
      doc.text(`${etapa.orden}. ${etapa.nombre}`, 20, yPos)
      doc.text(`Estado: ${etapa.estado.replace('_', ' ')}`, 25, yPos + 10)
      
      if (etapa.fechaInicioPlaneada) {
        doc.text(`Inicio planeado: ${new Date(etapa.fechaInicioPlaneada).toLocaleDateString('es-PY')}`, 25, yPos + 20)
      }
      if (etapa.fechaFinPlaneada) {
        doc.text(`Fin planeado: ${new Date(etapa.fechaFinPlaneada).toLocaleDateString('es-PY')}`, 25, yPos + 30)
      }
      if (etapa.fechaInicioReal) {
        doc.text(`Inicio real: ${new Date(etapa.fechaInicioReal).toLocaleDateString('es-PY')}`, 25, yPos + 40)
      }
      if (etapa.fechaFinReal) {
        doc.text(`Fin real: ${new Date(etapa.fechaFinReal).toLocaleDateString('es-PY')}`, 25, yPos + 50)
      }
      
      if (etapa.materialesExtra.length > 0) {
        const costoExtra = etapa.materialesExtra.reduce((sum, m) => sum + Number(m.costoTotal), 0)
        doc.text(`Materiales extra: ${formatPrice(costoExtra)}`, 25, yPos + 60)
      }
      
      yPos += 80
    })
    
    // Descargar
    doc.save(`Informe_Obra_${proyecto?.nombre?.replace(/\s+/g, '_')}_${fechaActual.replace(/\//g, '-')}.pdf`)
    toast.success('Informe PDF descargado')
  }

  const confirmarEliminar = async () => {
    if (!etapaToDelete) return
    
    try {
      await api.delete(`/proyectos/${proyectoId}/etapas/${etapaToDelete}`)
      toast.success('Etapa eliminada')
      fetchEtapas()
      setEtapaToDelete(null)
    } catch (error) {
      console.error('Error deleting etapa:', error)
      toast.error('Error al eliminar etapa')
    }
  }

  const updateEstadoEtapa = async (etapaId: string, nuevoEstado: string) => {
    try {
      const updateData: any = { estado: nuevoEstado }
      
      if (nuevoEstado === 'EN_PROGRESO' && !etapas.find(e => e.id === etapaId)?.fechaInicioReal) {
        updateData.fechaInicioReal = new Date().toISOString()
      }
      
      if (nuevoEstado === 'COMPLETADA') {
        updateData.fechaFinReal = new Date().toISOString()
      }

      await api.put(`/proyectos/${proyectoId}/etapas/${etapaId}`, updateData)
      toast.success('Estado actualizado')
      fetchEtapas()
    } catch (error) {
      console.error('Error updating etapa:', error)
      toast.error('Error al actualizar estado')
    }
  }

  const progreso = calcularProgreso()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando monitoreo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">Build Manager</h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href={`/proyectos/${proyectoId}`}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Monitoreo de Obra</h2>
                <p className="text-gray-600">{proyecto?.nombre}</p>
              </div>
            </div>
            <Link
              href={`/proyectos/${proyectoId}/obra/configurar`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              {etapas.length > 0 ? 'Editar Etapas' : 'Configurar Etapas'}
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Progreso General</h3>
              <span className="text-2xl font-bold text-blue-600">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{etapas.filter(e => e.estado === 'COMPLETADA').length} completadas</span>
              <span>{etapas.length} total</span>
            </div>
          </div>

          {/* Etapas */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Etapas de Construcción</h3>
            <div className="flex space-x-3">
              <button
                onClick={crearBorradorEtapas}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
              >
                <Building2 className="h-4 w-4 mr-2" />
                {etapas.length === 0 ? 'Crear Borrador' : 'Recrear Borrador'}
              </button>
              {etapas.length > 0 && (
                <>
                  <button
                    onClick={generarPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Informe de Estado
                  </button>
                  <button
                    onClick={generarPDFCostos}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Informe de Costos
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {etapas.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay etapas configuradas</p>
                <p className="text-sm text-gray-400 mt-2">
                  Usa "Crear Borrador" en la barra de progreso o "Editar Etapas" para configurar
                </p>
              </div>
            ) : (
              etapas.map((etapa) => (
                <div key={etapa.id} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium">
                          {etapa.orden}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{etapa.nombre}</h3>
                          {etapa.descripcion && (
                            <p className="text-sm text-gray-500">{etapa.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(etapa)}`}>
                          {etapa.estado.replace('_', ' ')}
                        </span>
                        {getEstadoIcon(etapa)}
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Inicio planeado:</span>
                        <p className="font-medium">
                          {etapa.fechaInicioPlaneada ? new Date(etapa.fechaInicioPlaneada).toLocaleDateString() : 'No definido'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fin planeado:</span>
                        <p className="font-medium">
                          {etapa.fechaFinPlaneada ? new Date(etapa.fechaFinPlaneada).toLocaleDateString() : 'No definido'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Inicio real:</span>
                        <p className="font-medium">
                          {etapa.fechaInicioReal ? new Date(etapa.fechaInicioReal).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fin real:</span>
                        <p className="font-medium">
                          {etapa.fechaFinReal ? new Date(etapa.fechaFinReal).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        {etapa.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => updateEstadoEtapa(etapa.id, 'EN_PROGRESO')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Iniciar
                          </button>
                        )}
                        {etapa.estado === 'EN_PROGRESO' && (
                          <button
                            onClick={() => updateEstadoEtapa(etapa.id, 'COMPLETADA')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                          >
                            Completar
                          </button>
                        )}
                        <button
                          onClick={() => eliminarEtapa(etapa.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                      
                      {etapa.materialesExtra.length > 0 && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Materiales extra:</span> {formatPrice(
                            etapa.materialesExtra.reduce((sum, m) => sum + Number(m.costoTotal), 0)
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal de confirmación para eliminar */}
      {etapaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de eliminar esta etapa? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => setEtapaToDelete(null)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={confirmarEliminar}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}