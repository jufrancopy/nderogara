'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Calculator, CheckCircle, Sparkles, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react'

export default function Home() {
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/proyectos/referencia`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setProyectos(data.data);
          
          if (data.data.length > 1) {
            const interval = setInterval(() => {
              setCurrentIndex((prev) => (prev + 1) % data.data.length);
            }, 5000);
            
            return () => clearInterval(interval);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const nextSlide = () => {
    if (proyectos.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % proyectos.length);
    }
  };

  const prevSlide = () => {
    if (proyectos.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + proyectos.length) % proyectos.length);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50" style={{background: 'linear-gradient(to bottom right, #f0f9f0, #ffffff, #fffef0)'}}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 py-4">
            <div className="flex items-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/logo.jpg`}
                alt="Nde Rogara"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('ml-2');
                }}
              />
              <h1 className="ml-2 sm:ml-4 text-lg sm:text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #38603B, #B99742)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Nde Rogara</h1>
            </div>
            <div className="hidden sm:flex gap-3">
              <Link href="/inmuebles" className="text-gray-600 hover:text-gray-900 px-4 py-2">
                Inmuebles
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2">
                Iniciar Sesión
              </Link>
              <Link href="/login" className="text-white px-6 py-2 rounded-full transition-all shadow-md hover:shadow-lg" style={{backgroundColor: '#38603B'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}>
                Comenzar Gratis
              </Link>
            </div>
            <div className="sm:hidden">
              <Link href="/login" className="text-white px-4 py-2 rounded-lg" style={{backgroundColor: '#38603B'}}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Planifica tu <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #38603B, #B99742)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Vivienda Ideal</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto px-4">
            Controla cada detalle de tu proyecto de construcción. Presupuestos precisos, materiales optimizados y seguimiento en tiempo real.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
            style={{background: 'linear-gradient(to right, #38603B, #633722)'}}
          >
            <Sparkles className="h-5 w-5" />
            Crear Mi Proyecto
          </Link>
        </div>
      </section>

      {/* Carrusel de Proyectos */}
      {proyectos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-3xl font-bold text-center mb-8">Proyectos de Referencia</h3>
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
            {proyectos[currentIndex]?.imagenUrl && (
              <div className="aspect-[16/9] bg-gray-200 overflow-hidden">
                <img 
                  src={`${process.env.NEXT_PUBLIC_API_URL}${proyectos[currentIndex].imagenUrl}`}
                  alt={proyectos[currentIndex].nombre}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold text-gray-900">{proyectos[currentIndex]?.nombre}</h4>
                <span className="px-4 py-2 rounded-full font-semibold" style={{backgroundColor: '#D1B48C', color: '#38603B'}}>
                  {proyectos[currentIndex]?.superficieTotal}m²
                </span>
              </div>
              <p className="text-gray-600 mb-6">{proyectos[currentIndex]?.descripcion}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Margen sugerido</p>
                  <p className="text-2xl font-bold text-green-600">{proyectos[currentIndex]?.margenGanancia}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Estado</p>
                  <p className="text-2xl font-bold" style={{color: '#38603B'}}>Completado</p>
                </div>
              </div>
              <Link
                href={`/referencia/${proyectos[currentIndex]?.id}`}
                className="inline-block text-white px-6 py-3 rounded-lg transition-colors"
                style={{backgroundColor: '#38603B'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#633722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38603B'}
              >
                Ver Detalles Completos
              </Link>
            </div>
            
            {/* Controles */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="h-6 w-6 text-gray-800" />
            </button>
            
            {/* Indicadores */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {proyectos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8' : 'w-2 bg-gray-300'
                  }`}
                  style={idx === currentIndex ? {backgroundColor: '#38603B'} : {}}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#f0f9f0'}}>
              <Calculator className="h-6 w-6" style={{color: '#38603B'}} />
            </div>
            <h3 className="text-xl font-bold mb-3">Presupuestos Exactos</h3>
            <p className="text-gray-600 text-sm">
              Calcula el costo real con precios actualizados.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#fffef0'}}>
              <Building2 className="h-6 w-6" style={{color: '#B99742'}} />
            </div>
            <h3 className="text-xl font-bold mb-3">Gestión Completa</h3>
            <p className="text-gray-600 text-sm">
              Organiza etapas, materiales y proveedores.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#f0f9f0'}}>
              <CheckCircle className="h-6 w-6" style={{color: '#38603B'}} />
            </div>
            <h3 className="text-xl font-bold mb-3">Seguimiento Real</h3>
            <p className="text-gray-600 text-sm">
              Monitorea el avance en tiempo real.
            </p>
          </div>

          <Link href="/inmuebles" className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2" style={{borderColor: '#B99742'}}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: '#B99742'}}>
              <HomeIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{color: '#38603B'}}>🏠 Inmuebles</h3>
            <p className="text-gray-700 text-sm mb-4 font-medium">
              Casas construidas con Nde Rogara. Transparencia total en costos.
            </p>
            <div className="text-right">
              <span className="text-sm font-bold px-3 py-1 rounded-full text-white" style={{backgroundColor: '#38603B'}}>Ver inmuebles →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl p-12 text-center text-white shadow-2xl" style={{background: 'linear-gradient(to right, #38603B, #633722)'}}>
          <h3 className="text-4xl font-bold mb-4">¿Listo para construir tu sueño?</h3>
          <p className="text-xl mb-8 opacity-90">
            Únete a cientos de personas que ya están planificando su vivienda con nosotros.
          </p>
          <Link 
            href="/login" 
            className="inline-block bg-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            style={{color: '#38603B'}}
          >
            Comenzar Ahora - Es Gratis
          </Link>
        </div>
      </section>


    </div>
  )
}
