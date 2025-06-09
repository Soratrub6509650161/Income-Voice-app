import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-sm py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © 2024 Speech Recognition App. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer; 