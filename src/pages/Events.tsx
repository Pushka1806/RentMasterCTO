import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Pencil, Trash2, Search, Filter, CheckCircle2, Circle, FileText } from 'lucide-react';
import { getEvents, deleteEvent, Event, EVENT_TYPES, EVENT_STATUSES } from '../lib/events';
import { useAuth } from '../contexts/AuthContext';

interface EventsProps {
  onEventFormOpen?: (event?: Event) => void;
  onSpecificationOpen?: (eventId: string) => void;
}

export function Events({ onEventFormOpen, onSpecificationOpen }: EventsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDelete = user?.role !== 'warehouse' && user?.role !== 'staff';

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это мероприятие?')) return;

    try {
      await deleteEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Ошибка при удалении');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.clients?.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venues?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'Запрос': 'bg-yellow-900/30 text-yellow-400 border-yellow-600',
      'На рассмотрении': 'bg-blue-900/30 text-blue-400 border-blue-600',
      'Подтверждено': 'bg-green-900/30 text-green-400 border-green-600'
    };
    return colors[status as keyof typeof colors] || colors['Запрос'];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-cyan-500" />
          <h1 className="text-3xl font-bold text-white">Мероприятия</h1>
        </div>
        {canEditDelete && (
          <button
            onClick={() => onEventFormOpen?.()}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить
          </button>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Поиск по названию, заказчику, площадке..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none"
            >
              <option value="all">Все типы</option>
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none"
            >
              <option value="all">Все статусы</option>
              {EVENT_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-gray-400 text-sm mb-1">Всего мероприятий</div>
          <div className="text-2xl font-bold text-white">{events.length}</div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-gray-400 text-sm mb-1">Запросов</div>
          <div className="text-2xl font-bold text-yellow-400">
            {events.filter(e => e.status === 'Запрос').length}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-gray-400 text-sm mb-1">На рассмотрении</div>
          <div className="text-2xl font-bold text-blue-400">
            {events.filter(e => e.status === 'На рассмотрении').length}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-gray-400 text-sm mb-1">Подтверждено</div>
          <div className="text-2xl font-bold text-green-400">
            {events.filter(e => e.status === 'Подтверждено').length}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Дата
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Название / Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Заказчик
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Площадка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Прогресс
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Мероприятия не найдены
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-cyan-400 font-medium">{formatDate(event.event_date)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{event.name || '-'}</div>
                      <div className="text-sm text-gray-400">{event.event_type}</div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {event.clients?.organization || '-'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {event.venues?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {event.progress_budget_done ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" title="Смета составлена" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600" title="Смета не составлена" />
                        )}
                        {event.progress_equipment_reserved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" title="Оборудование зарезервировано" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600" title="Оборудование не зарезервировано" />
                        )}
                        {event.progress_project_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" title="Проект выполнен" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600" title="Проект не выполнен" />
                        )}
                        {event.progress_paid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" title="Оплачен" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-600" title="Не оплачен" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditDelete ? (
                          <>
                            <button
                              onClick={() => onEventFormOpen?.(event)}
                              className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded transition-colors"
                              title="Редактировать"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onSpecificationOpen?.(event.id)}
                            className="p-2 text-cyan-400 hover:bg-cyan-900/30 rounded transition-colors"
                            title="Спецификация"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
