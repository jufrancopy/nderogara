'use client'

interface TableLoaderProps {
  message?: string
  className?: string
}

export default function TableLoader({ message = "Cargando...", className = "" }: TableLoaderProps) {
  return (
    <div className={`p-12 text-center ${className}`}>
      <div className="relative">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#38603B]"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#38603B] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
      <div className="mt-2 flex justify-center">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-[#38603B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#38603B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#38603B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
