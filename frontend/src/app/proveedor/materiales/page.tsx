'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

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

interface MaterialBase {
  id: string;
  nombre: string;
  descripcion: string | null;
  unidad: string;
  categoria: {
    id: string;
    nombre: string;
  };
  imagenUrl: string | null;
}

export default function MisMaterialesPage() {
  const router = useRouter();
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [materialesBase, setMaterialesBase] = useState<MaterialBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceUpdateMaterial, setPriceUpdateMaterial] = useState<Material | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [deleteMaterialData, setDeleteMaterialData] = useState<Material | null>(null);
  const [createOfferMaterial, setCreateOfferMaterial] = useState<MaterialBase | null>(null);
  const [offerForm, setOfferForm] = useState({
    precio: '',
    marca: '',
    tipoCalidad: 'COMUN' as 'COMUN' | 'PREMIUM' | 'ECONOMICO',
    observaciones: ''
  });

  useEffect(() => {
    fetchMateriales();
    fetchMaterialesBase();
  }, []);

  const fetchMaterialesBase = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/proveedor/materiales-base`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setMaterialesBase(data);
      }
    } catch (error) {
      console.error('Error al cargar materiales base:', error);
    }
  };

  const fetchMateriales = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/proveedor/mis-materiales`, {
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

      await fetch(`${API_BASE_URL}/proveedor/materiales/${id}`, {
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

  const handleDeleteClick = (material: Material) => {
    setDeleteMaterialData(material);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMaterialData) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/proveedor/materiales/${deleteMaterialData.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Material eliminado exitosamente');
        fetchMateriales();
      } else {
        toast.error('Error al eliminar el material');
      }
    } catch (error) {
      console.error('Error al eliminar material:', error);
      toast.error('Error al eliminar el material');
    } finally {
      setDeleteMaterialData(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteMaterialData(null);
  };

  const handlePrecioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    // Si el campo está vacío, mostrar 0
    if (!value) {
      setPriceDisplay('0');
      setNewPrice('0');
      return;
    }

    // Permitir solo números
    value = value.replace(/[^\d]/g, '');

    // Si después de limpiar no hay valor, mostrar 0
    if (!value) {
      setPriceDisplay('0');
      setNewPrice('0');
      return;
    }

    // Convertir a número y formatear
    const numericValue = parseInt(value, 10);
    const formattedValue = numericValue.toLocaleString('es-PY');

    setPriceDisplay(formattedValue);
    setNewPrice(value);
  };

  const handlePriceUpdateClick = (material: Material) => {
    setPriceUpdateMaterial(material);
    const precioValue = material.precio?.toString() || '0';
    setNewPrice(precioValue);
    setPriceDisplay(parseInt(precioValue).toLocaleString('es-PY'));
  };

  const handlePriceUpdateConfirm = async () => {
    if (!priceUpdateMaterial || !newPrice) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/proveedor/materiales/${priceUpdateMaterial.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...priceUpdateMaterial,
          precio: parseFloat(newPrice)
        })
      });

      toast.success('Precio actualizado exitosamente');
      fetchMateriales();
      setPriceUpdateMaterial(null);
      setNewPrice('');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar el precio');
    }
  };

  const handleCreateOfferClick = (materialBase: MaterialBase) => {
    setCreateOfferMaterial(materialBase);
    setOfferForm({
      precio: '',
      marca: '',
      tipoCalidad: 'COMUN',
      observaciones: ''
    });
  };

  const handleCreateOfferConfirm = async () => {
    if (!createOfferMaterial || !offerForm.precio) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/proveedor/ofertas-desde-base`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          materialBaseId: createOfferMaterial.id,
          precio: parseFloat(offerForm.precio),
          marca: offerForm.marca,
          tipoCalidad: offerForm.tipoCalidad,
          observaciones: offerForm.observaciones
        })
      });

      if (response.ok) {
        toast.success('Oferta creada exitosamente');
        fetchMateriales(); // Recargar materiales propios
        setCreateOfferMaterial(null);
      } else {
        toast.error('Error al crear la oferta');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error('Error al crear la oferta');
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
            <p className="text-gray-600 mt-2">Gestiona los materiales que ofreces al mercado</p>
          </div>
          <Link
            href="/proveedor/materiales/nuevo"
            className="bg-[#38603B] text-white px-6 py-3 rounded-lg hover:bg-[#2d4a2f] transition flex items-center"
          >
            + Nuevo Material
          </Link>
        </div>

        {/* Materiales Base Disponibles */}
        {materialesBase.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mr-4">📦 Materiales Base Disponibles</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {materialesBase.length} materiales
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {materialesBase.map((materialBase) => (
                <div key={materialBase.id} className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-blue-200">
                  {materialBase.imagenUrl && (
                    <img
                      src={materialBase.imagenUrl}
                      alt={materialBase.nombre}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{materialBase.nombre}</h3>
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        Base
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {materialBase.descripcion || 'Sin descripción'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">{materialBase.categoria.nombre}</span>
                      <span className="text-sm text-gray-500">{materialBase.unidad}</span>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => handleCreateOfferClick(materialBase)}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        💰 Crear Oferta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mis Materiales */}
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mr-4">🛒 Mis Materiales</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {materiales.length} materiales
          </span>
        </div>

        {materiales.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No tienes materiales registrados</p>
            <p className="text-gray-400 text-sm mb-4">
              Crea ofertas basadas en materiales base o materiales completamente nuevos
            </p>
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
                    src={material.imagenUrl}
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
                      ₲ {material.precio ? Number(material.precio).toLocaleString('es-PY') : '0'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePriceUpdateClick(material)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded text-center hover:bg-blue-100 transition text-sm"
                        title="Actualizar precio"
                      >
                        💰 Precio
                      </button>
                      <Link
                        href={`/proveedor/materiales/editar/${material.id}`}
                        className="flex-1 bg-purple-50 text-purple-600 px-3 py-2 rounded text-center hover:bg-purple-100 transition text-sm"
                        title="Editar material completo"
                      >
                        ✏️ Editar
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActivo(material.id, material.esActivo)}
                        className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded hover:bg-gray-100 transition text-sm"
                      >
                        {material.esActivo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material)}
                        className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Price Update Modal */}
        {priceUpdateMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Actualizar Precio</h2>
                  <button
                    onClick={() => setPriceUpdateMaterial(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 mb-2">Material: <strong>{priceUpdateMaterial.nombre}</strong></p>
                  <div className="text-sm text-gray-500 mb-4">
                    Unidad: {priceUpdateMaterial.unidad}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo Precio (₲)
                  </label>
                  <input
                    type="text"
                    value={priceDisplay}
                    onChange={handlePrecioChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setPriceUpdateMaterial(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handlePriceUpdateConfirm}
                    className="px-4 py-2 bg-[#38603B] text-white rounded hover:bg-[#2d4a2f] transition-colors"
                    disabled={!newPrice || parseFloat(newPrice) <= 0}
                  >
                    Actualizar Precio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Offer Modal */}
        {createOfferMaterial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-lg">💰</span>
                    </div>
                    <div className="ml-3">
                      <h2 className="text-xl font-bold text-gray-900">Crear Oferta</h2>
                      <p className="text-sm text-gray-600">Material base: {createOfferMaterial.nombre}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreateOfferMaterial(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio (₲) *
                    </label>
                    <input
                      type="number"
                      value={offerForm.precio}
                      onChange={(e) => setOfferForm({ ...offerForm, precio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="45000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={offerForm.marca}
                      onChange={(e) => setOfferForm({ ...offerForm, marca: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Mi Marca"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calidad
                    </label>
                    <select
                      value={offerForm.tipoCalidad}
                      onChange={(e) => setOfferForm({ ...offerForm, tipoCalidad: e.target.value as 'COMUN' | 'PREMIUM' | 'ECONOMICO' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="COMUN">Común</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="ECONOMICO">Económico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={offerForm.observaciones}
                      onChange={(e) => setOfferForm({ ...offerForm, observaciones: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Detalles adicionales..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setCreateOfferMaterial(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateOfferConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    disabled={!offerForm.precio || parseFloat(offerForm.precio) <= 0}
                  >
                    💰 Crear Oferta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteMaterialData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700">
                    ¿Estás seguro de que quieres eliminar el material <strong className="text-gray-900">"{deleteMaterialData.nombre}"</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Esta acción no se puede deshacer. El material será eliminado permanentemente.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    onClick={handleDeleteCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                    onClick={handleDeleteConfirm}
                  >
                    <span className="mr-2">🗑️</span>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
