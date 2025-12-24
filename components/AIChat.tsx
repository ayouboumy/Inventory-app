import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem } from '../types';
import { chatWithInventory } from '../services/geminiService';
import { Send, Bot, User, Loader2, Mic } from 'lucide-react';

interface AIChatProps {
  inventory: InventoryItem[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

export const AIChat: React.FC<AIChatProps> = ({ inventory }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'السلام عليكم! أنا مساعدك الذكي في منصة ضبط التوزيع. اسألني أي شيء عن مخزون الصوتيات أو المصاحف.', 
      id: 'welcome' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to hold the speech recognition instance
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA'; // Set to Arabic

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onError = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { role: 'user', content: input, id: crypto.randomUUID() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await chatWithInventory(input, inventory);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText, id: crypto.randomUUID() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "واجهت مشكلة في معالجة طلبك.", id: crypto.randomUUID() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasSpeechSupport = 'webkitSpeechRecognition' in window;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-emerald-50/30 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Bot size={18} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">ذكاء المخزون</h3>
          <p className="text-xs text-slate-500">مدعوم بواسطة Gemini 3 Flash</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center 
                ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed 
                ${msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tl-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl rounded-tr-none border border-slate-100 flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin" /> جاري التفكير...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          {hasSpeechSupport && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all flex-shrink-0
                ${isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              title="تحدث"
            >
              <Mic size={18} />
            </button>
          )}
          <input 
            type="text" 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder={isListening ? "جاري الاستماع..." : "اسأل عن الكميات، الأماكن، أو الحالة..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} className="rotate-180" /> {/* Rotated for RTL if needed, usually icon direction depends on svg, arrow icons usually need flip */}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">الذكاء الاصطناعي قد يخطئ. يرجى التحقق من مستويات المخزون المهمة يدوياً.</p>
      </form>
    </div>
  );
};