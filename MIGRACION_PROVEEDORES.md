# Migración a Modelo de Proveedores

## 🎯 Nuevo Modelo

### Antes:
```
Material {
  nombre, precio, proveedor (texto)
}
```

### Después:
```
Material Base {
  nombre, unidad, categoría (SIN PRECIO)
}
  ↓
OfertaProveedor {
  materialId, proveedorId, precio, comisión, vigencia
}
  ↓
Proveedor {
  nombre, email, teléfono, logo
}
```

## 📋 Plan de Implementación

### Fase 1: Preparación (SIN ROMPER NADA)
1. ✅ Crear nuevas tablas: `Proveedor`, `OfertaProveedor`, `HistorialPrecioOferta`
2. ✅ Mantener tabla `Material` actual funcionando
3. ✅ Agregar campo `precioPersonalizado` para materiales de usuarios

### Fase 2: Migración de Datos
1. Crear proveedores desde materiales existentes
2. Convertir materiales del catálogo en:
   - Material base (sin precio)
   - Ofertas de proveedores (con precio)
3. Mantener materiales personalizados de usuarios

### Fase 3: Actualizar Frontend
1. Vista de materiales muestra ofertas
2. Selector de proveedor al elegir material
3. Comparador de precios
4. Panel de proveedor para actualizar ofertas

## 🚀 Ventajas del Nuevo Modelo

1. **Comparación de precios**: Usuario ve todas las ofertas
2. **Actualización dinámica**: Proveedores actualizan sus precios
3. **Comisiones variables**: Cada proveedor puede tener diferente comisión
4. **Historial**: Tracking de cambios de precio
5. **Stock**: Saber qué proveedor tiene disponibilidad
6. **Vigencia**: Ofertas temporales

## 💡 Ejemplo Real

**Material Base**: Cemento Portland 50kg

**Ofertas**:
- INC: ₲45,000 (comisión 8%, stock: sí)
- Petrobras: ₲43,500 (comisión 10%, stock: sí)
- Itacemento: ₲46,000 (comisión 7%, stock: no)

**Usuario ve**: "Cemento Portland desde ₲43,500"

## ⚠️ Decisión Requerida

¿Quieres que implemente la migración completa ahora o prefieres:

A) Implementar en paralelo (nuevo modelo + viejo modelo funcionando)
B) Migración completa (puede tomar tiempo pero es más limpio)
C) Empezar de cero con datos de prueba

**Recomendación**: Opción A - Implementar en paralelo para no romper nada.
