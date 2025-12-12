'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Calculator, Package, Wrench, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatPrice } from '@/lib/formatters'

interface CostoEstimado {
  itemId: string
  itemNombre: string
  unidadMedida: string
  cantidad: number
  costoMateriales: number
  costoManoObra: number
  costoUnitario: number
  costoTotal: number
  desgloseMateriales: {
    material: string
    cantidadPorUnidad: number
    precioUnitario: number
    costoTotal: number
  }[]
}

export default function CalcularCostoPage() {
  const params = useParams()
  const itemId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [costoEstimado, setCostoEstimado] = useState<CostoEstimado | null>(null)

  useEffect(() => {
    if (cantidad > 0) {
      calcularCosto()
    }
  }, [cantidad, itemId])

  const calcularCosto = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/items/${itemId}/costo-estimado?cantidad=${cantidad}`)
      setCostoEstimado(response.data.data)
    } catch (error) {
      console.error('Error calculating cost:', error)
      toast.error('Error al calcular el costo')
    } finally {
      setLoading(false)
    }
  }



  const getUnidadLabel = (unidad: string) => {
    const labels: { [key: string]: string } = {
      'M2': 'm²',
      'M3': 'm³',
      'ML': 'ml',
      'KG': 'kg',
      'BOLSA': 'bolsa',
      'UNIDAD': 'unidad',
      'LOTE': 'lote',
      'GLOBAL': 'global'
    }
    return labels[unidad] || unidad
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center mb-6">
            <Link
              href="/items"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calculadora de Costos</h2>
              {costoEstimado && (
                <p className="text-gray-600">{costoEstimado.itemNombre}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Parámetros
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad {costoEstimado && `(${getUnidadLabel(costoEstimado.unidadMedida)})`}
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1.00"
                    />
                  </div>
                  
                  <button
                    onClick={calcularCosto}
                    disabled={loading || cantidad <= 0}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Calculator className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Calculando...' : 'Calcular Costo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              {costoEstimado ? (
                <div className="space-y-6">
                  {/* Resumen de Costos */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Resumen de Costos
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Materiales</p>
                            <p className="text-lg font-bold text-blue-900">
                              {formatPrice(costoEstimado.costoMateriales)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Wrench className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm text-green-600 font-medium">Mano de Obra</p>
                            <p className="text-lg font-bold text-green-900">
                              {formatPrice(costoEstimado.costoManoObra)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Costo Unitario</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatPrice(costoEstimado.costoUnitario)}
                          </p>
                          <p className="text-xs text-gray-500">
                            por {getUnidadLabel(costoEstimado.unidadMedida)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">Total</p>
                          <p className="text-xl font-bold text-yellow-900">
                            {formatPrice(costoEstimado.costoTotal)}
                          </p>
                          <p className="text-xs text-yellow-600">
                            {cantidad} {getUnidadLabel(costoEstimado.unidadMedida)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desglose de Materiales */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Desglose de Materiales
                    </h3>
                    
                    {costoEstimado.desgloseMateriales.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          No hay materiales asociados a este item.
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Agrega materiales para ver el desglose de costos.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Material
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cantidad por {getUnidadLabel(costoEstimado.unidadMedida)}
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio Unitario
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Costo Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {costoEstimado.desgloseMateriales.map((material, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {material.material}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {material.cantidadPorUnidad * cantidad}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatPrice(material.precioUnitario)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatPrice(material.costoTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Ingresa una cantidad y haz click en "Calcular Costo" para ver el desglose.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
