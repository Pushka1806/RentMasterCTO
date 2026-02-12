import { supabase } from './supabase';

export interface EquipmentComposition {
  id: string;
  parent_id: string;
  child_id: string;
  quantity: number;
  child_name: string;
  child_sku: string;
  child_category: string;
  child_type: string;
  created_at: string;
}

export interface EquipmentModule {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: string;
  subtype: string;
  note: string;
  quantity?: number; // For existing compositions
}

export async function getEquipmentCompositions(parentId: string): Promise<EquipmentComposition[]> {
  const { data, error } = await supabase
    .from('equipment_compositions')
    .select(`
      id,
      parent_id,
      child_id,
      quantity,
      created_at,
      child:equipment_items!equipment_compositions_child_id_fkey (
        name,
        sku,
        category,
        type
      )
    `)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    parent_id: item.parent_id,
    child_id: item.child_id,
    quantity: item.quantity,
    child_name: (item.child as any).name,
    child_sku: (item.child as any).sku,
    child_category: (item.child as any).category,
    child_type: (item.child as any).type,
    created_at: item.created_at
  }));
}

export async function addEquipmentComposition(
  parentId: string,
  childId: string,
  quantity: number
): Promise<string> {
  const { data, error } = await supabase
    .from('equipment_compositions')
    .insert({
      parent_id: parentId,
      child_id: childId,
      quantity
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function updateEquipmentComposition(
  id: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from('equipment_compositions')
    .update({
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteEquipmentComposition(id: string): Promise<void> {
  const { error } = await supabase
    .from('equipment_compositions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getLedModules(): Promise<EquipmentModule[]> {
  // Search for LED modules - look for "модуль" in name or note, or check if category is "Видео"
  const { data, error } = await supabase
    .from('equipment_items')
    .select('id, name, sku, category, type, subtype, note')
    .or('name.ilike.%модуль%,note.ilike.%модуль%,category.eq.Видео')
    .order('name');

  if (error) throw error;

  // Filter to only LED modules
  return (data || []).map(item => ({
    id: item.id,
    name: item.name || '',
    sku: item.sku || '',
    category: item.category || '',
    type: item.type || '',
    subtype: item.subtype || '',
    note: item.note || ''
  })).filter(module => {
    const name = module.name.toLowerCase();
    const note = module.note.toLowerCase();
    const category = module.category.toLowerCase();
    const subtype = module.subtype?.toLowerCase() || '';
    
    // Include if it's a LED module or video equipment
    return name.includes('модуль') || 
           note.includes('модуль') ||
           name.includes('led') || 
           note.includes('led') ||
           name.includes('светодиод') ||
           note.includes('светодиод') ||
           category === 'видео' ||
           subtype.includes('модуль');
  });
}

export async function getAvailableLedModules(screenType: 'P2.6' | 'P3.91'): Promise<EquipmentModule[]> {
  const allModules = await getLedModules();
  console.log('All LED modules found:', allModules.length, allModules);
  
  // For now, return all LED modules without filtering by type to ensure we find some
  // Filter by basic criteria like containing "модуль" and dimensions
  return allModules.filter(module => {
    const name = module.name.toLowerCase();
    const note = module.note.toLowerCase();
    
    // Check if it contains module dimensions (0,5x0,5, 0,5x1, etc.)
    const hasDimensions = name.match(/\d+[.,]?\d*[x×]\d+[.,]?\d+/) || note.match(/\d+[.,]?\d*[x×]\d+[.,]?\d+/);
    
    // Include if it's a module and has dimensions or doesn't explicitly mention incompatible screen type
    const isModule = name.includes('модуль') || note.includes('модуль');
    const isCompatible = !name.includes('p3,91') && !name.includes('p3.91') && !name.includes('p2,6') && !name.includes('p2.6') ||
                         (screenType === 'P2.6' && (name.includes('p2,6') || name.includes('p2.6'))) ||
                         (screenType === 'P3.91' && (name.includes('p3,91') || name.includes('p3.91')));
    
    return isModule && (hasDimensions || isCompatible);
  });
}
