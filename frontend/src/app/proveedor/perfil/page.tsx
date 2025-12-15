'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, MapPin, Save, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface ProveedorProfile {
  id: string
  nombre: string
  email: string
  telefono?: string
  direccion?: string
  ciudad?: string
  departamento?: string
  latitud?: number
  longitud?: number
  sitioWeb?: string
  logo?: string
  usuario: {
    name: string
    email: string
    telefono?: string
  }
}

export default function ProveedorPerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    // Información del proveedor
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    latitud: '',
    longitud: '',
    sitioWeb: '',
    logo: '',

    // Información del usuario
    name: '',
    userTelefono: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Solo proveedores pueden acceder
      if (parsedUser.rol !== 'PROVEEDOR_MATERIALES') {
        router.push('/')
        return
      }

      fetchPerfil()
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchPerfil = async () => {
    try {
      const response = await api.get('/proveedor/perfil-info')
      const proveedor: ProveedorProfile = response.data.data

      setFormData({
        nombre: proveedor.nombre || '',
        email: proveedor.email || '',
        telefono: proveedor.telefono || '',
        direccion: proveedor.direccion || '',
        ciudad: proveedor.ciudad || '',
        departamento: proveedor.departamento || '',
        latitud: proveedor.latitud?.toString() || '',
        longitud: proveedor.longitud?.toString() || '',
        sitioWeb: proveedor.sitioWeb || '',
        logo: proveedor.logo || '',
        name: proveedor.usuario.name || '',
        userTelefono: proveedor.usuario.telefono || ''
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updateData = {
        ...formData,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined
      }

      await api.put('/proveedor/perfil-info', updateData)
      toast.success('Perfil actualizado exitosamente')

      // Actualizar el usuario en localStorage si cambió el nombre
      if (user && formData.name !== user.name) {
        const updatedUser = { ...user, name: formData.name }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar el perfil'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <User className="h-8 w-8 mr-3 text-blue-600" />
              Mi Perfil de Proveedor
            </h2>
            <p className="mt-2 text-gray-600">
              Gestiona la información de tu empresa y ubicación para mejorar tu visibilidad en la plataforma.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información del Usuario */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información Personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Teléfono Personal
                  </label>
                  <input
                    type="tel"
                    name="userTelefono"
                    value={formData.userTelefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+595 XXX XXX XXX"
                  />
                </div>
              </div>
            </div>

            {/* Información de la Empresa */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-green-600" />
                Información de la Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de la Empresa *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de la Empresa
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+595 XXX XXX XXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dirección completa de la empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Asunción, Luque"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Central, Alto Paraná"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    name="sitioWeb"
                    value={formData.sitioWeb}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://www.ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Logo
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Geoposicionamiento */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                Ubicación Geográfica
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                Ingresa las coordenadas GPS de tu ubicación para que los clientes puedan encontrar tus productos más fácilmente.
                Puedes obtener estas coordenadas usando Google Maps o herramientas similares.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitud
                  </label>
                  <input
                    type="number"
                    name="latitud"
                    value={formData.latitud}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-25.2637"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: -25.2637 (para Asunción)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud
                  </label>
                  <input
                    type="number"
                    name="longitud"
                    value={formData.longitud}
                    onChange={handleInputChange}
                    step="any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="-57.5759"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: -57.5759 (para Asunción)
                  </p>
                </div>
              </div>

              {(formData.latitud || formData.longitud) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    📍 Coordenadas configuradas: Lat {formData.latitud || 'N/A'}, Lng {formData.longitud || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#38603B] text-white rounded-md hover:bg-[#2d4a2f] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
