export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400">© 2024 Nde Rogara. Planifica tu vivienda con confianza.</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm">
              Proyecto desarrollado con Claude & Amazon Q por{' '}
              <a 
                href="https://thepydeveloper.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
                style={{color: '#B99742'}}
              >
                ThePyDeveloper
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
