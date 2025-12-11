'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Material {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  precio: number | null;
  marca: string | null;
  imagenUrl: string | null;
  esActivo: boolean;
  categoria: {
    id: string;
    nombre: string;
  };
}

export default function MisMaterialesPage() {
  const router = useRouter();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMateriales();
  }, []);

  const fetchMateriales = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/proveedor/mis-materiales', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMateriales(data);
      }
    } catch (error) {
      console.error('Error al cargar materiales:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string, esActivo: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const material = materiales.find(m => m.id === id);
      if (!material) return;

      await fetch(`http://localhost:3001/proveedor/materiales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...material, esActivo: !esActivo })
      });

      fetchMateriales();
    } catch (error) {
      console.error('Error al actualizar material:', error);
    }
  };

  const eliminarMaterial = async (id: string) => {
    if (!confirm('¿Eliminar este material?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/proveedor/materiales/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchMateriales();
    } catch (error) {
      console.error('Error al eliminar material:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando materiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Materiales</h1>
            <p className="text-gray-600 mt-2">Gestiona tu catálogo de materiales</p>
          </div>
          <Link
            href="/proveedor/materiales/nuevo"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            + Nuevo Material
          </Link>
        </div>

        {materiales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No tienes materiales registrados</p>
            <Link
              href="/proveedor/materiales/nuevo"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear tu primer material →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materiales.map((material) => (
              <div key={material.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {material.imagenUrl && (
                  <img
                    src={`http://localhost:3001${material.imagenUrl}`}
                    alt={material.nombre}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{material.nombre}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${material.esActivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {material.esActivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  {material.marca && (
                    <p className="text-sm text-gray-500 mb-2">Marca: {material.marca}</p>
                  )}
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {material.descripcion || 'Sin descripción'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{material.categoria.nombre}</span>
                    <span className="text-sm text-gray-500">{material.unidad}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      ₲ {material.precio?.toLocaleString() || '0'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      href={`/proveedor/materiales/editar/${material.id}`}
                      className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded text-center hover:bg-blue-100 transition"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => toggleActivo(material.id, material.esActivo)}
                      className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded hover:bg-gray-100 transition"
                    >
                      {material.esActivo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => eliminarMaterial(material.id)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
