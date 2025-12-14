'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  FileText
} from 'lucide-react'
import api from '@/lib/api'
import { formatPrice } from '@/lib/formatters'

interface Proyecto {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  superficieTotal?: number
  fechaInicio?: string
  fechaFinEstimada?: string
  presupuestoItems?: Array<{
    id: string
    item: {
      id: string
      nombre: string
    }
    costoTotal: number
  }>
  etapasObra?: Array<{
    id: string
    nombre: string
    estado: string
    orden: number
  }>
}

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  leida: boolean
  createdAt: string
  proyectoId?: string
}

interface DashboardData {
  proyectos: Proyecto[]
  notificaciones: Notificacion[]
  stats: {
    totalProyectos: number
    proyectosActivos: number
    proyectosCompletados: number
    totalPresupuesto: number
  }
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

export default function ConstructorDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notificacionesSinLeer, setNotificacionesSinLeer] = useState(0)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.rol !== 'CONSTRUCTOR') {
      router.push('/proyectos')
      return
    }

    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/constructor/dashboard')
      if (response.data.success) {
        setData(response.data.data)
        setNotificacionesSinLeer(response.data.data.notificaciones.filter((n: Notificacion) => !n.leida).length)
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const marcarNotificacionLeida = async (notificacionId: string) => {
    try {
      await api.put(`/notificaciones/${notificacionId}/leer`)
      setData(prev => prev ? {
        ...prev,
        notificaciones: prev.notificaciones.map(n =>
          n.id === notificacionId ? { ...n, leida: true } : n
        )
      } : null)
      setNotificacionesSinLeer(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
    }
  }

  const calcularProgresoProyecto = (proyecto: Proyecto) => {
    if (!proyecto.etapasObra || proyecto.etapasObra.length === 0) return 0

    const etapasCompletadas = proyecto.etapasObra.filter(etapa => etapa.estado === 'COMPLETADA').length
    return Math.round((etapasCompletadas / proyecto.etapasObra.length) * 100)
  }

  const getProyectosEnMonitoreo = () => {
    if (!data?.proyectos) return []

    return data.proyectos.filter(proyecto =>
      proyecto.etapasObra?.some(etapa => etapa.estado === 'EN_PROGRESO')
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Error al cargar el dashboard</p>
          <Link href="/proyectos" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Volver a proyectos
          </Link>
        </div>
      </div>
    )
  }

  const proyectosEnMonitoreo = getProyectosEnMonitoreo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Constructor</h1>
              <p className="text-gray-600 mt-2">Gestiona tus proyectos y mantente al día con las actualizaciones</p>
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
                <Bell className="h-6 w-6" />
                {notificacionesSinLeer > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificacionesSinLeer}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalProyectos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Proyectos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.proyectosActivos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.proyectosCompletados}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(data.stats.totalPresupuesto)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones y Alertas */}
          {data.notificaciones.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificaciones
              </h2>
              <div className="space-y-3">
                {data.notificaciones.slice(0, 5).map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notificacion.leida
                        ? 'bg-gray-50 border-gray-300'
                        : `border-${
                            notificacion.tipo === 'warning' ? 'yellow' :
                            notificacion.tipo === 'error' ? 'red' :
                            notificacion.tipo === 'success' ? 'green' : 'blue'
                          }-500 bg-${
                            notificacion.tipo === 'warning' ? 'yellow' :
                            notificacion.tipo === 'error' ? 'red' :
                            notificacion.tipo === 'success' ? 'green' : 'blue'
                          }-50`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{notificacion.titulo}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notificacion.mensaje}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notificacion.createdAt).toLocaleDateString('es-PY')}
                        </p>
                      </div>
                      {!notificacion.leida && (
                        <button
                          onClick={() => marcarNotificacionLeida(notificacion.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm underline ml-4"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                    {notificacion.proyectoId && (
                      <Link
                        href={`/proyectos/${notificacion.proyectoId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block"
                      >
                        Ver proyecto →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proyectos en Monitoreo Activo */}
          {proyectosEnMonitoreo.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                Proyectos en Monitoreo Activo
              </h2>
              <div className="space-y-4">
                {proyectosEnMonitoreo.map((proyecto) => (
                  <div key={proyecto.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{proyecto.nombre}</h3>
                        <p className="text-sm text-gray-600">{proyecto.descripcion}</p>
                      </div>
                      <Link
                        href={`/proyectos/${proyecto.id}/obra`}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
                      >
                        Ir al Monitoreo
                      </Link>
                    </div>

                    {/* Etapas en progreso */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Etapas activas:</p>
                      {proyecto.etapasObra
                        ?.filter(etapa => etapa.estado === 'EN_PROGRESO')
                        .map(etapa => (
                          <div key={etapa.id} className="flex items-center text-sm text-orange-800">
                            <Clock className="h-4 w-4 mr-2" />
                            {etapa.nombre} - En progreso
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Proyectos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Mis Proyectos</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {data.proyectos.length} proyecto{data.proyectos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {data.proyectos.length === 0 ? (
                <div className="p-6 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tienes proyectos asignados</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Los administradores te asignarán proyectos pronto
                  </p>
                </div>
              ) : (
                data.proyectos.map((proyecto) => (
                  <div key={proyecto.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{proyecto.nombre}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[proyecto.estado as keyof typeof estadoColors]}`}>
                            {estadoLabels[proyecto.estado as keyof typeof estadoLabels]}
                          </span>
                        </div>

                        {proyecto.descripcion && (
                          <p className="text-gray-600 mb-3">{proyecto.descripcion}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-3">
                          <div>
                            <span className="font-medium">Superficie:</span>
                            <span className="ml-1">{proyecto.superficieTotal ? `${proyecto.superficieTotal} m²` : 'No definida'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Inicio:</span>
                            <span className="ml-1">{proyecto.fechaInicio ? new Date(proyecto.fechaInicio).toLocaleDateString('es-PY') : 'No definida'}</span>
                          </div>
                          <div>
                            <span className="font-medium">Items:</span>
                            <span className="ml-1">{proyecto.presupuestoItems?.length || 0}</span>
                          </div>
                          <div>
                            <span className="font-medium">Progreso:</span>
                            <span className="ml-1">{calcularProgresoProyecto(proyecto)}%</span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${calcularProgresoProyecto(proyecto)}%` }}
                          ></div>
                        </div>

                        {/* Acciones */}
                        <div className="flex space-x-3">
                          <Link
                            href={`/proyectos/${proyecto.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Link>
                          <Link
                            href={`/proyectos/${proyecto.id}/obra`}
                            className="text-green-600 hover:text-green-800 text-sm flex items-center"
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Monitoreo
                          </Link>
                          {proyecto.presupuestoItems && proyecto.presupuestoItems.length > 0 && (
                            <button
                              onClick={() => {/* TODO: Generar reporte */}}
                              className="text-purple-600 hover:text-purple-800 text-sm flex items-center"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Reporte
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
