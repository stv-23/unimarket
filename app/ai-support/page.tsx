"use client";

import { useChat, UseChatOptions, UIMessage } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';

export default function AISupportPage() {
  const { messages, sendMessage, status } = useChat({
    api: '/api/chat/support',
  } as UseChatOptions<UIMessage> & { api: string });
  
  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Optimistically clear input
    const currentInput = input;
    setInput('');
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sendMessage({ role: 'user', content: currentInput } as any);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInput(currentInput); // Restore input on error
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="flex flex-col h-[calc(100vh-64px)] bg-background max-w-4xl mx-auto w-full p-4">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-xl border border-border bg-card shadow-sm mb-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Hola! Soy el Asistente de Unimarket</h2>
            <p className="max-w-md">
              Estoy aquí para ayudarte con cualquier duda que tengas sobre la plataforma. 
              Pregúntame cómo vender, comprar o gestionar tu cuenta.
            </p>
          </div>
        )}
        
        {messages.map((m: UIMessage & { content?: string }) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-none' 
                : 'bg-muted text-foreground rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-2xl rounded-bl-none px-4 py-3">
              <span className="animate-pulse">Escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 bg-input border border-border rounded-full px-6 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm"
          value={input}
          onChange={handleInputChange}
          placeholder="Escribe tu pregunta aquí..."
        />
        <button
          className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium hover:bg-primary/90 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isLoading || !input.trim()}
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
