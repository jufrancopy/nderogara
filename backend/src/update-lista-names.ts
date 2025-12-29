import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateListaNames() {
  console.log('🔄 Actualizando nombres de listas de materiales...')

  try {
    // Buscar todos los materiales que tienen "[LISTA]" en el nombre
    const materialesConLista = await prisma.material.findMany({
      where: {
        nombre: {
          startsWith: '[LISTA]'
        },
        descripcion: {
          contains: 'LISTA DE MATERIALES'
        }
      }
    })

    console.log(`📋 Encontrados ${materialesConLista.length} materiales con prefijo "[LISTA]"`)

    let actualizados = 0

    for (const material of materialesConLista) {
      // Quitar el prefijo "[LISTA]" y espacios adicionales
      const nuevoNombre = material.nombre.replace(/^\[LISTA\]\s*/, '').trim()

      if (nuevoNombre !== material.nombre) {
        await prisma.material.update({
          where: { id: material.id },
          data: { nombre: nuevoNombre }
        })
        actualizados++
        console.log(`✅ Actualizado: "${material.nombre}" → "${nuevoNombre}"`)
      }
    }

    console.log(`🎉 Proceso completado. ${actualizados} materiales actualizados.`)

  } catch (error) {
    console.error('❌ Error al actualizar nombres de listas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la función
updateListaNames()
  .then(() => {
    console.log('✅ Script ejecutado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error al ejecutar script:', error)
    process.exit(1)
  })
