
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { MessageRole, ChatMessage } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef(new GeminiService());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage({ data: base64, mimeType: file.type });
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = { 
      role: MessageRole.USER, 
      text: input + (selectedImage ? " [Anexo Enviado]" : "") 
    };
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const response = await geminiService.current.sendMessage(messages, currentInput, currentImage || undefined);
      const modelMsg: ChatMessage = { role: MessageRole.MODEL, text: response };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
      console.error("Erro:", error);
      setMessages(prev => [...prev, { role: MessageRole.MODEL, text: "🔴 ERRO TÉCNICO: Falha definitiva no acesso ao Cérebro de Engenharia." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (text: string) => {
    return (
      <div className="markdown-content whitespace-pre-wrap text-sm leading-relaxed">
        {text.split('\n').map((line, i) => {
          // Table parsing logic
          if (line.includes('|')) {
            const cells = line.split('|').filter(c => c.trim().length > 0 || line.indexOf(c) !== 0);
            if (i > 0 && text.split('\n')[i-1].includes('---')) return null;
            if (line.includes('---')) return <div key={i} className="h-px bg-gray-200 my-2"></div>;
            
            const isHeader = i === 1 || i === 0 || (text.split('\n')[i-1]?.includes('---'));

            return (
              <div key={i} className="flex border-x border-b border-gray-200 first:border-t first:rounded-t-lg last:rounded-b-lg overflow-hidden shadow-sm">
                {cells.map((cell, j) => (
                  <div key={j} className={`flex-1 p-3 ${isHeader ? 'bg-black text-white font-bold text-[10px] uppercase tracking-widest' : 'bg-white text-gray-800'}`}>
                    {cell.trim().startsWith('🔴') ? (
                      <span className="text-red-500 font-black">{cell.trim()}</span>
                    ) : cell.trim().startsWith('🟢') ? (
                      <span className="text-green-600 font-bold">{cell.trim()}</span>
                    ) : (
                      cell.trim()
                    )}
                  </div>
                ))}
              </div>
            );
          }

          const parts = line.split(/(\*\*.*?\*\*|🔴.*?|🟢.*?|Especialista SK-G diz:)/g);
          return (
            <div key={i} className="mb-2">
              {parts.map((part, j) => {
                if (part === "Especialista SK-G diz:") {
                  return <span key={j} className="text-[#b11d1d] font-black uppercase tracking-tighter mr-2">{part}</span>;
                }
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <span key={j} className="text-[#16a34a] font-bold">{part.slice(2, -2)}</span>;
                }
                if (part.startsWith('🔴')) {
                  return <span key={j} className="text-red-600 font-black">{part}</span>;
                }
                if (part.startsWith('🟢')) {
                  return <span key={j} className="text-[#16a34a] font-bold">{part}</span>;
                }
                return <span key={j}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#fcfcfc]">
      {/* Header */}
      <header className="bg-[#b11d1d] text-white py-3 px-4 md:px-6 flex justify-between items-center shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-sm shadow-inner w-[60px] h-[35px] flex items-center justify-center">
             <img src="https://i.imgur.com/hURknEb.png" alt="SK-G" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[18px] md:text-[22px] font-black italic tracking-tight uppercase">CONSULTOR TÉCNICO</span>
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">ESTRUTURA DE ENGENHARIA SK-G</span>
          </div>
        </div>
        <button 
          onClick={resetChat}
          className="p-2 hover:bg-black/10 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative flex flex-col scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-40 h-40 md:w-52 md:h-52 mb-8 animate-pulse">
                <img 
                    src="https://i.imgur.com/kZCGerB.png" 
                    alt="Mascote SK-G" 
                    className="w-full h-full object-contain grayscale-[0.2]"
                />
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-black mb-3">ENGENHARIA SK-G</h1>
            <p className="text-[#64748b] font-semibold text-lg md:text-xl max-w-xl mx-auto">
              SISTEMA OFICIAL DE TRANSCODIFICAÇÃO <span className="text-[#b11d1d]">CAMOZZI</span>
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-6 pb-40">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] md:max-w-[85%] rounded-lg p-5 shadow-sm border ${
                  msg.role === MessageRole.USER 
                    ? 'bg-[#000000] text-white border-black rounded-br-none' 
                    : 'bg-white border-gray-100 text-[#334155] rounded-bl-none'
                }`}>
                  {msg.role === MessageRole.MODEL && (
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-[#b11d1d] rounded-full"></span>
                      RESPOSTA TÉCNICA SK-G
                    </div>
                  )}
                  {renderMessageContent(msg.text)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-lg p-5 rounded-bl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#b11d1d] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#b11d1d] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-[#b11d1d] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* Input section */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="flex flex-col gap-2">
            {imagePreview && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-white border border-[#b11d1d] rounded-lg shadow-lg w-fit">
                <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                <button onClick={() => {setSelectedImage(null); setImagePreview(null);}} className="text-red-600 font-bold p-2 hover:bg-red-50 rounded">EXCLUIR</button>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white border-2 border-black rounded-lg p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-1 focus-within:translate-y-1 focus-within:shadow-none transition-all">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-[#b11d1d] transition-colors"
                title="Câmera"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Código SMC/Festo ou Modelo Camozzi..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold text-black placeholder:text-gray-400 placeholder:font-normal"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-black text-white px-6 py-2 rounded font-black hover:bg-[#b11d1d] transition-colors disabled:opacity-50 uppercase italic"
              >
                {isLoading ? "Consultando..." : "Enviar"}
              </button>
            </div>
          </div>
          <p className="text-[9px] text-center mt-3 text-gray-400 font-bold uppercase tracking-[0.2em]">PROTOCOL V13.0 - SK-G ENGINEERING CORE</p>
        </div>
      </div>
    </div>
  );
};

export default App;
