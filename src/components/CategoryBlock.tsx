import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Check, X, GripVertical, Users } from 'lucide-react';
import { BudgetItem } from '../lib/events';

interface CategoryBlockProps {
  categoryId: string;
  categoryName: string;
  items: BudgetItem[];
  isExpanded: boolean;
  isSelected?: boolean;
  onToggleExpand: () => void;
  onSelect?: () => void;
  onUpdateCategoryName: (newName: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<BudgetItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onManagePersonnel?: (categoryId: string) => void;
  showInBYN: boolean;
  exchangeRate: number;
  onDragStart?: (e: React.DragEvent, type: 'category' | 'item', id: string) => void;
  onDragOver?: (e: React.DragEvent, categoryId: string) => void;
  onDrop?: (e: React.DragEvent, categoryId: string) => void;
  categoryRef?: (el: HTMLDivElement | null) => void;
}

export function CategoryBlock({
  categoryId,
  categoryName,
  items,
  isExpanded,
  isSelected = false,
  onToggleExpand,
  onSelect,
  onUpdateCategoryName,
  onUpdateItem,
  onDeleteItem,
  onManagePersonnel,
  showInBYN,
  exchangeRate,
  onDragStart,
  onDragOver,
  onDrop,
  categoryRef
}: CategoryBlockProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(categoryName);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== categoryName) {
      onUpdateCategoryName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(categoryName);
    setIsEditingName(false);
  };

  const calculateBYN = (priceUSD: number, quantity: number): number => {
    const baseAmount = priceUSD * exchangeRate * quantity;
    const withMarkup = baseAmount * 1.2;
    return Math.round(withMarkup / 5) * 5;
  };

  const categoryTotal = items.reduce((sum, item) => {
    return sum + (showInBYN ? calculateBYN(item.price, item.quantity) : item.price * item.quantity);
  }, 0);

  const hasWorkItems = items.some(item => item.item_type === 'work');

  return (
    <div
      ref={categoryRef}
      className={`bg-gray-800 rounded-lg border overflow-hidden transition-all ${
        isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-gray-700'
      }`}
      onDragOver={(e) => onDragOver?.(e, categoryId)}
      onDrop={(e) => onDrop?.(e, categoryId)}
    >
      <div
        className={`flex items-center gap-2 p-3 transition-colors cursor-pointer ${
          isSelected ? 'bg-cyan-900/30' : 'bg-gray-750 hover:bg-gray-700'
        }`}
        onClick={onSelect}
      >
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart?.(e, 'category', categoryId);
          }}
          className="text-gray-400 hover:text-white cursor-move"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>

        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveName();
              }}
              className="text-green-400 hover:text-green-300"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-white flex-1">{categoryName}</h3>
            {hasWorkItems && onManagePersonnel && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManagePersonnel(categoryId);
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Управление персоналом"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="text-sm font-medium text-cyan-400" onClick={(e) => e.stopPropagation()}>
          {showInBYN ? `${categoryTotal.toFixed(2)} BYN` : `$${categoryTotal.toFixed(2)}`}
        </div>

        <div className="text-xs text-gray-500 ml-2" onClick={(e) => e.stopPropagation()}>
          {items.length} {items.length === 1 ? 'позиция' : 'позиций'}
        </div>
      </div>

      {isExpanded && items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 border-b border-gray-700">
            <div className="w-4"></div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              <div className="text-xs font-medium text-gray-400 col-span-2">Наименование</div>
              <div className="text-xs font-medium text-gray-400">Количество</div>
              <div className="text-xs font-medium text-gray-400">Цена</div>
            </div>
            <div className="text-xs font-medium text-gray-400 w-24 text-right">Сумма</div>
            <div className="w-4"></div>
          </div>

          <div className="divide-y divide-gray-700">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-3 hover:bg-gray-750 transition-colors group"
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStart?.(e, 'item', item.id);
                  }}
                  className="text-gray-400 hover:text-white cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                  <div className="text-sm text-white col-span-2">
                    {item.equipment?.name || item.work_item?.name || 'Без названия'}
                  </div>

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm w-16 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min="1"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => onUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-white text-sm w-20 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>

                <div className="text-sm font-medium text-cyan-400 w-24 text-right">
                  {showInBYN
                    ? `${calculateBYN(item.price, item.quantity).toFixed(2)} BYN`
                    : `$${(item.price * item.quantity).toFixed(2)}`}
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
