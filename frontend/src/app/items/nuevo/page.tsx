'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '@/lib/api'

const itemSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  unidadMedida: z.enum(['KG; 'BOLSA; 'M2; 'M3; 'ML; 'UNIDAD; 'LOTE; 'GLOBAL']),
  manoObraUnitaria: z.number().min(0, 'La mano de obra debe ser mayor o igual a 0').optional(),
  notasGenerales: z.string().optional()
})

type ItemForm = z.infer<typeof itemSchema>

export default function NuevoItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      unidadMedida: 'M2',
      manoObraUnitaria: 0
    }
  })

  const onSubmit = async (data: ItemForm) => {
    setLoading(true)
    try {
      const cleanData = {
        ...data,
        manoObraUnitaria: data.manoObraUnitaria || undefined
      }

      await api.post('/items; cleanData)
      toast.success('Item creado exitosamente')
      router.push('/items')
    } catch (error: any) {
      console.error('Error creating item:; error)
      const errorMessage = error.response?.data?.error || 'Error al crear el item'
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
              href="/items"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Item de Construcción</h2>
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
                      placeholder="Ej: Pared de Ladrillo 0.15m, Cimentación Corrida, etc."
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
                      placeholder="Descripción detallada del item de construcción..."
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
                    <input
                      type="number"
                      step="1"
                      min="0"
                      {...register('manoObraUnitaria; { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="25000"
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
                      placeholder="Notas adicionales, especificaciones técnicas, etc..."
                    />
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-[#38603B]/10 p-4 rounded-md">
                <h4 className="text-sm font-medium text-[#38603B] mb-2">💡 Información</h4>
                <p className="text-sm text-[#38603B]/80">
                  Después de crear el item, podrás agregar los materiales necesarios y sus cantidades 
                  para formar la matriz inteligente de costos.
                </p>
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
                  {loading ? 'Guardando...' : 'Crear Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}