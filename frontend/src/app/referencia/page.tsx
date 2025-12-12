'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, TrendingUp } from 'lucide-react';
import PageLoader from '@/components/PageLoader';

export default function ProyectosReferenciaPage() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProyectos();
  }, []);

  const fetchProyectos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/proyectos/referencia`);
      const data = await response.json();
      if (data.success) {
        setProyectos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Proyectos de Referencia</h2>
            <p className="text-gray-600">Explora proyectos tipo con presupuestos estimados para Paraguay</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
              <div key={proyecto.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6 text-white" style={{background: 'linear-gradient(to right, #38603B, #633722)'}}>
                  <h3 className="text-2xl font-bold mb-2">{proyecto.nombre}</h3>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span className="text-lg">{proyecto.superficieTotal}m²</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{proyecto.descripcion}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Margen sugerido:</span>
                      <span className="font-semibold text-green-600">{proyecto.margenGanancia}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Items incluidos:</span>
                      <span className="font-semibold">{proyecto._count?.presupuestoItems || 0}</span>
                    </div>
                  </div>

                  <Link
                    href={`/referencia/${proyecto.id}`}
                    className="block w-full text-white text-center py-2 rounded-lg transition-colors"
                    style={{backgroundColor: '#38603B'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                  >
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {proyectos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay proyectos de referencia disponibles</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
