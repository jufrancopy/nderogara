'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ButtonLoading from '@/components/ButtonLoading';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    telefono: '',
    empresa: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Error en la autenticación');
        return;
      }

      // Limpiar cualquier sesión anterior
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      localStorage.setItem('token; data.data.token);
      localStorage.setItem('user; JSON.stringify(data.data.user));

      // Redirect based on user role
      const userRole = data.data.user.rol;
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (userRole === 'PROVEEDOR_MATERIALES' || userRole === 'CONSTRUCTOR' || userRole === 'PROVEEDOR_SERVICIOS') {
        router.push('/proveedor/materiales');
      } else {
        router.push('/proyectos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #f0f9f0, #ffffff, #fffef0)'}}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mx-4">
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/logo.jpg`}
              alt="Nde Rogara"
              className="h-28 w-28 object-contain mx-auto mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #38603B, #B99742); WebkitBackgroundClip: 'text; WebkitTextFillColor: 'transparent'}}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Empresa"
                value={formData.empresa}
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />

          <ButtonLoading
            type="submit"
            loading={loading}
            className="w-full text-white py-2 rounded-lg disabled:bg-gray-400"
            style={{backgroundColor: '#38603B'}}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#633722')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#38603B')}
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </ButtonLoading>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 hover:underline"
          style={{color: '#38603B'}}
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
