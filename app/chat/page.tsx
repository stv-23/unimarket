"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface User {
  id: number;
  name: string;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
}

interface Conversation {
  id: number;
  users: User[];
  messages: Message[];
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("id");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me").then(res => res.json()).then(data => setCurrentUser(data.user));
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (initialConversationId && !selectedConversation) {
          const found = data.find((c: Conversation) => c.id === parseInt(initialConversationId));
          if (found) setSelectedConversation(found);
        }
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll for new conversations
    return () => clearInterval(interval);
  }, [initialConversationId, selectedConversation]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      const res = await fetch(`/api/chat/${selectedConversation.id}`);
      if (res.ok) {
        setMessages(await res.json());
      }
    };

    const markAsRead = async () => {
      try {
        await fetch(`/api/chat/${selectedConversation.id}/read`, {
          method: "PATCH",
        });
      } catch (error) {
        console.error("Error marking messages as read", error);
      }
    };

    fetchMessages();
    markAsRead(); // Mark messages as read when opening conversation
    const interval = setInterval(fetchMessages, 3000); // Poll for new messages
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await fetch(`/api/chat/${selectedConversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        // Optimistic update or wait for poll
        const msg = await res.json();
        setMessages((prev: Message[]) => [...prev, { ...msg, sender: currentUser }]);
      }
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser) return { name: "Usuario" };
    return conversation.users.find((u) => u.id !== currentUser.id) || { name: "Desconocido" };
  };

  return (

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex gap-6 bg-background">
      {/* Sidebar List */}
      <div className="w-1/3 bg-card rounded-xl shadow-xl border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-card/50">
          <h2 className="text-lg font-bold text-primary">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-muted-foreground text-center">No tienes conversaciones.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversation?.id === conv.id ? "bg-muted border-l-4 border-l-primary" : ""
                }`}
              >
                <h3 className="font-bold text-foreground">{getOtherUser(conv).name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.messages[0]?.content || "Nueva conversación"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-card rounded-xl shadow-xl border border-border flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border bg-card/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">
                {getOtherUser(selectedConversation).name}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                        isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <span className={`text-xs block mt-1 ${isMe ? "text-blue-100" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-input border border-border rounded-full px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-background/50 text-muted-foreground">
            <p>Selecciona una conversación para comenzar a chatear.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Cargando chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
