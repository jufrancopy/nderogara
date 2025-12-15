'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Save, Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '@/lib/api'

const materialSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  unidad: z.enum(['KG', 'BOLSA', 'M2', 'M3', 'ML', 'UNIDAD', 'LOTE', 'GLOBAL']),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  marca: z.string().optional(),
  categoriaId: z.string().min(1, 'La categoría es requerida'),
  esActivo: z.boolean().optional()
})

type MaterialForm = z.infer<typeof materialSchema>

interface Categoria {
  id: string
  nombre: string
}

export default function EditarMaterialProveedorPage() {
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
  const [precioDisplay, setPrecioDisplay] = useState<string>('')

  const formatNumber = (value: string) => {
    const number = Number(value.replace(/,/g, ''));
    if (isNaN(number)) return '';
    return number.toLocaleString('es-PY');
  };

  const handlePrecioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    // Si el campo está vacío, mostrar 0
    if (!value) {
      setPrecioDisplay('0');
      setValue('precio', 0);
      return;
    }

    // Permitir solo números
    value = value.replace(/[^\d]/g, '');

    // Si después de limpiar no hay valor, mostrar 0
    if (!value) {
      setPrecioDisplay('0');
      setValue('precio', 0);
      return;
    }

    // Convertir a número y formatear
    const numericValue = parseInt(value, 10);
    const formattedValue = numericValue.toLocaleString('es-PY');

    setPrecioDisplay(formattedValue);
    setValue('precio', numericValue);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch
  } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema)
  })

  useEffect(() => {
    fetchCategorias()
    fetchGaleria()
    fetchMaterial()
  }, [materialId])

  const fetchGaleria = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/upload/galeria`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setGaleria(data.data)
      }
    } catch (error) {
      console.error('Error al cargar galería:', error)
    }
  }

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCategorias(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categorias:', error)
      setCategorias([
        { id: '1', nombre: 'Estructural' },
        { id: '2', nombre: 'Mampostería' },
        { id: '3', nombre: 'Acabados' },
        { id: '4', nombre: 'Instalaciones' }
      ])
    }
  }

  const fetchMaterial = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/proveedor/mis-materiales`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const material = data.find((m: any) => m.id === materialId)

        if (material) {
          // Verificar que el material pertenece al proveedor actual
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          if (material.usuarioId !== user.id) {
            toast.error('No tienes permiso para editar este material')
            router.push('/proveedor/materiales')
            return
          }

          reset({
            nombre: material.nombre,
            descripcion: material.descripcion || '',
            unidad: material.unidad,
            precio: Number(material.precio),
            marca: material.marca || '',
            categoriaId: material.categoria.id,
            esActivo: material.esActivo
          })

          // Inicializar el display del precio con formato
          setPrecioDisplay(formatNumber(material.precio.toString()));

          console.log('Imagen del material a editar:', material.imagenUrl);
          setCurrentImageUrl(material.imagenUrl || '')
        } else {
          toast.error('Material no encontrado')
          router.push('/proveedor/materiales')
        }
      } else {
        toast.error('Error al cargar el material')
        router.push('/proveedor/materiales')
      }
    } catch (error) {
      console.error('Error fetching material:', error)
      toast.error('Error al cargar el material')
      router.push('/proveedor/materiales')
    } finally {
      setLoadingData(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return currentImageUrl

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
      let imageUrl = currentImageUrl

      if (selectedFile) {
        imageUrl = await uploadImage() || currentImageUrl
      }

      // Get the current material data first
      const token = localStorage.getItem('token')
      const listResponse = await fetch(`${API_BASE_URL}/proveedor/mis-materiales`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!listResponse.ok) {
        throw new Error('Error al obtener datos actuales del material')
      }

      const materials = await listResponse.json()
      const currentMaterial = materials.find((m: any) => m.id === materialId)

      if (!currentMaterial) {
        throw new Error('Material no encontrado')
      }

      // Create updated material data
      const materialData = {
        ...currentMaterial,
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        unidad: data.unidad,
        precio: Number(data.precio),
        marca: data.marca || null,
        categoriaId: data.categoriaId,
        imagenUrl: imageUrl,
        esActivo: data.esActivo ?? true
      }

      const updateResponse = await fetch(`${API_BASE_URL}/proveedor/materiales/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(materialData)
      })

      if (updateResponse.ok) {
        toast.success('Material actualizado exitosamente')
        router.push('/proveedor/materiales')
      } else {
        const errorText = await updateResponse.text()
        let errorMessage = 'Error al actualizar el material'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(`${errorMessage} (${updateResponse.status})`)
      }
    } catch (error: any) {
      console.error('Error updating material:', error)
      toast.error(error.message || 'Error al actualizar el material')
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
              href="/proveedor/materiales"
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Material</h3>
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
                      Precio (₲) *
                    </label>
                    <input
                      type="text"
                      value={precioDisplay}
                      onChange={handlePrecioChange}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.precio && (
                      <p className="mt-1 text-sm text-red-600">{errors.precio.message}</p>
                    )}
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
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Imagen */}
              <div>
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
                </div>
              </div>

              {showGallery && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Galería de Imágenes</h4>
                  <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {galeria.map((img: any) => (
                      <div
                        key={img.filename}
                        onClick={() => {
                          // Convertir URL relativa a completa para la vista previa
                          const fullUrl = img.url.startsWith('http')
                            ? img.url
                            : `${API_BASE_URL}${img.url}`;
                          setCurrentImageUrl(fullUrl);
                          setPreviewUrl(''); // Limpiar preview si había uno
                          setSelectedFile(null); // Limpiar archivo seleccionado
                          setShowGallery(false);
                        }}
                        className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden"
                      >
                        <img src={`${API_BASE_URL}${img.url}`} alt={img.filename} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/proveedor/materiales"
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
                  style={{backgroundColor: '#38603B'}}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2d4a2f')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#38603B')}
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
