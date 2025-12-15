'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search, Edit, Trash2, Calendar, MapPin, User, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Proyecto {
  id: string
  nombre: string
  descripcion?: string
  superficieTotal?: number
  direccion?: string
  fechaInicio?: string
  fechaFinEstimada?: string
  estado: string
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
  createdAt: string
  _count?: {
    presupuestoItems: number
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

export default function ProyectosPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [user, setUser] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    proyectoId: string
    proyectoNombre: string
  }>({ isOpen: false, proyectoId: '', proyectoNombre: '' })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      // Redirect providers and constructors away from projects
      if (parsedUser.rol === 'PROVEEDOR_MATERIALES' || parsedUser.rol === 'CONSTRUCTOR' || parsedUser.rol === 'PROVEEDOR_SERVICIOS') {
        router.push('/proveedor/materiales')
        return
      }
    } else {
      router.push('/login')
      return
    }
    fetchProyectos()
  }, [router])

  const fetchProyectos = async () => {
    try {
      const response = await api.get('/proyectos')
      setProyectos(response.data.data || [])
    } catch (error) {
      console.error('Error fetching proyectos:', error)
      toast.error('Error al cargar los proyectos')
      // Mock data como fallback
      setProyectos([
        {
          id: '1',
          nombre: 'Mi Casa',
          descripcion: 'Construcción de casa familiar',
          superficieTotal: 120,
          direccion: 'Calle 123 #45-67',
          estado: 'EN_PROGRESO',
          clienteNombre: 'Julio Franco',
          createdAt: new Date().toISOString(),
          _count: { presupuestoItems: 5 }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredProyectos = proyectos.filter(proyecto => {
    const matchesSearch = proyecto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proyecto.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proyecto.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEstado = estadoFilter === '' || proyecto.estado === estadoFilter
    
    return matchesSearch && matchesEstado
  })

  const handleDeleteClick = (proyectoId: string, proyectoNombre: string) => {
    setDeleteDialog({
      isOpen: true,
      proyectoId,
      proyectoNombre
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/proyectos/${deleteDialog.proyectoId}`)
      toast.success('Proyecto eliminado exitosamente')
      fetchProyectos()
    } catch (error: any) {
      console.error('Error deleting proyecto:', error)
      const errorMessage = error.response?.data?.error || 'Error al eliminar el proyecto'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, proyectoId: '', proyectoNombre: '' })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida'
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Proyectos</h2>
            <Link
              href="/proyectos/nuevo"
              className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Link>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="PLANIFICACION">Planificación</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="PAUSADO">Pausado</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Projects Grid */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Cargando proyectos...</p>
              </div>
            ) : filteredProyectos.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No se encontraron proyectos</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredProyectos.map((proyecto) => (
                  <li key={proyecto.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900 mr-3">
                              {proyecto.nombre}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColors[proyecto.estado as keyof typeof estadoColors]}`}>
                              {estadoLabels[proyecto.estado as keyof typeof estadoLabels]}
                            </span>
                          </div>
                          {user?.rol !== 'CLIENTE' ? (
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/proyectos/${proyecto.id}`}
                                className="text-green-600 hover:text-green-800"
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link href={`/proyectos/editar/${proyecto.id}`} className="text-blue-600 hover:text-blue-800">
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(proyecto.id, proyecto.nombre)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/proyectos/${proyecto.id}`}
                              className="text-green-600 hover:text-green-800"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                        
                        {proyecto.descripcion && (
                          <p className="text-sm text-gray-600 mb-2">{proyecto.descripcion}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          {proyecto.clienteNombre && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              <span>{proyecto.clienteNombre}</span>
                            </div>
                          )}
                          {proyecto.direccion && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{proyecto.direccion}</span>
                            </div>
                          )}
                          {proyecto.superficieTotal && (
                            <div>
                              <span className="font-medium">Superficie:</span> {proyecto.superficieTotal} m²
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Inicio: {formatDate(proyecto.fechaInicio)}</span>
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
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que quieres eliminar "${deleteDialog.proyectoNombre}"? Esta acción eliminará también todos los presupuestos asociados y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}
