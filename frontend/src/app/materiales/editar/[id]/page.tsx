'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { API_BASE_URL } from '@/lib/api'

const materialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  unidad: z.enum(['KG', 'BOLSA', 'M2', 'M3', 'ML', 'UNIDAD', 'LOTE', 'GLOBAL']),
  precioUnitario: z.number().positive('El precio debe ser mayor a 0'),
  tipoCalidad: z.enum(['COMUN', 'PREMIUM', 'INDUSTRIAL', 'ARTESANAL']),
  marca: z.string().optional(),
  proveedorId: z.string().min(1, 'El proveedor es requerido'),
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

interface Proveedor {
  id: string
  nombre: string
  telefono?: string
  ciudad?: string
}

export default function EditarMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const materialId = params.id as string
  
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [galeria, setGaleria] = useState([])
  const [showGallery, setShowGallery] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('')
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema)
  })

  useEffect(() => {
    fetchCategorias()
    fetchGaleria()
    fetchProveedores()
    fetchMaterial()

    // Determinar si el usuario es admin
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setIsAdmin(user.rol === 'ADMIN')
    }
  }, [materialId])

  const fetchProveedores = async () => {
    try {
      const response = await api.get('/proveedores')
      setProveedores(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
    }
  }

  const fetchCategorias = async () => {
    try {
      const response = await api.get('/categorias')
      setCategorias(response.data.data || [])
    } catch (error) {
      setCategorias([
        { id: '1', nombre: 'Estructural' },
        { id: '2', nombre: 'Mampostería' },
        { id: '3', nombre: 'Acabados' },
        { id: '4', nombre: 'Instalaciones' }
      ])
    }
  }

  const fetchGaleria = async () => {
    try {
      const response = await api.get('/upload/galeria')
      setGaleria(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar galería:', error)
    }
  }

  const fetchMaterial = async () => {
    try {
      const response = await api.get(`/materiales/${materialId}`)
      const material = response.data.data

      // Llenar el formulario con los datos existentes
      reset({
        nombre: material.nombre,
        unidad: material.unidad,
        precioUnitario: Number(material.precioUnitario),
        tipoCalidad: material.tipoCalidad,
        marca: material.marca || '',
        proveedor: material.proveedor,
        telefonoProveedor: material.telefonoProveedor || '',
        stockMinimo: material.stockMinimo || 0,
        imagenUrl: material.imagenUrl || '',
        observaciones: material.observaciones || '',
        categoriaId: material.categoriaId
      })

      // Si el material tiene imagen, setearla como current
      if (material.imagenUrl) {
        setCurrentImageUrl(material.imagenUrl)
      }
    } catch (error) {
      console.error('Error fetching material:', error)
      toast.error('Error al cargar el material')
      router.push('/materiales')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: MaterialForm) => {
    setLoading(true)
    try {
      await api.put(`/materiales/${materialId}`, data)
      toast.success('Material actualizado exitosamente')
      router.push('/materiales')
    } catch (error: any) {
      console.error('Error updating material:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar el material'
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
          <p className="mt-2 text-gray-500">Cargando material...</p>
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
              href="/materiales"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Editar Material</h2>
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
                      type="number"
                      step="1"
                      {...register('precioUnitario', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.precioUnitario && (
                      <p className="mt-1 text-sm text-red-600">{errors.precioUnitario.message}</p>
                    )}
                  </div>

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
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setSelectedFile(file)
                                const url = URL.createObjectURL(file)
                                setPreviewUrl(url)
                                setCurrentImageUrl('')
                                setValue('imagenUrl', '')
                              }
                            }}
                            className="hidden"
                            id="image-upload-edit"
                          />
                          <label
                            htmlFor="image-upload-edit"
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
                  {loading ? 'Guardando...' : 'Actualizar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
