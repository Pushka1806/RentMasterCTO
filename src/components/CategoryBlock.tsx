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
      className={`bg-gray-900 border-b border-gray-800 transition-all ${
        isSelected ? 'bg-gray-800/50' : ''
      }`}
      onDragOver={(e) => onDragOver?.(e, categoryId)}
      onDrop={(e) => onDrop?.(e, categoryId)}
    >
      {/* Category header - compact, sticky */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 transition-colors cursor-pointer sticky top-0 z-10 ${
          isSelected ? 'bg-gray-900/20' : 'bg-gray-900 hover:bg-gray-800'
        }`}
        onClick={onSelect}
      >
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            onDragStart?.(e, 'category', categoryId);
          }}
          className="text-gray-500 hover:text-gray-400 cursor-move"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="text-gray-500 hover:text-gray-400 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {isEditingName ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveName();
              }}
              className="text-green-500 hover:text-green-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              className="text-red-500 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-medium text-sm text-gray-300 flex-1 truncate">{categoryName}</h3>
            {hasWorkItems && onManagePersonnel && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManagePersonnel(categoryId);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Управление персоналом"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="text-gray-500 hover:text-gray-400 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </>
        )}

        <div className="text-xs font-medium text-white ml-1" onClick={(e) => e.stopPropagation()}>
          {showInBYN ? `${categoryTotal.toFixed(2)} BYN` : `$${categoryTotal.toFixed(2)}`}
        </div>

        <div className="text-xs text-gray-600 ml-1" onClick={(e) => e.stopPropagation()}>
          ({items.length})
        </div>
      </div>

      {/* Items table - flat, compact */}
      {isExpanded && items.length > 0 && (
        <div>
          {/* Table header */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-900/50 text-xs text-gray-500 border-b border-gray-800">
            <div className="w-4"></div>
            <div className="flex-1 grid grid-cols-12 gap-1">
              <div className="col-span-5">Наименование</div>
              <div className="col-span-2 text-center">Кол-во</div>
              <div className="col-span-2 text-right">Цена</div>
              <div className="col-span-3 text-right">Сумма</div>
            </div>
            <div className="w-6"></div>
          </div>

          {/* Items */}
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 transition-colors group border-b border-gray-800/50 last:border-b-0"
              >
                <div
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    onDragStart?.(e, 'item', item.id);
                  }}
                  className="text-gray-600 hover:text-gray-400 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 grid grid-cols-12 gap-1 items-center text-sm">
                  <div className="col-span-5 text-gray-300 truncate">
                    {item.equipment?.name || item.work_item?.name || 'Без названия'}
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center">
                      <button
                        onClick={() => onUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-10 px-1 py-0.5 bg-transparent text-center text-white text-sm focus:outline-none"
                        min="1"
                      />
                      <button
                        onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => onUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-1 py-0.5 bg-transparent text-right text-gray-400 text-sm focus:outline-none focus:bg-gray-800 rounded"
                    />
                  </div>

                  <div className="col-span-3 text-right text-white font-medium text-sm">
                    {showInBYN
                      ? `${calculateBYN(item.price, item.quantity).toFixed(2)} BYN`
                      : `$${(item.price * item.quantity).toFixed(2)}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="text-red-500/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity w-6 flex justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
