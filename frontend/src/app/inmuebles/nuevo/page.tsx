'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/formatters';

const inmuebleSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['VENTA', 'ALQUILER']),
  precio: z.number().min(1, 'El precio debe ser mayor a 0'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  superficie: z.number().optional(),
  habitaciones: z.number().optional(),
  banos: z.number().optional(),
  garaje: z.boolean(),
  piscina: z.boolean(),
  jardin: z.boolean(),
  contactoNombre: z.string().min(1, 'El nombre de contacto es requerido'),
  contactoTelefono: z.string().min(1, 'El teléfono de contacto es requerido'),
  proyectoId: z.string().optional()
});

type InmuebleForm = z.infer<typeof inmuebleSchema>;

interface Proyecto {
  id: string;
  nombre: string;
}

export default function NuevoInmueblePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [precioFormateado, setPrecioFormateado] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InmuebleForm>({
    resolver: zodResolver(inmuebleSchema),
    defaultValues: {
      tipo: 'VENTA',
      garaje: false,
      piscina: false,
      jardin: false
    }
  });

  useEffect(() => {
    fetchProyectos();
  }, []);

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

  const onSubmit = async (data: InmuebleForm) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Convertir precio formateado a número
      const precioLimpio = precioFormateado.replace(/\./g, '').replace(',', '.');
      const precioNumerico = parseFloat(precioLimpio);

      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        toast.error('Por favor ingresa un precio válido');
        return;
      }

      // Agregar datos del formulario
      const formDataObj = {
        ...data,
        precio: precioNumerico
      };

      Object.entries(formDataObj).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formData.append(key, value.toString());
        }
      });

      // Agregar imágenes
      imagenes.forEach((imagen) => {
        formData.append('imagenes', imagen);
      });

      await api.post('/inmuebles', formData);

      toast.success('Inmueble publicado exitosamente');
      router.push('/inmuebles');
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || 'Error al publicar el inmueble';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Link
              href="/inmuebles"
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">Publicar Inmueble</h2>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
                      {...register('titulo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Casa en venta en Asunción"
                    />
                    {errors.titulo && (
                      <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo *
                    </label>
                    <select
                      {...register('tipo')}
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
                        // Limpiar el valor del formulario para evitar conflictos
                        const numericValue = parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'))
                        if (!isNaN(numericValue)) {
                          // No usar setValue aquí para evitar conflictos con react-hook-form
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="150.000.000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ingresa el precio con separadores de miles
                    </p>
                    {errors.precio && (
                      <p className="mt-1 text-sm text-red-600">{errors.precio.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      {...register('direccion')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Av. España 123"
                    />
                    {errors.direccion && (
                      <p className="mt-1 text-sm text-red-600">{errors.direccion.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      {...register('ciudad')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Asunción"
                    />
                    {errors.ciudad && (
                      <p className="mt-1 text-sm text-red-600">{errors.ciudad.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      {...register('descripcion')}
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
                      {...register('superficie', { valueAsNumber: true })}
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
                      {...register('habitaciones', { valueAsNumber: true })}
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
                      {...register('banos', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('garaje')}
                      className="rounded border-gray-300 text-[#38603B] focus:ring-[#38603B]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Garaje</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('piscina')}
                      className="rounded border-gray-300 text-[#38603B] focus:ring-[#38603B]"
                    />
                    <span className="ml-2 text-sm text-gray-700">Piscina</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('jardin')}
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
                      {...register('contactoNombre')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="Juan Pérez"
                    />
                    {errors.contactoNombre && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactoNombre.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de contacto *
                    </label>
                    <input
                      type="text"
                      {...register('contactoTelefono')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#38603B] focus:border-[#38603B]"
                      placeholder="0981123456"
                    />
                    {errors.contactoTelefono && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactoTelefono.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Proyecto BuildManager */}
              {proyectos.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Proyecto BuildManager (Opcional)</h3>
                  <select
                    {...register('proyectoId')}
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subir imágenes
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
                  href="/inmuebles"
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
                  {loading ? 'Publicando...' : 'Publicar Inmueble'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
