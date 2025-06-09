import React from 'react';
import SpeechRecognition from './components/SpeechRecognition';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <SpeechRecognition />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;