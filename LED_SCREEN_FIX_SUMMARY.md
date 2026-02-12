# LED Screen Module Display Fix

## Problem
LED screen modules were being automatically expanded in the warehouse specification, showing individual module items instead of the parent LED screen item. This made the specification cluttered and difficult to read for warehouse staff.

## Solution
Modified the `WarehouseSpecification.tsx` component to prevent LED screens from being expanded into their module compositions. LED screens are now displayed as single items in the warehouse specification, while their modules can still be managed through the LED specification calculator panel.

## Changes Made

### File: `/src/components/WarehouseSpecification.tsx`

1. **Added new helper function `isLedScreenBudgetItem`** (lines 103-112):
   - Checks if a `BudgetItem` is an LED screen based on:
     - Category is 'Видео' AND name contains 'LED', 'Светодиодный экран', 'P2,6', or 'P3,91'
     - OR notes contain dimension patterns: 'м.кв.', '×', 'x', or '\d+\s*м²'
   - This function works with the `BudgetItem` type (used during data loading)
   - Complements the existing `isLedScreenItem` function which works with `ExpandedItem` type (used for rendering)

2. **Modified virtual item expansion logic** in `loadData` function (lines 202-218):
   - Added `const isLedScreen = isLedScreenBudgetItem(item);` to check if the item is an LED screen
   - Changed condition from `if (!isVirtual)` to `if (!isVirtual || isLedScreen)`
   - This means:
     - Physical items are added as single items (existing behavior)
     - LED screens (even if virtual) are added as single items (NEW behavior)
     - Other virtual items continue to be expanded into their components (existing behavior)

## Behavior

### Before Fix
```
Видео Category:
├── LED Экран P3.91 (not shown)
│   ├── Модуль LED P3.91 - 50x50cm (qty: 20)
│   ├── Контроллер LED (qty: 2)
│   └── Кейс для модулей (qty: 5)
```

### After Fix
```
Видео Category:
└── LED Экран P3.91 (qty: 1) [Calculator Button]
```

The calculator button (green) allows warehouse staff to:
- View detailed module breakdown
- Calculate required modules based on screen dimensions
- Manage module quantities in compositions

## Benefits

1. **Cleaner warehouse specification**: LED screens appear as single line items
2. **Easier picking**: Warehouse staff see what they need to prepare (the complete LED screen setup) without unnecessary detail
3. **Maintained functionality**: Module management is still available through the LED specification panel
4. **Consistent with workflow**: Warehouse staff pick the "LED screen" as a complete unit, not individual modules
5. **Backward compatible**: Other virtual items (non-LED screens) continue to expand normally

## Technical Details

- The fix respects the existing `isFromComposition` flag - LED screens have this set to `false`
- The calculator button visibility is determined by the `isLedScreenItem` function (line 925)
- Module compositions are still loaded and managed through `LedSpecificationPanel` component
- The change only affects the warehouse specification view, not budget editing or other parts of the system

## Testing Scenarios

To verify this fix works correctly:

1. Create an event with LED screen equipment
2. Open warehouse specification for the event
3. Verify LED screens appear as single items (not expanded into modules)
4. Click the calculator button (green) on the LED screen item
5. Verify the LED specification panel opens and shows module details
6. Verify other virtual equipment items (non-LED screens) still expand normally
