import React from 'react';
import { FaDollarSign } from 'react-icons/fa';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ระบบฟังรายรับจากคำพูด
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              <FaDollarSign size={24} />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 