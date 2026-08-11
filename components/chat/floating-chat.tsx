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
import { useNotificationSound } from "@/lib/use-notification-sound";

// Initialize Pusher outside component to avoid multiple instances
let pusherInstance: Pusher | null = null;

export function FloatingChat({ user }: { user: any }) {
  const companyId = user?.companyId;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "chat">("users");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userUnreadCounts, setUserUnreadCounts] = useState<Record<string, number>>({});
  const [userLastMessage, setUserLastMessage] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const processedMessageIdsRef = useRef<Set<number>>(new Set());
  const { playMessage } = useNotificationSound();

  
  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Chat Data
  const [currentConvo, setCurrentConvo] = useState<any>(null);
  
  const currentConvoIdRef = useRef<number | null>(null);
  useEffect(() => {
    currentConvoIdRef.current = currentConvo?.id || null;
  }, [currentConvo]);
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

    const handleNewMessage = (message: any) => {
      // Prevent duplicate processing
      if (processedMessageIdsRef.current.has(message.id)) return;
      processedMessageIdsRef.current.add(message.id);

      // Play a pop sound for each incoming message
      playMessage(1);

      if (currentConvoIdRef.current === message.conversationId) {
        setMessages(prevMsgs => {
          if (prevMsgs.some(m => m.id === message.id)) return prevMsgs;
          return [...prevMsgs, message];
        });
      } else {
        // If not looking at it, increase unread count
        setUnreadCount(prev => prev + 1);
        setUserUnreadCounts(prev => ({
          ...prev,
          [message.senderId]: (prev[message.senderId] || 0) + 1
        }));
        setUserLastMessage(prev => ({
          ...prev,
          [message.senderId]: message.content
        }));
      }
    };

    userChannel.bind("new-message", handleNewMessage);

    return () => {
      if (pusherInstance) {
        userChannel.unbind("new-message", handleNewMessage);
        presenceChannel.unbind_all();
        pusherInstance.unsubscribe(`presence-company-${companyId}`);
        pusherInstance.unsubscribe(userChannelName);
      }
    };
  }, [companyId, user?.id]);

  // Load users + initial unread counts when opened
  useEffect(() => {
    if (isOpen && activeTab === "users") {
      if (users.length === 0) {
        loadUsers();
      }
      loadInitialUnreadCounts();
    }
  }, [isOpen, activeTab]);

  const loadInitialUnreadCounts = async () => {
    try {
      const res = await fetch('/api/chat/unread-counts', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const counts: Record<string, number> = {};
        const previews: Record<string, string> = {};
        json.data.forEach((item: { senderId: string; count: number; lastMessage: string }) => {
          counts[item.senderId] = item.count;
          previews[item.senderId] = item.lastMessage;
        });
        setUserUnreadCounts(counts);
        setUserLastMessage(previews);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        if (total > 0) setUnreadCount(total);
      }
    } catch {
      // silently ignore
    }
  };

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

    // Clear unread count for this user and recalculate total badge
    setUserUnreadCounts(prev => {
      const next = { ...prev };
      delete next[String(targetUser.id)];
      const newTotal = Object.values(next).reduce((a, b) => a + b, 0);
      setUnreadCount(newTotal);
      return next;
    });

    const res = await getOrCreateConversation(targetUser.id);
    if (res.success && res.data) {
      setCurrentConvo(res.data);
      const msgsRes = await getMessages(res.data.id);
      if (msgsRes.success) {
        setMessages(msgsRes.data || []);
      }
      // Update lastReadAt in DB so counts reset on next load
      try {
        await fetch(`/api/chat/mark-read?conversationId=${res.data.id}`, { method: 'POST' });
      } catch { /* silently ignore */ }
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

  const isSendingRef = useRef(false);

  const submitMessage = async () => {
    if (!newMessage.trim() || sending || isSendingRef.current || !currentConvo) return;
    
    isSendingRef.current = true;
    setSending(true);
    const tempContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear
    setShowEmojiPicker(false);

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now(),
      conversationId: currentConvo.id,
      senderId: Number(user?.id),
      content: tempContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await sendMessage(currentConvo.id, tempContent);
      if (!res.success) {
        alert(res.error);
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        setNewMessage(tempContent); // Restore input on error
      } else if (res.data) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? res.data : m));
      }
    } catch (e: any) {
      alert("Error de red al enviar mensaje");
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setNewMessage(tempContent);
    }
    
    setSending(false);
    isSendingRef.current = false;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
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
      {/* Chat Panel */}
      {isOpen && (
        <div className="bg-card text-foreground w-[380px] sm:w-[420px] h-[650px] max-h-[85vh] rounded-[24px] shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-5 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {activeTab === "chat" ? (
                <button onClick={backToUsers} className="text-muted-foreground hover:text-foreground transition p-2 hover:bg-muted rounded-full">
                  <ChevronLeft size={24} />
                </button>
              ) : (
                <div className="w-12 h-12 rounded-[16px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                  <Users size={24} />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-lg text-foreground tracking-tight">
                  {activeTab === "users" ? "Chat de Empresa" : chatUser?.name}
                </h3>
                {activeTab === "users" ? (
                  <p className="text-[13px] text-muted-foreground">Comunícate con tu equipo</p>
                ) : (
                  <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    {onlineUsers.has(String(chatUser?.id)) ? (
                      <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span> En línea</>
                    ) : (
                      <><span className="w-2 h-2 rounded-full bg-muted-foreground"></span> Desconectado</>
                    )}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <button onClick={() => setIsOpen(false)} className="p-2 hover:text-foreground transition rounded-full hover:bg-muted" title="Minimizar chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
            </div>
          </div>

          {/* Body: Users List */}
          {activeTab === "users" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search Bar */}
              <div className="px-5 pb-4">
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-muted-foreground">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar usuario..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-muted/50 border border-border text-foreground rounded-[12px] pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <div className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-4 custom-scrollbar">
                {loadingUsers ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center text-muted-foreground mt-10 text-sm">
                    No hay otros usuarios en tu empresa.
                  </div>
                ) : (
                  <>
                    {showAll ? (
                      /* ── Ver Todos: lista única ordenada (no leídos → online → offline) ── */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-[13px] font-semibold text-muted-foreground">Todos los usuarios</span>
                          <span className="bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">{users.length}</span>
                        </div>
                        {[...users]
                          .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .sort((a, b) => {
                            const aUnread = userUnreadCounts[String(a.id)] || 0;
                            const bUnread = userUnreadCounts[String(b.id)] || 0;
                            if (bUnread !== aUnread) return bUnread - aUnread;
                            const aOnline = onlineUsers.has(String(a.id)) ? 1 : 0;
                            const bOnline = onlineUsers.has(String(b.id)) ? 1 : 0;
                            return bOnline - aOnline;
                          })
                          .map(u => {
                            const unread = userUnreadCounts[String(u.id)] || 0;
                            const isOnline = onlineUsers.has(String(u.id));
                            return (
                              <button
                                key={u.id}
                                onClick={() => openConversation(u)}
                                className="w-full text-left flex items-center justify-between p-3 bg-card hover:bg-muted/50 border border-border/50 rounded-[16px] transition group relative shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center font-bold overflow-hidden">
                                      {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[15px] text-foreground">{u.name}</p>
                                    <p className={`text-[13px] truncate max-w-[200px] ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                      {unread > 0 && userLastMessage[String(u.id)] ? userLastMessage[String(u.id)] : (u.position || (isOnline ? 'En línea' : 'Offline'))}
                                    </p>
                                  </div>
                                </div>
                                {unread > 0 ? (
                                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm shrink-0">
                                    {unread}
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <MessageCircle size={18} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <>
                        {/* Conectados */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
                              <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-500">Conectados</span>
                            </div>
                            <span className="bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {users.filter(u => onlineUsers.has(String(u.id))).length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {users.filter(u => onlineUsers.has(String(u.id)) && u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
                              const unread = userUnreadCounts[String(u.id)] || 0;
                              return (
                                <button
                                  key={u.id}
                                  onClick={() => openConversation(u)}
                                  className="w-full text-left flex items-center justify-between p-3 bg-card hover:bg-muted/50 border border-primary/20 rounded-[16px] transition group relative shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold overflow-hidden">
                                        {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full"></div>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-[15px] text-foreground">{u.name}</p>
                                      <p className={`text-[13px] truncate max-w-[200px] ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {unread > 0 && userLastMessage[String(u.id)] ? userLastMessage[String(u.id)] : (u.position || 'Miembro del equipo')}
                                      </p>
                                    </div>
                                  </div>
                                  {unread > 0 ? (
                                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm shrink-0">
                                      {unread}
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                      <MessageCircle size={18} />
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Offline */}
                        <div>
                          <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                              <span className="text-[13px] font-semibold text-muted-foreground">Offline</span>
                            </div>
                            <span className="bg-muted text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                              {users.filter(u => !onlineUsers.has(String(u.id))).length}
                            </span>
                          </div>
                          {users.filter(u => !onlineUsers.has(String(u.id))).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 opacity-50">
                              <div className="w-16 h-16 rounded-full border border-muted-foreground flex items-center justify-center text-muted-foreground mb-3">
                                <Users size={24} />
                              </div>
                              <p className="text-foreground font-medium text-sm">No hay usuarios offline</p>
                              <p className="text-xs text-muted-foreground mt-1">Todos los miembros conectados</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {users.filter(u => !onlineUsers.has(String(u.id)) && u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(u => {
                                const unread = userUnreadCounts[String(u.id)] || 0;
                                return (
                                  <button
                                    key={u.id}
                                    onClick={() => openConversation(u)}
                                    className="w-full text-left flex items-center justify-between p-3 bg-transparent hover:bg-muted/50 border border-transparent hover:border-border rounded-[16px] transition group relative"
                                  >
                                    <div className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                                      <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold overflow-hidden">
                                          {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                      </div>
                                      <div>
                                        <p className="font-semibold text-[15px] text-foreground">{u.name}</p>
                                        <p className={`text-[13px] truncate max-w-[200px] ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                          {unread > 0 && userLastMessage[String(u.id)] ? userLastMessage[String(u.id)] : (u.position || 'Miembro del equipo')}
                                        </p>
                                      </div>
                                    </div>
                                    {unread > 0 ? (
                                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm shrink-0">
                                        {unread}
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <MessageCircle size={18} />
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-card flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{onlineUsers.size} miembro{onlineUsers.size !== 1 ? 's' : ''} conectado{onlineUsers.size !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-muted-foreground">{showAll ? `${users.length} usuarios en total` : 'Buen trabajo en equipo 👋'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAll(prev => !prev)}
                  className="text-xs font-medium text-primary border border-primary/30 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <Users size={14} /> {showAll ? 'Ver secciones' : 'Ver todos'}
                </button>
              </div>
            </div>
          )}

          {/* Body: Chat Interface */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-card relative">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {loadingChat ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <div className="w-16 h-16 rounded-full border border-muted-foreground flex items-center justify-center text-muted-foreground mb-3">
                      <MessageCircle size={24} />
                    </div>
                    <p className="text-foreground font-medium text-sm">Inicia la conversación</p>
                    <p className="text-xs text-muted-foreground mt-1">Escribe tu primer mensaje a {chatUser?.name.split(' ')[0]}</p>
                  </div>
                ) : (
                  messages.map((msg: any, i) => {
                    const isMe = msg.senderId === Number(user?.id);
                    const showDate = i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                    
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-5">
                            <span className="text-[11px] bg-muted/80 text-muted-foreground px-3 py-1 rounded-full font-semibold">
                              {format(new Date(msg.createdAt), "d 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] rounded-[16px] px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm ${isMe ? 'bg-primary text-primary-foreground border border-primary/20 rounded-br-sm' : 'bg-muted/30 text-foreground border border-border rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1.5 px-1 font-medium">
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
                <div className="absolute bottom-20 right-4 z-50 shadow-2xl rounded-2xl border border-border overflow-hidden bg-card">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="auto" locale="es" />
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 bg-card border-t border-border">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3 relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                  >
                    <Smile size={22} />
                  </button>
                  
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          submitMessage();
                        }
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-muted/50 border border-border focus:border-primary/50 text-foreground text-sm rounded-[16px] px-4 py-3 outline-none resize-none max-h-32 min-h-[44px] transition-colors custom-scrollbar"
                    rows={1}
                  />
                  
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-sm"
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
