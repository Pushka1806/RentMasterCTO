import { useState, useEffect } from 'react';
import { DollarSign, FileText, Calendar } from 'lucide-react';
import { getPersonnel, Personnel } from '../lib/personnel';
import { getPaymentsByPersonnel, PaymentWithDetails } from '../lib/payments';

export default function PersonnelPaymentsReport() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPersonnel();
  }, []);

  useEffect(() => {
    if (selectedPersonnelId) {
      loadPayments();
    } else {
      setPayments([]);
    }
  }, [selectedPersonnelId]);

  async function loadPersonnel() {
    try {
      const data = await getPersonnel();
      setPersonnel(data);
    } catch (error) {
      console.error('Error loading personnel:', error);
    }
  }

  async function loadPayments() {
    try {
      setLoading(true);
      const data = await getPaymentsByPersonnel(selectedPersonnelId);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectedPerson = personnel.find(p => p.id === selectedPersonnelId);

  const paymentsByMonth: Record<string, PaymentWithDetails[]> = {};
  payments.forEach(payment => {
    const month = payment.month;
    if (!paymentsByMonth[month]) {
      paymentsByMonth[month] = [];
    }
    paymentsByMonth[month].push(payment);
  });

  const sortedMonths = Object.keys(paymentsByMonth).sort().reverse();

  const calculateMonthTotal = (monthPayments: PaymentWithDetails[]): number => {
    return monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidAmount = payments
    .filter(p => p.status === 'Выплачено')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const plannedAmount = payments
    .filter(p => p.status === 'Запланировано')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const overdueAmount = payments
    .filter(p => p.status === 'Просрочено')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Отчет по выплатам сотрудников</h1>
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Выберите сотрудника
          </label>
          <select
            value={selectedPersonnelId}
            onChange={(e) => setSelectedPersonnelId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">— Все сотрудники —</option>
            {personnel.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name} ({person.rate_percentage}%)
              </option>
            ))}
          </select>
        </div>

        {selectedPerson && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Всего</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalAmount.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Выплачено</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {paidAmount.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Запланировано</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {plannedAmount.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Просрочено</span>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {overdueAmount.toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        )}

        {!selectedPersonnelId ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Выберите сотрудника для просмотра отчета</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Загрузка...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Нет выплат для выбранного сотрудника</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((month) => {
              const monthPayments = paymentsByMonth[month];
              const monthTotal = calculateMonthTotal(monthPayments);
              const monthDate = new Date(month);
              const monthName = monthDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' });

              return (
                <div key={month} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">{monthName}</h3>
                      <p className="font-bold text-lg text-gray-900">
                        {monthTotal.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Мероприятие</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Работа</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-900">Сумма</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Статус</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Дата выплаты</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monthPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm text-gray-900">
                              {payment.event?.name || '—'}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {payment.work_item?.name || '—'}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                              {Number(payment.amount).toLocaleString('ru-RU')} ₽
                            </td>
                            <td className="px-6 py-3 text-sm text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                payment.status === 'Выплачено'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'Запланировано'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {payment.payment_date
                                ? new Date(payment.payment_date).toLocaleDateString('ru-RU')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
