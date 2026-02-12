import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { BudgetItem } from '../lib/events';
import { getEquipmentCompositions, updateEquipmentComposition, addEquipmentComposition, getAvailableLedModules } from '../lib/equipmentCompositions';
import { EquipmentComposition, EquipmentModule } from '../lib/equipmentCompositions';

interface LedSpecificationPanelProps {
  budgetItemId: string;
  budgetItems: BudgetItem[];
  onClose: () => void;
}

export function LedSpecificationPanel({ budgetItemId, budgetItems, onClose }: LedSpecificationPanelProps) {
  const budgetItem = budgetItems.find(b => b.id === budgetItemId);
  
  console.log('LedSpecificationPanel props:', {
    budgetItemId,
    budgetItem,
    budgetItemsCount: budgetItems.length
  });
  
  const [modules, setModules] = useState<EquipmentComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModule, setShowAddModule] = useState(false);
  const [availableModules, setAvailableModules] = useState<EquipmentModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  
  // Determine screen type from equipment name or notes
  const equipmentName = budgetItem?.equipment?.name || '';
  const notes = budgetItem?.notes || '';
  const screenType: 'P2.6' | 'P3.91' = 
    equipmentName.includes('P2,6') || equipmentName.includes('P2.6') || equipmentName.includes('P2') ||
    notes.includes('P2,6') || notes.includes('P2.6') || notes.includes('P2')
      ? 'P2.6' 
      : 'P3.91';
  
  useEffect(() => {
    const loadModules = async () => {
      if (!budgetItem?.equipment_id) {
        setLoading(false);
        return;
      }
      
      console.log('Loading modules for equipment_id:', budgetItem.equipment_id);
      try {
        const compositions = await getEquipmentCompositions(budgetItem.equipment_id);
        console.log('Loaded compositions:', compositions);
        setModules(compositions);
      } catch (error) {
        console.error('Error loading modules:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadModules();
  }, [budgetItem?.equipment_id]);

  const handleQuantityChange = (moduleId: string, newQuantity: number) => {
    setModules(prev => prev.map(m => 
      m.id === moduleId ? { ...m, quantity: Math.max(0, newQuantity) } : m
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const module of modules) {
        await updateEquipmentComposition(module.id, module.quantity);
      }
      onClose();
    } catch (error) {
      console.error('Error saving modules:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async (moduleModule: EquipmentModule, quantity: number = 1) => {
    if (!budgetItem?.equipment_id) return;
    
    try {
      const newCompositionId = await addEquipmentComposition(budgetItem.equipment_id, moduleModule.id, quantity);
      // Reload modules to get the new composition
      const compositions = await getEquipmentCompositions(budgetItem.equipment_id);
      setModules(compositions);
      setShowAddModule(false);
    } catch (error) {
      console.error('Error adding module:', error);
    }
  };

  const handleLoadAvailableModules = async () => {
    setLoadingModules(true);
    try {
      const modules = await getAvailableLedModules(screenType);
      console.log('Found modules for screen type:', screenType, modules);
      
      // If no modules found, try to get all LED modules
      let finalModules = modules;
      if (modules.length === 0) {
        console.log('No modules found, falling back to all LED modules');
        const { getLedModules } = await import('../lib/equipmentCompositions');
        finalModules = await getLedModules();
        console.log('Fallback modules:', finalModules);
      }
      
      setAvailableModules(finalModules);
    } catch (error) {
      console.error('Error loading available modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const totalModules = modules.reduce((sum, m) => sum + m.quantity, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-[500px] overflow-hidden">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-[600px] overflow-hidden max-h-[80vh]">
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-white">
              Спецификация модулей LED экрана
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-white mb-2">
              {budgetItem?.equipment?.name || 'LED экран'}
            </h4>
            <p className="text-xs text-gray-400">
              Отредактируйте количество модулей для подбора оптимальной конфигурации
            </p>
          </div>

          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-white mb-1">
                      {module.child_name}
                    </h5>
                    <p className="text-xs text-gray-400">
                      SKU: {module.child_sku} • Категория: {module.child_category}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Всего в составе</div>
                    <div className="text-lg font-bold text-green-400">{module.quantity}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-400">Количество:</label>
                  <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                    <button
                      onClick={() => handleQuantityChange(module.id, module.quantity - 1)}
                      className="text-gray-400 hover:text-white transition-colors"
                      disabled={module.quantity <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={module.quantity}
                      onChange={(e) => handleQuantityChange(module.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-transparent text-white text-sm text-center outline-none"
                    />
                    <button
                      onClick={() => handleQuantityChange(module.id, module.quantity + 1)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">шт.</div>
                </div>
              </div>
            ))}
            
            {modules.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">Модули не найдены</div>
                <div className="text-xs text-gray-500">
                  Возможно, состав экрана еще не настроен в системе
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowAddModule(!showAddModule);
                  if (!showAddModule && availableModules.length === 0) {
                    handleLoadAvailableModules();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                {showAddModule ? <ChevronDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                Добавить модуль из справочника
              </button>
              
              {showAddModule && (
                <div className="mt-4 bg-gray-800/30 rounded-lg p-4">
                  {loadingModules ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-400">
                        Доступные модули для экрана {screenType}
                      </div>
                      {availableModules.map((module) => (
                        <div key={module.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white mb-1">{module.name}</div>
                            <div className="text-xs text-gray-400">SKU: {module.sku}</div>
                            {module.note && (
                              <div className="text-xs text-gray-500 mt-1">{module.note}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddModule(module, 1)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Добавить
                          </button>
                        </div>
                      ))}
                      {availableModules.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Модули не найдены
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Общее количество модулей: 
              <span className="text-white font-bold ml-1">{totalModules}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
