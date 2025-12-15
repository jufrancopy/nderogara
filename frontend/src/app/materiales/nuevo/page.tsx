'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Save, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { API_BASE_URL } from '@/lib/api'

export const dynamic = 'force-dynamic'

const materialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  unidad: z.enum(['KG', 'BOLSA', 'M2', 'M3', 'ML', 'UNIDAD', 'LOTE', 'GLOBAL']),
  precioUnitario: z.number().positive('El precio debe ser mayor a 0').optional(),
  precioBase: z.number().positive('El precio base debe ser mayor a 0').optional(),
  tipoCalidad: z.enum(['COMUN', 'PREMIUM', 'INDUSTRIAL', 'ARTESANAL']).optional(),
  marca: z.string().optional(),
  proveedor: z.string().optional(),
  telefonoProveedor: z.string().optional(),
  stockMinimo: z.number().int().min(0).optional(),
  imagenUrl: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  observaciones: z.string().optional(),
  categoriaId: z.string().min(1, 'La categoría es requerida')
})

type MaterialForm = z.infer<typeof materialSchema>

interface Categoria {
  id: string
  nombre: string
}

export default function NuevoMaterialPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [galeria, setGaleria] = useState([])
  const [showGallery, setShowGallery] = useState(false)
  const [loading, setLoading] = useState(false)
  const [precioDisplay, setPrecioDisplay] = useState('')
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      tipoCalidad: 'COMUN',
      unidad: 'UNIDAD',
      stockMinimo: 0
    }
  })

  useEffect(() => {
    fetchCategorias()
    fetchGaleria()
  }, [])

  const fetchGaleria = async () => {
    try {
      const response = await api.get('/upload/galeria')
      setGaleria(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar galería:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await api.get('/categorias')
      setCategorias(response.data.data || [])
    } catch (error) {
      // Mock data si no hay backend para categorías aún
      setCategorias([
        { id: '1', nombre: 'Estructural' },
        { id: '2', nombre: 'Mampostería' },
        { id: '3', nombre: 'Acabados' },
        { id: '4', nombre: 'Instalaciones' }
      ])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setCurrentImageUrl('')
      setValue('imagenUrl', '')
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return currentImageUrl || ''

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.url
      } else {
        throw new Error('Error al subir imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const onSubmit = async (data: MaterialForm) => {
    setLoading(true)
    try {
      // Subir imagen si hay archivo seleccionado
      let finalImageUrl = currentImageUrl || data.imagenUrl || ''
      if (selectedFile) {
        finalImageUrl = await uploadImage() || ''
      }

      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      // Determinar el endpoint correcto basado en el rol del usuario
      let endpoint = '/proveedor/materiales' // default
      if (user?.rol === 'ADMIN') {
        endpoint = '/admin/materiales'
      }

      // Preparar datos con imagen final
      const materialData = {
        ...data,
        imagenUrl: finalImageUrl
      }

      const response = await api.post(endpoint, materialData)

      toast.success('Material creado exitosamente')
      router.push('/materiales')
    } catch (error: any) {
      console.error('Error creating material:', error)
      console.error('Error response:', error.response)
      const errorMessage = error.response?.data?.error || 'Error al crear el material'
      toast.error(`Error: ${errorMessage}`)
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
              href="/materiales"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Material</h2>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Material *
                    </label>
                    <input
                      type="text"
                      {...register('nombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Cemento Portland"
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select
                      {...register('categoriaId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.categoriaId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoriaId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      {...register('unidad')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UNIDAD">Unidad</option>
                      <option value="KG">Kilogramo</option>
                      <option value="BOLSA">Bolsa</option>
                      <option value="M2">Metro Cuadrado</option>
                      <option value="M3">Metro Cúbico</option>
                      <option value="ML">Metro Lineal</option>
                      <option value="LOTE">Lote</option>
                      <option value="GLOBAL">Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Unitario (₲) *
                    </label>
                    <input
                      type="text"
                      value={precioDisplay}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        const numValue = parseInt(value) || 0
                        setPrecioDisplay(numValue.toLocaleString('es-PY'))
                        setValue('precioUnitario', numValue)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    {errors.precioUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precioUnitario.message}</p>
                    )}
                  </div>

                  {(() => {
                    const userData = localStorage.getItem('user')
                    const user = userData ? JSON.parse(userData) : null
                    const isAdmin = user?.rol === 'ADMIN'

                    if (isAdmin) {
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio Base de Mercado (₲)
                          </label>
                          <input
                            type="number"
                            step="1"
                            {...register('precioBase', { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Precio de referencia"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Precio promedio de mercado para cálculos aproximados (solo para catálogo admin)
                          </p>
                          {errors.precioBase && (
                            <p className="mt-1 text-sm text-red-600">{errors.precioBase.message}</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Calidad
                    </label>
                    <select
                      {...register('tipoCalidad')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="COMUN">Común</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="INDUSTRIAL">Industrial</option>
                      <option value="ARTESANAL">Artesanal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      {...register('marca')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Holcim"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imagen del Material
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                          >
                            📎 Seleccionar imagen...
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGallery(!showGallery)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
                        >
                          🖼️ Galería
                        </button>
                      </div>
                      {previewUrl || currentImageUrl ? (
                        <img src={previewUrl || currentImageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                      ) : null}

                      {/* Campo URL como opción adicional */}
                      <div className="border-t pt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          O especificar URL
                        </label>
                        <input
                          type="url"
                          {...register('imagenUrl')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        {errors.imagenUrl && (
                          <p className="mt-1 text-sm text-red-600">{errors.imagenUrl.message}</p>
                        )}
                      </div>
                    </div>

                    {showGallery && (
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                        <h4 className="font-medium mb-3">Seleccionar de Galería</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {galeria.map((img: any) => (
                            <div
                              key={img.filename}
                              onClick={() => {
                                // Usar imagen de galería
                                const fullUrl = img.url.startsWith('http')
                                  ? img.url
                                  : `${API_BASE_URL}${img.url}`;
                                setCurrentImageUrl(fullUrl);
                                setPreviewUrl('');
                                setSelectedFile(null);
                                setValue('imagenUrl', fullUrl);
                                setShowGallery(false);
                              }}
                              className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden transition-colors"
                            >
                              <img src={`${API_BASE_URL}${img.url}`} alt={img.filename} className="w-full h-20 object-cover" />
                            </div>
                          ))}
                        </div>
                        {galeria.length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-4">No hay imágenes en la galería</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Proveedor */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Proveedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor *
                    </label>
                    <input
                      type="text"
                      {...register('proveedor')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del proveedor"
                    />
                    {errors.proveedor && (
                      <p className="mt-1 text-sm text-red-600">{errors.proveedor.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono del Proveedor
                    </label>
                    <input
                      type="tel"
                      {...register('telefonoProveedor')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3001234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      {...register('stockMinimo', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  {...register('observaciones')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre el material..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/materiales"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
