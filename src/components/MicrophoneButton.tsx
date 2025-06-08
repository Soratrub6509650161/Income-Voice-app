import React from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean | null;
  onMicClick: () => void;
  interimText: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isSupported,
  onMicClick,
  interimText
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
        onClick={onMicClick}
        className={getMicButtonClass()}
        disabled={!isSupported}
      >
        🎤
      </button>
      <div className="mt-4 text-lg font-bold text-gray-600">
        {getMicText()}
      </div>
    </div>
  );
};

export default MicrophoneButton;