import React, { useState, useEffect, useRef } from 'react';
import { Delete, X, ChevronDown, GripHorizontal } from 'lucide-react';

const ARABIC_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ']
];

export const VirtualKeyboard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      // Check if target is a text input or textarea
      if (
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'checkbox' && (target as HTMLInputElement).type !== 'radio' && (target as HTMLInputElement).type !== 'file') ||
        target.tagName === 'TEXTAREA'
      ) {
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
        setIsVisible(true);
        setMinimized(false);
      }
    };

    // We use capture to ensure we catch focus events
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, []);

  const triggerInputEvent = (element: HTMLInputElement | HTMLTextAreaElement, newValue: string) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;

    if (element.tagName === 'INPUT' && nativeInputValueSetter) {
      nativeInputValueSetter.call(element, newValue);
    } else if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(element, newValue);
    } else {
      element.value = newValue;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const handleKeyPress = (e: React.MouseEvent, key: string) => {
    e.preventDefault(); // Prevent focus loss
    if (!activeInput) return;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const value = activeInput.value;

    const newValue = value.substring(0, start) + key + value.substring(end);

    triggerInputEvent(activeInput, newValue);
    
    // Restore cursor position
    requestAnimationFrame(() => {
      activeInput.setSelectionRange(start + key.length, start + key.length);
      activeInput.focus();
    });
  };

  const handleBackspace = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeInput) return;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const value = activeInput.value;

    if (start === end && start === 0) return; // Nothing to delete

    let newValue;
    let newCursorPos;

    if (start !== end) {
      // Delete selection
      newValue = value.substring(0, start) + value.substring(end);
      newCursorPos = start;
    } else {
      // Delete previous char
      newValue = value.substring(0, start - 1) + value.substring(end);
      newCursorPos = start - 1;
    }

    triggerInputEvent(activeInput, newValue);

    requestAnimationFrame(() => {
      activeInput.setSelectionRange(newCursorPos, newCursorPos);
      activeInput.focus();
    });
  };

  const handleSpace = (e: React.MouseEvent) => {
    handleKeyPress(e, ' ');
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={keyboardRef}
      className={`fixed bottom-0 left-0 right-0 bg-slate-100 border-t border-slate-300 shadow-2xl z-50 transition-transform duration-300 ${minimized ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'}`}
      dir="ltr" // Layout keys LTR so row order is preserved visually as defined
    >
      {/* Header / Drag Handle */}
      <div className="flex items-center justify-between px-4 py-1 bg-slate-200 border-b border-slate-300">
        <button 
          onClick={() => setIsVisible(false)} 
          className="p-1 hover:bg-slate-300 rounded text-slate-600"
          title="إغلاق لوحة المفاتيح"
        >
          <X size={20} />
        </button>
        
        <div 
            className="flex items-center gap-2 text-slate-500 cursor-pointer"
            onClick={() => setMinimized(!minimized)}
        >
            <GripHorizontal size={16} />
            <span className="text-xs font-semibold select-none">لوحة المفاتيح العربية</span>
        </div>

        <button 
          onClick={() => setMinimized(!minimized)} 
          className="p-1 hover:bg-slate-300 rounded text-slate-600"
        >
          <ChevronDown size={20} className={`transition-transform duration-300 ${minimized ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Keys Container */}
      <div className="p-2 pb-6 md:p-4 max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 select-none">
          {ARABIC_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 justify-center">
              {row.map((char) => (
                <button
                  key={char}
                  onMouseDown={(e) => handleKeyPress(e, char)}
                  className="flex-1 min-w-[30px] h-10 md:h-12 bg-white rounded shadow-sm border border-slate-300 hover:bg-slate-50 active:bg-slate-200 active:scale-95 transition-all text-lg md:text-xl font-medium text-slate-800 flex items-center justify-center font-['Cairo']"
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
          
          {/* Bottom Row (Space, Backspace) */}
          <div className="flex gap-1 justify-center mt-1">
            <button
                onMouseDown={handleSpace}
                className="flex-[4] h-10 md:h-12 bg-white rounded shadow-sm border border-slate-300 hover:bg-slate-50 active:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium"
            >
                مسافة
            </button>
            <button
                onMouseDown={handleBackspace}
                className="flex-[1] h-10 md:h-12 bg-red-50 rounded shadow-sm border border-red-100 hover:bg-red-100 active:bg-red-200 flex items-center justify-center text-red-600"
            >
                <Delete size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};