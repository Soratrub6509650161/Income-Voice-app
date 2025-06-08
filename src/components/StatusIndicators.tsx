import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface StatusIndicatorsProps {
  firebaseReady: boolean;
  initializingFirebase: boolean;
  isSupported: boolean | null;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  firebaseReady,
  initializingFirebase,
  isSupported
}) => {
  return (
    <>
      {/* Firebase Status */}
      <div className={`text-center mb-5 p-4 rounded-xl font-bold ${
        initializingFirebase
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          : firebaseReady 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-orange-100 text-orange-800 border border-orange-200'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {initializingFirebase ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
              🔥 กำลังเชื่อมต่อ Firebase...
            </>
          ) : firebaseReady ? (
            <>
              <Wifi size={20} />
              🔥 Firebase พร้อมใช้งาน
            </>
          ) : (
            <>
              <WifiOff size={20} />
              ⚠️ ใช้งานแบบออฟไลน์
            </>
          )}
        </div>
      </div>
      
      {/* Speech Recognition Status */}
      <div className={`text-center mb-5 p-4 rounded-xl font-bold ${
        isSupported === null 
          ? 'bg-gray-100 text-gray-700'
          : isSupported 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isSupported === null && '🔍 กำลังตรวจสอบการรองรับ...'}
        {isSupported === true && '✅ เบราว์เซอร์รองรับ Speech Recognition'}
        {isSupported === false && (
          <>
            ❌ เบราว์เซอร์ไม่รองรับ Speech Recognition
            <br />
            <small>กรุณาใช้ Google Chrome</small>
          </>
        )}
      </div>
    </>
  );
};