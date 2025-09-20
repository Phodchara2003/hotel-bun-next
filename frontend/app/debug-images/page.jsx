'use client';

export default function DebugImagesPage() {
  const testImages = [
    "room-1758387372962-915093540.png",
    "room-1758283949829-274513890.png", 
    "room-1758283949849-871061205.png"
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Room Images</h1>
      
      {testImages.map((imageName, index) => {
        const imagePath = `/images/rooms/${imageName}`;
        
        return (
          <div key={index} className="mb-8 p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Test Image #{index + 1}</h2>
            
            <div className="mb-4">
              <strong>Image Name:</strong> {imageName}<br/>
              <strong>Image Path:</strong> {imagePath}<br/>
              <strong>Full URL:</strong> http://localhost:3002{imagePath}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Method 1: Regular img tag */}
              <div className="border p-4">
                <h3 className="font-medium mb-2">Method 1: Regular &lt;img&gt;</h3>
                <img
                  src={imagePath}
                  alt={`Test ${imageName}`}
                  className="w-full h-32 object-cover border"
                  onLoad={(e) => {
                    console.log('✅ Regular img loaded:', imagePath);
                    e.target.style.border = '3px solid green';
                  }}
                  onError={(e) => {
                    console.log('❌ Regular img failed:', imagePath);
                    e.target.style.border = '3px solid red';
                    e.target.alt = `Failed to load: ${imageName}`;
                  }}
                />
              </div>

              {/* Method 2: Full URL */}
              <div className="border p-4">
                <h3 className="font-medium mb-2">Method 2: Full URL</h3>
                <img
                  src={`http://localhost:3002${imagePath}`}
                  alt={`Test Full URL ${imageName}`}
                  className="w-full h-32 object-cover border"
                  onLoad={(e) => {
                    console.log('✅ Full URL img loaded:', `http://localhost:3002${imagePath}`);
                    e.target.style.border = '3px solid green';
                  }}
                  onError={(e) => {
                    console.log('❌ Full URL img failed:', `http://localhost:3002${imagePath}`);
                    e.target.style.border = '3px solid red';
                    e.target.alt = `Failed full URL: ${imageName}`;
                  }}
                />
              </div>

              {/* Method 3: Background image */}
              <div className="border p-4">
                <h3 className="font-medium mb-2">Method 3: Background Image</h3>
                <div
                  className="w-full h-32 border bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${imagePath}')`,
                    backgroundColor: '#f3f4f6'
                  }}
                  onLoad={() => {
                    console.log('✅ Background image loaded:', imagePath);
                  }}
                  onError={() => {
                    console.log('❌ Background image failed:', imagePath);
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                    Background Image Test
                  </div>
                </div>
              </div>
            </div>

            {/* Network Test Button */}
            <div className="mt-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`http://localhost:3002${imagePath}`);
                    console.log(`Network test for ${imageName}:`, {
                      status: response.status,
                      statusText: response.statusText,
                      contentType: response.headers.get('content-type'),
                      contentLength: response.headers.get('content-length')
                    });
                    alert(`✅ Network test passed: ${response.status} ${response.statusText}`);
                  } catch (error) {
                    console.error(`Network test failed for ${imageName}:`, error);
                    alert(`❌ Network test failed: ${error.message}`);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🌐 Test Network Access
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}