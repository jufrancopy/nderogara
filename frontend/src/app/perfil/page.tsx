'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, User, Mail, Phone, Building, Camera, Save, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface UserProfile {
  id: string
  name: string
  email: string
  rol: string
  telefono?: string
  empresa?: string
  image?: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determinar página anterior para navegación inteligente
  const getPreviousPage = () => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer
      // Si viene de cualquier página de la app (no externa), usar referrer
      if (referrer && referrer.includes(window.location.origin)) {
        return referrer
      }
    }
    // Fallback a proyectos
    return '/proyectos'
  }

  const handleGoBack = () => {
    const previousPage = getPreviousPage()
    if (previousPage !== window.location.href) {
      window.location.href = previousPage
    } else {
      router.push('/proyectos')
    }
  }

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editing, setEditing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    telefono: '',
    empresa: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      const userData = response.data.data
      setUser(userData)
      setFormData({
        name: userData.name || '',
        telefono: userData.telefono || '',
        empresa: userData.empresa || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error al cargar el perfil')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await api.put('/auth/profile', formData)
      setUser(response.data.data)
      setEditing(false)
      toast.success('Perfil actualizado exitosamente')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar perfil'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setUser(response.data.data)
      toast.success('Foto de perfil actualizada exitosamente')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      const errorMessage = error.response?.data?.error || 'Error al subir la imagen'
      toast.error(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const getRolLabel = (rol: string) => {
    const labels: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'CONSTRUCTOR': 'Constructor',
      'PROVEEDOR': 'Proveedor',
      'CLIENTE': 'Cliente'
    }
    return labels[rol] || rol
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor: '#38603B'}}></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No se pudo cargar el perfil</p>
          <button
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            Volver atrás
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                title="Volver"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
                <p className="text-gray-600">Gestiona tu información personal</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Image Section */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                  Foto de Perfil
                </h3>
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                      {user.image ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${user.image}`}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleImageClick}
                      disabled={uploadingImage}
                      className="absolute bottom-0 right-0 bg-[#38603B] text-white p-2 rounded-full hover:bg-[#2d4a2f] transition-colors disabled:opacity-50"
                      title="Cambiar foto"
                    >
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Haz click en la cámara para cambiar tu foto
                  </p>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Formatos: JPG, PNG. Máx: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Información Personal
                </h3>

                {editing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <div className="flex items-center">
                          <input
                            type="email"
                            value={user.email}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                            disabled
                          />
                          <Mail className="h-4 w-4 text-gray-400 ml-2" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          El email no se puede modificar
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <div className="flex items-center">
                          <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+595 9XX XXX XXX"
                          />
                          <Phone className="h-4 w-4 text-gray-400 ml-2" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Empresa
                        </label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nombre de la empresa"
                          />
                          <Building className="h-4 w-4 text-gray-400 ml-2" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-gray-500">
                        <strong>Rol:</strong> {getRolLabel(user.rol)}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false)
                            setFormData({
                              name: user.name || '',
                              telefono: user.telefono || '',
                              empresa: user.empresa || ''
                            })
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-[#38603B] text-white px-4 py-2 rounded-md hover:bg-[#2d4a2f] transition-colors disabled:opacity-50 flex items-center"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium text-gray-900">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <p className="font-medium text-gray-900">{user.telefono || 'No especificado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Empresa</p>
                          <p className="font-medium text-gray-900">{user.empresa || 'No especificada'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Rol en el sistema</p>
                          <p className="font-medium text-gray-900">{getRolLabel(user.rol)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Miembro desde</p>
                          <p className="font-medium text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
