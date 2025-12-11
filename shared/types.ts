// Tipos compartidos entre frontend y backend

export enum Rol {
  ADMIN = 'ADMIN',
  CONSTRUCTOR = 'CONSTRUCTOR',
  CLIENTE = 'CLIENTE'
}

export enum EstadoProyecto {
  PLANIFICACION = 'PLANIFICACION',
  EN_PROGRESO = 'EN_PROGRESO',
  PAUSADO = 'PAUSADO',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO'
}

export enum TipoCalidad {
  COMUN = 'COMUN',
  PREMIUM = 'PREMIUM',
  INDUSTRIAL = 'INDUSTRIAL',
  ARTESANAL = 'ARTESANAL'
}

export enum UnidadMedida {
  KG = 'KG',
  BOLSA = 'BOLSA',
  M2 = 'M2',
  M3 = 'M3',
  ML = 'ML',
  UNIDAD = 'UNIDAD',
  LOTE = 'LOTE',
  GLOBAL = 'GLOBAL'
}

// Interfaces principales
export interface User {
  id: string
  name?: string
  email: string
  rol: Rol
  telefono?: string
  empresa?: string
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  nombre: string
  unidad: UnidadMedida
  precioUnitario: number
  tipoCalidad: TipoCalidad
  marca?: string
  proveedor: string
  telefonoProveedor?: string
  stockMinimo?: number
  esActivo: boolean
  imagenUrl?: string
  observaciones?: string
  categoriaId: string
  categoria?: CategoriaMaterial
  fechaActualizacion: Date
  createdAt: Date
  updatedAt: Date
}

export interface CategoriaMaterial {
  id: string
  nombre: string
  descripcion?: string
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: string
  nombre: string
  descripcion?: string
  unidadMedida: UnidadMedida
  manoObraUnitaria?: number
  notasGenerales?: string
  esActivo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion?: string
  superficieTotal?: number
  direccion?: string
  fechaInicio?: Date
  fechaFinEstimada?: Date
  estado: EstadoProyecto
  margenGanancia?: number
  moneda: string
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
  usuarioId: string
  usuario?: User
  createdAt: Date
  updatedAt: Date
}

// DTOs para API
export interface CreateMaterialDto {
  nombre: string
  unidad: UnidadMedida
  precioUnitario: number
  tipoCalidad: TipoCalidad
  marca?: string
  proveedor: string
  telefonoProveedor?: string
  stockMinimo?: number
  imagenUrl?: string
  observaciones?: string
  categoriaId: string
}

export interface CreateProyectoDto {
  nombre: string
  descripcion?: string
  superficieTotal?: number
  direccion?: string
  fechaInicio?: Date
  fechaFinEstimada?: Date
  margenGanancia?: number
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  name: string
  email: string
  password: string
  rol?: Rol
  telefono?: string
  empresa?: string
}

// Respuestas de API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  user: User
  token: string
}