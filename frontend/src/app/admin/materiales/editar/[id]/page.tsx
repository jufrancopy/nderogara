'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

export default function EditarMaterialAdminPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const [categorias, setCategorias] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: 'BOLSA',
    categoriaId: '',
    imagenUrl: '',
    precioBase: ''
  });
  const [precioBaseDisplay, setPrecioBaseDisplay] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'ADMIN') {
      router.push('/proyectos');
      return;
    }

    fetchCategorias();
    fetchGaleria();
    fetchMaterial();
  }, [materialId]);

  const fetchMaterial = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/materiales/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const material = data.data;
          const precioBaseValue = material.precioBase ? material.precioBase.toString() : '';
          const precioBaseNum = material.precioBase ? Number(material.precioBase) : 0;

          setFormData({
            nombre: material.nombre,
            descripcion: material.descripcion || '',
            unidad: material.unidad,
            categoriaId: material.categoriaId,
            imagenUrl: material.imagenUrl || '',
            precioBase: precioBaseValue
          });
          setPrecioBaseDisplay(precioBaseNum.toLocaleString('es-PY'));
        } else {
          toast.error('Material no encontrado');
          router.push('/admin/materiales');
        }
      } else {
        toast.error('Error al cargar el material');
        router.push('/admin/materiales');
      }
    } catch (error) {
      console.error('Error fetching material:', error);
      toast.error('Error al cargar el material');
      router.push('/admin/materiales');
    } finally {
      setLoadingData(false);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/upload/imagen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, imagenUrl: data.data.url }));
        fetchGaleria();
        toast.success('Imagen subida exitosamente');
      } else {
        toast.error(data.error || 'Error al subir imagen');
      }
    } catch (error) {
      toast.error('Error al subir imagen');
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
      const response = await fetch(`${API_BASE_URL}/admin/materiales/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Material actualizado exitosamente');
        router.push('/admin/materiales');
      } else {
        toast.error(data.error || 'Error al actualizar material');
      }
    } catch (error) {
      toast.error('Error al actualizar material');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando material...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center mb-6">
            <Link
              href="/admin/materiales"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Editar Material Base</h2>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cemento Portland 50kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción del material..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Material</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
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
                  {formData.imagenUrl && (
                    <img src={formData.imagenUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
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
                          // Convertir URL relativa a completa para la vista previa
                          const fullUrl = img.url.startsWith('http')
                            ? img.url
                            : `${API_BASE_URL}${img.url}`;
                          setFormData({ ...formData, imagenUrl: fullUrl });
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad *</label>
                  <select
                    required
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categorias.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Base de Mercado (₲)
                  </label>
                  <input
                    type="text"
                    value={precioBaseDisplay}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = parseInt(value) || 0
                      setPrecioBaseDisplay(numValue.toLocaleString('es-PY'))
                      setFormData({ ...formData, precioBase: value })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Referencia de mercado para cálculos
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-md" style={{backgroundColor: '#f0f9f0'}}>
                <p className="text-sm" style={{color: '#38603B'}}>
                  💡 El precio base es opcional. Si lo defines, servirá como referencia de mercado para cálculos aproximados. Los proveedores podrán crear ofertas competitivas sobre este precio.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link href="/admin/materiales" className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white rounded-md flex items-center disabled:opacity-50"
                  style={{backgroundColor: '#38603B'}}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#633722')}
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
  );
}
