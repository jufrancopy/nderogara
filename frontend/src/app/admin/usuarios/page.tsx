'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Edit, Trash2 } from 'lucide-react';
import PageLoader from '@/components/PageLoader';
import ButtonLoading from '@/components/ButtonLoading';

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rol: 'CLIENTE',
    telefono: '',
    empresa: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'ADMIN') {
      router.push('/proyectos');
      return;
    }
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${editingUser.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        // Si hay imagen seleccionada, subirla
        if (selectedImage) {
          await uploadImage(data.data.id);
        }
        fetchUsuarios();
        closeModal();
      } else {
        alert(data.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        fetchUsuarios();
      } else {
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error de conexión');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        e.target.value = '';
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        e.target.value = '';
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (userId: string) => {
    if (!selectedImage) return;
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedImage);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error uploading image:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Image uploaded successfully:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir la imagen. Intenta con una imagen más pequeña.');
    }
  };

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email,
        password: '',
        rol: user.rol,
        telefono: user.telefono || '',
        empresa: user.empresa || ''
      });
      setImagePreview(user.image ? `${process.env.NEXT_PUBLIC_API_URL}${user.image}` : '');
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        rol: 'CLIENTE',
        telefono: '',
        empresa: ''
      });
      setImagePreview('');
    }
    setSelectedImage(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const getRolBadge = (rol: string) => {
    const colors = {
      ADMIN: 'bg-orange-100 text-orange-800',
      CONSTRUCTOR: 'bg-blue-100 text-blue-800',
      CLIENTE: 'bg-gray-100 text-gray-800',
      PROVEEDOR_MATERIALES: 'bg-purple-100 text-purple-800',
      PROVEEDOR_SERVICIOS: 'bg-green-100 text-green-800'
    };
    return colors[rol as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Filtrar usuarios por término de búsqueda
  const filteredUsuarios = usuarios.filter((usuario: any) =>
    usuario.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.rol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Administrar Usuarios</h2>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 text-white px-3 py-1 rounded text-sm transition-colors sm:px-4 sm:py-2 lg:px-4 lg:py-2"
              style={{backgroundColor: '#38603B'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
              title="Nuevo Usuario"
            >
              <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline ml-2">Nuevo Usuario</span>
            </button>
          </div>

          {/* Barra de búsqueda */}
          {usuarios.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar usuarios por nombre, email, rol o empresa..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {usuarios.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No hay usuarios registrados</p>
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No se encontraron usuarios que coincidan con la búsqueda</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-blue-600 hover:text-blue-700 underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actividad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsuarios.map((usuario: any) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {usuario.image ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={`${process.env.NEXT_PUBLIC_API_URL}${usuario.image}`}
                                  alt={usuario.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{usuario.name}</div>
                              <div className="text-sm text-gray-500">{usuario.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolBadge(usuario.rol)}`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{usuario.telefono || '-'}</div>
                          <div>{usuario.empresa || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>Proyectos: {usuario._count?.proyectos || 0}</div>
                          <div>Inmuebles: {usuario._count?.inmuebles || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal(usuario)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(usuario.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                
                <input
                  type="password"
                  placeholder={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required={!editingUser}
                />
                
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="CONSTRUCTOR">Constructor</option>
                  <option value="PROVEEDOR_MATERIALES">Proveedor de Materiales</option>
                  <option value="PROVEEDOR_SERVICIOS">Proveedor de Servicios</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                
                <input
                  type="text"
                  placeholder="Empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de perfil
                  </label>
                  <div className="flex items-center space-x-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <ButtonLoading
                    type="submit"
                    loading={submitting}
                    className="px-4 py-2 text-white rounded"
                    style={{backgroundColor: '#38603B'}}
                  >
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </ButtonLoading>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
