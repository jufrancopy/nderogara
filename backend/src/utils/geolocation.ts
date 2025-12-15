/**
 * Utilidades para cálculos de geolocalización
 */

export interface Coordinates {
  latitud: number;
  longitud: number;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param coord1 Primer punto (latitud, longitud)
 * @param coord2 Segundo punto (latitud, longitud)
 * @returns Distancia en kilómetros
 */
export function calcularDistancia(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Radio de la Tierra en kilómetros

  const dLat = toRadians(coord2.latitud - coord1.latitud);
  const dLon = toRadians(coord2.longitud - coord1.longitud);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitud)) * Math.cos(toRadians(coord2.latitud)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convierte grados a radianes
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar
 */
export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)}m`;
  } else if (distanciaKm < 10) {
    return `${distanciaKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanciaKm)}km`;
  }
}

/**
 * Ordena proveedores por distancia a un punto de referencia
 */
export function ordenarPorDistancia<T extends { latitud?: number; longitud?: number }>(
  items: T[],
  referencia: Coordinates
): T[] {
  return items
    .filter(item => item.latitud !== null && item.longitud !== null)
    .map(item => ({
      ...item,
      distancia: calcularDistancia(referencia, {
        latitud: item.latitud!,
        longitud: item.longitud!
      })
    }))
    .sort((a, b) => (a as any).distancia - (b as any).distancia);
}

/**
 * Filtra proveedores dentro de un radio determinado
 */
export function filtrarPorRadio<T extends { latitud?: number; longitud?: number }>(
  items: T[],
  centro: Coordinates,
  radioKm: number
): T[] {
  return items.filter(item => {
    if (!item.latitud || !item.longitud) return false;
    const distancia = calcularDistancia(centro, {
      latitud: item.latitud,
      longitud: item.longitud
    });
    return distancia <= radioKm;
  });
}
