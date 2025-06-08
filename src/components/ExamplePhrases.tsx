import React from 'react';

const ExamplePhrases: React.FC = () => {
  const examples = [
    '🛒 "ขายน้ำ 20 บาท"',
    '🛒 "ซื้อข้าว 50 บาท"',
    '💰 "รายได้ 100 บาท"',
    '💸 "จ่ายค่าไฟ 200 บาท"',
    '🍜 "ขายก๋วยเตี๋ยว 35 บาท"',
    '🧴 "ซื้อน้ำยาล้างจาน 25 บาท"',
    '📱 "ค่าโทรศัพท์ 299 บาท"',
    '⛽ "ค่าน้ำมัน 500 บาท"'
  ];

  return (
    <div className="bg-amber-50 rounded-xl p-5 mb-8">
      <h3 className="text-amber-800 text-lg font-semibold mb-4">
        💡 ประโยคตัวอย่างสำหรับทดสอบ:
      </h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {examples.map((example, index) => (
          <li
            key={index}
            className="bg-white p-3 rounded-lg border-l-4 border-amber-500 text-sm"
          >
            {example}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExamplePhrases;