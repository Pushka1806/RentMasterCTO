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

// Module size info extracted from name
interface ModuleSizeInfo {
  width: number;
  height: number;
  area: number;
}

// Extract module size from name (e.g., "Модуль 0,5x0,5м" or "Модуль 0.5x0.5m")
const extractModuleSize = (name: string): ModuleSizeInfo | null => {
  const nameLower = name.toLowerCase();

  // Patterns to match module sizes: 0,5x0,5, 0.5x0.5, 0.5x0,5, 0,5x0.5, 0.5x1, 0,5x1, etc.
  // Match both comma and dot as decimal separators
  const patterns = [
    // 0.5x0.5 or 0,5x0,5 (both 0.25 sq.m)
    { regex: /[\(]?\s*(0[,.]5)\s*[x×х]\s*(0[,.]5)\s*[мm]?\s*[\)]?/, width: 0.5, height: 0.5, area: 0.25 },
    // 0.5x1 or 0,5x1 (0.5 sq.m)
    { regex: /[\(]?\s*(0[,.]5)\s*[x×х]\s*(1)\s*[мm]?\s*[\)]?/, width: 0.5, height: 1, area: 0.5 },
    // 1x0.5 or 1x0,5 (0.5 sq.m) - reversed
    { regex: /[\(]?\s*(1)\s*[x×х]\s*(0[,.]5)\s*[мm]?\s*[\)]?/, width: 1, height: 0.5, area: 0.5 },
    // Direct area mention: 0.25 m² or 0.25 кв.м
    { regex: /[\(]?\s*(0[,.]25)\s*(?:м²|м\^2|кв\.м|кв\.\s*м|m²|m\^2)\s*[\)]?/, width: 0.5, height: 0.5, area: 0.25 },
    // Direct area mention: 0.5 m² or 0.5 кв.м
    { regex: /[\(]?\s*(0[,.]5)\s*(?:м²|м\^2|кв\.м|кв\.\s*м|m²|m\^2)\s*[\)]?/, width: 0.5, height: 1, area: 0.5 },
    // Generic pattern to extract dimensions
    { regex: /(\d+[,.]?\d*)\s*[x×х]\s*(\d+[,.]?\d*)\s*[мm]?/, width: null, height: null, area: null },
  ];

  for (const pattern of patterns) {
    const match = nameLower.match(pattern.regex);
    if (match) {
      if (pattern.width !== null) {
        return { width: pattern.width, height: pattern.height, area: pattern.area };
      }
      // For generic pattern, calculate area from captured dimensions
      const width = parseFloat(match[1].replace(',', '.'));
      const height = parseFloat(match[2].replace(',', '.'));
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height, area: width * height };
      }
    }
  }

  return null;
};

// Get module size info, with fallback to default
const getModuleSizeInfo = (name: string): ModuleSizeInfo => {
  const extracted = extractModuleSize(name);
  if (extracted) {
    return extracted;
  }
  // Default to 0.5x0.5m (0.25 sq.m) if no size found
  return { width: 0.5, height: 0.5, area: 0.25 };
};

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

  // Calculate total area for all modules
  const calculateTotalArea = (moduleList: EquipmentComposition[]): number => {
    return moduleList.reduce((sum, module) => {
      const sizeInfo = getModuleSizeInfo(module.child_name);
      return sum + (sizeInfo.area * module.quantity);
    }, 0);
  };

  const handleQuantityChange = (moduleId: string, newQuantity: number) => {
    const updatedModules = modules.map(m =>
      m.id === moduleId ? { ...m, quantity: Math.max(0, newQuantity) } : m
    );
    setModules(updatedModules);

    // Check if target area reached
    const newTotalArea = calculateTotalArea(updatedModules);
    const currentProgress = requiredArea > 0 ? Math.min((newTotalArea / requiredArea) * 100, 100) : 0;

    if (currentProgress >= 100 && progress < 100) {
      setTimeout(() => {
        alert('Отлично! Количество модулей соответствует необходимой площади экрана');
      }, 100);
    }
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

  // Extract screen dimensions from notes (format: (4x3м))
  const getScreenDimensions = () => {
    if (!budgetItem?.notes) return null;
    const match = budgetItem.notes.match(/\((\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)м\)/);
    if (match) {
      return {
        width: parseFloat(match[1].replace(',', '.')),
        height: parseFloat(match[2].replace(',', '.')),
        area: parseFloat(match[1].replace(',', '.')) * parseFloat(match[2].replace(',', '.'))
      };
    }
    return null;
  };

  const screenDimensions = getScreenDimensions();

  // Calculate total module area using extracted sizes
  const totalModuleArea = calculateTotalArea(modules);
  const requiredArea = screenDimensions?.area || 0;
  const progress = requiredArea > 0 ? Math.min((totalModuleArea / requiredArea) * 100, 100) : 0;

  // Calculate total module count
  const totalModules = modules.reduce((sum, m) => sum + m.quantity, 0);

  // Calculate estimated modules needed (using average size)
  const estimatedModulesNeeded = requiredArea > 0 ? Math.ceil(requiredArea / 0.25) : 0;

  // Calculate area difference
  const areaDifference = totalModuleArea - requiredArea;
  const areaDiffText = areaDifference > 0
    ? `+${areaDifference.toFixed(2)} м² (перебор)`
    : areaDifference < 0
      ? `${areaDifference.toFixed(2)} м² (недобор)`
      : 'точное совпадение';

  // Get progress bar color based on completion
  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-cyan-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

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
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-[700px] overflow-hidden max-h-[85vh]">
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

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-white mb-2">
              {budgetItem?.equipment?.name || 'LED экран'}
              {screenDimensions && (
                <span className="text-green-400 ml-2">
                  {screenDimensions.width}×{screenDimensions.height}м ({screenDimensions.area.toFixed(2)} м²)
                </span>
              )}
            </h4>
            <p className="text-xs text-gray-400">
              Отредактируйте количество модулей для подбора оптимальной конфигурации
            </p>
          </div>

          {screenDimensions && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Заполнение модулями</span>
                <span className={`text-xs font-medium ${
                  progress >= 100 ? 'text-green-400' :
                  progress >= 75 ? 'text-cyan-400' :
                  progress >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {totalModuleArea.toFixed(2)} / {requiredArea.toFixed(2)} м² ({Math.round(progress)}%)
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-500">
                  Требуется модулей: ~{estimatedModulesNeeded} шт.
                </span>
                <span className={`font-medium ${
                  areaDifference > 0 ? 'text-yellow-400' :
                  areaDifference < 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {areaDiffText}
                </span>
                <span className="text-gray-500">Добавлено: {totalModules} шт.</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {modules.map((module) => {
              const sizeInfo = getModuleSizeInfo(module.child_name);
              const moduleArea = sizeInfo.area * module.quantity;

              return (
                <div key={module.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-white mb-1">
                        {module.child_name}
                      </h5>
                      <p className="text-xs text-gray-400">
                        SKU: {module.child_sku} • Категория: {module.child_category}
                      </p>
                      <p className="text-xs text-cyan-400 mt-1">
                        Размер: {sizeInfo.width}×{sizeInfo.height}м ({sizeInfo.area} м²) × {module.quantity} шт. = {moduleArea.toFixed(2)} м²
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Площадь</div>
                      <div className="text-lg font-bold text-green-400">{moduleArea.toFixed(2)} м²</div>
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
              );
            })}

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
                      {availableModules.map((module) => {
                        const sizeInfo = getModuleSizeInfo(module.name);
                        return (
                          <div key={module.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white mb-1">{module.name}</div>
                              <div className="text-xs text-gray-400">SKU: {module.sku}</div>
                              {module.note && (
                                <div className="text-xs text-gray-500 mt-1">{module.note}</div>
                              )}
                              <div className="text-xs text-cyan-400 mt-1">
                                Размер: {sizeInfo.width}×{sizeInfo.height}м ({sizeInfo.area} м²)
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddModule(module, 1)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                            >
                              Добавить
                            </button>
                          </div>
                        );
                      })}
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
            <div className="flex flex-col">
              <div className="text-sm text-gray-400">
                Общее количество модулей:
                <span className="text-white font-bold ml-1">{totalModules}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Общая площадь модулей:
                <span className={`font-bold ml-1 ${
                  Math.abs(areaDifference) < 0.01 ? 'text-green-400' :
                  areaDifference > 0 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {totalModuleArea.toFixed(2)} м²
                </span>
              </div>
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
