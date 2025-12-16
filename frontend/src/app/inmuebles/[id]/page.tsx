'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Home, Bath, Car, Waves, Trees, Phone, Mail, User, Building2, Calculator, ChevronLeft, ChevronRight, Trash2, Edit, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/formatters';

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
  contactoEmail: string | null;
  usuario: {
    name: string;
    telefono: string | null;
    email: string;
  };
  proyecto: {
    nombre: string;
    superficieTotal: number | null;
    presupuestoItems: Array<{
      id: string;
      cantidadMedida: number;
      costoMateriales: number;
      costoManoObra: number;
      costoTotal: number;
      item: {
        nombre: string;
        unidadMedida: string;
      };
    }>;
  } | null;
}

export default function InmuebleDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [inmueble, setInmueble] = useState<Inmueble | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'VENTA' as 'VENTA' | 'ALQUILER',
    precio: '',
    precioFormateado: '',
    direccion: '',
    ciudad: '',
    superficie: '',
    habitaciones: '',
    banos: '',
    garaje: false,
    piscina: false,
    jardin: false,
    contactoNombre: '',
    contactoTelefono: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchInmueble();
    }
  }, [params.id]);

  const fetchInmueble = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inmuebles/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setInmueble(data.data);
        
        // Verificar si el usuario actual es el propietario
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setIsOwner(payload.id === data.data.usuarioId);
    } catch (error) {
      console.error('Error al cargar inmueble:', error);
    }
        }
      }
    } catch (error) {
      toast.error('Error al cargar el inmueble');
    } finally {
      setLoading(false);
    }
  };

  const getImagenes = (imagenesJson: string | null) => {
    if (!imagenesJson) return [];
    try {
      return JSON.parse(imagenesJson);
    } catch {
      return [imagenesJson];
    }
  };

  const calcularCostoTotal = () => {
    if (!inmueble?.proyecto?.presupuestoItems) return 0;
    return inmueble.proyecto.presupuestoItems.reduce((total, item) => total + Number(item.costoTotal), 0);
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

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // Convertir precio formateado a número
      const precioLimpio = editData.precioFormateado.replace(/\./g, '').replace(',', '.');
      const precioNumerico = parseFloat(precioLimpio);

      if (isNaN(precioNumerico) || precioNumerico <= 0) {
        toast.error('Por favor ingresa un precio válido');
        return;
      }

      const updateData = {
        titulo: editData.titulo,
        descripcion: editData.descripcion || null,
        tipo: editData.tipo,
        precio: precioNumerico,
        direccion: editData.direccion,
        ciudad: editData.ciudad,
        superficie: editData.superficie ? parseFloat(editData.superficie) : null,
        habitaciones: editData.habitaciones ? parseInt(editData.habitaciones) : null,
        banos: editData.banos ? parseInt(editData.banos) : null,
        garaje: editData.garaje,
        piscina: editData.piscina,
        jardin: editData.jardin,
        contactoNombre: editData.contactoNombre,
        contactoTelefono: editData.contactoTelefono
      };

      await api.put(`/inmuebles/${params.id}`, updateData);

      // Actualizar el inmueble localmente
      setInmueble(prev => prev ? { ...prev, ...updateData } : null);
      setIsEditing(false);
      toast.success('Inmueble actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar inmueble:', error);
      const errorMessage = error.response?.data?.error || 'Error al actualizar el inmueble';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setShowDeleteModal(false);
    try {
      await api.delete(`/inmuebles/${params.id}`);
      toast.success('Inmueble eliminado exitosamente');
      router.push('/inmuebles');
    } catch (error: any) {
      console.error('Error al eliminar inmueble:', error);
      const errorMessage = error.response?.data?.error || 'Error al eliminar el inmueble';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: '#38603B'}}></div>
          <p className="mt-4 text-gray-600">Cargando inmueble...</p>
        </div>
      </div>
    );
  }

  if (!inmueble) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Inmueble no encontrado</p>
          <Link href="/inmuebles" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            Volver a inmuebles
          </Link>
        </div>
      </div>
    );
  }

  const imagenes = getImagenes(inmueble.imagenes);

  const GaleriaCarrusel = () => {
    if (imagenes.length === 0) return null;

    const nextSlide = () => {
      setCurrentImageIndex((prev) => (prev + 1) % imagenes.length);
    };

    const prevSlide = () => {
      setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    };

    // Función para obtener la URL correcta de la imagen
    const getImageUrl = (imagePath: string) => {
      if (!imagePath.startsWith('http')) {
        // Es una ruta relativa, agregar el dominio
        return `${process.env.NEXT_PUBLIC_API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
      }
      // Si ya es una URL completa, usar tal cual
      return imagePath;
    };

    const currentImageUrl = getImageUrl(imagenes[currentImageIndex]);

    return (
      <div className="relative">
        <div className="aspect-[16/9] bg-gray-200 overflow-hidden rounded-lg">
          <img
            src={currentImageUrl}
            alt={`${inmueble.titulo} - Imagen ${currentImageIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => setModalImage(currentImageUrl)}
            onError={(e) => {
              console.error('Error loading image:', currentImageUrl);
              // Fallback si la imagen no carga
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE4QzE0IDE5LjEgMTMuMSAyMCAxMiAyMEMxMC45IDIwIDEwIDE5LjEgMTAgMThWNFMxMC45IDIgMTIgMlpNMTIgNUEuNS41IDAgMCAxIDExLjUgNUMxMS41IDQuNSAxMiA0LjUgMTIgNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
            }}
          />
        </div>
        
        {imagenes.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </button>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {imagenes.map((_: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/60'
                  }`}
                />
              ))}
            </div>
            
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentImageIndex + 1} / {imagenes.length}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/inmuebles" className="mr-4 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editData.titulo}
                    onChange={(e) => setEditData({...editData, titulo: e.target.value})}
                    className="text-3xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
                    placeholder="Título del inmueble"
                  />
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <input
                      type="text"
                      value={editData.direccion}
                      onChange={(e) => setEditData({...editData, direccion: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1 mr-2"
                      placeholder="Dirección"
                    />
                    <input
                      type="text"
                      value={editData.ciudad}
                      onChange={(e) => setEditData({...editData, ciudad: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1"
                      placeholder="Ciudad"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">{inmueble.titulo}</h1>
                  <div className="flex items-center text-gray-600 mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {inmueble.direccion}, {inmueble.ciudad}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {isOwner && (
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={() => {
                    // Inicializar datos de edición
                    setEditData({
                      titulo: inmueble.titulo,
                      descripcion: inmueble.descripcion || '',
                      tipo: inmueble.tipo,
                      precio: inmueble.precio.toString(),
                      precioFormateado: formatPrice(inmueble.precio),
                      direccion: inmueble.direccion,
                      ciudad: inmueble.ciudad,
                      superficie: inmueble.superficie?.toString() || '',
                      habitaciones: inmueble.habitaciones?.toString() || '',
                      banos: inmueble.banos?.toString() || '',
                      garaje: inmueble.garaje,
                      piscina: inmueble.piscina,
                      jardin: inmueble.jardin,
                      contactoNombre: inmueble.contactoNombre,
                      contactoTelefono: inmueble.contactoTelefono
                    });
                    setIsEditing(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
              )}
              <button
                onClick={handleDeleteClick}
                disabled={deleting || saving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galería */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Galería</h2>
              <GaleriaCarrusel />
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Descripción</h2>
              {isEditing ? (
                <textarea
                  value={editData.descripcion}
                  onChange={(e) => setEditData({...editData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe las características del inmueble..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {inmueble.descripcion || 'Sin descripción disponible'}
                </p>
              )}
            </div>

            {/* Características */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Características</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inmueble.superficie && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Home className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Superficie</p>
                    <p className="font-semibold">{inmueble.superficie}m²</p>
                  </div>
                )}
                {inmueble.habitaciones && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Home className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Habitaciones</p>
                    <p className="font-semibold">{inmueble.habitaciones}</p>
                  </div>
                )}
                {inmueble.banos && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Bath className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Baños</p>
                    <p className="font-semibold">{inmueble.banos}</p>
                  </div>
                )}
                {inmueble.garaje && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Car className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Garaje</p>
                    <p className="font-semibold">Sí</p>
                  </div>
                )}
                {inmueble.piscina && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Waves className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Piscina</p>
                    <p className="font-semibold">Sí</p>
                  </div>
                )}
                {inmueble.jardin && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Trees className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-500">Jardín</p>
                    <p className="font-semibold">Sí</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información del proyecto */}
            {inmueble.proyecto && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Building2 className="h-5 w-5 mr-2" style={{color: '#38603B'}} />
                  <h2 className="text-xl font-semibold">Construido con BuildManager</h2>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm" style={{color: '#38603B'}}>
                    ✅ Esta propiedad fue construida usando BuildManager. Conoces los costos reales de construcción y la calidad de los materiales utilizados.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Proyecto Original</h3>
                    <p className="text-gray-600">{inmueble.proyecto.nombre}</p>
                    {inmueble.proyecto.superficieTotal && (
                      <p className="text-sm text-gray-500">Superficie: {inmueble.proyecto.superficieTotal}m²</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Costo de Construcción</h3>
                    <p className="text-2xl font-bold" style={{color: '#38603B'}}>
                      ₲ {formatPrice(calcularCostoTotal())}
                    </p>
                    <p className="text-sm text-gray-500">Costo real de construcción</p>
                  </div>
                </div>

                {inmueble.proyecto.presupuestoItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Trabajos Realizados</h3>
                    <div className="space-y-2">
                      {inmueble.proyecto.presupuestoItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">{item.item.nombre}</span>
                          <span className="text-sm font-medium">₲ {formatPrice(Number(item.costoTotal))}</span>
                        </div>
                      ))}
                      {inmueble.proyecto.presupuestoItems.length > 5 && (
                        <p className="text-sm text-gray-500 italic">
                          Y {inmueble.proyecto.presupuestoItems.length - 5} trabajos más...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Precio y tipo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                {isEditing ? (
                  <div className="space-y-4">
                    <select
                      value={editData.tipo}
                      onChange={(e) => setEditData({...editData, tipo: e.target.value as 'VENTA' | 'ALQUILER'})}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="VENTA">Venta</option>
                      <option value="ALQUILER">Alquiler</option>
                    </select>
                    <div>
                      <input
                        type="text"
                        value={editData.precioFormateado}
                        onChange={(e) => {
                          const formattedValue = formatMontoInput(e.target.value)
                          setEditData({...editData, precioFormateado: formattedValue})
                        }}
                        className="text-3xl font-bold text-center border border-gray-300 rounded px-2 py-1 w-full"
                        style={{color: '#38603B'}}
                        placeholder="150.000.000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Ingresa el precio con separadores de miles</p>
                    </div>
                    {editData.tipo === 'ALQUILER' && (
                      <p className="text-gray-500">por mes</p>
                    )}
                  </div>
                ) : (
                  <>
                    <span
                      className="inline-block px-3 py-1 text-sm rounded text-white mb-3"
                      style={{backgroundColor: inmueble.tipo === 'VENTA' ? '#38603B' : '#B99742'}}
                    >
                      {inmueble.tipo}
                    </span>
                    <div className="text-3xl font-bold mb-2" style={{color: '#38603B'}}>
                      ₲ {formatPrice(inmueble.precio)}
                    </div>
                    {inmueble.tipo === 'ALQUILER' && (
                      <p className="text-gray-500">por mes</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contacto
              </h3>

              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={editData.contactoNombre}
                        onChange={(e) => setEditData({...editData, contactoNombre: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombre del contacto"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={editData.contactoTelefono}
                        onChange={(e) => setEditData({...editData, contactoTelefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0981123456"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="font-medium">{inmueble.contactoNombre}</p>
                    </div>

                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${inmueble.contactoTelefono}`} className="text-blue-600 hover:text-blue-800">
                        {inmueble.contactoTelefono}
                      </a>
                    </div>

                    {inmueble.contactoEmail && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <a href={`mailto:${inmueble.contactoEmail}`} className="text-blue-600 hover:text-blue-800">
                          {inmueble.contactoEmail}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {!isEditing && (
                <button
                  className="w-full mt-4 text-white py-3 rounded-lg transition-colors"
                  style={{backgroundColor: '#38603B'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
                  onClick={() => window.open(`https://wa.me/595${inmueble.contactoTelefono.replace(/\D/g, '')}?text=Hola, me interesa el inmueble: ${inmueble.titulo}`, '_blank')}
                >
                  Contactar por WhatsApp
                </button>
              )}
            </div>

            {/* Publicado por */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Publicado por</h3>
              <div className="space-y-2">
                <p className="font-medium">{inmueble.usuario.name}</p>
                {inmueble.usuario.telefono && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm">{inmueble.usuario.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
            >
              ×
            </button>
            <img 
              src={modalImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Eliminar Inmueble</h3>
            <p className="text-gray-600 mb-6">¿Estás seguro de que quieres eliminar este inmueble? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50" 
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
