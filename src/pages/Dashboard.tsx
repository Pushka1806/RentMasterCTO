import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, FileText, DollarSign } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Активные мероприятия',
      value: '12',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-900/30',
    },
    {
      label: 'Единиц оборудования',
      value: '247',
      icon: Package,
      color: 'text-green-500',
      bgColor: 'bg-green-900/30',
    },
    {
      label: 'Активных смет',
      value: '8',
      icon: FileText,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-900/30',
    },
    {
      label: 'Отчётов на рассмотрении',
      value: '5',
      icon: DollarSign,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-900/30',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Главная</h1>
        <p className="text-gray-400">
          Добро пожаловать, {user?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Последние мероприятия
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">Мероприятие {i}</p>
                  <p className="text-sm text-gray-400">Клиент {i}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">2025-11-{20 + i}</p>
                  <span className="text-xs bg-green-900/30 text-green-500 px-2 py-1 rounded">
                    Подтверждено
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Последние сметы
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">СМ-2025-00{i}</p>
                  <p className="text-sm text-gray-400">Мероприятие {i}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">${500 * i}</p>
                  <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-1 rounded">
                    Черновик
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
