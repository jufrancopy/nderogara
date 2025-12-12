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
import { API_BASE_URL } from '@/lib/api';import { formatPrice } from '@/lib/formatters'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

interface Pago {
  id: string
  monto: number
  comprobanteUrl?: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  fechaPago: string
  notas?: string
  item?: {
    id: string
    nombre: string
    costoTotal: number
  }
}

export default function MonitoreoObraPage() {
  const params = useParams()
  const proyectoId = params.id as string

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [pagosPorEtapa, setPagosPorEtapa] = useState<{ [etapaId: string]: number }>({})
  const [costosPorEtapa, setCostosPorEtapa] = useState<{ [etapaId: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [pagoModal, setPagoModal] = useState<{
    isOpen: boolean
    etapaId: string
    etapaNombre: string
    presupuestoItems: any[]
  }>({ isOpen: false, etapaId: '', etapaNombre: '', presupuestoItems: [] })

  const [detallesPagoModal, setDetallesPagoModal] = useState<{
    isOpen: boolean
    etapaId: string
    etapaNombre: string
    pagos: Pago[]
    presupuestoItems?: any[]
  }>({ isOpen: false, etapaId: '', etapaNombre: '', pagos: [] })

  const [etapaToDelete, setEtapaToDelete] = useState<string | null>(null)

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
    const etapasData = response.data.data || []
    setEtapas(etapasData)

    // Obtener el proyecto completo con items del presupuesto
    const proyectoResponse = await api.get(`/proyectos/${proyectoId}`)
    const proyectoCompleto = proyectoResponse.data.data
    const presupuestoItems = proyectoCompleto.presupuestoItems || []

    console.log('Presupuesto items:', presupuestoItems)

    // Calcular costo total por etapa
    const costosPorEtapaTemp: { [etapaId: string]: number } = {}
    
    for (const etapa of etapasData) {
      // Buscar items que coincidan con el nombre de la etapa
      const itemsCoincidentes = presupuestoItems.filter((item: any) => {
        const nombreEtapa = etapa.nombre.toLowerCase().trim()
        const nombreItem = item.item.nombre.toLowerCase().trim()
        
        // Coincidencia exacta o parcial
        return nombreEtapa.includes(nombreItem) || nombreItem.includes(nombreEtapa)
      })

      console.log(`Etapa "${etapa.nombre}":`, itemsCoincidentes.length, 'items encontrados')

      // Sumar el costo total de todos los items coincidentes
      const costoTotal = itemsCoincidentes.reduce((sum: number, item: any) => {
        const costo = Number(item.costoTotal) || 0
        console.log(`  - ${item.item.nombre}: ${costo}`)
        return sum + costo
      }, 0)

      // Si no se encontraron coincidencias, el costo es 0
      costosPorEtapaTemp[etapa.id] = costoTotal
      
      console.log(`Costo total para "${etapa.nombre}": ${costoTotal}`)
    }

    setCostosPorEtapa(costosPorEtapaTemp)

    // Cargar pagos para todas las etapas
    const pagosPorEtapaTemp: { [etapaId: string]: number } = {}
    for (const etapa of etapasData) {
      try {
        const pagosResponse = await api.get(`/proyectos/${proyectoId}/etapas/${etapa.id}/pagos`)
        const pagos = pagosResponse.data.data || []
        const totalPagado = pagos.reduce((sum: number, pago: any) => sum + Number(pago.monto), 0)
        pagosPorEtapaTemp[etapa.id] = totalPagado
      } catch (error) {
        console.error(`Error loading pagos for etapa ${etapa.id}:`, error)
        pagosPorEtapaTemp[etapa.id] = 0
      }
    }
    setPagosPorEtapa(pagosPorEtapaTemp)
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
    doc.setFontSize(18)
    doc.text('INFORME DE ESTADO DE OBRA', 105, 25, { align: 'center' })

    // Información del proyecto
    doc.setFontSize(11)
    doc.text(`Proyecto: ${proyecto?.nombre || 'N/A'}`, 20, 45)
    doc.text(`Fecha del informe: ${fechaActual}`, 20, 55)
    doc.text(`Progreso general: ${progreso}%`, 140, 55)

    // Resumen de etapas en tabla
    const completadas = etapas.filter(e => e.estado === 'COMPLETADA').length
    const enProgreso = etapas.filter(e => e.estado === 'EN_PROGRESO').length
    const pendientes = etapas.filter(e => e.estado === 'PENDIENTE').length
    const atrasadas = etapas.filter(e => e.estado === 'ATRASADA').length

    doc.setFontSize(14)
    doc.text('RESUMEN DE ETAPAS', 20, 75)

    const resumenData = [
      ['Estado', 'Cantidad'],
      ['Completadas', completadas.toString()],
      ['En Progreso', enProgreso.toString()],
      ['Pendientes', pendientes.toString()],
      ['Atrasadas', atrasadas.toString()],
      ['Total', etapas.length.toString()]
    ]

    autoTable(doc, {
      startY: 80,
      head: [resumenData[0]],
      body: resumenData.slice(1),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 20, right: 20 }
    })

    // Detalle de etapas en tabla
    let finalY = 80 + 50 + 20 // Después del resumen

    if (finalY > 250) {
      doc.addPage()
      finalY = 30
    }

    doc.setFontSize(14)
    doc.text('DETALLE DE ETAPAS', 20, finalY)

    const etapasData = etapas.map(etapa => {
      const totalPagado = pagosPorEtapa[etapa.id] || 0
      const costoTotal = costosPorEtapa[etapa.id] || 0

      // Si no hay costo calculado pero hay pagos, asumir que el total es lo pagado (estimación)
      const costoTotalFinal = costoTotal > 0 ? costoTotal : (totalPagado > 0 ? totalPagado : 0)
      const pendiente = costoTotalFinal - totalPagado

      return [
        etapa.nombre,
        etapa.estado.replace('_', ' '),
        costoTotalFinal > 0 ? formatPrice(costoTotalFinal) : '₲0',
        totalPagado > 0 ? formatPrice(totalPagado) : '₲0',
        pendiente !== 0 ? formatPrice(Math.abs(pendiente)) : '₲0'
      ]
    })

    const etapasHeaders = ['Etapa', 'Estado', 'Total', 'Pagado', 'Pendiente']

    autoTable(doc, {
      startY: finalY + 5,
      head: [etapasHeaders],
      body: etapasData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' }, // Etapa
        1: { cellWidth: 30, halign: 'center' }, // Estado
        2: { cellWidth: 25, halign: 'right' }, // Total
        3: { cellWidth: 25, halign: 'right' }, // Pagado
        4: { cellWidth: 25, halign: 'right' } // Pendiente
      },
      margin: { left: 15, right: 15 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
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

  const abrirModalPago = async (etapaId: string, etapaNombre: string) => {
    try {
      // Obtener los items del presupuesto relacionados con esta etapa
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyectoCompleto = response.data.data
      const presupuestoItems = proyectoCompleto.presupuestoItems || []

      // Filtrar items que correspondan a esta etapa (por nombre)
      const itemsEtapa = presupuestoItems.filter((item: any) =>
        etapaNombre.includes(item.item.nombre) || item.item.nombre.includes(etapaNombre)
      )

      // Obtener pagos existentes de esta etapa
      const pagosResponse = await api.get(`/proyectos/${proyectoId}/etapas/${etapaId}/pagos`)
      const pagosExistentes = pagosResponse.data.data || []

      // Agregar información de pagos a cada presupuestoItem
      const itemsConPagos = itemsEtapa.map((presupuestoItem: any) => {
        console.log('Procesando presupuestoItem:', presupuestoItem)
        console.log('presupuestoItem.item.id:', presupuestoItem.item?.id)

        // Filtrar pagos que corresponden a este item
        const pagosDelItem = pagosExistentes.filter((pago: any) => {
          console.log('Comparando pago.itemId:', pago.itemId, 'con presupuestoItem.item.id:', presupuestoItem.item?.id)
          return pago.itemId === presupuestoItem.item?.id
        })

        console.log('Pagos encontrados para este item:', pagosDelItem.length, pagosDelItem)

        return {
          ...presupuestoItem,
          pagos: pagosDelItem
        }
      })

      setPagoModal({
        isOpen: true,
        etapaId,
        etapaNombre,
        presupuestoItems: itemsConPagos
      })
    } catch (error) {
      console.error('Error fetching presupuesto items:', error)
      toast.error('Error al cargar items para pago')
    }
  }

  const cerrarModalPago = () => {
    setPagoModal({ isOpen: false, etapaId: '', etapaNombre: '', presupuestoItems: [] })
  }

  const abrirModalDetallesPago = async (etapaId: string, etapaNombre: string) => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}/etapas/${etapaId}/pagos`)
      const pagos = response.data.data || []

      // Obtener los items del presupuesto para calcular totales
      const proyectoResponse = await api.get(`/proyectos/${proyectoId}`)
      const proyectoCompleto = proyectoResponse.data.data
      const presupuestoItems = proyectoCompleto.presupuestoItems || []

      setDetallesPagoModal({
        isOpen: true,
        etapaId,
        etapaNombre,
        pagos,
        presupuestoItems
      })
    } catch (error) {
      console.error('Error fetching pagos:', error)
      toast.error('Error al cargar pagos')
    }
  }

  const cerrarModalDetallesPago = () => {
    setDetallesPagoModal({ isOpen: false, etapaId: '', etapaNombre: '', pagos: [] })
  }

  const handlePago = async (itemId: string, monto: number, comprobanteFile?: File) => {
    try {
      let comprobanteUrl = ''

      // Subir comprobante si existe
      if (comprobanteFile) {
        console.log('Subiendo comprobante:', comprobanteFile.name, 'tipo:', comprobanteFile.type)

        const formData = new FormData()
        formData.append('file', comprobanteFile)

        const uploadResponse = await fetch('${API_BASE_URL}/upload/comprobante', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })

        console.log('Upload response status:', uploadResponse.status)

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          console.log('Upload response data:', uploadData)
          console.log('uploadData.data:', uploadData.data)
          console.log('uploadData.data.url:', uploadData.data?.url)

          if (uploadData.data && uploadData.data.url) {
            comprobanteUrl = uploadData.data.url
            console.log('Comprobante URL asignada correctamente:', comprobanteUrl)
          } else {
            console.error('No se encontró URL en respuesta del servidor')
            throw new Error('Respuesta del servidor inválida')
          }
        } else {
          const errorText = await uploadResponse.text()
          console.error('Upload error response:', errorText)
          throw new Error('Error al subir comprobante')
        }
      }

      // Crear pago
      const pagoData = {
        etapaId: pagoModal.etapaId,
        itemId: itemId || undefined,
        monto,
        comprobanteUrl: comprobanteUrl || undefined,
        notas: 'Pago registrado desde monitoreo de obra'
      }

      console.log('Creando pago con datos:', pagoData)
      console.log('comprobanteUrl value:', comprobanteUrl)
      console.log('comprobanteUrl type:', typeof comprobanteUrl)
      console.log('comprobanteUrl length:', comprobanteUrl ? comprobanteUrl.length : 0)

      const pagoResponse = await api.post(`/proyectos/${proyectoId}/etapas/${pagoModal.etapaId}/pagos`, pagoData)

      console.log('Pago creado exitosamente:', pagoResponse.data)

      toast.success('Pago registrado exitosamente')
      cerrarModalPago()
      // Recargar etapas para mostrar el botón "Ver Pagos" actualizado
      fetchEtapas()
    } catch (error: any) {
      console.error('Error creating pago:', error)
      toast.error(error.response?.data?.error || 'Error al registrar pago')
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
                  Usa "Configurar Etapas" para crear las etapas del proyecto
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
                        {etapa.estado === 'COMPLETADA' && (
                          <>
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              💰
                            </span>
                            <button
                              onClick={() => abrirModalDetallesPago(etapa.id, etapa.nombre)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              👁️ Ver Pagos
                            </button>
                            <button
                              onClick={() => abrirModalPago(etapa.id, etapa.nombre)}
                              className="bg-[#38603B] text-white px-3 py-1 rounded text-sm hover:bg-[#2d4a2f]"
                            >
                              💰 Pagar
                            </button>
                          </>
                        )}
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

      {/* Componente para cada item de pago */}
      {/* Modal de pago */}
      {pagoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pagar Etapa</h2>
                  <p className="text-gray-600">{pagoModal.etapaNombre}</p>
                </div>
                <button
                  onClick={cerrarModalPago}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {pagoModal.presupuestoItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay items asociados a esta etapa para pagar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Selecciona el item que deseas pagar y sube el comprobante correspondiente:
                  </p>

                  {pagoModal.presupuestoItems.map((presupuestoItem: any) => (
                    <PagoItemCard
                      key={presupuestoItem.id}
                      presupuestoItem={presupuestoItem}
                      onPago={(itemId, monto, comprobante) => handlePago(itemId, monto, comprobante)}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={cerrarModalPago}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de pagos */}
      {detallesPagoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pagos de Etapa</h2>
                  <p className="text-gray-600">{detallesPagoModal.etapaNombre}</p>
                </div>
                <button
                  onClick={cerrarModalDetallesPago}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {detallesPagoModal.pagos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay pagos registrados para esta etapa</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar pagos por item */}
                  {(() => {
                    const pagosPorItem: { [key: string]: typeof detallesPagoModal.pagos } = {}

                    detallesPagoModal.pagos.forEach(pago => {
                      const itemKey = pago.item?.id || 'sin-item'
                      if (!pagosPorItem[itemKey]) {
                        pagosPorItem[itemKey] = []
                      }
                      pagosPorItem[itemKey].push(pago)
                    })

                    return Object.entries(pagosPorItem).map(([itemKey, pagosItem]) => {
                      // Calcular el total adeudado desde el presupuesto del proyecto
                      const pagoEjemplo = pagosItem[0]
                      let totalAdeudado = 0

                      // Buscar el item en el presupuesto para calcular el costo total
                      if (pagoEjemplo?.item?.id) {
                        // Buscar en presupuestoItems para obtener la cantidad y calcular el total
                        const presupuestoItem = detallesPagoModal.presupuestoItems?.find((pi: any) =>
                          pi.item?.id === pagoEjemplo.item!.id
                        )
                        if (presupuestoItem) {
                          totalAdeudado = Number(presupuestoItem.costoTotal) || 0
                        }
                      }

                      const totalPagadoAprobado = pagosItem
                        .filter(p => p.estado === 'APROBADO')
                        .reduce((sum, p) => sum + Number(p.monto), 0)

                      const totalPagadoPendiente = pagosItem
                        .filter(p => p.estado === 'PENDIENTE')
                        .reduce((sum, p) => sum + Number(p.monto), 0)

                      const totalPagado = totalPagadoAprobado + totalPagadoPendiente
                      const pendientePago = totalAdeudado - totalPagado

                      const item = pagosItem[0]?.item

                      return (
                        <div key={itemKey} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item ? item.nombre : 'Pagos varios'}
                              </h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>Total adeudado: {formatPrice(totalAdeudado)}</p>
                                <p>Total pagado: {formatPrice(totalPagado)}</p>
                                <p>Pendiente: {formatPrice(pendientePago)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {totalAdeudado > 0 && (
                                <div className="w-24 bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.min((totalPagado / totalAdeudado) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              )}
                              {pendientePago <= 0 ? (
                                <span className="text-green-600 font-medium text-sm">✅ Completado</span>
                              ) : (
                                <span className="text-orange-600 font-medium text-sm">⏳ Pendiente</span>
                              )}
                            </div>
                          </div>

                          {/* Lista de pagos del item */}
                          <div className="space-y-2 mt-4">
                            <h5 className="text-sm font-medium text-gray-700">Historial de pagos:</h5>
                            {pagosItem.map((pago) => (
                              <div key={pago.id} className="bg-white rounded border p-3">
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

                                {(() => {
                                  console.log('Checking pago:', pago);
                                  console.log('comprobanteUrl:', pago.comprobanteUrl);
                                  return pago.comprobanteUrl && (
                                    <div className="mt-3 p-3 bg-white rounded border">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-gray-600 text-sm font-medium">Comprobante:</span>
                                        {pago.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                          <span className="text-red-600 text-sm">📄 PDF</span>
                                        ) : (
                                          <span className="text-green-600 text-sm">🖼️ Imagen</span>
                                        )}
                                      </div>
                                      {pago.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                        <div className="flex items-center justify-center p-4 bg-red-50 rounded">
                                          <a
                                            href={`${API_BASE_URL}${pago.comprobanteUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                                          >
                                            Ver comprobante PDF
                                          </a>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <img
                                            src={`${API_BASE_URL}${pago.comprobanteUrl}`}
                                            alt="Comprobante de pago"
                                            className="w-full max-w-md h-auto rounded border shadow-sm"
                                            onError={(e) => {
                                              console.error('Error loading image:', `${API_BASE_URL}${pago.comprobanteUrl}`);
                                              console.log('Pago data:', pago);
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                            onLoad={() => {
                                              console.log('Image loaded successfully:', `${API_BASE_URL}${pago.comprobanteUrl}`);
                                            }}
                                          />
                                          <div className="flex items-center space-x-2">
                                            <span className="text-green-600 text-sm">🖼️</span>
                                            <a
                                              href={`${API_BASE_URL}${pago.comprobanteUrl}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:text-blue-800 text-sm underline"
                                            >
                                              Ver imagen completa
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={cerrarModalDetallesPago}
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

// Componente para cada item de pago
function PagoItemCard({ presupuestoItem, onPago }: {
  presupuestoItem: any
  onPago: (itemId: string, monto: number, comprobante?: File) => void
}) {
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [montoPago, setMontoPago] = useState<string>('')
  const [montoDisplay, setMontoDisplay] = useState<string>('')

  // Calcular cuánto se ha pagado ya (considerar todos los pagos, no solo aprobados)
  const totalPagado = presupuestoItem.pagos?.reduce((sum: number, pago: any) =>
    sum + Number(pago.monto), 0) || 0
  const totalAdeudado = Number(presupuestoItem.costoTotal)
  const pendientePago = totalAdeudado - totalPagado

  const handleMontoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    // Si el campo está vacío, mostrar 0
    if (!value) {
      setMontoDisplay('0');
      setMontoPago('0');
      return;
    }

    // Permitir solo números
    value = value.replace(/[^\d]/g, '');

    // Si después de limpiar no hay valor, mostrar 0
    if (!value) {
      setMontoDisplay('0');
      setMontoPago('0');
      return;
    }

    // Validar que no exceda el pendiente
    const numericValue = parseInt(value, 10);
    if (numericValue > pendientePago) {
      toast.error(`El monto no puede exceder ${formatPrice(pendientePago)}`)
      return;
    }

    // Convertir a número y formatear
    const formattedValue = numericValue.toLocaleString('es-PY');
    setMontoDisplay(formattedValue);
    setMontoPago(value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setComprobanteFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comprobanteFile) {
      toast.error('Debes subir un comprobante de pago')
      return
    }
    if (!montoPago || parseFloat(montoPago) <= 0) {
      toast.error('Debes ingresar un monto válido')
      return
    }

    onPago(presupuestoItem.item.id, parseFloat(montoPago), comprobanteFile)
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{presupuestoItem.item.nombre}</h4>
          <p className="text-sm text-gray-600">
            Cantidad: {presupuestoItem.cantidadMedida} {presupuestoItem.item.unidadMedida}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            <p>Pagado: {formatPrice(totalPagado)} / {formatPrice(totalAdeudado)}</p>
            <p>Pendiente: {formatPrice(pendientePago)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">{formatPrice(presupuestoItem.costoTotal)}</p>
          {totalPagado > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(totalPagado / totalAdeudado) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {pendientePago <= 0 ? (
        <div className="text-center py-4">
          <span className="text-green-600 font-medium">✅ Item completamente pagado</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a Pagar (₲)
              </label>
              <input
                type="text"
                value={montoDisplay}
                onChange={handleMontoChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {formatPrice(pendientePago)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

          <button
            type="submit"
            className="w-full bg-[#38603B] text-white py-2 px-4 rounded-md hover:bg-[#2d4a2f] transition-colors"
          >
            Registrar Pago de {montoDisplay ? formatPrice(parseFloat(montoPago) || 0) : '₲0'}
          </button>
        </form>
      )}
    </div>
  )
}
