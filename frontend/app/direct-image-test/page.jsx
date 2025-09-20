export default function DirectImageTest() {
  const imageName = "room-1758387372962-915093540.png";
  const imagePath = `/images/rooms/${imageName}`;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Image Test</h1>
      
      <div className="mb-4">
        <p><strong>Image Path:</strong> {imagePath}</p>
      </div>
      
      <div className="border rounded-lg overflow-hidden max-w-md">
        <img 
          src={imagePath}
          alt="Test room image"
          className="w-full h-64 object-cover"
          onLoad={() => console.log('✅ Image loaded successfully:', imagePath)}
          onError={(e) => {
            console.log('❌ Image failed to load:', imagePath);
            e.target.style.border = '2px solid red';
            e.target.alt = 'Failed to load image';
          }}
        />
      </div>
      
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Other test images:</h2>
        {[
          "room-1758283949829-274513890.png",
          "room-1758283949849-871061205.png",
          "room-1758275954942-81117622.png"
        ].map(img => (
          <div key={img} className="mb-2">
            <p className="text-sm text-gray-600">{img}</p>
            <img 
              src={`/images/rooms/${img}`}
              alt={img}
              className="w-32 h-24 object-cover border rounded"
              onLoad={() => console.log('✅ Image loaded:', img)}
              onError={(e) => {
                console.log('❌ Image failed:', img);
                e.target.style.border = '2px solid red';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}