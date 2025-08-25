// Test file to verify @sinclair/typebox can be imported
console.log('Testing @sinclair/typebox import...');

try {
  const { Type } = require('@sinclair/typebox');
  console.log('✅ Successfully imported @sinclair/typebox via require');
  console.log('Type:', typeof Type);
} catch (error) {
  console.error('❌ Failed to import @sinclair/typebox via require:', error.message);
}

try {
  const typebox = await import('@sinclair/typebox');
  console.log('✅ Successfully imported @sinclair/typebox via import');
  console.log('Typebox:', typeof typebox);
} catch (error) {
  console.error('❌ Failed to import @sinclair/typebox via import:', error.message);
}
