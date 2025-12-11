'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, TrendingUp, Package } from 'lucide-react';
import PageLoader from '@/components/PageLoader';

export default function DetalleReferenciaPage() {
  const params = useParams();
  const [proyecto, setProyecto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/proyectos/referencia/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setProyecto(data.data);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <PageLoader />;
  if (!proyecto) return <div className="p-8 text-center">Proyecto no encontrado</div>;

  const calcularTotal = () => {
    return proyecto.presupuestoItems?.reduce((sum: number, item: any) => sum + Number(item.costoTotal || 0), 0) || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Link 
            href={user ? "/referencia" : "/"} 
            className="inline-flex items-center gap-2 mb-6" 
            style={{color: '#38603B'}}
          >
            <ArrowLeft className="h-4 w-4" />
            {user ? "Volver a Proyectos de Referencia" : "Volver al Inicio"}
          </Link>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="p-8 text-white" style={{background: 'linear-gradient(to right, #38603B, #633722)'}}>
              <h1 className="text-4xl font-bold mb-4">{proyecto.nombre}</h1>
              <div className="flex gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  <span>{proyecto.superficieTotal}m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Margen: {proyecto.margenGanancia}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <span>{proyecto.presupuestoItems?.length || 0} items</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Descripción del Proyecto</h2>
              <p className="text-gray-600 mb-6 text-lg">{proyecto.descripcion}</p>

              {/* Resumen de Items */}
              {proyecto.presupuestoItems && proyecto.presupuestoItems.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Trabajos Incluidos</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {proyecto.presupuestoItems.map((presItem: any) => (
                      <div key={presItem.id} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{presItem.item?.nombre}</h4>
                        <p className="text-sm text-gray-600 mb-2">{presItem.item?.descripcion}</p>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Cantidad:</span> {presItem.cantidadMedida} {presItem.item?.unidadMedida}
                        </div>
                        {presItem.item?.materialesPorItem && presItem.item.materialesPorItem.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Materiales necesarios:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {presItem.item.materialesPorItem.map((mp: any) => (
                                <li key={mp.id} className="flex justify-between">
                                  <span>• {mp.material?.nombre}</span>
                                  <span className="text-gray-500">
                                    {mp.cantidadPorUnidad} {mp.material?.unidad}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 mb-6" style={{backgroundColor: '#f0f9f0', borderLeft: '4px solid #38603B'}}>
                <p className="text-sm text-gray-700">
                  <strong>Nota:</strong> Este es un proyecto de referencia con precios estimados para Paraguay. 
                  Los costos pueden variar según tu ubicación y proveedores.
                </p>
              </div>

              {proyecto.presupuestoItems && proyecto.presupuestoItems.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Presupuesto Detallado</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materiales</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mano de Obra</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {proyecto.presupuestoItems.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.item?.nombre || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.cantidadMedida} {item.item?.unidadMedida}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₲{Number(item.costoMateriales || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₲{Number(item.costoManoObra || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              ₲{Number(item.costoTotal || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                            Total Estimado:
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-lg font-bold" style={{color: '#38603B'}}>
                            ₲{calcularTotal().toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              <div className="mt-8 flex gap-4">
                <Link
                  href="/login"
                  className="text-white px-6 py-3 rounded-lg transition-colors"
                  style={{backgroundColor: '#38603B'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                >
                  Crear Mi Proyecto Basado en Este
                </Link>
                <Link
                  href="/referencia"
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Ver Más Proyectos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
