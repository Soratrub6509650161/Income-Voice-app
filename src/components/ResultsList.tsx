import React from 'react';
import { Edit2, Trash2, Check, X, Database } from 'lucide-react';
import type { SpeechResult } from '../types';

interface ResultsListProps {
  results: SpeechResult[];
  savingIds: Set<string>;
  firebaseReady: boolean;
  onStartEditing: (id: string) => void;
  onCancelEditing: (id: string) => void;
  onSaveEdit: (id: string) => void;
  onEditTextChange: (id: string, text: string) => void;
  onSaveToDatabase: (id: string) => void;
  onDeleteFromDatabase: (id: string) => void;
}

const ResultsList: React.FC<ResultsListProps> = ({
  results,
  savingIds,
  firebaseReady,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onEditTextChange,
  onSaveToDatabase,
  onDeleteFromDatabase
}) => {
  const formatConfidence = (confidence: number | null) => {
    return confidence ? `${(confidence * 100).toFixed(1)}%` : 'ไม่ระบุ';
  };

  if (results.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">📝 ผลลัพธ์การทดสอบ:</h3>
        <p className="text-center text-gray-500 py-5">ยังไม่มีผลลัพธ์</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4">📝 ผลลัพธ์การทดสอบ:</h3>
      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={result.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs text-gray-500">
                #{results.length - index} - {result.timestamp.toLocaleString('th-TH')}
                {result.isSaved && (
                  <span className="ml-2 text-green-600">
                    💾 บันทึกแล้ว
                    {result.firebaseId && (
                      <span className="ml-1 text-xs bg-green-100 px-1 rounded">
                        ID: {result.firebaseId.slice(0, 8)}...
                      </span>
                    )}
                  </span>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {!result.isEditing && (
                  <>
                    <button
                      onClick={() => onStartEditing(result.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="แก้ไข"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onSaveToDatabase(result.id)}
                      disabled={savingIds.has(result.id) || !firebaseReady}
                      className={`p-1 rounded transition-colors ${
                        firebaseReady 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 cursor-not-allowed'
                      } disabled:opacity-50`}
                      title={firebaseReady ? (result.isSaved ? 'อัพเดท' : 'บันทึก') : 'Firebase ไม่พร้อม'}
                    >
                      {savingIds.has(result.id) ? (
                        <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                      ) : (
                        <Database size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteFromDatabase(result.id)}
                      disabled={savingIds.has(result.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                      title="ลบ"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                
                {result.isEditing && (
                  <>
                    <button
                      onClick={() => onSaveEdit(result.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="บันทึกการแก้ไข"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => onCancelEditing(result.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="ยกเลิกการแก้ไข"
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Text Display/Edit */}
            {result.isEditing ? (
              <textarea
                value={result.editedText || ''}
                onChange={(e) => onEditTextChange(result.id, e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="แก้ไขข้อความที่นี่..."
              />
            ) : (
              <div className="text-base text-gray-800 font-medium mb-1">
                "{result.text}"
              </div>
            )}
            
            <div className="text-xs text-green-600 mb-2">
              ความแม่นยำ: {formatConfidence(result.confidence)}
            </div>
            
            {result.alternatives && result.alternatives.length > 1 && !result.isEditing && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-600">
                  ตัวเลือกอื่นๆ
                </summary>
                <div className="mt-2 text-xs space-y-1">
                  {result.alternatives.slice(1).map((alt, i) => (
                    <div 
                      key={i}
                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                      onClick={() => onEditTextChange(result.id, alt.text)}
                      title="คลิกเพื่อใช้ข้อความนี้"
                    >
                      • "{alt.text}" ({formatConfidence(alt.confidence)})
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsList;