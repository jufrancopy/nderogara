'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/formatters';

interface Proyecto {
  id: string;
  nombre: string;
}

export default function EditarInmueblePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<string[]>([]);
  const [precioFormateado, setPrecioFormateado] = useState('');

  // Datos del inmueble
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'VENTA' as 'VENTA' | 'ALQUILER',
    precio: '',
    direccion: '',
    ciudad: '',
    superficie: '',
    habitaciones: '',
    banos: '',
    garaje: false,
    piscina: false,
    jardin: false,
    contactoNombre: '',
    contactoTelefono: '',
    proyectoId: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchInmueble();
      fetchProyectos();
    }
  }, [params.id]);

  const fetchInmueble = async () => {
    try {
      const response = await api.get(`/inmuebles/${params.id}`);
      const inmueble = response.data.data;

      // Verificar que el usuario sea el propietario
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id !== inmueble.usuarioId) {
          toast.error('No tienes permisos para editar este inmueble');
          router.push(`/inmuebles/${params.id}`);
          return;
        }
      }

      // Cargar datos en el formulario
      setFormData({
        titulo: inmueble.titulo,
        descripcion: inmueble.descripcion || '',
        tipo: inmueble.tipo,
        precio: inmueble.precio.toString(),
        direccion: inmueble.direccion,
        ciudad: inmueble.ciudad,
        superficie: inmueble.superficie?.toString() || '',
        habitaciones: inmueble.habitaciones?.toString() || '',
        banos: inmueble.banos?.toString() || '',
        garaje: inmueble.garaje,
        piscina: inmueble.piscina,
        jardin: inmueble.jardin,
        contactoNombre: inmueble.contactoNombre,
        contactoTelefono: inmueble.contactoTelefono,
        proyectoId: inmueble.proyecto?.id || ''
      });

      setPrecioFormateado(formatPrice(inmueble?.precio || 0));

      // Cargar imágenes existentes
      if (inmueble.imagenes) {
        try {
          const imagenesArray = JSON.parse(inmueble.imagenes);
          setImagenesExistentes(imagenesArray);
        } catch (error) {
          console.error('Error parsing images:', error);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar inmueble:', error);
      toast.error('Error al cargar el inmueble');
      router.push('/inmuebles');
    } finally {
      setFetching(false);
    }
  };

  const fetchProyectos = async () => {
    try {
      const response = await api.get('/proyectos');
      setProyectos(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImagenes(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setImagenesExistentes(prev => prev.filter((_, i) => i !== index));
  };

  const formatMontoInput = (value: string) => {
    // Remover todos los caracteres no numéricos excepto punto y coma
    const numericValue = value.replace(/[^\d.,]/g, '')

    // Convertir a número y formatear con separadores de miles
    const number = parseFloat(numericValue.replace(/\./g, '').replace(',', '.'))
    if (isNaN(number)) return ''

    return number.toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir precio formateado a número
      const precioLimpio = precioFormateado.replace(/\./g, '').replace(',', '.');
      const precioNumerico = parseFloat(precioLimpio);

      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        toast.error('Por favor ingresa un precio válido');
        return;
      }

      // Validaciones básicas
      if (!formData.titulo || !formData.tipo || !formData.direccion || !formData.ciudad || !formData.contactoNombre || !formData.contactoTelefono) {
        toast.error('Por favor completa todos los campos obligatorios');
        return;
      }

      const formDataToSend = new FormData();

      // Agregar datos del formulario
      const updateData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion || null,
        tipo: formData.tipo,
        precio: precioNumerico,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        superficie: formData.superficie ? parseFloat(formData.superficie) : null,
        habitaciones: formData.habitaciones ? parseInt(formData.habitaciones) : null,
        banos: formData.banos ? parseInt(formData.banos) : null,
        garaje: formData.garaje,
        piscina: formData.piscina,
        jardin: formData.jardin,
        contactoNombre: formData.contactoNombre,
        contactoTelefono: formData.contactoTelefono,
        proyectoId: formData.proyectoId || null,
        imagenesExistentes: JSON.stringify(imagenesExistentes)
      };

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Agregar nuevas imágenes
      imagenes.forEach((imagen) => {
        formDataToSend.append('imagenes', imagen);
      });

      await api.put(`/inmuebles/${params.id}`, formDataToSend);

      toast.success('Inmueble actualizado exitosamente');
      router.push(`/inmuebles/${params.id}`);
    } catch (error: any) {
      console.error('Error al actualizar inmueble:', error);
      const errorMessage = error.response?.data?.error || 'Error al actualizar el inmueble';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: '#38603B'}}></div>
          <p className="mt-4 text-gray-600">Cargando inmueble...</p>
        </div>
      </div>
    );
  }

  // Función para obtener la URL correcta de la imagen
  const getImageUrl = (imagePath: string) => {
    if (!imagePath.startsWith('http')) {
      // Es una ruta relativa, agregar el dominio
      return `${process.env.NEXT_PUBLIC_API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }
    // Si ya es una URL completa, usar tal cual
    return imagePath;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link
              href={`/inmuebles/${params.id}`}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Editar Inmueble</h2>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Inmueble</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Casa en venta en Asunción"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as 'VENTA' | 'ALQUILER'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                    >
                      <option value="VENTA">Venta</option>
                      <option value="ALQUILER">Alquiler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio (₲) *
                    </label>
                    <input
                      type="text"
                      value={precioFormateado}
                      onChange={(e) => {
                        const formattedValue = formatMontoInput(e.target.value)
                        setPrecioFormateado(formattedValue)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="150.000.000"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ingresa el precio con separadores de miles
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Av. España 123"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Asunción"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Describe las características del inmueble..."
                    />
                  </div>
                </div>
              </div>

              {/* Características */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Características</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Superficie (m²)
                    </label>
                    <input
                      type="number"
                      value={formData.superficie}
                      onChange={(e) => setFormData({...formData, superficie: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Habitaciones
                    </label>
                    <input
                      type="number"
                      value={formData.habitaciones}
                      onChange={(e) => setFormData({...formData, habitaciones: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Baños
                    </label>
                    <input
                      type="number"
                      value={formData.banos}
                      onChange={(e) => setFormData({...formData, banos: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.garaje}
                      onChange={(e) => setFormData({...formData, garaje: e.target.checked})}
                      className="rounded border-gray-300 text-[#38603B] focus:ring-[#38603B]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Garaje</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.piscina}
                      onChange={(e) => setFormData({...formData, piscina: e.target.checked})}
                      className="rounded border-gray-300 text-[#38603B] focus:ring-[#38603B]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Piscina</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.jardin}
                      onChange={(e) => setFormData({...formData, jardin: e.target.checked})}
                      className="rounded border-gray-300 text-[#38603B] focus:ring-[#38603B]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Jardín</span>
                  </label>
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de contacto *
                    </label>
                    <input
                      type="text"
                      value={formData.contactoNombre}
                      onChange={(e) => setFormData({...formData, contactoNombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Juan Pérez"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de contacto *
                    </label>
                    <input
                      type="text"
                      value={formData.contactoTelefono}
                      onChange={(e) => setFormData({...formData, contactoTelefono: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="0981123456"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Proyecto BuildManager */}
              {proyectos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Proyecto BuildManager (Opcional)</h3>
                  <select
                    value={formData.proyectoId}
                    onChange={(e) => setFormData({...formData, proyectoId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                  >
                    <option value="">Seleccionar proyecto (opcional)</option>
                    {proyectos.map((proyecto) => (
                      <option key={proyecto.id} value={proyecto.id}>
                        {proyecto.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Si este inmueble fue construido con BuildManager, selecciona el proyecto
                  </p>
                </div>
              )}

              {/* Imágenes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Imágenes</h3>

                {/* Imágenes existentes */}
                {imagenesExistentes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Imágenes actuales</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagenesExistentes.map((imagen, index) => (
                        <div key={index} className="relative">
                          <img
                            src={getImageUrl(imagen)}
                            alt={`Imagen existente ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agregar nuevas imágenes
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                    />
                  </div>

                  {imagenes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagenes.map((imagen, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(imagen)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Link
                  href={`/inmuebles/${params.id}`}
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
                  {loading ? 'Actualizando...' : 'Actualizar Inmueble'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
