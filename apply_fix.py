#!/usr/bin/env python3
import sys

# Read the file
with open('src/components/WarehouseSpecification.tsx', 'r') as f:
    content = f.read()

# Find the pattern and replace it
old_code = '''    setExpandedItems(updatedItems);
    
    // Mark parent item as having applied modifications
    setItemsWithAppliedModifications(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedBudgetItemForMod.id);
      return newSet;
    });'''

new_code = '''    setExpandedItems(updatedItems);

    // Mark the new modification component items as modified so they get saved
    setModifiedItems(prev => {
      const newSet = new Set(prev);
      newItems.forEach(item => newSet.add(item.budgetItemId));
      return newSet;
    });

    // Mark parent item as having applied modifications
    setItemsWithAppliedModifications(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedBudgetItemForMod.id);
      return newSet;
    });'''

if old_code in content:
    updated_content = content.replace(old_code, new_code)
    with open('src/components/WarehouseSpecification.tsx', 'w') as f:
        f.write(updated_content)
    print("✓ Fix successfully applied!")
    sys.exit(0)
else:
    print("✗ Pattern not found - file may already be fixed")
    sys.exit(1)
