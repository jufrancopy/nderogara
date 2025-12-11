// Formatear precios en guaraníes paraguayos
export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Formatear números sin símbolo de moneda
export const formatNumber = (number: number) => {
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number)
}