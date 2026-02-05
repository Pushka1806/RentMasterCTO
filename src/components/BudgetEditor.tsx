import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Save, Package, Download, FileText, Settings, ChevronDown } from 'lucide-react';
import { BudgetItem, getBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem, getEvent } from '../lib/events';
import { EquipmentItem, getEquipmentItems, getEquipmentModifications, EquipmentModification } from '../lib/equipment';
import { WorkItem, getWorkItems } from '../lib/personnel';
import { Category, getCategories, updateCategory } from '../lib/categories';
import { CategoryBlock } from './CategoryBlock';
import { WorkPersonnelManager } from './WorkPersonnelManager';
import { TemplatesInBudget } from './TemplatesInBudget';
import { WarehouseSpecification } from './WarehouseSpecification';
import { ModificationSelector } from './ModificationSelector';
import { generateBudgetPDF } from '../lib/pdfGenerator';

interface BudgetEditorProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

interface GroupedItems {
  [categoryId: string]: BudgetItem[];
}

export function BudgetEditor({ eventId, eventName, onClose }: BudgetEditorProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<string>('Оборудование');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentCategory, setSelectedEquipmentCategory] = useState<string>('Все');
  const [exchangeRate, setExchangeRate] = useState(3.0);
  const [showInBYN, setShowInBYN] = useState(false);
  const [workPersonnelManagerOpen, setWorkPersonnelManagerOpen] = useState(false);
  const [selectedCategoryForPersonnel, setSelectedCategoryForPersonnel] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'item'; id: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeCategoryIds, setActiveCategoryIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showWarehouseSpec, setShowWarehouseSpec] = useState(false);
  const [showModificationSelector, setShowModificationSelector] = useState(false);
  const [selectedEquipmentForMods, setSelectedEquipmentForMods] = useState<EquipmentItem | null>(null);
  const [equipmentModifications, setEquipmentModifications] = useState<EquipmentModification[]>([]);
  const [loadingModifications, setLoadingModifications] = useState(false);
  const [showExchangeRatePopover, setShowExchangeRatePopover] = useState(false);

  const budgetListRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAddedItemRef = useRef<string | null>(null);

  useEffect(() => {
    loadData();
  }, [eventId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCategoryDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.category-dropdown-container')) {
          setShowCategoryDropdown(false);
        }
      }
      if (showExchangeRatePopover) {
        const target = event.target as HTMLElement;
        if (!target.closest('.exchange-rate-container')) {
          setShowExchangeRatePopover(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategoryDropdown, showExchangeRatePopover]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetData, categoriesData, equipmentData, workItemsData] = await Promise.all([
        getBudgetItems(eventId),
        getCategories(),
        getEquipmentItems(),
        getWorkItems()
      ]);
      setBudgetItems(budgetData);
      setCategories(categoriesData);
      setEquipment(equipmentData);
      setWorkItems(workItemsData);

      if (budgetData.length > 0 && budgetData[0].exchange_rate) {
        setExchangeRate(budgetData[0].exchange_rate);
      }

      const initialExpanded: Record<string, boolean> = {};
      const initialActive = new Set<string>();

      categoriesData.forEach(cat => {
        initialExpanded[cat.id] = true;
      });

      budgetData.forEach(item => {
        if (item.category_id) {
          initialActive.add(item.category_id);
        }
      });

      setExpandedCategories(initialExpanded);
      setActiveCategoryIds(initialActive);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = async (categoryId: string) => {
    setShowCategoryDropdown(false);

    const newActiveCategoryIds = new Set(activeCategoryIds);
    newActiveCategoryIds.add(categoryId);
    setActiveCategoryIds(newActiveCategoryIds);

    setExpandedCategories({ ...expandedCategories, [categoryId]: true });
  };

  const handleEquipmentClick = async (equipmentItem: EquipmentItem) => {
    try {
      setLoadingModifications(true);
      const mods = await getEquipmentModifications(equipmentItem.id);

      if (mods.length > 0) {
        setSelectedEquipmentForMods(equipmentItem);
        setEquipmentModifications(mods);
        setShowModificationSelector(true);
      } else {
        await handleAddItem(equipmentItem, 1, undefined, selectedCategoryId || undefined);
      }
    } catch (error) {
      console.error('Error loading modifications:', error);
      await handleAddItem(equipmentItem, 1, undefined, selectedCategoryId || undefined);
    } finally {
      setLoadingModifications(false);
    }
  };

  const handleModificationSelect = async (modificationId: string | null, quantity: number) => {
    if (selectedEquipmentForMods) {
      setShowModificationSelector(false);
      await handleAddItem(
        selectedEquipmentForMods,
        quantity,
        modificationId || undefined,
        selectedCategoryId || undefined
      );
      setSelectedEquipmentForMods(null);
      setEquipmentModifications([]);
    }
  };

  const handleAddItem = async (equipmentItem: EquipmentItem, quantity: number = 1, modificationId?: string, categoryId?: string) => {
    try {
      console.log('handleAddItem called:', { equipmentItem: equipmentItem.name, quantity, modificationId, categoryId });
      const targetCategoryId = categoryId || selectedCategoryId || undefined;

      const newItem = await createBudgetItem({
        event_id: eventId,
        equipment_id: equipmentItem.id,
        modification_id: modificationId || null,
        item_type: 'equipment',
        quantity,
        price: equipmentItem.rental_price,
        exchange_rate: exchangeRate,
        category_id: targetCategoryId,
        notes: ''
      });
      console.log('Created budget item:', newItem);
      const updatedItems = [...budgetItems, newItem];
      setBudgetItems(updatedItems);
      lastAddedItemRef.current = newItem.id;

      if (targetCategoryId) {
        const newActiveCategoryIds = new Set(activeCategoryIds);
        newActiveCategoryIds.add(targetCategoryId);
        setActiveCategoryIds(newActiveCategoryIds);

        if (!expandedCategories[targetCategoryId]) {
          setExpandedCategories({ ...expandedCategories, [targetCategoryId]: true });
        }
      }

      setTimeout(() => {
        if (budgetListRef.current) {
          budgetListRef.current.scrollTop = budgetListRef.current.scrollHeight;
        }
      }, 150);
    } catch (error: any) {
      console.error('Error adding item:', error);
      alert(`Ошибка добавления: ${error.message}`);
    }
  };

  const handleAddWorkItem = async (workItem: WorkItem, categoryId?: string) => {
    try {
      const targetCategoryId = categoryId || selectedCategoryId || undefined;

      const newItem = await createBudgetItem({
        event_id: eventId,
        work_item_id: workItem.id,
        item_type: 'work',
        quantity: 1,
        price: 0,
        exchange_rate: exchangeRate,
        category_id: targetCategoryId,
        notes: ''
      });
      const updatedItems = [...budgetItems, newItem];
      setBudgetItems(updatedItems);
      lastAddedItemRef.current = newItem.id;

      if (targetCategoryId) {
        const newActiveCategoryIds = new Set(activeCategoryIds);
        newActiveCategoryIds.add(targetCategoryId);
        setActiveCategoryIds(newActiveCategoryIds);

        if (!expandedCategories[targetCategoryId]) {
          setExpandedCategories({ ...expandedCategories, [targetCategoryId]: true });
        }
      }

      setTimeout(() => {
        if (budgetListRef.current) {
          budgetListRef.current.scrollTop = budgetListRef.current.scrollHeight;
        }
      }, 150);
    } catch (error: any) {
      console.error('Error adding work item:', error);
      alert(`Ошибка добавления: ${error.message}`);
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<BudgetItem>) => {
    try {
      const updatedItem = await updateBudgetItem(itemId, updates);
      setBudgetItems(budgetItems.map(item =>
        item.id === itemId ? { ...item, ...updatedItem } : item
      ));
    } catch (error: any) {
      console.error('Error updating item:', error);
      alert(`Ошибка обновления: ${error.message}`);
    }
  };

  const handleOpenWorkPersonnelManager = (categoryId: string) => {
    setSelectedCategoryForPersonnel(categoryId);
    setWorkPersonnelManagerOpen(true);
  };

  const handleWorkPersonnelSave = async () => {
    await loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Удалить позицию из сметы?')) return;
    try {
      await deleteBudgetItem(itemId);
      setBudgetItems(budgetItems.filter(item => item.id !== itemId));
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(`Ошибка удаления: ${error.message}`);
    }
  };

  const handleUpdateCategoryName = async (categoryId: string, newName: string) => {
    try {
      await updateCategory(categoryId, { name: newName });
      setCategories(categories.map(cat =>
        cat.id === categoryId ? { ...cat, name: newName } : cat
      ));
    } catch (error: any) {
      console.error('Error updating category:', error);
      alert(`Ошибка обновления категории: ${error.message}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      for (const item of budgetItems) {
        await updateBudgetItem(item.id, { exchange_rate: exchangeRate });
      }

      alert('Смета сохранена успешно');
      onClose();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      alert(`Ошибка сохранения: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setGeneratingPDF(true);
      const event = await getEvent(eventId);

      await generateBudgetPDF({
        eventName: eventName,
        eventDate: event.event_date,
        venueName: event.venues?.name,
        clientName: event.clients?.full_name,
        organizerName: event.organizers?.full_name,
        budgetItems: budgetItems,
        categories: categories,
        exchangeRate: exchangeRate
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert(`Ошибка при создании PDF: ${error.message}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, type: 'category' | 'item', id: string) => {
    setDraggedItem({ type, id });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetCategoryId);
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    if (!draggedItem) return;

    if (draggedItem.type === 'item') {
      const targetCat = targetCategoryId === 'uncategorized' ? null : targetCategoryId;
      await handleUpdateItem(draggedItem.id, { category_id: targetCat });
    } else if (draggedItem.type === 'category') {
      const sourceCategoryId = draggedItem.id;
      if (sourceCategoryId !== targetCategoryId) {
        const sourceIndex = categories.findIndex(c => c.id === sourceCategoryId);
        const targetIndex = categories.findIndex(c => c.id === targetCategoryId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          const newCategories = [...categories];
          const [movedCategory] = newCategories.splice(sourceIndex, 1);
          newCategories.splice(targetIndex, 0, movedCategory);

          setCategories(newCategories);

          for (let i = 0; i < newCategories.length; i++) {
            await updateCategory(newCategories[i].id, { sort_order: i });
          }
        }
      }
    }

    setDraggedItem(null);
  };

  const calculateBYN = (priceUSD: number, quantity: number): number => {
    const baseAmount = priceUSD * exchangeRate * quantity;
    const withMarkup = baseAmount * 1.2;
    return Math.round(withMarkup / 5) * 5;
  };

  const equipmentCategories = ['Все', ...Array.from(new Set(equipment.map(item => item.category)))];

  const filteredEquipment = equipment.filter(item => {
    const hasPrice = item.rental_price > 0;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedEquipmentCategory === 'Все' || item.category === selectedEquipmentCategory;
    return hasPrice && matchesSearch && matchesCategory;
  });

  const filteredWorkItems = workItems.filter(item =>
    !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems: GroupedItems = budgetItems.reduce((acc, item) => {
    const catId = item.category_id || 'uncategorized';
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {} as GroupedItems);

  const totalUSD = budgetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalBYN = budgetItems.reduce((sum, item) =>
    sum + calculateBYN(item.price, item.quantity), 0
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg">
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-[95vw] max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Смета мероприятия</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main content - 2 column layout */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0 h-full">
            {/* Left column - Budget table */}
            <div className="flex flex-col h-full min-h-0 border-r border-gray-800">
              {/* Compact toolbar */}
              <div className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex-shrink-0">
                <div className="flex items-center justify-between relative category-dropdown-container flex-wrap gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors border border-gray-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Категория
                    </button>

                    <button
                      onClick={() => setShowTemplates(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors border border-gray-700"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Шаблоны
                    </button>
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[220px] max-h-[280px] overflow-y-auto">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleSelectCategory(category.id)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Exchange rate popover */}
                  <div className="relative exchange-rate-container">
                    <button
                      onClick={() => setShowExchangeRatePopover(!showExchangeRatePopover)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{showInBYN ? 'BYN' : '$'}</span>
                      <span className="text-xs text-gray-500">({exchangeRate.toFixed(2)})</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showExchangeRatePopover && (
                      <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 p-3 min-w-[180px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Курс $:</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={exchangeRate}
                              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.0)}
                              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showInBYN}
                              onChange={(e) => setShowInBYN(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-300">Показать в BYN</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget list */}
              <div
                ref={budgetListRef}
                className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0 custom-scrollbar"
              >
                {budgetItems.length === 0 && activeCategoryIds.size === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">
                    Смета пуста. Добавьте категорию или позиции из списка справа
                  </p>
                ) : (
                  <>
                    {categories.map(category => {
                      const categoryItems = groupedItems[category.id] || [];
                      const isActive = activeCategoryIds.has(category.id);

                      if (categoryItems.length === 0 && !isActive) return null;

                      return (
                        <div
                          key={category.id}
                          className={`transition-all ${
                            dragOverTarget === category.id ? 'ring-2 ring-cyan-400 rounded-lg' : ''
                          }`}
                        >
                          <CategoryBlock
                            categoryId={category.id}
                            categoryName={category.name}
                            items={categoryItems}
                            isExpanded={expandedCategories[category.id] || false}
                            isSelected={selectedCategoryId === category.id}
                            onToggleExpand={() => setExpandedCategories({
                              ...expandedCategories,
                              [category.id]: !expandedCategories[category.id]
                            })}
                            onSelect={() => setSelectedCategoryId(
                              selectedCategoryId === category.id ? null : category.id
                            )}
                            onUpdateCategoryName={(newName) => handleUpdateCategoryName(category.id, newName)}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                            onManagePersonnel={handleOpenWorkPersonnelManager}
                            showInBYN={showInBYN}
                            exchangeRate={exchangeRate}
                            onDragStart={handleDragStart}
                            onDragOver={(e) => handleDragOver(e, category.id)}
                            onDrop={(e) => handleDrop(e, category.id)}
                            categoryRef={(el) => {
                              categoryRefs.current[category.id] = el;
                            }}
                          />
                        </div>
                      );
                    })}

                    {groupedItems['uncategorized'] && groupedItems['uncategorized'].length > 0 && (
                      <div
                        className={`transition-all ${
                          dragOverTarget === 'uncategorized' ? 'ring-2 ring-cyan-400 rounded-lg' : ''
                        }`}
                      >
                        <CategoryBlock
                          categoryId="uncategorized"
                          categoryName="Без категории"
                          items={groupedItems['uncategorized']}
                          isExpanded={expandedCategories['uncategorized'] !== false}
                          isSelected={selectedCategoryId === 'uncategorized'}
                          onToggleExpand={() => setExpandedCategories({
                            ...expandedCategories,
                            uncategorized: !expandedCategories['uncategorized']
                          })}
                          onSelect={() => setSelectedCategoryId(
                            selectedCategoryId === 'uncategorized' ? null : 'uncategorized'
                          )}
                          onUpdateCategoryName={() => {}}
                          onUpdateItem={handleUpdateItem}
                          onDeleteItem={handleDeleteItem}
                          onManagePersonnel={handleOpenWorkPersonnelManager}
                          showInBYN={showInBYN}
                          exchangeRate={exchangeRate}
                          onDragStart={handleDragStart}
                          onDragOver={(e) => handleDragOver(e, 'uncategorized')}
                          onDrop={(e) => handleDrop(e, 'uncategorized')}
                          categoryRef={(el) => {
                            categoryRefs.current['uncategorized'] = el;
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right column - Add items panel */}
            <div className="flex flex-col h-full min-h-0 bg-gray-900">
              {/* Compact header with tabs */}
              <div className="border-b border-gray-800 flex-shrink-0">
                {/* Search on top */}
                <div className="p-2 pb-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  />
                </div>

                {/* Compact segment control */}
                <div className="flex p-2 pt-1">
                  <button
                    onClick={() => setSelectedItemType('Оборудование')}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-l transition-colors ${
                      selectedItemType === 'Оборудование'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Оборудование
                  </button>
                  <button
                    onClick={() => setSelectedItemType('Работа')}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-r transition-colors ${
                      selectedItemType === 'Работа'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Работа
                  </button>
                </div>

                {/* Equipment category filter */}
                {selectedItemType === 'Оборудование' && (
                  <div className="px-2 pb-2">
                    <select
                      value={selectedEquipmentCategory}
                      onChange={(e) => setSelectedEquipmentCategory(e.target.value)}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:border-gray-600"
                    >
                      {equipmentCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Items list - compact */}
              <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {selectedItemType === 'Оборудование' ? (
                  filteredEquipment.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">Оборудование не найдено</p>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {filteredEquipment.map(item => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between px-3 py-2 hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => handleEquipmentClick(item)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-cyan-400">${item.rental_price}</span>
                            <button
                              disabled={loadingModifications}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-cyan-400"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  filteredWorkItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">Работы не найдены</p>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {filteredWorkItems.map(item => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between px-3 py-2 hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => handleAddWorkItem(item)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.unit}</p>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-cyan-400 ml-2">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar with total and actions */}
        <div className="px-4 py-2 border-t border-gray-800 flex items-center justify-between bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Итого:</span>
            <span className="text-lg font-semibold text-cyan-400">
              {showInBYN ? `${totalBYN.toFixed(2)} BYN` : `$${totalUSD.toFixed(2)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={generatingPDF || budgetItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors disabled:opacity-50 border border-gray-700"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setShowWarehouseSpec(true)}
              disabled={budgetItems.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors disabled:opacity-50 border border-gray-700"
            >
              <FileText className="w-3.5 h-3.5" />
              Спецификация
            </button>
            <div className="w-px h-6 bg-gray-700 mx-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {workPersonnelManagerOpen && selectedCategoryForPersonnel && (
        <WorkPersonnelManager
          workItems={budgetItems.filter(
            item => item.item_type === 'work' &&
            (selectedCategoryForPersonnel === 'uncategorized'
              ? !item.category_id
              : item.category_id === selectedCategoryForPersonnel)
          )}
          onClose={() => {
            setWorkPersonnelManagerOpen(false);
            setSelectedCategoryForPersonnel(null);
          }}
          onSave={handleWorkPersonnelSave}
          showInBYN={showInBYN}
          exchangeRate={exchangeRate}
        />
      )}

      {showTemplates && (
        <TemplatesInBudget
          eventId={eventId}
          onClose={() => setShowTemplates(false)}
          onApply={() => {
            setShowTemplates(false);
            loadData();
          }}
        />
      )}

      {showWarehouseSpec && (
        <WarehouseSpecification
          eventId={eventId}
          eventName={eventName}
          onClose={() => setShowWarehouseSpec(false)}
        />
      )}

      {showModificationSelector && selectedEquipmentForMods && (
        <ModificationSelector
          equipmentName={selectedEquipmentForMods.name}
          modifications={equipmentModifications}
          onSelect={handleModificationSelect}
          onClose={() => {
            setShowModificationSelector(false);
            setSelectedEquipmentForMods(null);
            setEquipmentModifications([]);
          }}
        />
      )}
    </div>
  );
}
