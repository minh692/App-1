import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
      <p className="text-lg text-gray-300 font-semibold">Analyzing your video...</p>
      <p className="text-sm text-gray-400">This may take a few minutes for longer videos.</p>
    </div>
  );
};

export default Loader;
