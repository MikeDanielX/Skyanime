const SkeletonCard = () => {
  return (
    // animate-pulse: Tailwind's built-in shimmer animation
    <div className="rounded-lg overflow-hidden shadow-lg animate-pulse bg-gray-700">
      
      {/* Fake Image Placeholder */}
      <div className="w-full h-64 bg-gray-600"></div>
      
      {/* Fake Text Placeholder */}
      <div className="p-4">
        {/* Title Line */}
        <div className="h-6 bg-gray-600 rounded mb-2 w-3/4"></div>
        {/* Subtitle Line */}
        <div className="h-4 bg-gray-600 rounded w-1/2"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;