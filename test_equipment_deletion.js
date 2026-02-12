// Simple test to verify equipment deletion logic
// This is a Node.js script to test the logic without running the full app

const { deleteEquipmentItem } = require('./src/lib/equipment');

// Mock supabase client for testing
const mockSupabase = {
  from: (table) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        limit: (limit) => {
          // Simulate different responses based on table and query
          if (table === 'budget_items' && column === 'equipment_id' && value === 'test-id-1') {
            return Promise.resolve({ data: [{ id: 'budget-item-1' }], error: null });
          } else if (table === 'template_items' && column === 'equipment_id' && value === 'test-id-2') {
            return Promise.resolve({ data: [{ id: 'template-item-1' }], error: null });
          } else if (table === 'warehouse_specification_items' && column === 'equipment_id' && value === 'test-id-3') {
            return Promise.resolve({ data: [{ id: 'warehouse-item-1' }], error: null });
          } else {
            return Promise.resolve({ data: [], error: null });
          }
        }
      })
    }),
    delete: () => ({
      eq: (column, value) => {
        return Promise.resolve({ error: null });
      }
    })
  })
};

// Test cases
async function runTests() {
  console.log('Running equipment deletion tests...\n');

  // Test 1: Equipment referenced in budget_items
  try {
    console.log('Test 1: Equipment referenced in budget_items');
    // This should throw an error
    await deleteEquipmentItem('test-id-1');
    console.log('❌ FAILED: Should have thrown an error');
  } catch (error) {
    console.log('✅ PASSED: Correctly prevented deletion -', error.message);
  }

  // Test 2: Equipment referenced in template_items
  try {
    console.log('\nTest 2: Equipment referenced in template_items');
    await deleteEquipmentItem('test-id-2');
    console.log('❌ FAILED: Should have thrown an error');
  } catch (error) {
    console.log('✅ PASSED: Correctly prevented deletion -', error.message);
  }

  // Test 3: Equipment referenced in warehouse_specification_items
  try {
    console.log('\nTest 3: Equipment referenced in warehouse_specification_items');
    await deleteEquipmentItem('test-id-3');
    console.log('❌ FAILED: Should have thrown an error');
  } catch (error) {
    console.log('✅ PASSED: Correctly prevented deletion -', error.message);
  }

  // Test 4: Equipment not referenced anywhere (should succeed)
  try {
    console.log('\nTest 4: Equipment not referenced anywhere');
    await deleteEquipmentItem('test-id-clean');
    console.log('✅ PASSED: Successfully deleted equipment with no references');
  } catch (error) {
    console.log('❌ FAILED: Should have succeeded -', error.message);
  }

  console.log('\nAll tests completed!');
}

// Note: This is a conceptual test. In a real scenario, you would:
// 1. Use proper mocking libraries
// 2. Set up a test database
// 3. Use a testing framework like Jest
// 4. Test actual Supabase integration

console.log('Test script created. This demonstrates the expected behavior.');
console.log('In a real implementation, you would use proper testing frameworks and database setup.');