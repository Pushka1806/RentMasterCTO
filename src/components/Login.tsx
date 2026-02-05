import React, { useState } from 'react';
import { signIn } from '../lib/auth';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export function Login({ onSuccess, onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const translateError = (error: string): string => {
    if (error.includes('Invalid login credentials')) return 'Неверный логин или пароль';
    if (error.includes('Email not confirmed')) return 'Email не подтверждён';
    if (error.includes('pending approval')) return 'Аккаунт ожидает активации администратором';
    if (error.includes('User profile not found')) return 'Профиль не найден. Обратитесь к администратору';
    if (error.includes('User not found')) return 'Пользователь не найден';
    return 'Ошибка входа. Попробуйте позже';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(translateError(err.message || 'Failed to sign in'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg shadow-xl p-8 border border-gray-800">
          <div className="flex items-center justify-center mb-8">
            <LogIn className="w-12 h-12 text-gray-400" />
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            RentMaster
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Система управления прокатом оборудования
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Логин
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-white hover:text-gray-300 text-sm"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
