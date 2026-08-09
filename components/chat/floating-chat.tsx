"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Users, Send, Smile, ChevronLeft, Loader2, Minimize2, Circle } from "lucide-react";
import Pusher from "pusher-js";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { getCompanyUsers, getOrCreateConversation, getMessages, sendMessage } from "@/app/actions/chat-actions";
import { cn } from "@/lib/utils";

// Initialize Pusher outside component to avoid multiple instances
let pusherInstance: Pusher | null = null;

export function FloatingChat({ user }: { user: any }) {
  const companyId = user?.companyId;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "chat">("users");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userUnreadCounts, setUserUnreadCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Chat Data
  const [currentConvo, setCurrentConvo] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Input
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Pusher and presence channel
  useEffect(() => {
    if (!companyId || !user?.id) return;

    if (!pusherInstance) {
      // Enable pusher logging for debugging in dev
      // Pusher.logToConsole = true;
      pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: "/api/pusher/auth",
      });
    }

    const presenceChannel = pusherInstance.subscribe(`presence-company-${companyId}`);
    
    presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
      const onlineSet = new Set<string>();
      members.each((member: any) => onlineSet.add(member.id));
      setOnlineUsers(onlineSet);
    });

    presenceChannel.bind("pusher:member_added", (member: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(member.id);
        return next;
      });
    });

    presenceChannel.bind("pusher:member_removed", (member: any) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(member.id);
        return next;
      });
    });

    // Global private channel for this user
    const userChannelName = `private-user-${user.id}`;
    const userChannel = pusherInstance.subscribe(userChannelName);

    userChannel.bind("new-message", (message: any) => {
      // Always play a sound if it's not from me (shouldn't happen on this channel anyway)
      try {
        // Use a short standard notification sound (base64 encoded short pop)
        const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        audio.play().catch(() => {}); // ignore autoplay errors
      } catch (e) {}

      // If we are currently looking at this conversation, just append it
      setCurrentConvo((prevConvo: any) => {
        if (prevConvo?.id === message.conversationId) {
          setMessages(prevMsgs => {
            if (prevMsgs.some(m => m.id === message.id)) return prevMsgs;
            return [...prevMsgs, message];
          });
          return prevConvo;
        } else {
          // If not looking at it, increase unread count
          setUnreadCount(prev => prev + 1);
          setUserUnreadCounts(prev => ({
            ...prev,
            [message.senderId]: (prev[message.senderId] || 0) + 1
          }));
          return prevConvo;
        }
      });
    });

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe(`presence-company-${companyId}`);
        pusherInstance.unsubscribe(userChannelName);
      }
    };
  }, [companyId, user?.id]);

  // Load users when opened
  useEffect(() => {
    if (isOpen && activeTab === "users" && users.length === 0) {
      loadUsers();
    }
  }, [isOpen, activeTab]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const loadUsers = async () => {
    setLoadingUsers(true);
    const res = await getCompanyUsers();
    if (res.success) {
      setUsers(res.data || []);
    }
    setLoadingUsers(false);
  };

  const openConversation = async (targetUser: any) => {
    setChatUser(targetUser);
    setActiveTab("chat");
    setLoadingChat(true);

    setUserUnreadCounts(prev => {
      const next = { ...prev };
      delete next[targetUser.id];
      return next;
    });

    const res = await getOrCreateConversation(targetUser.id);
    if (res.success && res.data) {
      setCurrentConvo(res.data);
      const msgsRes = await getMessages(res.data.id);
      if (msgsRes.success) {
        setMessages(msgsRes.data || []);
      }
    }
    setLoadingChat(false);
  };

  const backToUsers = () => {
    setActiveTab("users");
    setCurrentConvo(null);
    setChatUser(null);
    setMessages([]);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConvo || sending) return;

    const tempContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear
    setShowEmojiPicker(false);
    setSending(true);

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(), // temporary
      senderId: Number(user?.id),
      content: tempContent,
      createdAt: new Date(),
      sender: { name: user?.name }
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const res = await sendMessage(currentConvo.id, tempContent);
    if (!res.success) {
      alert(res.error);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } else if (res.data) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data : m));
    }
    
    setSending(false);
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.native);
  };

  if (!companyId) return null; // Don't render for users without company

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0); // clear count on open
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center relative"
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-card">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-card w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in-50 duration-200">
          
          {/* Header */}
          <div className="bg-primary/5 border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {activeTab === "chat" ? (
                <button onClick={backToUsers} className="text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-full">
                  <ChevronLeft size={20} />
                </button>
              ) : (
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <Users size={20} />
                </div>
              )}
              
              <div>
                <h3 className="font-bold text-sm">
                  {activeTab === "users" ? "Chat de Empresa" : chatUser?.name}
                </h3>
                {activeTab === "chat" && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {onlineUsers.has(String(chatUser?.id)) ? (
                      <><Circle size={8} className="fill-emerald-500 text-emerald-500" /> En línea</>
                    ) : (
                      <><Circle size={8} className="fill-muted text-muted" /> Desconectado</>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition p-1 hover:bg-muted rounded-full">
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Body: Users List */}
          {activeTab === "users" && (
            <div className="flex-1 overflow-y-auto p-2 flex flex-col">
              <div className="px-2 pb-2">
                <input 
                  type="text" 
                  placeholder="Buscar usuario..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {loadingUsers ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center text-muted-foreground mt-10 text-sm">
                  No hay otros usuarios en tu empresa.
                </div>
              ) : (
                <div className="space-y-1">
                  {users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
                    const isOnline = onlineUsers.has(String(u.id));
                    const unread = userUnreadCounts[String(u.id)] || 0;
                    return (
                      <button
                        key={u.id}
                        onClick={() => openConversation(u)}
                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition group relative"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
                            {u.image ? <img src={u.image} alt={u.name} /> : u.name.substring(0, 2).toUpperCase()}
                          </div>
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-sm truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.position || "Miembro"}</p>
                        </div>
                        {unread > 0 && (
                          <div className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {unread}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Body: Chat Interface */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/10 relative">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingChat ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-10 text-xs">
                    Inicia la conversación con {chatUser?.name.split(' ')[0]}
                  </div>
                ) : (
                  messages.map((msg: any, i) => {
                    const isMe = msg.senderId === Number(user?.id);
                    const showDate = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] bg-muted/50 text-muted-foreground px-2 py-1 rounded-full font-medium">
                              {format(new Date(msg.createdAt), "d 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border shadow-sm rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </span>
                        </div>
                      </React.Fragment>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 right-0 z-50 shadow-2xl rounded-xl border border-border overflow-hidden">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" locale="es" />
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-card border-t border-border">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition"
                  >
                    <Smile size={20} />
                  </button>
                  
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim() && !sending) {
                          handleSendMessage(e as any);
                        }
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-muted/50 border-none focus:ring-0 text-sm rounded-xl px-4 py-2.5 outline-none resize-none max-h-32 min-h-[40px]"
                    rows={1}
                  />
                  
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition disabled:opacity-50 disabled:scale-100 active:scale-95"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
