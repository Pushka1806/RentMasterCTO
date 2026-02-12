import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { BudgetItem } from '../lib/events';

interface LedSpecificationPanelProps {
  budgetItemId: string;
  budgetItems: BudgetItem[];
  onClose: () => void;
}

export function LedSpecificationPanel({ budgetItemId, budgetItems, onClose }: LedSpecificationPanelProps) {
  const budgetItem = budgetItems.find(b => b.id === budgetItemId);
  const notes = budgetItem?.notes || '';
  
  const [moduleType, setModuleType] = useState<'P2.6' | 'P3.91'>('P3.91');
  const [moduleSize, setModuleSize] = useState({ width: 0.25, height: 0.25 });
  const [targetArea, setTargetArea] = useState(0);
  
  useEffect(() => {
    if (notes) {
      const areaMatch = notes.match(/(\d+(?:\.\d+)?)\s*м\.кв\./);
      if (areaMatch) {
        setTargetArea(parseFloat(areaMatch[1]));
      } else {
        const dimMatch = notes.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/);
        if (dimMatch) {
          setTargetArea(parseFloat(dimMatch[1]) * parseFloat(dimMatch[2]));
        }
      }
    }
  }, [notes]);
  
  useEffect(() => {
    setModuleSize(moduleType === 'P2.6' ? { width: 0.25, height: 0.25 } : { width: 0.25, height: 0.25 });
  }, [moduleType]);
  
  const moduleArea = moduleSize.width * moduleSize.height;
  const totalModules = targetArea > 0 ? Math.ceil(targetArea / moduleArea) : 0;
  
  const casesData = [
    { caseName: 'Кейс 2 м²', caseId: 'VI_CASE_2', modulesPerCase: 32 },
    { caseName: 'Кейс 3 м²', caseId: 'VI_CASE_3', modulesPerCase: 48 },
  ];
  
  const calculateCases = () => {
    const cases: Array<{ modulesCount: number; caseCount: number; caseId: string; caseName: string }> = [];
    let remainingModules = totalModules;
    
    for (const caseTemplate of casesData) {
      if (remainingModules <= 0) break;
      const caseCount = Math.floor(remainingModules / caseTemplate.modulesPerCase);
      if (caseCount > 0) {
        cases.push({
          modulesCount: caseTemplate.modulesPerCase,
          caseCount,
          caseId: caseTemplate.caseId,
          caseName: caseTemplate.caseName
        });
        remainingModules -= caseCount * caseTemplate.modulesPerCase;
      }
    }
    
    if (remainingModules > 0) {
      const smallCaseModules = casesData[0].modulesPerCase;
      const additionalCases = Math.ceil(remainingModules / smallCaseModules);
      const existingCase = cases.find(c => c.caseId === casesData[0].caseId);
      if (existingCase) {
        existingCase.caseCount += additionalCases;
      } else {
        cases.push({
          modulesCount: smallCaseModules,
          caseCount: additionalCases,
          caseId: casesData[0].caseId,
          caseName: casesData[0].caseName
        });
      }
    }
    
    return cases;
  };
  
  const calculatedCases = calculateCases();
  const progress = targetArea > 0 ? Math.min(100, Math.round((totalModules * moduleArea / targetArea) * 100)) : 0;

  return (
    <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Calculator className="w-4 h-4 text-green-500" />
          Спецификация модулей LED экрана
        </h4>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Тип модуля</label>
          <div className="flex gap-2">
            <button
              onClick={() => setModuleType('P3.91')}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${
                moduleType === 'P3.91'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              P3.91
            </button>
            <button
              onClick={() => setModuleType('P2.6')}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${
                moduleType === 'P2.6'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              P2.6
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Размер модуля (м)</label>
          <div className="flex items-center gap-1 bg-gray-700 rounded px-2 py-1.5">
            <input
              type="number"
              step="0.01"
              value={moduleSize.width}
              onChange={(e) => setModuleSize({ ...moduleSize, width: parseFloat(e.target.value) || 0 })}
              className="w-14 bg-transparent text-white text-xs text-center outline-none"
            />
            <span className="text-gray-500 text-xs">×</span>
            <input
              type="number"
              step="0.01"
              value={moduleSize.height}
              onChange={(e) => setModuleSize({ ...moduleSize, height: parseFloat(e.target.value) || 0 })}
              className="w-14 bg-transparent text-white text-xs text-center outline-none"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Площадь экрана (м²)</label>
          <input
            type="number"
            step="0.1"
            value={targetArea}
            onChange={(e) => setTargetArea(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm outline-none focus:border-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Итого модулей</label>
          <div className="px-3 py-1.5 bg-gray-900 rounded text-white text-sm font-bold">
            {totalModules} шт
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Покрытие площади</span>
          <span className={`font-bold ${progress >= 100 ? 'text-green-500' : 'text-yellow-500'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          Фактическая площадь: {(totalModules * moduleArea).toFixed(2)} м²
        </div>
      </div>
      
      <div>
        <label className="block text-xs text-gray-400 mb-2">Необходимые кейсы</label>
        <div className="space-y-2">
          {calculatedCases.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-700/50 rounded px-3 py-2">
              <div>
                <span className="text-xs text-white font-medium">{c.caseName}</span>
                <span className="text-[10px] text-gray-500 ml-2">({c.modulesCount} мод.)</span>
              </div>
              <span className="text-sm font-bold text-green-400">{c.caseCount} шт</span>
            </div>
          ))}
          {calculatedCases.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-2">Укажите площадь экрана</div>
          )}
        </div>
      </div>
    </div>
  );
}
