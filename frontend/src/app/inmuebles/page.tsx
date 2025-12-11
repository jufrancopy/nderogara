'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Home, Bath, Car, Waves, Trees, Search, Filter } from 'lucide-react';

interface Inmueble {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: 'VENTA' | 'ALQUILER';
  precio: number;
  direccion: string;
  ciudad: string;
  superficie: number | null;
  habitaciones: number | null;
  banos: number | null;
  garaje: boolean;
  piscina: boolean;
  jardin: boolean;
  imagenes: string | null;
  contactoNombre: string;
  contactoTelefono: string;
  proyecto: {
    nombre: string;
    superficieTotal: number | null;
  } | null;
}

export default function InmueblesPage() {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    ciudad: '',
    precioMin: '',
    precioMax: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchInmuebles();
  }, []);

  const fetchInmuebles = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
      if (filtros.precioMin) params.append('precioMin', filtros.precioMin);
      if (filtros.precioMax) params.append('precioMax', filtros.precioMax);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inmuebles?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInmuebles(data.data);
      }
    } catch (error) {
      console.error('Error al cargar inmuebles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchInmuebles();
  };

  const getImagenes = (imagenesJson: string | null) => {
    if (!imagenesJson) return [];
    try {
      return JSON.parse(imagenesJson);
    } catch {
      return [imagenesJson];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: '#38603B'}}></div>
          <p className="mt-4 text-gray-600">Cargando inmuebles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inmuebles</h1>
            <p className="text-gray-600 mt-2">Encuentra tu próximo hogar</p>
          </div>
          {(() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            return token ? (
              <Link
                href="/inmuebles/nuevo"
                className="text-white px-6 py-3 rounded-lg transition-colors"
                style={{backgroundColor: '#38603B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
              >
                + Publicar Inmueble
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-white px-6 py-3 rounded-lg transition-colors"
                style={{backgroundColor: '#38603B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
              >
                + Publicar Inmueble
              </Link>
            );
          })()}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros de búsqueda</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos los tipos</option>
                <option value="VENTA">Venta</option>
                <option value="ALQUILER">Alquiler</option>
              </select>

              <input
                type="text"
                placeholder="Ciudad"
                value={filtros.ciudad}
                onChange={(e) => setFiltros({...filtros, ciudad: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="number"
                placeholder="Precio mínimo"
                value={filtros.precioMin}
                onChange={(e) => setFiltros({...filtros, precioMin: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />

              <input
                type="number"
                placeholder="Precio máximo"
                value={filtros.precioMax}
                onChange={(e) => setFiltros({...filtros, precioMax: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          <button
            onClick={handleSearch}
            className="flex items-center gap-2 text-white px-4 py-2 rounded-md transition-colors"
            style={{backgroundColor: '#38603B'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
          >
            <Search className="h-4 w-4" />
            Buscar
          </button>
        </div>

        {/* Listado */}
        {inmuebles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No hay inmuebles disponibles</p>
            <Link
              href="/inmuebles/nuevo"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Publica el primer inmueble →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inmuebles.map((inmueble) => {
              const imagenes = getImagenes(inmueble.imagenes);
              return (
                <Link key={inmueble.id} href={`/inmuebles/${inmueble.id}`}>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {/* Imagen */}
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {imagenes.length > 0 ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${imagenes[0]}`}
                          alt={inmueble.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                          {inmueble.titulo}
                        </h3>
                        <span 
                          className="px-2 py-1 text-xs rounded text-white"
                          style={{backgroundColor: inmueble.tipo === 'VENTA' ? '#38603B' : '#B99742'}}
                        >
                          {inmueble.tipo}
                        </span>
                      </div>

                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {inmueble.direccion}, {inmueble.ciudad}
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {inmueble.descripcion || 'Sin descripción'}
                      </p>

                      {/* Características */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        {inmueble.superficie && (
                          <span>{inmueble.superficie}m²</span>
                        )}
                        {inmueble.habitaciones && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            {inmueble.habitaciones}
                          </div>
                        )}
                        {inmueble.banos && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {inmueble.banos}
                          </div>
                        )}
                        {inmueble.garaje && <Car className="h-3 w-3" />}
                        {inmueble.piscina && <Waves className="h-3 w-3" />}
                        {inmueble.jardin && <Trees className="h-3 w-3" />}
                      </div>

                      {/* Precio */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold" style={{color: '#38603B'}}>
                            ₲ {inmueble.precio.toLocaleString()}
                          </span>
                          {inmueble.tipo === 'ALQUILER' && (
                            <span className="text-sm text-gray-500">/mes</span>
                          )}
                        </div>
                        {inmueble.proyecto && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Con BuildManager
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}