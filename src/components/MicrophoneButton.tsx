import React from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean | null;
  onMicClick: () => void;
  interimText: string;
  onClick: () => void;
  disabled: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isSupported,
  onMicClick,
  interimText,
  onClick,
  disabled
}) => {
  const getMicButtonClass = () => {
    if (isListening) {
      return 'w-30 h-30 rounded-full border-none cursor-pointer text-4xl transition-all duration-300 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse';
    } else if (isSupported) {
      return 'w-30 h-30 rounded-full border-none cursor-pointer text-4xl transition-all duration-300 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-110';
    } else {
      return 'w-30 h-30 rounded-full border-none cursor-not-allowed text-4xl transition-all duration-300 shadow-lg bg-gray-400 text-gray-600';
    }
  };

  const getMicText = () => {
    if (isListening) {
      return interimText ? (
        <div className="text-center">
          <div>🎤 กำลังฟัง... กดเพื่อหยุด</div>
          <div className="text-sm text-gray-600 mt-1">{interimText}</div>
        </div>
      ) : '🎤 กำลังฟัง... กดเพื่อหยุด';
    } else if (isSupported === null) {
      return 'กำลังโหลด...';
    } else if (isSupported) {
      return 'กดเพื่อเริ่มพูด';
    } else {
      return 'ไม่รองรับ';
    }
  };

  return (
    <div className="text-center my-10">
      <button
        onClick={onClick}
        disabled={!isSupported}
        className={getMicButtonClass()}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>{isListening ? 'หยุดการฟัง' : 'เริ่มการฟัง'}</span>
        </div>
      </button>
      <div className="mt-4 text-lg font-bold text-gray-600">
        {getMicText()}
      </div>
    </div>
  );
};

export default MicrophoneButton;