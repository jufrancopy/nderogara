'use client'

interface TableLoaderProps {
  message?: string
  className?: string
}

export default function TableLoader({ message = "Cargando...", className = "" }: TableLoaderProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      {/* Spinner moderno con gradiente */}
      <div className="relative inline-block">
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin"
             style={{
               background: 'conic-gradient(from 0deg, #38603B, #B99742, #38603B)',
               WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
               mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))'
             }}>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-full shadow-inner"></div>
        </div>
      </div>

      <p className="mt-6 text-gray-600 font-medium">{message}</p>

      {/* Indicador de progreso sutil */}
      <div className="mt-4 flex justify-center space-x-2">
        <div className="w-1 h-1 bg-[#38603B] rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.5s' }}></div>
        <div className="w-1 h-1 bg-[#B99742] rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}></div>
        <div className="w-1 h-1 bg-[#38603B] rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '1.5s' }}></div>
      </div>
    </div>
  )
}
