import React, { useState } from 'react';
import { X, Plus, Minus, Package } from 'lucide-react';
import { EquipmentItem } from '../lib/equipment';

interface LEDModule {
  id: string;
  name: string;
  width: number;
  height: number;
  area: number;
  sku: string;
}

interface LEDScreenSpecificationProps {
  equipment: EquipmentItem;
  modules: LEDModule[];
  initialQuantity?: number;
  onConfirm: (quantity: number, totalArea: number) => void;
  onClose: () => void;
}

const DEFAULT_MODULE: LEDModule = {
  id: 'default',
  name: 'Модуль LED 0.5x1м',
  width: 0.5,
  height: 1,
  area: 0.5,
  sku: 'LED-MOD-0.5X1'
};

export function LEDScreenSpecification({
  equipment,
  modules,
  initialQuantity = 1,
  onConfirm,
  onClose
}: LEDScreenSpecificationProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedModule, setSelectedModule] = useState<LEDModule>(modules[0] || DEFAULT_MODULE);

  const totalArea = quantity * selectedModule.area;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleConfirm = () => {
    onConfirm(quantity, totalArea);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" />
            Спецификация LED экрана
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Equipment Info */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Оборудование
            </label>
            <div className="text-white font-medium">{equipment.name}</div>
            <div className="text-xs text-gray-500">{equipment.sku}</div>
          </div>

          {/* Module Selection */}
          {modules.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">
                Тип модуля
              </label>
              <select
                value={selectedModule.id}
                onChange={(e) => {
                  const mod = modules.find(m => m.id === e.target.value);
                  if (mod) setSelectedModule(mod);
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                {modules.map(mod => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name} ({mod.width}×{mod.height}м = {mod.area} м²)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Control - positioned right of item name */}
          <div className="flex items-center justify-between bg-gray-800/30 rounded p-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium">{selectedModule.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-center text-white text-sm focus:outline-none focus:border-cyan-500"
                min="1"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-7 h-7 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Total Area Display */}
          <div className="flex items-center justify-between border-t border-gray-800 pt-3">
            <span className="text-sm text-gray-400">Общая площадь:</span>
            <span className="text-lg font-bold text-cyan-400">{totalArea.toFixed(1)} м²</span>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 transition-colors"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_MODULE };
export type { LEDModule };
