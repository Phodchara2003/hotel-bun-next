// ทดสอบ parseRoomImages function กับข้อมูลจริงจากฐานข้อมูล

function parseRoomImages(imagesData) {
  console.log('🔍 Input:', JSON.stringify(imagesData, null, 2));
  
  if (!imagesData) return [];
  
  // Handle string JSON
  if (typeof imagesData === 'string') {
    try {
      imagesData = JSON.parse(imagesData);
    } catch (e) {
      console.log('⚠️ JSON parse error:', e.message);
      return [];
    }
  }
  
  // Function to flatten deeply nested arrays
  function deepFlatten(arr) {
    const result = [];
    
    function flatten(item) {
      if (Array.isArray(item)) {
        item.forEach(flatten);
      } else if (typeof item === 'string' && item.trim() !== '') {
        result.push(item);
      }
    }
    
    flatten(arr);
    return result;
  }
  
  const flattened = deepFlatten(imagesData);
  console.log('✅ Output:', flattened);
  console.log('---');
  return flattened;
}

// ข้อมูลจริงจากฐานข้อมูล
const testCases = [
  // room1 - ซับซ้อนมาก
  [
    [
      [
        "room1.jpg"
      ],
      "room-1758139865408-375582854.png"
    ],
    "room-1758139951564-107725448.jpg"
  ],
  
  // room6 - ซับซ้อนปานกลาง
  [
    [
      "room4.jpg"
    ]
  ],
  
  // room7 - ซับซ้อนปานกลาง
  [
    [
      "suite2.jpg"
    ]
  ],
  
  // room3 - ธรรมดา
  [
    "suite1.jpg"
  ],
  
  // Test edge cases
  [],
  null,
  undefined,
  "",
  "invalid json",
  '["valid_json.jpg"]'
];

console.log('🧪 ทดสอบ parseRoomImages function\n');

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}:`);
  const result = parseRoomImages(testCase);
  console.log(`Result count: ${result.length}\n`);
});