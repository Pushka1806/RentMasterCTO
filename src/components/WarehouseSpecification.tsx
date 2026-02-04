import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Package, Download, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import { BudgetItem, getBudgetItems, getEvent, updateBudgetItem, confirmSpecification, createBudgetItem } from '../lib/events';
import { EquipmentItem, getEquipmentItems } from '../lib/equipment';
import { getEquipmentCompositions } from '../lib/equipmentCompositions';
import { Category, getCategories } from '../lib/categories';
import { EquipmentSelector } from './EquipmentSelector';
import { useAuth } from '../contexts/AuthContext';
import { isWarehouse } from '../lib/auth';
import {
  CableItem,
  ConnectorItem,
  OtherItem,
  CABLE_TEMPLATES,
  CONNECTOR_TEMPLATES,
  OTHER_TEMPLATES,
  getCables,
  createCable,
  updateCable,
  deleteCable,
  getConnectors,
  createConnector,
  updateConnector,
  deleteConnector,
  getOtherItems,
  createOtherItem,
  updateOtherItem,
  deleteOtherItem
} from '../lib/warehouseSpecification';
import { getModificationComponents } from '../lib/equipment';

interface WarehouseSpecificationProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

interface ExpandedItem {
  budgetItemId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  category: string;
  notes: string;
  picked: boolean;
  isFromComposition: boolean;
  parentName?: string;
}

type TabType = 'budget' | 'cables' | 'connectors' | 'other';

export function WarehouseSpecification({ eventId, eventName, onClose }: WarehouseSpecificationProps) {
  const { user } = useAuth();
  const isWarehouseUser = isWarehouse(user);

  const [activeTab, setActiveTab] = useState<TabType>('budget');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<ExpandedItem[]>([]);
  const [cables, setCables] = useState<CableItem[]>([]);
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [otherItems, setOtherItems] = useState<OtherItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEquipmentSelector, setShowEquipmentSelector] = useState(false);
  const [allEquipment, setAllEquipment] = useState<EquipmentItem[]>([]);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [expandedCableTypes, setExpandedCableTypes] = useState<Record<string, boolean>>({});
  const [expandedConnectorCategories, setExpandedConnectorCategories] = useState<Record<string, boolean>>({});
  const [expandedOtherCategories, setExpandedOtherCategories] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetData, categoriesData, equipmentData, event, cablesData, connectorsData, otherData] = await Promise.all([
        getBudgetItems(eventId),
        getCategories(),
        getEquipmentItems(),
        getEvent(eventId),
        getCables(eventId),
        getConnectors(eventId),
        getOtherItems(eventId)
      ]);

      setCategories(categoriesData);
      setAllEquipment(equipmentData);
      setEventDetails(event);
      setBudgetItems(budgetData);
      setCables(cablesData);
      setConnectors(connectorsData);
      setOtherItems(otherData);

      const items: ExpandedItem[] = [];

      console.log('Loading warehouse specification for event:', eventId);
      console.log('Budget items count:', budgetData.length);

      for (const budgetItem of budgetData) {
        console.log('Processing budget item:', {
          id: budgetItem.id,
          item_type: budgetItem.item_type,
          equipment_name: budgetItem.equipment?.name,
          modification_id: budgetItem.modification_id,
          quantity: budgetItem.quantity
        });

        if (budgetItem.item_type === 'equipment' && budgetItem.equipment) {
          const equipment = budgetItem.equipment;

          if (budgetItem.modification_id) {
            console.log('Loading modification components for modification_id:', budgetItem.modification_id);

            if (equipment.object_type === 'virtual' && equipment.has_composition) {
              const compositions = await getEquipmentCompositions(equipment.id);
              for (const comp of compositions) {
                items.push({
                  budgetItemId: budgetItem.id,
                  name: comp.child_name,
                  sku: comp.child_sku,
                  quantity: budgetItem.quantity * comp.quantity,
                  unit: 'шт.',
                  category: comp.child_category,
                  notes: `Из комплекта: ${equipment.name}`,
                  picked: budgetItem.picked || false,
                  isFromComposition: true,
                  parentName: equipment.name
                });
              }
            } else {
              items.push({
                budgetItemId: budgetItem.id,
                name: equipment.name,
                sku: equipment.sku,
                quantity: budgetItem.quantity,
                unit: 'шт.',
                category: equipment.category,
                notes: `Основное оборудование`,
                picked: budgetItem.picked || false,
                isFromComposition: false
              });
            }

            const modComponents = await getModificationComponents(budgetItem.modification_id);
            console.log('Loaded modification components:', modComponents.length, modComponents);

            for (const modComp of modComponents) {
              if (modComp.component) {
                items.push({
                  budgetItemId: budgetItem.id,
                  name: modComp.component.name,
                  sku: modComp.component.sku || '',
                  quantity: budgetItem.quantity * modComp.quantity,
                  unit: 'шт.',
                  category: modComp.component.category,
                  notes: `Модификация: ${equipment.name}`,
                  picked: budgetItem.picked || false,
                  isFromComposition: true,
                  parentName: equipment.name
                });
              }
            }
          } else if (equipment.object_type === 'virtual' && equipment.has_composition) {
            const compositions = await getEquipmentCompositions(equipment.id);

            for (const comp of compositions) {
              items.push({
                budgetItemId: budgetItem.id,
                name: comp.child_name,
                sku: comp.child_sku,
                quantity: budgetItem.quantity * comp.quantity,
                unit: 'шт.',
                category: comp.child_category,
                notes: `Из комплекта: ${equipment.name}`,
                picked: budgetItem.picked || false,
                isFromComposition: true,
                parentName: equipment.name
              });
            }
          } else {
            items.push({
              budgetItemId: budgetItem.id,
              name: equipment.name,
              sku: equipment.sku,
              quantity: budgetItem.quantity,
              unit: 'шт.',
              category: equipment.category,
              notes: budgetItem.notes || '',
              picked: budgetItem.picked || false,
              isFromComposition: false
            });
          }
        }
      }

      setExpandedItems(items);

      const initialCableExpanded: Record<string, boolean> = {};
      CABLE_TEMPLATES.forEach(template => {
        initialCableExpanded[template.type] = true;
      });
      setExpandedCableTypes(initialCableExpanded);

      const initialConnectorExpanded: Record<string, boolean> = {};
      CONNECTOR_TEMPLATES.forEach(template => {
        initialConnectorExpanded[template.category] = true;
      });
      setExpandedConnectorCategories(initialConnectorExpanded);

      const initialOtherExpanded: Record<string, boolean> = {};
      OTHER_TEMPLATES.forEach(template => {
        initialOtherExpanded[template.category] = true;
      });
      setExpandedOtherCategories(initialOtherExpanded);
    } catch (error) {
      console.error('Error loading specification:', error);
      alert('Ошибка при загрузке спецификации');
    } finally {
      setLoading(false);
    }
  };

  const handlePickedChange = async (budgetItemId: string, picked: boolean) => {
    try {
      await updateBudgetItem(budgetItemId, { picked });
      setExpandedItems(expandedItems.map(item =>
        item.budgetItemId === budgetItemId ? { ...item, picked } : item
      ));
      setBudgetItems(budgetItems.map(item =>
        item.id === budgetItemId ? { ...item, picked } : item
      ));
    } catch (error) {
      console.error('Error updating picked status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleCablePickedChange = async (id: string, picked: boolean) => {
    try {
      const updated = await updateCable(id, { picked });
      setCables(cables.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      console.error('Error updating cable picked status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleConnectorPickedChange = async (id: string, picked: boolean) => {
    try {
      const updated = await updateConnector(id, { picked });
      setConnectors(connectors.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      console.error('Error updating connector picked status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleConfirmSpecification = async () => {
    if (!user) return;

    const allBudgetPicked = expandedItems.every(item => item.picked);
    const allCablesPicked = cables.length === 0 || cables.every(c => c.picked);
    const allConnectorsPicked = connectors.length === 0 || connectors.every(c => c.picked);
    const allOtherPicked = otherItems.length === 0 || otherItems.every(i => i.picked);

    if (!allBudgetPicked || !allCablesPicked || !allConnectorsPicked || !allOtherPicked) {
      const confirmMessage = 'Не все элементы отмечены как взятые. Вы уверены, что хотите подтвердить сборку спецификации?';
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    try {
      setConfirming(true);
      await confirmSpecification(eventId, user.id);
      alert('Спецификация подтверждена');
      onClose();
    } catch (error) {
      console.error('Error confirming specification:', error);
      alert('Ошибка при подтверждении спецификации');
    } finally {
      setConfirming(false);
    }
  };

  const handleAddEquipment = async (equipment: EquipmentItem, quantity: number, modificationId?: string) => {
    try {
      console.log('Adding equipment:', equipment.name, 'quantity:', quantity, 'modificationId:', modificationId);

      const newItem = await createBudgetItem({
        event_id: eventId,
        equipment_id: equipment.id,
        modification_id: modificationId || null,
        item_type: 'equipment',
        quantity,
        price: equipment.rental_price,
        exchange_rate: 1,
        category_id: null,
        notes: ''
      });

      console.log('Created budget item:', newItem);
      setShowEquipmentSelector(false);
      await loadData();
      alert(`Добавлено: ${equipment.name} x ${quantity}${modificationId ? ' (с модификацией)' : ''}`);
    } catch (error) {
      console.error('Error adding equipment:', error);
      alert('Ошибка при добавлении оборудования');
    }
  };

  const handleQuantityChange = (budgetItemId: string, newQuantity: number) => {
    setExpandedItems(expandedItems.map(item =>
      item.budgetItemId === budgetItemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
    ));
  };

  const handleNotesChange = (budgetItemId: string, newNotes: string) => {
    setExpandedItems(expandedItems.map(item =>
      item.budgetItemId === budgetItemId ? { ...item, notes: newNotes } : item
    ));
  };

  const handleAddCableFromTemplate = async (cableType: string, cableLength: string) => {
    try {
      const existingCable = cables.find(c => c.cable_type === cableType && c.cable_length === cableLength);

      if (existingCable) {
        const updated = await updateCable(existingCable.id, {
          quantity: existingCable.quantity + 1
        });
        setCables(cables.map(c => c.id === updated.id ? updated : c));
      } else {
        const newCable = await createCable({
          event_id: eventId,
          cable_type: cableType,
          cable_length: cableLength,
          quantity: 1,
          notes: '',
          picked: false
        });
        setCables([...cables, newCable]);
      }
    } catch (error) {
      console.error('Error adding cable:', error);
      alert('Ошибка при добавлении кабеля');
    }
  };

  const handleCableQuantityChange = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        await deleteCable(id);
        setCables(cables.filter(c => c.id !== id));
      } else {
        const updated = await updateCable(id, { quantity: newQuantity });
        setCables(cables.map(c => c.id === updated.id ? updated : c));
      }
    } catch (error) {
      console.error('Error updating cable:', error);
      alert('Ошибка при обновлении кабеля');
    }
  };

  const handleCableNotesChange = async (id: string, newNotes: string) => {
    try {
      const updated = await updateCable(id, { notes: newNotes });
      setCables(cables.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      console.error('Error updating cable notes:', error);
    }
  };

  const handleAddConnectorFromTemplate = async (connectorType: string) => {
    try {
      const existingConnector = connectors.find(c => c.connector_type === connectorType);

      if (existingConnector) {
        const updated = await updateConnector(existingConnector.id, {
          quantity: existingConnector.quantity + 1
        });
        setConnectors(connectors.map(c => c.id === updated.id ? updated : c));
      } else {
        const newConnector = await createConnector({
          event_id: eventId,
          connector_type: connectorType,
          quantity: 1,
          notes: '',
          picked: false
        });
        setConnectors([...connectors, newConnector]);
      }
    } catch (error) {
      console.error('Error adding connector:', error);
      alert('Ошибка при добавлении коннектора');
    }
  };

  const handleConnectorQuantityChange = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        await deleteConnector(id);
        setConnectors(connectors.filter(c => c.id !== id));
      } else {
        const updated = await updateConnector(id, { quantity: newQuantity });
        setConnectors(connectors.map(c => c.id === updated.id ? updated : c));
      }
    } catch (error) {
      console.error('Error updating connector:', error);
      alert('Ошибка при обновлении коннектора');
    }
  };

  const handleConnectorNotesChange = async (id: string, newNotes: string) => {
    try {
      const updated = await updateConnector(id, { notes: newNotes });
      setConnectors(connectors.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      console.error('Error updating connector notes:', error);
    }
  };

  const toggleCableType = (type: string) => {
    setExpandedCableTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const toggleConnectorCategory = (category: string) => {
    setExpandedConnectorCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleOtherCategory = (category: string) => {
    setExpandedOtherCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleAddOtherFromTemplate = async (category: string, itemType: string) => {
    try {
      const existingItem = otherItems.find(
        i => i.category === category && i.item_type === itemType
      );

      if (existingItem) {
        const updated = await updateOtherItem(existingItem.id, {
          quantity: existingItem.quantity + 1
        });
        setOtherItems(otherItems.map(i => i.id === updated.id ? updated : i));
      } else {
        const newItem = await createOtherItem({
          event_id: eventId,
          category,
          item_type: itemType,
          quantity: 1,
          notes: '',
          picked: false
        });
        setOtherItems([...otherItems, newItem]);
      }
    } catch (error) {
      console.error('Error adding other item:', error);
      alert('Ошибка при добавлении предмета');
    }
  };

  const handleOtherQuantityChange = async (id: string, newQuantity: number) => {
    try {
      if (newQuantity === 0) {
        await deleteOtherItem(id);
        setOtherItems(otherItems.filter(i => i.id !== id));
      } else {
        const updated = await updateOtherItem(id, { quantity: newQuantity });
        setOtherItems(otherItems.map(i => i.id === updated.id ? updated : i));
      }
    } catch (error) {
      console.error('Error updating other item:', error);
      alert('Ошибка при обновлении предмета');
    }
  };

  const handleOtherNotesChange = async (id: string, newNotes: string) => {
    try {
      const updated = await updateOtherItem(id, { notes: newNotes });
      setOtherItems(otherItems.map(i => i.id === updated.id ? updated : i));
    } catch (error) {
      console.error('Error updating other item notes:', error);
    }
  };

  const handleOtherPickedChange = async (id: string, picked: boolean) => {
    try {
      const updated = await updateOtherItem(id, { picked });
      setOtherItems(otherItems.map(i => i.id === updated.id ? updated : i));
    } catch (error) {
      console.error('Error updating other item picked status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const getOtherQuantity = (category: string, itemType: string) => {
    const item = otherItems.find(i => i.category === category && i.item_type === itemType);
    return item?.quantity || 0;
  };

  const getOtherId = (category: string, itemType: string) => {
    const item = otherItems.find(i => i.category === category && i.item_type === itemType);
    return item?.id;
  };

  const getOtherNotes = (category: string, itemType: string) => {
    const item = otherItems.find(i => i.category === category && i.item_type === itemType);
    return item?.notes || '';
  };

  const getOtherPicked = (category: string, itemType: string) => {
    const item = otherItems.find(i => i.category === category && i.item_type === itemType);
    return item?.picked || false;
  };

  const handleExportBudget = () => {
    const csvContent = [
      ['№', 'Наименование', 'Артикул', 'Категория', 'Количество', 'Ед. изм.', 'Взято', 'Примечания'].join(','),
      ...expandedItems.map((item, index) =>
        [
          index + 1,
          `"${item.name}"`,
          item.sku,
          `"${item.category}"`,
          item.quantity,
          item.unit,
          item.picked ? 'Да' : 'Нет',
          `"${item.notes}"`
        ].join(',')
      )
    ].join('\n');

    downloadCSV(csvContent, `Спецификация_Смета_${eventName}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportCables = () => {
    const csvContent = [
      ['№', 'Тип кабеля', 'Длина', 'Количество', 'Взято', 'Примечания'].join(','),
      ...cables.map((cable, index) =>
        [
          index + 1,
          `"${cable.cable_type}"`,
          cable.cable_length,
          cable.quantity,
          cable.picked ? 'Да' : 'Нет',
          `"${cable.notes}"`
        ].join(',')
      )
    ].join('\n');

    downloadCSV(csvContent, `Спецификация_Кабели_${eventName}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportConnectors = () => {
    const csvContent = [
      ['№', 'Категория', 'Тип коннектора', 'Количество', 'Взято', 'Примечания'].join(','),
      ...connectors.map((connector, index) =>
        [
          index + 1,
          `"${connector.connector_type}"`,
          `"${connector.connector_type}"`,
          connector.quantity,
          connector.picked ? 'Да' : 'Нет',
          `"${connector.notes}"`
        ].join(',')
      )
    ].join('\n');

    downloadCSV(csvContent, `Спецификация_Коннекторы_${eventName}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportOther = () => {
    const csvContent = [
      ['№', 'Категория', 'Предмет', 'Количество', 'Взято', 'Примечания'].join(','),
      ...otherItems.map((item, index) =>
        [
          index + 1,
          `"${item.category}"`,
          `"${item.item_type}"`,
          item.quantity,
          item.picked ? 'Да' : 'Нет',
          `"${item.notes}"`
        ].join(',')
      )
    ].join('\n');

    downloadCSV(csvContent, `Спецификация_Прочее_${eventName}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedByCategory = expandedItems.reduce((acc, item) => {
    const category = item.category || 'Без категории';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ExpandedItem[]>);

  const getCableQuantity = (cableType: string, cableLength: string) => {
    const cable = cables.find(c => c.cable_type === cableType && c.cable_length === cableLength);
    return cable?.quantity || 0;
  };

  const getCableId = (cableType: string, cableLength: string) => {
    const cable = cables.find(c => c.cable_type === cableType && c.cable_length === cableLength);
    return cable?.id;
  };

  const getCableNotes = (cableType: string, cableLength: string) => {
    const cable = cables.find(c => c.cable_type === cableType && c.cable_length === cableLength);
    return cable?.notes || '';
  };

  const getCablePicked = (cableType: string, cableLength: string) => {
    const cable = cables.find(c => c.cable_type === cableType && c.cable_length === cableLength);
    return cable?.picked || false;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Загрузка спецификации...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-[1600px] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6" />
              Спецификация для кладовщика
            </h2>
            <p className="text-gray-600 mt-1">{eventName}</p>
            {eventDetails && (
              <div className="flex items-center gap-4 mt-2">
                <p className="text-sm text-gray-500">
                  {eventDetails.venues?.name} • {new Date(eventDetails.event_date).toLocaleDateString('ru-RU')}
                </p>
                {eventDetails.specification_confirmed && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Подтверждено
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('budget')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'budget'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Смета
            </button>
            <button
              onClick={() => setActiveTab('cables')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'cables'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Кабели
            </button>
            <button
              onClick={() => setActiveTab('connectors')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'connectors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Коннекторы
            </button>
            <button
              onClick={() => setActiveTab('other')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'other'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Прочее
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'budget' && (
            <>
              <div className="mb-4 flex justify-between items-center">
                {!isWarehouseUser && (
                  <button
                    onClick={() => setShowEquipmentSelector(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить оборудование
                  </button>
                )}
                <button
                  onClick={handleExportBudget}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 ml-auto"
                >
                  <Download className="w-4 h-4" />
                  Экспорт CSV
                </button>
              </div>

              {Object.entries(groupedByCategory).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-bold mb-3 bg-gray-100 px-4 py-2 rounded">
                    {category}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-center w-12">✓</th>
                          <th className="border border-gray-300 px-4 py-2 text-left w-12">№</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Наименование</th>
                          <th className="border border-gray-300 px-4 py-2 text-left w-32">Артикул</th>
                          <th className="border border-gray-300 px-4 py-2 text-center w-24">Кол-во</th>
                          <th className="border border-gray-300 px-4 py-2 text-left w-24">Ед. изм.</th>
                          {!isWarehouseUser && (
                            <th className="border border-gray-300 px-4 py-2 text-left">Примечания</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={`${item.budgetItemId}-${index}`} className={item.isFromComposition ? 'bg-blue-50' : ''}>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.picked}
                                onChange={(e) => handlePickedChange(item.budgetItemId, e.target.checked)}
                                className="w-5 h-5 cursor-pointer"
                                disabled={eventDetails?.specification_confirmed && !isWarehouseUser}
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              {item.name}
                              {item.parentName && (
                                <div className="text-xs text-blue-600 mt-1">
                                  ↳ {item.parentName}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{item.sku}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.unit}</td>
                            {!isWarehouseUser && (
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="text"
                                  value={item.notes}
                                  onChange={(e) => handleNotesChange(item.budgetItemId, e.target.value)}
                                  className="w-full px-2 py-1 border rounded"
                                  placeholder="Примечания"
                                />
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {expandedItems.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Спецификация пуста</p>
                  <p className="text-sm mt-2">Добавьте оборудование или создайте смету для мероприятия</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'cables' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleExportCables}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт CSV
                </button>
              </div>

              <div className="space-y-4">
                {CABLE_TEMPLATES.map((template) => (
                  <div key={template.type} className="border rounded-lg">
                    <button
                      onClick={() => toggleCableType(template.type)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-bold">{template.type}</h3>
                      {expandedCableTypes[template.type] ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {expandedCableTypes[template.type] && (
                      <div className="p-4">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-center w-12">✓</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Длина</th>
                              <th className="border border-gray-300 px-4 py-2 text-center w-32">Кол-во</th>
                              {!isWarehouseUser && (
                                <>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Примечания</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center w-24"></th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {template.lengths.map((length) => {
                              const quantity = getCableQuantity(template.type, length);
                              const cableId = getCableId(template.type, length);
                              const notes = getCableNotes(template.type, length);
                              const picked = getCablePicked(template.type, length);

                              return (
                                <tr key={length}>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {cableId && (
                                      <input
                                        type="checkbox"
                                        checked={picked}
                                        onChange={(e) => handleCablePickedChange(cableId, e.target.checked)}
                                        className="w-5 h-5 cursor-pointer"
                                        disabled={eventDetails?.specification_confirmed && !isWarehouseUser}
                                      />
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">{length}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {cableId ? (
                                      isWarehouseUser ? (
                                        <div className="text-center">{quantity}</div>
                                      ) : (
                                        <input
                                          type="number"
                                          value={quantity}
                                          onChange={(e) => handleCableQuantityChange(cableId, parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 border rounded text-center"
                                          min="0"
                                        />
                                      )
                                    ) : (
                                      <div className="text-center text-gray-400">0</div>
                                    )}
                                  </td>
                                  {!isWarehouseUser && (
                                    <>
                                      <td className="border border-gray-300 px-4 py-2">
                                        {cableId && (
                                          <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => handleCableNotesChange(cableId, e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="Примечания"
                                          />
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-center flex justify-center gap-2">
                                        <button
                                          onClick={() => cableId && handleCableQuantityChange(cableId, Math.max(0, quantity - 1))}
                                          disabled={!cableId || quantity === 0}
                                          className="text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                          title="Уменьшить"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleAddCableFromTemplate(template.type, length)}
                                          className="text-blue-600 hover:text-blue-700"
                                          title="Добавить"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'connectors' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleExportConnectors}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт CSV
                </button>
              </div>

              <div className="space-y-4">
                {CONNECTOR_TEMPLATES.map((template) => (
                  <div key={template.category} className="border rounded-lg">
                    <button
                      onClick={() => toggleConnectorCategory(template.category)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-bold">{template.category}</h3>
                      {expandedConnectorCategories[template.category] ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {expandedConnectorCategories[template.category] && (
                      <div className="p-4">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-center w-12">✓</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Тип</th>
                              <th className="border border-gray-300 px-4 py-2 text-center w-32">Кол-во</th>
                              {!isWarehouseUser && (
                                <>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Примечания</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center w-24"></th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {template.items.map((itemType) => {
                              const connector = connectors.find(c => c.connector_type === itemType);
                              const quantity = connector?.quantity || 0;
                              const notes = connector?.notes || '';
                              const picked = connector?.picked || false;

                              return (
                                <tr key={itemType}>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {connector && (
                                      <input
                                        type="checkbox"
                                        checked={picked}
                                        onChange={(e) => handleConnectorPickedChange(connector.id, e.target.checked)}
                                        className="w-5 h-5 cursor-pointer"
                                        disabled={eventDetails?.specification_confirmed && !isWarehouseUser}
                                      />
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">{itemType}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {connector ? (
                                      isWarehouseUser ? (
                                        <div className="text-center">{quantity}</div>
                                      ) : (
                                        <input
                                          type="number"
                                          value={quantity}
                                          onChange={(e) => handleConnectorQuantityChange(connector.id, parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 border rounded text-center"
                                          min="0"
                                        />
                                      )
                                    ) : (
                                      <div className="text-center text-gray-400">0</div>
                                    )}
                                  </td>
                                  {!isWarehouseUser && (
                                    <>
                                      <td className="border border-gray-300 px-4 py-2">
                                        {connector && (
                                          <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => handleConnectorNotesChange(connector.id, e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="Примечания"
                                          />
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-center flex justify-center gap-2">
                                        <button
                                          onClick={() => connector && handleConnectorQuantityChange(connector.id, Math.max(0, quantity - 1))}
                                          disabled={!connector || quantity === 0}
                                          className="text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                          title="Уменьшить"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleAddConnectorFromTemplate(itemType)}
                                          className="text-blue-600 hover:text-blue-700"
                                          title="Добавить"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'other' && (
            <>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleExportOther}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Экспорт CSV
                </button>
              </div>

              <div className="space-y-4">
                {OTHER_TEMPLATES.map((template) => (
                  <div key={template.category} className="border rounded-lg">
                    <button
                      onClick={() => toggleOtherCategory(template.category)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-bold">{template.category}</h3>
                      {expandedOtherCategories[template.category] ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {expandedOtherCategories[template.category] && (
                      <div className="p-4">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-center w-12">✓</th>
                              <th className="border border-gray-300 px-4 py-2 text-left">Предмет</th>
                              <th className="border border-gray-300 px-4 py-2 text-center w-32">Кол-во</th>
                              {!isWarehouseUser && (
                                <>
                                  <th className="border border-gray-300 px-4 py-2 text-left">Примечания</th>
                                  <th className="border border-gray-300 px-4 py-2 text-center w-24"></th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {template.items.map((itemType) => {
                              const otherId = getOtherId(template.category, itemType);
                              const quantity = getOtherQuantity(template.category, itemType);
                              const notes = getOtherNotes(template.category, itemType);
                              const picked = getOtherPicked(template.category, itemType);

                              return (
                                <tr key={itemType}>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {otherId && (
                                      <input
                                        type="checkbox"
                                        checked={picked}
                                        onChange={(e) => handleOtherPickedChange(otherId, e.target.checked)}
                                        className="w-5 h-5 cursor-pointer"
                                        disabled={eventDetails?.specification_confirmed && !isWarehouseUser}
                                      />
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">{itemType}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {otherId ? (
                                      isWarehouseUser ? (
                                        <div className="text-center">{quantity}</div>
                                      ) : (
                                        <input
                                          type="number"
                                          value={quantity}
                                          onChange={(e) => handleOtherQuantityChange(otherId, parseInt(e.target.value) || 0)}
                                          className="w-full px-2 py-1 border rounded text-center"
                                          min="0"
                                        />
                                      )
                                    ) : (
                                      <div className="text-center text-gray-400">0</div>
                                    )}
                                  </td>
                                  {!isWarehouseUser && (
                                    <>
                                      <td className="border border-gray-300 px-4 py-2">
                                        {otherId && (
                                          <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => handleOtherNotesChange(otherId, e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            placeholder="Примечания"
                                          />
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2 text-center flex justify-center gap-2">
                                        <button
                                          onClick={() => otherId && handleOtherQuantityChange(otherId, Math.max(0, quantity - 1))}
                                          disabled={!otherId || quantity === 0}
                                          className="text-red-600 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                          title="Уменьшить"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleAddOtherFromTemplate(template.category, itemType)}
                                          className="text-blue-600 hover:text-blue-700"
                                          title="Добавить"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {isWarehouseUser && (
              <p>Отметьте все взятые элементы и подтвердите сборку спецификации</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Закрыть
            </button>
            {(isWarehouseUser || !eventDetails?.specification_confirmed) && (
              <button
                onClick={handleConfirmSpecification}
                disabled={confirming || eventDetails?.specification_confirmed}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {confirming ? (
                  <>Подтверждение...</>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Подтвердить сборку
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showEquipmentSelector && !isWarehouseUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Добавить оборудование</h3>
              <button
                onClick={() => setShowEquipmentSelector(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <EquipmentSelector
              onSelect={handleAddEquipment}
              onClose={() => setShowEquipmentSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
