'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  estado: z.enum(['PLANIFICACION', 'EN_PROGRESO', 'PAUSADO', 'COMPLETADO', 'CANCELADO']),
  margenGanancia: z.number().min(0).max(100).optional(),
  clienteNombre: z.string().optional(),
  clienteTelefono: z.string().optional(),
  clienteEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  encargadoNombre: z.string().optional(),
  encargadoTelefono: z.string().optional()
})

type ProyectoForm = z.infer<typeof proyectoSchema>

export default function EditarProyectoPage() {
  const router = useRouter()
  const params = useParams()
  const proyectoId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [imagenes, setImagenes] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [clientes, setClientes] = useState<User[]>([])
  const [constructores, setConstructores] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ProyectoForm>({
    resolver: zodResolver(proyectoSchema)
  })

  useEffect(() => {
    fetchProyecto()
    fetchUsers()
  }, [proyectoId])

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

  const fetchProyecto = async () => {
    try {
      const response = await api.get(`/proyectos/${proyectoId}`)
      const proyecto = response.data.data

      // Cargar imágenes existentes
      if (proyecto.imagenUrl) {
        try {
          const imagenesExistentes = JSON.parse(proyecto.imagenUrl)
          if (Array.isArray(imagenesExistentes)) {
            setImagenes(imagenesExistentes)
          }
        } catch (e) {
          console.log('Error parsing existing images:', e)
        }
      }

      // Formatear fechas para inputs de tipo date
      const formatDateForInput = (dateString?: string) => {
        if (!dateString) return ''
        return new Date(dateString).toISOString().split('T')[0]
      }

      reset({
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || '',
        superficieTotal: proyecto.superficieTotal ? Number(proyecto.superficieTotal) : undefined,
        direccion: proyecto.direccion || '',
        fechaInicio: formatDateForInput(proyecto.fechaInicio),
        fechaFinEstimada: formatDateForInput(proyecto.fechaFinEstimada),
        estado: proyecto.estado,
        margenGanancia: proyecto.margenGanancia ? Number(proyecto.margenGanancia) : undefined,
        clienteNombre: proyecto.clienteNombre || '',
        clienteTelefono: proyecto.clienteTelefono || '',
        clienteEmail: proyecto.clienteEmail || '',
        encargadoNombre: proyecto.encargadoNombre || '',
        encargadoTelefono: proyecto.encargadoTelefono || ''
      })
    } catch (error) {
      console.error('Error fetching proyecto:', error)
      toast.error('Error al cargar el proyecto')
      router.push('/proyectos')
    } finally {
      setLoadingData(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('🖼️ Subiendo', files.length, 'archivos para editar');
    setUploadingImages(true);

    try {
      // Primero probar el endpoint de test
      console.log('🧪 Probando endpoint de test...');
      const token = localStorage.getItem('token');
      const testResponse = await fetch(`${API_BASE_URL}/upload/test`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const testData = await testResponse.json();
      console.log('🧪 Respuesta test:', testData);

      if (!testData.success) {
        throw new Error('Endpoint de test falló');
      }

      console.log('✅ Endpoint funcionando, procediendo con subida...');

      const uploadPromises = Array.from(files).map(async (file) => {
        console.log('📤 Subiendo archivo:', file.name, file.size, 'bytes');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) {
          console.log('❌ Response status:', response.status, response.statusText);
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

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
      console.log('🎉 Primera URL:', urls[0]);

      // Verificar formato de URLs
      urls.forEach((url, index) => {
        console.log(`🔍 URL ${index}:`, url);
        if (typeof url === 'string' && url.includes('https://')) {
          console.log(`✅ URL ${index} parece correcta`);
        } else {
          console.log(`❌ URL ${index} parece malformada`);
        }
      });

      setImagenes(prev => {
        const newImages = [...prev, ...urls];
        console.log('📸 Estado imagenes actualizado:', newImages);
        return newImages;
      });
      toast.success(`${urls.length} imagen(es) subida(s) exitosamente`);
    } catch (error) {
      console.error('❌ Error uploading:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al subir imágenes: ${errorMessage}`);
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
  };

  const onSubmit = async (data: ProyectoForm) => {
    setLoading(true)
    try {
      const cleanData = {
        ...data,
        superficieTotal: data.superficieTotal || undefined,
        fechaInicio: data.fechaInicio || undefined,
        fechaFinEstimada: data.fechaFinEstimada || undefined,
        margenGanancia: data.margenGanancia || undefined,
        clienteEmail: data.clienteEmail || undefined,
        imagenUrl: imagenes.length > 0 ? JSON.stringify(imagenes) : undefined
      }

      console.log('📝 Enviando actualización del proyecto:', cleanData)
      console.log('🖼️ Imágenes a actualizar:', imagenes)
      console.log('📄 imagenUrl serializada:', cleanData.imagenUrl)

      await api.put(`/proyectos/${proyectoId}`, cleanData)
      toast.success('Proyecto actualizado exitosamente')
      router.push('/proyectos')
    } catch (error: any) {
      console.error('Error updating proyecto:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar el proyecto'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando proyecto...</p>
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
          <div className="flex items-center mb-6">
            <Link
              href="/proyectos"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Editar Proyecto</h2>
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
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado del Proyecto
                    </label>
                    <select
                      {...register('estado')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PLANIFICACION">Planificación</option>
                      <option value="EN_PROGRESO">En Progreso</option>
                      <option value="PAUSADO">Pausado</option>
                      <option value="COMPLETADO">Completado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      {...register('descripcion')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    />
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
                        {imagenes.map((url, index) => {
                          // Si la URL ya es absoluta (empieza con http), úsala tal cual
                          // Si es relativa, concaténala con API_BASE_URL
                          const imageSrc = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
                          console.log(`🖼️ Mostrando imagen ${index}:`, imageSrc);

                          return (
                            <div key={index} className="relative">
                              <img src={imageSrc} alt={`Plano ${index + 1}`} className="w-full h-20 object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => setImagenes(prev => prev.filter((_, i) => i !== index))}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
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
                  className="px-4 py-2 bg-[#38603B] text-white rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Actualizar Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
