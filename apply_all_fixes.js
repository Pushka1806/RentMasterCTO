const fs = require('fs');

const filePath = 'src/components/WarehouseSpecification.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let changes = 0;

// Fix 1: Mark modification components as modified
const fix1Old = `    setExpandedItems(updatedItems);

    // Mark parent item as having applied modifications
    setItemsWithAppliedModifications(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedBudgetItemForMod.id);
      return newSet;
    });`;

const fix1New = `    setExpandedItems(updatedItems);

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

if (content.includes(fix1Old)) {
  content = content.replace(fix1Old, fix1New);
  changes++;
  console.log('✓ Fix 1 applied: Save modification components');
} else {
  console.log('✗ Fix 1 already applied or pattern not found');
}

// Fix 2: Load modifications for LED screens
const fix2Old = `            // Pre-load modifications for all equipment items to know which ones have modifications
            const equipmentIds = budgetData
              .filter(item => item.item_type === 'equipment' && item.equipment_id && item.equipment?.object_type !== 'virtual')
              .map(item => item.equipment_id);`;

const fix2New = `            // Pre-load modifications for all equipment items to know which ones have modifications
            const equipmentIds = budgetData
              .filter(item => {
                if (item.item_type !== 'equipment' || !item.equipment_id) return false;
                // Include all physical equipment and LED screens
                if (item.equipment?.object_type !== 'virtual') return true;
                // Only include virtual items that are LED screens
                return isLedScreenBudgetItem(item);
              })
              .map(item => item.equipment_id);`;

if (content.includes(fix2Old)) {
  content = content.replace(fix2Old, fix2New);
  changes++;
  console.log('✓ Fix 2 applied: Load modifications for LED screens');
} else {
  console.log('✗ Fix 2 already applied or pattern not found');
}

if (changes > 0) {
  fs.writeFileSync(filePath, content);
  console.log(`\n✓ Successfully applied ${changes} fix(es)!`);
} else {
  console.log('\nNo fixes were applied. File may already have all fixes.');
}
