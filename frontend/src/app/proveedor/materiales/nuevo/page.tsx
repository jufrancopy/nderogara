'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';

export default function NuevoMaterialProveedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: 'BOLSA',
    categoriaId: '',
    imagenUrl: '',
    precio: '',
    marca: ''
  });

  useEffect(() => {
    fetchCategorias();
    fetchGaleria();
  }, []);

  const fetchGaleria = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload/galeria`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGaleria(data.data);
      }
    } catch (error) {
      console.error('Error al cargar galería:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, imagenUrl: data.data.url }));
        fetchGaleria();
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategorias(data.data);
        if (data.data.length > 0) {
          setFormData(prev => ({ ...prev, categoriaId: data.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/proveedor/materiales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio)
        })
      });

      if (response.ok) {
        router.push('/proveedor/materiales');
      }
    } catch (error) {
      console.error('Error al crear material:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/proveedor/materiales" className="mr-4 text-gray-600 hover:text-gray-900">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Material</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ej: Cemento Portland 50kg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ej: INC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Descripción del material..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio (₲) *</label>
              <input
                type="number"
                required
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="45000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Vista previa: ₲{formData.precio ? parseFloat(formData.precio).toLocaleString('es-PY') : '0'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGallery(!showGallery)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Galería
                  </button>
                </div>
                {formData.imagenUrl && (
                  <img src={`${API_BASE_URL}${formData.imagenUrl}`} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                )}
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
                        setFormData({ ...formData, imagenUrl: img.url });
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
                <select
                  required
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="BOLSA">Bolsa</option>
                  <option value="KG">Kilogramo</option>
                  <option value="M2">Metro Cuadrado</option>
                  <option value="M3">Metro Cúbico</option>
                  <option value="ML">Metro Lineal</option>
                  <option value="UNIDAD">Unidad</option>
                  <option value="LOTE">Lote</option>
                  <option value="GLOBAL">Global</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <select
                  required
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categorias.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link href="/proveedor/materiales" className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Crear Material'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
