'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ImageCarousel = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  const validImages = images?.filter(img => img && img.trim() !== '') || [];

  if (validImages.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Main Image Container */}
      <div className="relative w-full max-w-5xl h-full max-h-[80vh] flex items-center justify-center">
        {/* Previous Button */}
        {validImages.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Image */}
        <div className="relative w-full h-full">
          <Image
            src={validImages[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Next Button */}
        {validImages.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Image Counter */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-3 rounded-lg">
          {validImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
