  const handleSaveComponents = () => {
    if (!selectedBudgetItemForMod || !selectedModification) return;

    // Add components as expanded items
    const newItems: ExpandedItem[] = modificationComponents
      .filter(comp => componentQuantities[comp.id] > 0)
      .map(comp => ({
        budgetItemId: `${selectedBudgetItemForMod.id}-mod-${comp.id}-${Date.now()}`,
        categoryId: selectedBudgetItemForMod.category_id || null,
        name: comp.component?.name || 'Unknown',
        sku: comp.component?.sku || '',
        quantity: componentQuantities[comp.id],
        unit: 'шт.',
        category: comp.component?.category || 'Modification Components',
        notes: '',
        picked: false,
        isFromComposition: true,
        parentName: `${selectedBudgetItemForMod.equipment?.name} (${selectedModification.name})`
      }));

    // Find the parent item index
    const parentIndex = expandedItems.findIndex(item => item.budgetItemId === selectedBudgetItemForMod.id);

    // Insert new items right after the parent
    const updatedItems = [...expandedItems];
    if (parentIndex >= 0) {
      updatedItems.splice(parentIndex + 1, 0, ...newItems);
    } else {
      updatedItems.push(...newItems);
    }

    setExpandedItems(updatedItems);

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
    });

    // Reset state
    setShowComponentsDialog(false);
    setSelectedModification(null);
    setModificationComponents([]);
    setComponentQuantities({});
    setSelectedBudgetItemForMod(null);
  };
