'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/lib/api'

// Componente para input con formato de miles
const FormattedNumberInput = ({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: {
  value: number | undefined
  onChange: (value: number | undefined) => void
  placeholder?: string
  className?: string
  [key: string]: any
}) => {
  const [displayValue, setDisplayValue] = useState(
    value ? value.toLocaleString('es-PY') : ''
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Remover todos los caracteres no numéricos
    const numericValue = inputValue.replace(/\D/g, '')

    if (numericValue === '') {
      setDisplayValue('')
      onChange(undefined)
    } else {
      const numberValue = parseInt(numericValue, 10)
      setDisplayValue(numberValue.toLocaleString('es-PY'))
      onChange(numberValue)
    }
  }

  const handleFocus = () => {
    // Al enfocar, mostrar el valor sin formato para facilitar edición
    if (value) {
      setDisplayValue(value.toString())
    }
  }

  const handleBlur = () => {
    // Al desenfocar, volver a formatear
    if (value) {
      setDisplayValue(value.toLocaleString('es-PY'))
    } else {
      setDisplayValue('')
    }
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}

const itemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  unidadMedida: z.enum(['KG', 'BOLSA', 'M2', 'M3', 'ML', 'UNIDAD', 'LOTE', 'GLOBAL']),
  manoObraUnitaria: z.number().min(0, 'La mano de obra debe ser mayor o igual a 0').optional(),
  notasGenerales: z.string().optional()
})

type ItemForm = z.infer<typeof itemSchema>

export default function EditarItemPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [manoObraValue, setManoObraValue] = useState<number | undefined>(undefined)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema)
  })

  useEffect(() => {
    fetchItem()
  }, [itemId])

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${itemId}`)
      const item = response.data.data

      const manoObraValue = item.manoObraUnitaria ? Number(item.manoObraUnitaria) : undefined
      setManoObraValue(manoObraValue)

      reset({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        unidadMedida: item.unidadMedida,
        manoObraUnitaria: manoObraValue,
        notasGenerales: item.notasGenerales || ''
      })
    } catch (error) {
      console.error('Error fetching item:', error)
      toast.error('Error al cargar el item')
      router.push('/items')
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: ItemForm) => {
    setLoading(true)
    try {
      const cleanData = {
        ...data,
        manoObraUnitaria: data.manoObraUnitaria || undefined
      }

      await api.put(`/items/${itemId}`, cleanData)
      toast.success('Item actualizado exitosamente')
      router.push('/items')
    } catch (error: any) {
      console.error('Error updating item:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar el item'
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
          <p className="mt-2 text-gray-500">Cargando item...</p>
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
              href="/items"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Editar Item de Construcción</h2>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Item *
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
                      Unidad de Medida *
                    </label>
                    <select
                      {...register('unidadMedida')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="M2">Metro Cuadrado (m²)</option>
                      <option value="M3">Metro Cúbico (m³)</option>
                      <option value="ML">Metro Lineal (ml)</option>
                      <option value="UNIDAD">Unidad</option>
                      <option value="KG">Kilogramo</option>
                      <option value="BOLSA">Bolsa</option>
                      <option value="LOTE">Lote</option>
                      <option value="GLOBAL">Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mano de Obra Unitaria (₲)
                    </label>
                    <FormattedNumberInput
                      value={manoObraValue}
                      onChange={(value) => {
                        setManoObraValue(value)
                        setValue('manoObraUnitaria', value || 0)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="25.000"
                    />
                    {errors.manoObraUnitaria && (
                      <p className="mt-1 text-sm text-red-600">{errors.manoObraUnitaria.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Costo de mano de obra por unidad de medida
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Generales
                    </label>
                    <textarea
                      {...register('notasGenerales')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/items"
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
                  {loading ? 'Guardando...' : 'Actualizar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
