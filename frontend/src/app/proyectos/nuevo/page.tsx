'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api, { API_BASE_URL } from '@/lib/api'

interface User {
  id: string
  name: string | null
  email: string
  telefono: string | null
  empresa: string | null
}

const proyectoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  superficieTotal: z.number().positive('La superficie debe ser mayor a 0').optional(),
  direccion: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFinEstimada: z.string().optional(),
  margenGanancia: z.number().min(0).max(100).optional(),
  clienteNombre: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  encargadoNombre: z.string().optional(),
  encargadoTelefono: z.string().optional(),
  usuarioId: z.string()
})

type ProyectoForm = z.infer<typeof proyectoSchema>

export default function NuevoProyectoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [imagenes, setImagenes] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [clientes, setClientes] = useState<User[]>([])
  const [constructores, setConstructores] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ProyectoForm>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      margenGanancia: 20
    }
  })

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const [clientesResponse, constructoresResponse] = await Promise.all([
        api.get('/auth/users-by-role?rol=CLIENTE'),
        api.get('/auth/users-by-role?rol=CONSTRUCTOR')
      ])

      setClientes(clientesResponse.data.data || [])
      setConstructores(constructoresResponse.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me')
      const user = response.data.data
      setCurrentUser(user)
      setValue('usuarioId', user.id)
    } catch (error) {
      console.error('Error fetching user:', error)
      // Si no puede obtener el usuario, redirigir al login
      toast.error('Sesión expirada. Redirigiendo al login...')
      router.push('/login')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('🖼️ Subiendo', files.length, 'archivos');
    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        console.log('📤 Subiendo archivo:', file.name, file.size, 'bytes');
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await response.json();
        console.log('📥 Respuesta upload:', data);

        if (data.success) {
          console.log('✅ URL obtenida:', data.data.url);
          return data.data.url;
        }
        throw new Error(data.error || 'Error al subir imagen');
      });

      const urls = await Promise.all(uploadPromises);
      console.log('🎉 URLs finales:', urls);
      setImagenes(prev => {
        const newImages = [...prev, ...urls];
        console.log('📸 Estado imagenes actualizado:', newImages);
        return newImages;
      });
      toast.success(`${urls.length} imagen(es) subida(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error uploading:', error);
      toast.error('Error al subir algunas imágenes');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleClienteChange = (userId: string) => {
    const cliente = clientes.find(c => c.id === userId)
    if (cliente) {
      setValue('clienteNombre', cliente.name || '')
      setValue('clienteTelefono', cliente.telefono || '')
      setValue('clienteEmail', cliente.email)
    }
  }

  const handleEncargadoChange = (userId: string) => {
    const encargado = constructores.find(c => c.id === userId)
    if (encargado) {
      setValue('encargadoNombre', encargado.name || '')
      setValue('encargadoTelefono', encargado.telefono || '')
    }
  }

  const onSubmit = async (data: ProyectoForm) => {
    setLoading(true)
    try {
      // Convertir strings vacíos a undefined para campos opcionales
      const cleanData = {
        ...data,
        superficieTotal: data.superficieTotal || undefined,
        fechaInicio: data.fechaInicio || undefined,
        fechaFinEstimada: data.fechaFinEstimada || undefined,
        margenGanancia: data.margenGanancia || undefined,
        clienteEmail: data.clienteEmail || undefined,
        imagenUrl: imagenes.length > 0 ? JSON.stringify(imagenes) : undefined
      }

      console.log('📝 Enviando datos del proyecto:', cleanData)
      console.log('🖼️ Imágenes a enviar:', imagenes)
      console.log('📄 imagenUrl serializada:', cleanData.imagenUrl)

      await api.post('/proyectos', cleanData)
      toast.success('Proyecto creado exitosamente')
      router.push('/proyectos')
    } catch (error: any) {
      console.error('Error creating proyecto:', error)
      const errorMessage = error.response?.data?.error || 'Error al crear el proyecto'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center mb-6">
            <Link
              href="/proyectos"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h2>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Información del Proyecto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Proyecto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      {...register('nombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Mi Casa, Edificio Central, etc."
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      {...register('descripcion')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción del proyecto..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Superficie Total (m²)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('superficieTotal', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="120.50"
                    />
                    {errors.superficieTotal && (
                      <p className="mt-1 text-sm text-red-600">{errors.superficieTotal.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margen de Ganancia (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...register('margenGanancia', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      {...register('direccion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Calle 123 #45-67, Ciudad"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planos e Imágenes
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={uploadingImages}
                    />
                    {uploadingImages && (
                      <p className="mt-1 text-sm text-blue-600">Subiendo imágenes...</p>
                    )}
                    {imagenes.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {imagenes.map((url, index) => (
                          <div key={index} className="relative">
                            <img src={`${API_BASE_URL}${url}`} alt={`Plano ${index + 1}`} className="w-full h-20 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => setImagenes(prev => prev.filter((_, i) => i !== index))}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Puedes subir múltiples imágenes de planos, fachadas, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      {...register('fechaInicio')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Estimada de Finalización
                    </label>
                    <input
                      type="date"
                      {...register('fechaFinEstimada')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Encargado de Obra */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Encargado de Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Encargado
                    </label>
                    <select
                      onChange={(e) => handleEncargadoChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingUsers}
                    >
                      <option value="">Seleccionar constructor...</option>
                      {constructores.map((constructor) => (
                        <option key={constructor.id} value={constructor.id}>
                          {constructor.name || constructor.email}
                          {constructor.empresa && ` (${constructor.empresa})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Encargado
                    </label>
                    <input
                      type="text"
                      {...register('encargadoNombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del encargado de obra"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono del Encargado
                    </label>
                    <input
                      type="tel"
                      {...register('encargadoTelefono')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3001234567"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar Cliente
                    </label>
                    <select
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={loadingUsers}
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.name || cliente.email}
                          {cliente.empresa && ` (${cliente.empresa})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      {...register('clienteNombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono del Cliente
                    </label>
                    <input
                      type="tel"
                      {...register('clienteTelefono')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3001234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email del Cliente
                    </label>
                    <input
                      type="email"
                      {...register('clienteEmail')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="cliente@email.com"
                    />
                    {errors.clienteEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.clienteEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/proyectos"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
                  style={{backgroundColor: '#38603B'}}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#633722')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#38603B')}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
