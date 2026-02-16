#!/usr/bin/env python3

import re

# Read the original file
with open('/home/engine/project/src/components/BudgetEditor.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the new imports
old_imports = "import { WarehouseSpecification } from './WarehouseSpecification';\nimport { generateBudgetPDF } from '../lib/pdfGenerator';"
new_imports = """import { WarehouseSpecification } from './WarehouseSpecification';
import { generateBudgetPDF } from '../lib/pdfGenerator';
import { LedSizeDialog } from './dialogs/LedSizeDialog';
import { PodiumDialog } from './dialogs/PodiumDialog';
import { TotemDialog } from './dialogs/TotemDialog';
import { UShapeDialog } from './dialogs/UShapeDialog';
import { UShapeLedDialog } from './dialogs/UShapeLedDialog';"""

content = content.replace(old_imports, new_imports)

# 2. Remove dialog state variables (lines 48-79)
# These lines contain useState declarations for the dialogs
state_pattern = r'  const \[showLedSizeDialog, setShowLedSizeDialog\] = useState\(false\);\n  const \[selectedLedEquipment, setSelectedLedEquipment\] = useState<EquipmentItem \| null>\(null\);\n  const \[ledWidth, setLedWidth\] = useState\(\'\');\n  const \[ledHeight, setLedHeight\] = useState\(\'\');\n  const \[ledArea, setLedArea\] = useState\(\'\');\n  const \[ledSizeType, setLedSizeType\] = useState<\'dimensions\' \| \'area\'\>\(\'dimensions\'\);\n\n  const \[showPodiumDialog, setShowPodiumDialog\] = useState\(false\);\n  const \[selectedPodiumEquipment, setSelectedPodiumEquipment\] = useState<EquipmentItem \| null>\(null\);\n  const \[podiumWidth, setPodiumWidth\] = useState\(\'\');\n  const \[podiumDepth, setPodiumDepth\] = useState\(\'\');\n  const \[podiumHeight, setPodiumHeight\] = useState\(\'\');\n\n  const \[showTotemDialog, setShowTotemDialog\] = useState\(false\);\n  const \[selectedTotemEquipment, setSelectedTotemEquipment\] = useState<EquipmentItem \| null>\(null\);\n  const \[totemHeight, setTotemHeight\] = useState\(\'\');\n  const \[isMonototem, setIsMonototem\] = useState\(false\);\n\n  const \[showUShapeDialog, setShowUShapeDialog\] = useState\(false\);\n  const \[selectedUShapeEquipment, setSelectedUShapeEquipment\] = useState<EquipmentItem \| null>\(null\);\n  const \[uShapeWidth, setUShapeWidth\] = useState\(\'\');\n  const \[uShapeHeight, setUShapeHeight\] = useState\(\'\');\n  const \[uShapeSupportCount, setUShapeSupportCount\] = useState\(\'0\');\n  const \[uShapeSupportLength, setUShapeSupportLength\] = useState\(\'\');\n\n  const \[showUShapeLedDialog, setShowUShapeLedDialog\] = useState\(false\);\n  const \[selectedUShapeLedEquipment, setSelectedUShapeLedEquipment\] = useState<EquipmentItem \| null>\(null\);\n  const \[uShapeLedWidth, setUShapeLedWidth\] = useState\(\'\');\n  const \[uShapeLedHeight, setUShapeLedHeight\] = useState\(\'\');\n  const \[uShapeLedSupportCount, setUShapeLedSupportCount\] = useState\(\'0\');\n  const \[uShapeLedSupportLength, setUShapeLedSupportLength\] = useState\(\'\');\n  const \[uShapeLedHoistType, setUShapeLedHoistType\] = useState<\'manual\' \| \'motor\'\>\(\'manual\'\);'

# Find and remove all the dialog state lines
lines = content.split('\n')
new_lines = []
skip_dialog_state = False
for i, line in enumerate(lines):
    # Skip dialog state lines
    if line.strip().startswith('const [showLedSizeDialog'):
        skip_dialog_state = True
        continue
    if skip_dialog_state and 'useState' in line and line.strip().startswith('const ['):
        # This is part of the dialog state block, skip it
        continue
    if skip_dialog_state and not 'useState' in line and not line.strip().startswith('const ['):
        # End of dialog state block
        skip_dialog_state = False
        new_lines.append(line)
    elif not skip_dialog_state:
        new_lines.append(line)

content = '\n'.join(new_lines)

# 3. Add simplified dialog state
simplified_dialog_state = """  // Dialog state for refactored components
  const [showLedSizeDialog, setShowLedSizeDialog] = useState(false);
  const [showPodiumDialog, setShowPodiumDialog] = useState(false);
  const [showTotemDialog, setShowTotemDialog] = useState(false);
  const [showUShapeDialog, setShowUShapeDialog] = useState(false);
  const [showUShapeLedDialog, setShowUShapeLedDialog] = useState(false);

  const [selectedLedEquipment, setSelectedLedEquipment] = useState<EquipmentItem | null>(null);
  const [selectedPodiumEquipment, setSelectedPodiumEquipment] = useState<EquipmentItem | null>(null);
  const [selectedTotemEquipment, setSelectedTotemEquipment] = useState<EquipmentItem | null>(null);
  const [isMonototem, setIsMonototem] = useState(false);
  const [selectedUShapeEquipment, setSelectedUShapeEquipment] = useState<EquipmentItem | null>(null);
  const [selectedUShapeLedEquipment, setSelectedUShapeLedEquipment] = useState<EquipmentItem | null>(null);
"""

# Find the right place to insert simplified state (after showExchangeRatePopover)
lines = content.split('\n')
new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if line.strip() == "const [showExchangeRatePopover, setShowExchangeRatePopover] = useState(false);":
        new_lines.append('')
        new_lines.append(simplified_dialog_state)

content = '\n'.join(new_lines)

print("Refactoring complete - saving to file...")
with open('/home/engine/project/src/components/BudgetEditor_refactored.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File saved to BudgetEditor_refactored.tsx")
