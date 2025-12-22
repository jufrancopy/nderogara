'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatPrice } from '@/lib/formatters'
import { API_BASE_URL } from '@/lib/api'

// Función auxiliar para formatear unidades
const getUnidadLabel = (unidad: string) => {
  const labels: { [key: string]: string } = {
    'M2': 'm²',
    'M3': 'm³',
    'ML': 'ml',
    'KG': 'kg',
    'BOLSA': 'bolsa',
    'UNIDAD': 'unidad',
    'LOTE': 'lote',
    'GLOBAL': 'global'
  }
  return labels[unidad] || unidad
}

interface Item {
  id: string
  nombre: string
  unidadMedida: string
  manoObraUnitaria?: number
  materialesPorItem: MaterialPorItem[]
}

interface MaterialPorItem {
  id: string
  cantidadPorUnidad: number
  observaciones?: string
  material: {
    id: string
    nombre: string
    unidad: string
    precioUnitario: number
    imagenUrl?: string
  }
}
interface Material {
  id: string
  nombre: string
  unidad: string
  precioBase?: number
  imagenUrl?: string
  ofertas?: Array<{
    precio: number
    stock: boolean
    proveedor: {
      nombre: string
    }
  }>
}

export default function MaterialesItemPage() {
  const params = useParams()
  const itemId = params.id as string
  
  const [item, setItem] = useState<Item | null>(null)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [cantidad, setCantidad] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    materialId: string
    materialNombre: string
  }>({ isOpen: false, materialId: '', materialNombre: '' })
  const [editingMaterial, setEditingMaterial] = useState<{
    id: string
    cantidadPorUnidad: number
    observaciones: string
  } | null>(null)

  // Estados para pagos de materiales
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [selectedMaterialForPago, setSelectedMaterialForPago] = useState<MaterialPorItem | null>(null)
  const [pagoForm, setPagoForm] = useState({
    montoPagado: '',
    comprobante: null as File | null,
    notas: ''
  })
  const [estadoPagos, setEstadoPagos] = useState<Record<string, any>>({})
  const [uploadingComprobante, setUploadingComprobante] = useState(false)

  // Estados para ver detalles de pago
  const [showPagoDetalleModal, setShowPagoDetalleModal] = useState(false)
  const [selectedMaterialForDetalle, setSelectedMaterialForDetalle] = useState<MaterialPorItem | null>(null)
  const [pagosMaterial, setPagosMaterial] = useState<any[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)

  // Estados para ver detalles del material
  const [showMaterialDetailModal, setShowMaterialDetailModal] = useState(false)
  const [selectedMaterialForDetail, setSelectedMaterialForDetail] = useState<Material | null>(null)

  // Estados para crear nuevo material
  const [showCreateMaterialModal, setShowCreateMaterialModal] = useState(false)

  // Estados para agregar ofertas
  const [showAddOfertaModal, setShowAddOfertaModal] = useState(false)
  const [selectedMaterialForOferta, setSelectedMaterialForOferta] = useState<MaterialPorItem | null>(null)
  const [ofertaForm, setOfertaForm] = useState({
    proveedorId: '',
    precio: '',
    tipoCalidad: 'COMUN',
    marca: '',
    comisionPorcentaje: '0',
    stock: true,
    observaciones: '',
    imagenUrl: ''
  })
  const [loadingOferta, setLoadingOferta] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [showGallery, setShowGallery] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [proveedores, setProveedores] = useState<any[]>([])
  const [proveedorSearchTerm, setProveedorSearchTerm] = useState('')
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<any>(null)
  const [showCreateProveedorModal, setShowCreateProveedorModal] = useState(false)
  const [newProveedor, setNewProveedor] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    departamento: ''
  })
  const [createMaterialForm, setCreateMaterialForm] = useState({
    nombre: '',
    descripcion: '',
    unidad: 'UNIDAD',
    categoriaId: '',
    precioUnitario: '',
    precioBase: '',
    tipoCalidad: 'COMUN',
    marca: '',
    proveedorId: '',
    telefonoProveedor: '',
    stockMinimo: '0',
    imagenUrl: '',
    observaciones: ''
  })
  const [loadingCreate, setLoadingCreate] = useState(false)

  // Estados para búsqueda y paginación
  const [materialSearchTerm, setMaterialSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Detectar si viene desde proyecto
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const fromProyecto = searchParams.get('from') === 'proyecto'
  const proyectoId = searchParams.get('proyectoId')

  useEffect(() => {
    fetchItem()
    fetchMateriales()
    fetchCategorias()
    fetchGaleria()
    fetchProveedores()
  }, [itemId])

  // Filtrar materiales para el dropdown
  const filteredDropdownMateriales = materiales.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Resetear selección cuando cambia el filtro
  useEffect(() => {
    setSelectedIndex(-1)
  }, [searchTerm])

  // Manejar navegación por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown || filteredDropdownMateriales.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredDropdownMateriales.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < filteredDropdownMateriales.length) {
            const selectedMaterial = filteredDropdownMateriales[selectedIndex]
            setSelectedMaterial(selectedMaterial)
            setSearchTerm(selectedMaterial.nombre)
            setShowDropdown(false)
            setSelectedIndex(-1)
          }
          break
        case 'Escape':
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
      }
    }

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDropdown, selectedIndex, filteredDropdownMateriales])

  // Cargar estados de pago cuando el item se carga
  useEffect(() => {
    if (item?.materialesPorItem) {
      fetchEstadoPagos()
    }
  }, [item])

  // Efecto para resetear página cuando se busca
  useEffect(() => {
    setCurrentPage(1)
  }, [materialSearchTerm])

  // Filtrar materiales del item
  const filteredMaterialesPorItem = item?.materialesPorItem.filter(materialItem =>
    (materialItem.material?.nombre || '').toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
    materialItem.observaciones?.toLowerCase().includes(materialSearchTerm.toLowerCase())
  ) || []

  // Calcular costos totales
  const costoTotalMateriales = filteredMaterialesPorItem.reduce((total, materialItem) => {
    const costoMaterial = (materialItem.material?.precioUnitario || 0) * materialItem.cantidadPorUnidad
    return total + costoMaterial
  }, 0)

  const costoTotalManoObra = Number(item?.manoObraUnitaria || 0)
  const costoTotalPorUnidad = costoTotalMateriales + costoTotalManoObra
  const costoTotalGeneral = costoTotalPorUnidad * (item ? getUnidadLabel(item.unidadMedida) === 'm²' ? 1 : 1 : 1) // Multiplicador según unidad

  // Paginación
  const totalPages = Math.ceil(filteredMaterialesPorItem.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMaterialesPorItem = filteredMaterialesPorItem.slice(startIndex, endIndex)

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Funciones para pagos de materiales
  const handleAddComprobante = (materialItem: MaterialPorItem) => {
    setSelectedMaterialForPago(materialItem)
    setPagoForm({ montoPagado: '', comprobante: null, notas: '' })
    setShowPagoModal(true)
  }

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

  const handlePagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialForPago || !pagoForm.montoPagado || !pagoForm.comprobante) return

    setUploadingComprobante(true)
    try {
      // Primero subir el comprobante
      const formData = new FormData()
      formData.append('file', pagoForm.comprobante)

      const uploadResponse = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const comprobanteUrl = uploadResponse.data.data.url

      // Luego crear el pago
      await api.post('/materiales/pagos', {
        materialPorItemId: selectedMaterialForPago.id,
        montoPagado: pagoForm.montoPagado.replace(/\./g, '').replace(',', '.'),
        comprobanteUrl,
        notas: pagoForm.notas
      })

      toast.success('Comprobante de pago agregado exitosamente')
      setShowPagoModal(false)
      setSelectedMaterialForPago(null)

      // Actualizar estados de pago
      await fetchEstadoPagos()

    } catch (error: any) {
      console.error('Error adding pago:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar comprobante de pago'
      toast.error(errorMessage)
    } finally {
      setUploadingComprobante(false)
    }
  }

  const fetchEstadoPagos = async () => {
    if (!item?.materialesPorItem) return

    const estados: Record<string, any> = {}

    for (const materialItem of item.materialesPorItem) {
      try {
        const response = await api.get(`/materiales/${materialItem.id}/estado-pago`)
        estados[materialItem.id] = response.data.data
      } catch (error) {
        console.error(`Error fetching estado pago for ${materialItem.id}:`, error)
      }
    }

    setEstadoPagos(estados)
  }

  const getEstadoPagoLabel = (materialItemId: string) => {
    const estado = estadoPagos[materialItemId]
    if (!estado) return { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', clickable: false }

    if (estado.estado === 'COMPLETO') {
      return { label: 'Pagado', color: 'bg-green-100 text-green-800', clickable: true }
    } else if (estado.estado === 'PARCIAL') {
      return { label: `Parcial (${formatPrice(estado.totalPagado)}/${formatPrice(estado.costoTotal)})`, color: 'bg-yellow-100 text-yellow-800', clickable: true }
    }
    return { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', clickable: true }
  }

  const handleVerDetallesPago = async (materialItem: MaterialPorItem) => {
    setSelectedMaterialForDetalle(materialItem)
    setLoadingPagos(true)
    setShowPagoDetalleModal(true)

    try {
      const response = await api.get(`/materiales/${materialItem.id}/pagos`)
      setPagosMaterial(response.data.data || [])
    } catch (error) {
      console.error('Error fetching pagos:', error)
      setPagosMaterial([])
    } finally {
      setLoadingPagos(false)
    }
  }

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${itemId}`)
      setItem(response.data.data)
    } catch (error) {
      console.error('Error fetching item:', error)
      toast.error('Error al cargar el item')
    } finally {
      setLoading(false)
    }
  }

  const fetchMateriales = async () => {
    try {
      const response = await api.get('/materiales')
      setMateriales(response.data.data || [])
    } catch (error) {
      console.error('Error fetching materiales:', error)
    }
  }

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterial || !cantidad) return

    try {
      await api.post(`/items/${itemId}/materiales`, {
        materialId: selectedMaterial.id,
        cantidadPorUnidad: Number(cantidad),
        observaciones: observaciones || undefined
      })

      toast.success('Material agregado exitosamente')
      setShowAddForm(false)
      setSelectedMaterial(null)
      setSearchTerm('')
      setCantidad('')
      setObservaciones('')
      fetchItem() // Recargar item
    } catch (error: any) {
      console.error('Error adding material:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar material'
      toast.error(errorMessage)
    }
  }

  const handleDeleteClick = (materialId: string, materialNombre: string) => {
    setDeleteDialog({
      isOpen: true,
      materialId,
      materialNombre
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/items/${itemId}/materiales/${deleteDialog.materialId}`)
      toast.success('Material removido exitosamente')
      fetchItem()
    } catch (error: any) {
      console.error('Error removing material:', error)
      const errorMessage = error.response?.data?.error || 'Error al remover material'
      toast.error(errorMessage)
    }
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, materialId: '', materialNombre: '' })
  }

  const handleEditClick = (materialItem: MaterialPorItem) => {
    setEditingMaterial({
      id: materialItem.material.id,
      cantidadPorUnidad: materialItem.cantidadPorUnidad,
      observaciones: materialItem.observaciones || ''
    })
  }

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMaterial) return

    try {
      await api.put(`/items/${itemId}/materiales/${editingMaterial.id}`, {
        cantidadPorUnidad: editingMaterial.cantidadPorUnidad,
        observaciones: editingMaterial.observaciones || undefined
      })

      toast.success('Material actualizado exitosamente')
      setEditingMaterial(null)
      fetchItem()
    } catch (error: any) {
      console.error('Error updating material:', error)
      const errorMessage = error.response?.data?.error || 'Error al actualizar material'
      toast.error(errorMessage)
    }
  }

  const handleShowDetail = (material: Material) => {
    setSelectedMaterialForDetail(material)
    setShowMaterialDetailModal(true)
  }

  // Función para crear nuevo material y agregarlo al item
  const handleCreateNewMaterial = async () => {
    // Validaciones básicas
    if (!createMaterialForm.nombre || !createMaterialForm.categoriaId ||
        !createMaterialForm.precioUnitario || !createMaterialForm.proveedorId) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setLoadingCreate(true)

    try {
      // Subir imagen si hay archivo seleccionado
      let finalImageUrl = createMaterialForm.imagenUrl || ''
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const uploadResponse = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (uploadResponse.data.success) {
          finalImageUrl = uploadResponse.data.data.url
        }
      }

      // Crear el material usando la API de admin (que también crea la oferta automáticamente)
      const materialData = {
        nombre: createMaterialForm.nombre,
        descripcion: createMaterialForm.observaciones,
        unidad: createMaterialForm.unidad,
        categoriaId: createMaterialForm.categoriaId,
        precioUnitario: parseFloat(createMaterialForm.precioUnitario.replace(/\./g, '').replace(',', '.')),
        precioBase: createMaterialForm.precioBase ? parseFloat(createMaterialForm.precioBase) : null,
        tipoCalidad: createMaterialForm.tipoCalidad,
        marca: createMaterialForm.marca,
        proveedorId: createMaterialForm.proveedorId,
        telefonoProveedor: selectedProveedor?.telefono || '',
        stockMinimo: parseInt(createMaterialForm.stockMinimo) || 0,
        imagenUrl: finalImageUrl,
        observaciones: createMaterialForm.observaciones
      }

      const response = await api.post('/admin/materiales', materialData)

      if (response.data.success) {
        const nuevoMaterial = response.data.data

        // Agregar automáticamente el material al item actual
        await api.post(`/items/${itemId}/materiales`, {
          materialId: nuevoMaterial.id,
          cantidadPorUnidad: 1, // Valor por defecto
          observaciones: `Material creado y agregado automáticamente - ${new Date().toLocaleDateString('es-PY')}`
        })

        toast.success('Material creado y agregado exitosamente al item')

        // Resetear formulario
        setCreateMaterialForm({
          nombre: '',
          descripcion: '',
          unidad: 'UNIDAD',
          categoriaId: '',
          precioUnitario: '',
          precioBase: '',
          tipoCalidad: 'COMUN',
          marca: '',
          proveedorId: '',
          telefonoProveedor: '',
          stockMinimo: '0',
          imagenUrl: '',
          observaciones: ''
        })
        setSelectedFile(null)
        setCurrentImageUrl('')
        setSelectedProveedor(null)
        setProveedorSearchTerm('')

        // Cerrar modal y recargar datos
        setShowCreateMaterialModal(false)
        fetchItem()
        fetchMateriales()
      } else {
        toast.error(response.data.error || 'Error al crear material')
      }
    } catch (error: any) {
      console.error('Error creating material:', error)
      const errorMessage = error.response?.data?.error || 'Error al crear material'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoadingCreate(false)
    }
  }

  // Función para agregar oferta a material existente
  const handleAddOferta = (materialItem: MaterialPorItem) => {
    setSelectedMaterialForOferta(materialItem)
    setOfertaForm({
      proveedorId: '',
      precio: '',
      tipoCalidad: 'COMUN',
      marca: '',
      comisionPorcentaje: '0',
      stock: true,
      observaciones: '',
      imagenUrl: ''
    })
    setShowAddOfertaModal(true)
  }

  // Función para crear proveedores
  const handleCreateProveedor = async () => {
    try {
      const response = await api.post('/proveedores', newProveedor)
      const proveedorCreado = response.data.data

      // Agregar el nuevo proveedor a la lista
      setProveedores(prev => [...prev, proveedorCreado])

      // Seleccionar automáticamente el nuevo proveedor
      setSelectedProveedor(proveedorCreado)
      setProveedorSearchTerm(proveedorCreado.nombre)
      setCreateMaterialForm(prev => ({ ...prev, proveedorId: proveedorCreado.id }))
      setOfertaForm(prev => ({ ...prev, proveedorId: proveedorCreado.id }))
      setShowProveedorDropdown(false)

      // Cerrar modal y resetear formulario
      setShowCreateProveedorModal(false)
      setNewProveedor({
        nombre: '',
        email: '',
        telefono: '',
        ciudad: '',
        departamento: ''
      })

      toast.success('Proveedor creado exitosamente')
    } catch (error: any) {
      console.error('Error creating proveedor:', error)
      const errorMessage = error.response?.data?.error || 'Error al crear proveedor'
      toast.error(`Error: ${errorMessage}`)
    }
  }

  // Función para enviar oferta
  const handleSubmitOferta = async () => {
    if (!selectedMaterialForOferta || !ofertaForm.proveedorId || !ofertaForm.precio) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setLoadingOferta(true)

    try {
      // Crear la oferta usando la API de admin
      const ofertaData = {
        proveedorId: ofertaForm.proveedorId,
        precio: parseFloat(ofertaForm.precio.replace(/\./g, '').replace(',', '.')),
        tipoCalidad: ofertaForm.tipoCalidad,
        marca: ofertaForm.marca,
        comisionPorcentaje: parseFloat(ofertaForm.comisionPorcentaje) || 0,
        stock: ofertaForm.stock,
        observaciones: ofertaForm.observaciones
      }

      const response = await api.post(`/admin/materiales/${selectedMaterialForOferta.material.id}/ofertas`, ofertaData)

      if (response.data.success) {
        toast.success('Oferta agregada exitosamente')

        // Cerrar modal y resetear formulario
        setShowAddOfertaModal(false)
        setOfertaForm({
          proveedorId: '',
          precio: '',
          tipoCalidad: 'COMUN',
          marca: '',
          comisionPorcentaje: '0',
          stock: true,
          observaciones: '',
          imagenUrl: ''
        })
        setSelectedProveedor(null)
        setProveedorSearchTerm('')

        // Recargar materiales para mostrar la nueva oferta
        fetchMateriales()
      } else {
        toast.error(response.data.error || 'Error al agregar oferta')
      }
    } catch (error: any) {
      console.error('Error creating oferta:', error)
      const errorMessage = error.response?.data?.error || 'Error al agregar oferta'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoadingOferta(false)
    }
  }

  // Funciones para cargar datos
  const fetchCategorias = async () => {
    try {
      const response = await api.get('/categorias')
      setCategorias(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar categorías:', error)
      // Cargar categorías por defecto si falla
      setCategorias([
        { id: '1', nombre: 'Estructural' },
        { id: '2', nombre: 'Mampostería' },
        { id: '3', nombre: 'Acabados' },
        { id: '4', nombre: 'Instalaciones Eléctricas' },
        { id: '5', nombre: 'Instalaciones Sanitarias' },
        { id: '6', nombre: 'Herramientas' },
        { id: '7', nombre: 'Construcción General' },
        { id: '8', nombre: 'Aislantes' },
        { id: '9', nombre: 'Fijaciones' },
        { id: '10', nombre: 'Adhesivos y Selladores' },
        { id: '11', nombre: 'Cubierta y Techos' },
        { id: '12', nombre: 'Carpintería' },
        { id: '13', nombre: 'Jardinería' },
        { id: '14', nombre: 'Seguridad' }
      ])
    }
  }

  const fetchGaleria = async () => {
    try {
      const response = await api.get('/upload/galeria')
      setGaleria(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar galería:', error)
      setGaleria([])
    }
  }

  const fetchProveedores = async () => {
    try {
      const response = await api.get('/proveedores')
      setProveedores(response.data.data || [])
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
      setProveedores([])
    }
  }




  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link
                href={fromProyecto && proyectoId ? `/proyectos/${proyectoId}` : "/items"}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Materiales del Item</h2>
                <p className="text-gray-600">{item?.nombre}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-[#38603B] text-white px-3 py-1 rounded text-sm transition-colors flex items-center hover:bg-[#2d4a2f] sm:px-4 sm:py-2 lg:px-4 lg:py-2"
                title="Agregar Material Existente"
              >
                <Plus className="h-4 w-4 sm:h-4 sm:w-4 lg:h-4 lg:w-4" />
                <span className="hidden sm:inline ml-2">Agregar Material</span>
              </button>
              <button
                onClick={() => setShowCreateMaterialModal(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center hover:bg-blue-700 sm:px-4 sm:py-2 lg:px-4 lg:py-2"
                title="Crear Nuevo Material"
              >
                <span className="text-lg">+</span>
                <span className="hidden sm:inline ml-2">Nuevo Material</span>
              </button>
            </div>
          </div>

          {/* Cost Summary Card */}
          {item?.materialesPorItem && item.materialesPorItem.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💰</span>
                Resumen de Costos - {item.nombre}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Costo Total Materiales */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Materiales</span>
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatPrice(costoTotalMateriales)}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">
                    {filteredMaterialesPorItem.length} material{filteredMaterialesPorItem.length !== 1 ? 'es' : ''}
                  </div>
                </div>

                {/* Costo Mano de Obra */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Mano de Obra</span>
                    <span className="text-green-600">👷</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {formatPrice(costoTotalManoObra)}
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Por {getUnidadLabel(item.unidadMedida)}
                  </div>
                </div>

                {/* Costo Total por Unidad */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Total por {getUnidadLabel(item.unidadMedida)}</span>
                    <span className="text-purple-600">📊</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatPrice(costoTotalPorUnidad)}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    Incluye todo
                  </div>
                </div>

                {/* Costo Total General */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-900">Costo Total Acumulativo</span>
                    <span className="text-orange-600">💵</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-900">
                    {formatPrice(costoTotalGeneral)}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">
                    Costo total del item
                  </div>
                </div>
              </div>

              {/* Breakdown por material */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Desglose por Material:</h4>
                <div className="space-y-2">
                  {filteredMaterialesPorItem.slice(0, 5).map((materialItem) => (
                    <div key={materialItem.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {materialItem.material?.nombre || 'Material sin nombre'} ({materialItem.cantidadPorUnidad}x)
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(materialItem.material.precioUnitario * materialItem.cantidadPorUnidad)}
                      </span>
                    </div>
                  ))}
                  {filteredMaterialesPorItem.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      ... y {filteredMaterialesPorItem.length - 5} materiales más
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Material Form */}
          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Material</h3>
              <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar material..."
                      required
                    />
                    {selectedMaterial && (
                      <div className="absolute right-2 top-2 text-sm text-gray-600">
                        ✓
                      </div>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredDropdownMateriales.length > 0 ? (
                        filteredDropdownMateriales.map((material, index) => (
                          <div
                            key={material.id}
                            onClick={() => {
                              setSelectedMaterial(material)
                              setSearchTerm(material.nombre)
                              setShowDropdown(false)
                              setSelectedIndex(-1)
                            }}
                            className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              selectedIndex === index
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {material.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getUnidadLabel(material.unidad)}
                                  {(() => {
                                    // Mostrar el precio más atractivo disponible
                                    let precioMasAtractivo = null;
                                    let fuentePrecio = '';

                                    // Primero buscar el precio más bajo entre ofertas activas
                                    if (material.ofertas && material.ofertas.length > 0) {
                                      const ofertasActivas = material.ofertas.filter(oferta => oferta.stock === true);
                                      if (ofertasActivas.length > 0) {
                                        precioMasAtractivo = Math.min(...ofertasActivas.map(o => Number(o.precio)));
                                        fuentePrecio = `• Mejor oferta: ₲ ${precioMasAtractivo.toLocaleString('es-PY')}`;
                                      }
                                    }

                                    // Si no hay ofertas, mostrar precio base
                                    if (precioMasAtractivo === null && material.precioBase) {
                                      precioMasAtractivo = Number(material.precioBase);
                                      fuentePrecio = `• Precio base: ₲ ${precioMasAtractivo.toLocaleString('es-PY')}`;
                                    }

                                    return precioMasAtractivo ? (
                                      <span className="ml-2 text-green-600 font-medium">
                                        {fuentePrecio}
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                              {material.precioBase && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  📊 Base
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          No se encontraron materiales
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad por {item && getUnidadLabel(item.unidadMedida)}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Opcional"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          {item?.materialesPorItem && item.materialesPorItem.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar materiales en este item..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={materialSearchTerm}
                  onChange={(e) => setMaterialSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Materials List */}
          <div className="bg-white shadow rounded-lg">
            {!item?.materialesPorItem.length ? (
              <div className="p-6 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay materiales asociados a este item</p>
                <p className="text-sm text-gray-400 mt-2">
                  Agrega materiales para crear la matriz de costos
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Imagen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad por {item && getUnidadLabel(item.unidadMedida)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo por {item && getUnidadLabel(item.unidadMedida)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Observaciones
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentMaterialesPorItem.map((materialItem) => (
                      <tr key={materialItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden"
                               onClick={() => materialItem.material && handleShowDetail(materialItem.material)}>
                            {materialItem.material?.imagenUrl ? (
                              <img
                                src={materialItem.material.imagenUrl.startsWith('http')
                                  ? materialItem.material.imagenUrl
                                  : `${API_BASE_URL}${materialItem.material.imagenUrl}`}
                                alt={materialItem.material.nombre || 'Material'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<span class="text-gray-400 text-xs">Sin imagen</span>';
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">Sin imagen</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                 onClick={() => materialItem.material && handleShowDetail(materialItem.material)}>
                              {materialItem.material?.nombre || 'Material sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {materialItem.material ? getUnidadLabel(materialItem.material.unidad) : 'Sin unidad'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingMaterial?.id === materialItem.material.id ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editingMaterial.cantidadPorUnidad}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                cantidadPorUnidad: Number(e.target.value)
                              })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            materialItem.cantidadPorUnidad
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(materialItem.material.precioUnitario)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(materialItem.material.precioUnitario * materialItem.cantidadPorUnidad)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => getEstadoPagoLabel(materialItem.id).clickable && handleVerDetallesPago(materialItem)}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              getEstadoPagoLabel(materialItem.id).clickable
                                ? `${getEstadoPagoLabel(materialItem.id).color} hover:opacity-80 cursor-pointer`
                                : getEstadoPagoLabel(materialItem.id).color
                            }`}
                            title={getEstadoPagoLabel(materialItem.id).clickable ? "Ver detalles de pago" : "Sin pagos registrados"}
                          >
                            {getEstadoPagoLabel(materialItem.id).label}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-48 overflow-hidden">
                          {editingMaterial?.id === materialItem.material.id ? (
                            <input
                              type="text"
                              value={editingMaterial.observaciones}
                              onChange={(e) => setEditingMaterial({
                                ...editingMaterial,
                                observaciones: e.target.value
                              })}
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Observaciones"
                            />
                          ) : (
                            <span title={materialItem.observaciones || '-'} className="block truncate whitespace-nowrap">
                              {materialItem.observaciones || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {editingMaterial?.id === materialItem.material.id ? (
                              <>
                                <button
                                  onClick={handleUpdateMaterial}
                                  className="text-green-600 hover:text-green-800 mr-2"
                                  title="Guardar"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingMaterial(null)}
                                  className="text-gray-600 hover:text-gray-800"
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAddOferta(materialItem)}
                                  className="text-purple-600 hover:text-purple-800"
                                  title="Agregar Oferta"
                                >
                                  💰
                                </button>
                                <button
                                  onClick={() => handleEditClick(materialItem)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleAddComprobante(materialItem)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Agregar Comprobante de Pago"
                                >
                                  🧾
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(materialItem.material.id, materialItem.material.nombre)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación - Footer de la tabla */}
            {filteredMaterialesPorItem.length > itemsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando{' '}
                        <span className="font-medium">{startIndex + 1}</span>
                        {' '}a{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredMaterialesPorItem.length)}</span>
                        {' '}de{' '}
                        <span className="font-medium">{filteredMaterialesPorItem.length}</span>
                        {' '}resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const distance = Math.abs(page - currentPage);
                            return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                          })
                          .map((page, index, array) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => goToPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          ))}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Siguiente</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Remover Material"
        message={`¿Estás seguro de que quieres remover "${deleteDialog.materialNombre}" de este item?`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal de agregar comprobante de pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Agregar Comprobante de Pago</h2>
                <button
                  onClick={() => setShowPagoModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedMaterialForPago && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Resumen de Pago</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Monto Total</p>
                      <p className="text-xl font-bold text-blue-900">
                        {formatPrice(selectedMaterialForPago.material.precioUnitario * selectedMaterialForPago.cantidadPorUnidad)}
                      </p>
                    </div>

                    {(() => {
                      const estadoPago = estadoPagos[selectedMaterialForPago.id]
                      if (estadoPago) {
                        return (
                          <>
                            <div className="text-center">
                              <p className="text-sm text-green-600 font-medium">Pagado</p>
                              <p className="text-xl font-bold text-green-900">
                                {formatPrice(estadoPago.totalPagado)}
                              </p>
                            </div>

                            <div className="text-center">
                              <p className="text-sm text-orange-600 font-medium">Pendiente</p>
                              <p className={`text-xl font-bold ${
                                estadoPago.pendiente > 0 ? 'text-orange-900' :
                                estadoPago.pendiente < 0 ? 'text-red-900' : 'text-green-900'
                              }`}>
                                {estadoPago.pendiente !== 0 ? formatPrice(Math.abs(estadoPago.pendiente)) : '₲0'}
                                {estadoPago.pendiente < 0 && (
                                  <span className="text-xs text-red-600 block">(Sobre-pago)</span>
                                )}
                              </p>
                            </div>
                          </>
                        )
                      }
                      return null
                    })()}
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Material:</strong> {selectedMaterialForPago.material.nombre}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handlePagoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Pagado *
                  </label>
                  <input
                    type="text"
                    value={pagoForm.montoPagado}
                    onChange={(e) => {
                      const formattedValue = formatMontoInput(e.target.value)
                      setPagoForm({...pagoForm, montoPagado: formattedValue})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el monto con separadores de miles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante (Imagen) *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPagoForm({...pagoForm, comprobante: e.target.files?.[0] || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos permitidos: JPG, PNG, GIF. Máx: 10MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={pagoForm.notas}
                    onChange={(e) => setPagoForm({...pagoForm, notas: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Referencia de pago, fecha, etc."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPagoModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingComprobante}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {uploadingComprobante ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💰</span>
                        Agregar Pago
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles de pago */}
      {showPagoDetalleModal && selectedMaterialForDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Detalles de Pago</h2>
                  <p className="text-gray-600 mt-1">
                    Material: {selectedMaterialForDetalle.material.nombre}
                  </p>
                </div>
                <button
                  onClick={() => setShowPagoDetalleModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Resumen de pago */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Costo Total</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(selectedMaterialForDetalle.material.precioUnitario * selectedMaterialForDetalle.cantidadPorUnidad)}
                  </p>
                </div>

                {(() => {
                  const estado = estadoPagos[selectedMaterialForDetalle.id]
                  if (!estado) return null

                  return (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-900 mb-2">Total Pagado</h3>
                        <p className="text-2xl font-bold text-green-900">
                          {formatPrice(estado.totalPagado)}
                        </p>
                      </div>

                      <div className={`border rounded-lg p-4 ${
                        estado.estado === 'COMPLETO'
                          ? 'bg-green-50 border-green-200'
                          : estado.estado === 'PARCIAL'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h3 className={`text-sm font-medium mb-2 ${
                          estado.estado === 'COMPLETO'
                            ? 'text-green-900'
                            : estado.estado === 'PARCIAL'
                            ? 'text-yellow-900'
                            : 'text-gray-900'
                        }`}>
                          Estado de Pago
                        </h3>
                        <p className={`text-xl font-bold ${
                          estado.estado === 'COMPLETO'
                            ? 'text-green-900'
                            : estado.estado === 'PARCIAL'
                            ? 'text-yellow-900'
                            : 'text-gray-900'
                        }`}>
                          {estado.estado === 'COMPLETO' ? 'Pagado' :
                           estado.estado === 'PARCIAL' ? 'Parcial' : 'Pendiente'}
                        </p>
                        {estado.pendiente > 0 && (
                          <p className="text-sm mt-1">
                            Pendiente: {formatPrice(estado.pendiente)}
                          </p>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Historial de pagos */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Historial de Pagos ({pagosMaterial.length})
                  </h3>
                </div>

                <div className="p-6">
                  {loadingPagos ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Cargando pagos...</p>
                    </div>
                  ) : pagosMaterial.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400">
                        <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No hay comprobantes de pago registrados</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pagosMaterial.map((pago: any) => (
                        <div key={pago.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {formatPrice(pago.montoPagado)}
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(pago.fechaPago).toLocaleDateString('es-PY')}
                                </span>
                              </div>
                              {pago.notas && (
                                <p className="text-sm text-gray-600">{pago.notas}</p>
                              )}
                            </div>
                          </div>

                          {/* Imagen del comprobante */}
                          {pago.comprobanteUrl && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Comprobante:</p>
                              <div className="bg-white border border-gray-200 rounded-lg p-2 inline-block">
                                {(() => {
                                  // Determinar la URL correcta
                                  let imageUrl = pago.comprobanteUrl;
                                  if (!imageUrl.startsWith('http')) {
                                    // Es una ruta relativa, agregar el dominio
                                    imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                                  }
                                  // Si ya es una URL completa, usar tal cual

                                  return (
                                    <img
                                      src={imageUrl}
                                      alt="Comprobante de pago"
                                      className="max-w-xs max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(imageUrl, '_blank')}
                                      onError={(e) => {
                                        console.error('Error loading image:', imageUrl);
                                        // Fallback si la imagen no carga
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE4QzE0IDE5LjEgMTMuMSAyMCAxMiAyMEMxMC45IDIwIDEwIDE5LjEgMTAgMThWNFMxMC45IDIgMTIgMlpNMTIgNUEuNS41IDAgMCAxIDExLjUgNUMxMS41IDQuNSAxMiA0LjUgMTIgNFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                                      }}
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPagoDetalleModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del material */}
      {showMaterialDetailModal && selectedMaterialForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Detalles del Material</h2>
                <button
                  onClick={() => setShowMaterialDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedMaterialForDetail.nombre}</h3>
                  <p className="text-sm text-gray-600">{getUnidadLabel(selectedMaterialForDetail.unidad)}</p>
                </div>

                {selectedMaterialForDetail.ofertas && selectedMaterialForDetail.ofertas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ofertas Disponibles:</h4>
                    <div className="space-y-2">
                      {selectedMaterialForDetail.ofertas.map((oferta, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">{oferta.proveedor.nombre}</span>
                          <span className="text-sm font-medium text-green-600">{formatPrice(oferta.precio)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMaterialForDetail.precioBase && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Precio Base:</strong> {formatPrice(selectedMaterialForDetail.precioBase)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowMaterialDetailModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo material */}
      {showCreateMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Material</h2>
                <button
                  onClick={() => setShowCreateMaterialModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">¿Qué hace esto?</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Crea un material en el catálogo general</li>
                  <li>• Genera automáticamente una oferta</li>
                  <li>• Agrega el material a este item inmediatamente</li>
                  <li>• El material estará disponible para otros proyectos</li>
                </ul>
              </div>

              <form className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Material *
                      </label>
                      <input
                        type="text"
                        value={createMaterialForm.nombre}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Cemento Portland"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría *
                      </label>
                      <select
                        value={createMaterialForm.categoriaId}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, categoriaId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map((categoria: any) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de Medida *
                      </label>
                      <select
                        value={createMaterialForm.unidad}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, unidad: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="UNIDAD">Unidad</option>
                        <option value="KG">Kilogramo</option>
                        <option value="BOLSA">Bolsa</option>
                        <option value="M2">Metro Cuadrado</option>
                        <option value="M3">Metro Cúbico</option>
                        <option value="ML">Metro Lineal</option>
                        <option value="LOTE">Lote</option>
                        <option value="GLOBAL">Global</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Unitario (₲) *
                      </label>
                      <input
                        type="text"
                        value={createMaterialForm.precioUnitario}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          const numValue = parseInt(value) || 0
                          setCreateMaterialForm(prev => ({
                            ...prev,
                            precioUnitario: numValue.toLocaleString('es-PY')
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Calidad
                      </label>
                      <select
                        value={createMaterialForm.tipoCalidad}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, tipoCalidad: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="COMUN">Común</option>
                        <option value="PREMIUM">Premium</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="ARTESANAL">Artesanal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={createMaterialForm.marca}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, marca: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Holcim"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen del Material
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedFile(file);
                                  const url = URL.createObjectURL(file);
                                  setCurrentImageUrl('');
                                  setCreateMaterialForm(prev => ({ ...prev, imagenUrl: url }));
                                }
                              }}
                              className="hidden"
                              id="create-material-image-upload"
                            />
                            <label
                              htmlFor="create-material-image-upload"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                            >
                              📎 Seleccionar imagen...
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Cargar galería si no está cargada
                              if (galeria.length === 0) {
                                fetchGaleria();
                              }
                              setShowGallery(!showGallery);
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 whitespace-nowrap"
                          >
                            🖼️ Galería
                          </button>
                        </div>
                        {currentImageUrl || createMaterialForm.imagenUrl ? (
                          <img src={currentImageUrl || createMaterialForm.imagenUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
                        ) : null}

                        {/* Campo URL como opción adicional */}
                        <div className="border-t pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            O especificar URL
                          </label>
                          <input
                            type="url"
                            value={createMaterialForm.imagenUrl.startsWith('blob:') ? '' : createMaterialForm.imagenUrl}
                            onChange={(e) => {
                              setCreateMaterialForm(prev => ({ ...prev, imagenUrl: e.target.value }));
                              setSelectedFile(null);
                              setCurrentImageUrl('');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                      </div>

                      {showGallery && (
                        <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto mt-3">
                          <h4 className="font-medium mb-3">Seleccionar de Galería</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {galeria.map((img: any) => (
                              <div
                                key={img.filename}
                                onClick={() => {
                                  const fullUrl = img.url.startsWith('http')
                                    ? img.url
                                    : `${API_BASE_URL}${img.url}`;
                                  setCreateMaterialForm(prev => ({ ...prev, imagenUrl: fullUrl }));
                                  setCurrentImageUrl(fullUrl);
                                  setSelectedFile(null);
                                  setShowGallery(false);
                                }}
                                className="cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden transition-colors"
                              >
                                <img src={`${API_BASE_URL}${img.url}`} alt={img.filename} className="w-full h-20 object-cover" />
                              </div>
                            ))}
                          </div>
                          {galeria.length === 0 && (
                            <p className="text-gray-500 text-sm text-center py-4">No hay imágenes en la galería</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Información del Proveedor */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Proveedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proveedor *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={proveedorSearchTerm}
                            onChange={(e) => {
                              setProveedorSearchTerm(e.target.value)
                              setShowProveedorDropdown(true)
                              if (selectedProveedor && e.target.value !== selectedProveedor.nombre) {
                                setSelectedProveedor(null)
                                setCreateMaterialForm(prev => ({ ...prev, proveedorId: '' }))
                              }
                            }}
                            onFocus={() => setShowProveedorDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Buscar proveedor..."
                            required
                          />
                          {selectedProveedor && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProveedor(null)
                                setProveedorSearchTerm('')
                                setCreateMaterialForm(prev => ({ ...prev, proveedorId: '' }))
                              }}
                              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCreateProveedorModal(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          + Agregar
                        </button>
                      </div>

                      {/* Dropdown de proveedores */}
                      {showProveedorDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {proveedores
                            .filter(proveedor =>
                              proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                            )
                            .map((proveedor) => (
                              <div
                                key={proveedor.id}
                                onClick={() => {
                                  setSelectedProveedor(proveedor)
                                  setProveedorSearchTerm(proveedor.nombre)
                                  setCreateMaterialForm(prev => ({ ...prev, proveedorId: proveedor.id }))
                                  setShowProveedorDropdown(false)
                                }}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{proveedor.nombre}</div>
                                {proveedor.ciudad && (
                                  <div className="text-sm text-gray-500">📍 {proveedor.ciudad}</div>
                                )}
                                {proveedor.telefono && (
                                  <div className="text-sm text-gray-500">📞 {proveedor.telefono}</div>
                                )}
                              </div>
                            ))}
                          {proveedores.filter(proveedor =>
                            proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-center">
                              No se encontraron proveedores
                            </div>
                          )}
                        </div>
                      )}

                      {createMaterialForm.proveedorId === '' && (
                        <p className="mt-1 text-sm text-red-600">El proveedor es requerido</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono del Proveedor
                      </label>
                      <input
                        type="tel"
                        value={selectedProveedor?.telefono || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                        placeholder="Se completa automáticamente"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={selectedProveedor?.ciudad || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                        placeholder="Se completa automáticamente"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createMaterialForm.stockMinimo}
                        onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, stockMinimo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={createMaterialForm.observaciones}
                    onChange={(e) => setCreateMaterialForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notas adicionales sobre el material..."
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateMaterialModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewMaterial}
                    disabled={loadingCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {loadingCreate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">⚡</span>
                        Crear y Agregar Material
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear proveedor */}
      {showCreateProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Nuevo Proveedor</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newProveedor.nombre}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Ferretería Central"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newProveedor.email}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contacto@proveedor.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={newProveedor.telefono}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+595 21 123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={newProveedor.ciudad}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Asunción"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={newProveedor.departamento}
                    onChange={(e) => setNewProveedor(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Central"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateProveedorModal(false)
                    setNewProveedor({
                      nombre: '',
                      email: '',
                      telefono: '',
                      ciudad: '',
                      departamento: ''
                    })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateProveedor}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Crear Proveedor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar oferta */}
      {showAddOfertaModal && selectedMaterialForOferta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Agregar Oferta</h2>
                <button
                  onClick={() => setShowAddOfertaModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Material Seleccionado</h3>
                <div className="flex items-center">
                  {selectedMaterialForOferta.material.imagenUrl ? (
                    <img
                      src={selectedMaterialForOferta.material.imagenUrl.startsWith('http')
                        ? selectedMaterialForOferta.material.imagenUrl
                        : `${API_BASE_URL}${selectedMaterialForOferta.material.imagenUrl}`}
                      alt={selectedMaterialForOferta.material.nombre}
                      className="w-12 h-12 rounded-lg object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-blue-900">{selectedMaterialForOferta.material.nombre}</div>
                    <div className="text-sm text-blue-700">{getUnidadLabel(selectedMaterialForOferta.material.unidad)}</div>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={proveedorSearchTerm}
                      onChange={(e) => {
                        setProveedorSearchTerm(e.target.value)
                        setShowProveedorDropdown(true)
                        if (selectedProveedor && e.target.value !== selectedProveedor.nombre) {
                          setSelectedProveedor(null)
                          setOfertaForm(prev => ({ ...prev, proveedorId: '' }))
                        }
                      }}
                      onFocus={() => setShowProveedorDropdown(true)}
                      onBlur={() => setTimeout(() => setShowProveedorDropdown(false), 200)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Buscar proveedor..."
                      required
                    />
                    {selectedProveedor && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProveedor(null)
                          setProveedorSearchTerm('')
                          setOfertaForm(prev => ({ ...prev, proveedorId: '' }))
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    )}

                    {/* Dropdown de proveedores */}
                    {showProveedorDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {proveedores
                          .filter(proveedor =>
                            proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                            proveedor.ciudad?.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                          )
                          .map((proveedor) => (
                            <div
                              key={proveedor.id}
                              onClick={() => {
                                setSelectedProveedor(proveedor)
                                setProveedorSearchTerm(proveedor.nombre)
                                setOfertaForm(prev => ({ ...prev, proveedorId: proveedor.id }))
                                setShowProveedorDropdown(false)
                              }}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{proveedor.nombre}</div>
                              {proveedor.ciudad && (
                                <div className="text-sm text-gray-500">📍 {proveedor.ciudad}</div>
                              )}
                              {proveedor.telefono && (
                                <div className="text-sm text-gray-500">📞 {proveedor.telefono}</div>
                              )}
                            </div>
                          ))}
                        {proveedores.filter(proveedor =>
                          proveedor.nombre.toLowerCase().includes(proveedorSearchTerm.toLowerCase()) ||
                          proveedor.ciudad?.toLowerCase().includes(proveedorSearchTerm.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-2 text-gray-500 text-center">
                            No se encontraron proveedores
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateProveedorModal(true)}
                    className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Crear nuevo proveedor"
                  >
                    + Crear Nuevo Proveedor
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (₲) *
                  </label>
                  <input
                    type="text"
                    value={ofertaForm.precio}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      const numValue = parseInt(value) || 0
                      setOfertaForm(prev => ({ ...prev, precio: numValue.toLocaleString('es-PY') }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Calidad
                  </label>
                  <select
                    value={ofertaForm.tipoCalidad}
                    onChange={(e) => setOfertaForm(prev => ({ ...prev, tipoCalidad: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="COMUN">Común</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="ARTESANAL">Artesanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={ofertaForm.marca}
                    onChange={(e) => setOfertaForm(prev => ({ ...prev, marca: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Marca del producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comisión (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ofertaForm.comisionPorcentaje}
                    onChange={(e) => setOfertaForm(prev => ({ ...prev, comisionPorcentaje: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={ofertaForm.observaciones}
                    onChange={(e) => setOfertaForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="oferta-stock"
                    checked={ofertaForm.stock}
                    onChange={(e) => setOfertaForm(prev => ({ ...prev, stock: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="oferta-stock" className="ml-2 block text-sm text-gray-900">
                    Disponible en stock
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddOfertaModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOferta}
                    disabled={loadingOferta}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                  >
                    {loadingOferta ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">💰</span>
                        Agregar Oferta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
