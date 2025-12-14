'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface EtapaForm {
  id?: string
  nombre: string
  descripcion: string
  orden: number
  fechaInicioPlaneada: string
  fechaFinPlaneada: string
}

interface Proyecto {
  id: string
  nombre: string
}

export default function ConfigurarEtapasPage() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string
  
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [etapas, setEtapas] = useState<EtapaForm[]>([])
  const [itemsDisponibles, setItemsDisponibles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProyecto()
    fetchEtapas()
    fetchItemsProyecto()
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
      setEtapas(etapasData.map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion || '',
        orden: e.orden,
        fechaInicioPlaneada: e.fechaInicioPlaneada ? e.fechaInicioPlaneada.split('T')[0] : '',
        fechaFinPlaneada: e.fechaFinPlaneada ? e.fechaFinPlaneada.split('T')[0] : ''
      })))
    } catch (error) {
      console.error('Error fetching etapas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchItemsProyecto = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyecto = response.data.data
      setItemsDisponibles(proyecto.presupuestoItems || [])
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const agregarEtapa = () => {
    const nuevaEtapa: EtapaForm = {
      nombre: '',
      descripcion: '',
      orden: etapas.length + 1,
      fechaInicioPlaneada: '',
      fechaFinPlaneada: ''
    }
    setEtapas([...etapas, nuevaEtapa])
  }

  const crearBorradorEtapas = () => {
    if (itemsDisponibles.length === 0) {
      toast.error('No hay items en el proyecto para crear etapas')
      return
    }

    const nuevasEtapas: EtapaForm[] = itemsDisponibles.map((item, index) => ({
      nombre: item.item.nombre,
      descripcion: `Etapa de construcción para ${item.item.nombre}`,
      orden: index + 1,
      fechaInicioPlaneada: '',
      fechaFinPlaneada: ''
    }))

    setEtapas(nuevasEtapas)
    toast.success(`Se crearon ${nuevasEtapas.length} etapas basadas en los items del proyecto`)
  }

  const actualizarEtapa = (index: number, campo: keyof EtapaForm, valor: string | number) => {
    const nuevasEtapas = [...etapas]
    nuevasEtapas[index] = { ...nuevasEtapas[index], [campo]: valor }
    setEtapas(nuevasEtapas)
  }

  const eliminarEtapa = (index: number) => {
    const nuevasEtapas = etapas.filter((_, i) => i !== index)
    // Reordenar
    nuevasEtapas.forEach((etapa, i) => {
      etapa.orden = i + 1
    })
    setEtapas(nuevasEtapas)
  }

  const guardarEtapas = async () => {
    setSaving(true)
    try {
      // Validar que todas las etapas tengan nombre
      if (etapas.some(e => !e.nombre.trim())) {
        toast.error('Todas las etapas deben tener nombre')
        return
      }

      // Guardar cada etapa
      for (const etapa of etapas) {
        const etapaData = {
          nombre: etapa.nombre,
          descripcion: etapa.descripcion,
          orden: etapa.orden,
          fechaInicioPlaneada: etapa.fechaInicioPlaneada || undefined,
          fechaFinPlaneada: etapa.fechaFinPlaneada || undefined
        }

        if (etapa.id) {
          // Actualizar etapa existente
          await api.put(`/proyectos/${proyectoId}/etapas/${etapa.id}`, etapaData)
        } else {
          // Crear nueva etapa
          await api.post(`/proyectos/${proyectoId}/etapas`, etapaData)
        }
      }

      toast.success('Etapas guardadas exitosamente')
      router.push(`/proyectos/${proyectoId}/obra`)
    } catch (error) {
      console.error('Error saving etapas:', error)
      toast.error('Error al guardar las etapas')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href={`/proyectos/${proyectoId}/obra`}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configurar Etapas</h2>
                <p className="text-gray-600">{proyecto?.nombre}</p>
              </div>
            </div>
            <button
              onClick={agregarEtapa}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Etapa
            </button>
          </div>

          {/* Etapas Form */}
          <div className="space-y-4">
            {etapas.map((etapa, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-medium">
                      {etapa.orden}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Etapa {etapa.orden}
                    </h3>
                  </div>
                  <button
                    onClick={() => eliminarEtapa(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item del Proyecto *
                    </label>
                    <select
                      value={etapa.nombre}
                      onChange={(e) => actualizarEtapa(index, 'nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar item</option>
                      {itemsDisponibles
                        .filter(item => !etapas.some((e, i) => i !== index && e.nombre === item.item.nombre))
                        .map(item => (
                          <option key={item.id} value={item.item.nombre}>
                            {item.item.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={etapa.descripcion}
                      onChange={(e) => actualizarEtapa(index, 'descripcion', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción de las actividades de esta etapa..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio Planeada
                    </label>
                    <input
                      type="date"
                      value={etapa.fechaInicioPlaneada}
                      onChange={(e) => actualizarEtapa(index, 'fechaInicioPlaneada', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin Planeada
                    </label>
                    <input
                      type="date"
                      value={etapa.fechaFinPlaneada}
                      onChange={(e) => actualizarEtapa(index, 'fechaFinPlaneada', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {etapas.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No hay etapas configuradas</p>
                <p className="text-sm text-gray-400 mt-2">
                  Haz clic en "Agregar Etapa" para comenzar
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {etapas.length > 0 && (
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
              <Link
                href={`/proyectos/${proyectoId}/obra`}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </Link>
              <button
                onClick={guardarEtapas}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar Etapas'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
