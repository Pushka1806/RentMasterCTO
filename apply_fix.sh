#!/bin/bash
cd /home/engine/project

# Create a temporary file with the fix
sed '/^    setExpandedItems(updatedItems);$/a\\
\\n    // Mark the new modification component items as modified so they get saved\\
    setModifiedItems(prev => {\\
      const newSet = new Set(prev);\\
      newItems.forEach(item => newSet.add(item.budgetItemId));\\
      return newSet;\\
    });' src/components/WarehouseSpecification.tsx > src/components/WarehouseSpecification.tsx.new

# Replace the original file
mv src/components/WarehouseSpecification.tsx.new src/components/WarehouseSpecification.tsx

echo "Fix applied successfully!"
