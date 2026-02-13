const fs = require('fs');

const filePath = 'src/components/WarehouseSpecification.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCode = `            // Pre-load modifications for all equipment items to know which ones have modifications
            const equipmentIds = budgetData
              .filter(item => item.item_type === 'equipment' && item.equipment_id && item.equipment?.object_type !== 'virtual')
              .map(item => item.equipment_id);`;

const newCode = `            // Pre-load modifications for all equipment items to know which ones have modifications
            const equipmentIds = budgetData
              .filter(item => {
                if (item.item_type !== 'equipment' || !item.equipment_id) return false;
                // Include all physical equipment and LED screens
                if (item.equipment?.object_type !== 'virtual') return true;
                // Only include virtual items that are LED screens
                return isLedScreenBudgetItem(item);
              })
              .map(item => item.equipment_id);`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('✓ LED screen modifications fix successfully applied!');
} else {
  console.log('✗ Pattern not found - file may already be fixed');
}
