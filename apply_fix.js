const fs = require('fs');

const filePath = 'src/components/WarehouseSpecification.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `    setExpandedItems(updatedItems);
    
    // Mark parent item as having applied modifications
    setItemsWithAppliedModifications(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedBudgetItemForMod.id);
      return newSet;
    });`;

const newCode = `    setExpandedItems(updatedItems);

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
    });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('✓ Fix successfully applied!');
} else {
  console.log('✗ Pattern not found - file may already be fixed');
}
