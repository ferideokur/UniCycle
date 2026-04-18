"use client";

import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Tiplerimiz
interface ChatMessage {
    id: number;
    text: string;
    isMine: boolean;
    createdAt?: string;
}

interface InboxItem {
    id: number;
    name: string;
    lastMsg: string;
    time: string;
    unread: number;
}

interface ActiveChat {
    id: number;
    name: string;
}

// 🛑 ACIĞIMASIZ KÜFÜR VE ARGO FİLTRESİ V2.0
const BANNED_WORDS = [
    "amk", "aq", "amq", "mk", "sik", "sikiş", "sikik", "sikerim", "sikerler", "sokam", "sokarım",
    "orospu", "piç", "pic", "gavat", "yavşak", "yavsak", "pezevenk", "pzevenk",
    "siktir", "sktir", "sktr", "sg", "yarrak", "yarak", "amına", "am", "amı", "amcık", "amcik",
    "göt", "got", "götveren", "gotveren", "kahpe", "kaltak", "kancık", "kancik",
    "sürtük", "surtuk", "fahişe", "fahise", "ibne", "ipne", "dürzü", "durzu",
    "dallama", "şerefsiz", "serefsiz", "haysiyetsiz", "oc", "oç", "amkoyim", "amkoyayım",
    "taşşak", "tassak", "tasak", "çük", "cuk", "it", "köpek", "kopek", "bok", "veled", "velet"
];

const containsBannedWord = (text: string) => {
    const normalize = (str: string) => {
        return str.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
    };
    const cleanText = normalize(text);
    return BANNED_WORDS.some(word => {
        const normalizedWord = normalize(word);
        const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
        return regex.test(cleanText);
    });
};

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'inbox' | 'chat'>('inbox');
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // VERİ HAFIZALARI
    const [inboxChats, setInboxChats] = useState<InboxItem[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
    const [chatInput, setChatInput] = useState("");
    
    // 🚀 WHATSAPP ALINTI (REPLY) HAFIZASI
    const [replyTo, setReplyTo] = useState<{name: string, text: string} | null>(null);

    // ÇEVRİMİÇİ VE SCROLL HAFIZASI
    const [isUserOnline, setIsUserOnline] = useState(false);
    const [isUserScrolling, setIsUserScrolling] = useState(false); 

    const [stompClient, setStompClient] = useState<any>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    const activeChatRef = useRef<ActiveChat | null>(null);
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const totalUnreadMessages = inboxChats.reduce((total, chat) => total + (chat.unread || 0), 0);

    const getHiddenChats = () => JSON.parse(localStorage.getItem(`hidden_chats_${currentUser?.id}`) || "[]");
    const getHiddenMsgs = () => JSON.parse(localStorage.getItem(`hidden_msgs_${currentUser?.id}`) || "[]");

    const saveInboxToLocal = (newInbox: InboxItem[], userId: number) => {
        const hiddenChats = JSON.parse(localStorage.getItem(`hidden_chats_${userId}`) || "[]");
        const filteredInbox = newInbox.filter(chat => !hiddenChats.includes(chat.id));
        setInboxChats(filteredInbox);
        localStorage.setItem(`unicycle_inbox_${userId}`, JSON.stringify(filteredInbox));
    };

    const updateInboxLocally = (contactId: number, contactName: string, lastMsg: string, isUnread: boolean = false) => {
        if (!currentUser) return;
        const hiddenChats = getHiddenChats();
        if (hiddenChats.includes(contactId)) {
            const newHidden = hiddenChats.filter((id: number) => id !== contactId);
            localStorage.setItem(`hidden_chats_${currentUser.id}`, JSON.stringify(newHidden));
        }

        setInboxChats(prev => {
            const filtered = prev.filter(c => c.id !== contactId);
            const existing = prev.find(c => c.id === contactId);
            
            const cleanLastMsg = lastMsg.replace(/\[REPLY:.*?\](.*?)\[\/REPLY\]/g, '↩️ $1 - ').trim();

            const updatedList = [{
                id: contactId,
                name: contactName,
                lastMsg: cleanLastMsg,
                time: new Date().toISOString(),
                unread: isUnread ? (existing ? existing.unread + 1 : 1) : 0
            }, ...filtered];

            localStorage.setItem(`unicycle_inbox_${currentUser.id}`, JSON.stringify(updatedList));
            return updatedList;
        });
    };

    const checkIsOnline = (lastActiveRaw: any) => {
        if (!lastActiveRaw) return false;
        let dateLocal: Date;
        let dateUTC: Date;

        if (Array.isArray(lastActiveRaw)) {
            dateLocal = new Date(lastActiveRaw[0], lastActiveRaw[1] - 1, lastActiveRaw[2], lastActiveRaw[3], lastActiveRaw[4], lastActiveRaw[5] || 0);
            dateUTC = new Date(Date.UTC(lastActiveRaw[0], lastActiveRaw[1] - 1, lastActiveRaw[2], lastActiveRaw[3], lastActiveRaw[4], lastActiveRaw[5] || 0));
        } else {
            const str = lastActiveRaw.toString();
            dateLocal = new Date(str.replace("Z", "")); 
            dateUTC = new Date(str.endsWith("Z") ? str : str + "Z"); 
        }

        const now = new Date();
        const diffLocal = (now.getTime() - dateLocal.getTime()) / (1000 * 60);
        const diffUTC = (now.getTime() - dateUTC.getTime()) / (1000 * 60);

        return (
            (diffLocal >= -5 && diffLocal <= 5) || 
            (diffUTC >= -5 && diffUTC <= 5) ||
            (diffLocal >= 175 && diffLocal <= 185) || 
            (diffLocal >= -185 && diffLocal <= -175)
        );
    };

    const fetchUserStatus = async (userId: number) => {
        try {
            const res = await fetch(`https://unicycle-api.onrender.com/api/users/${userId}`, { cache: "no-store" });
            if (res.ok) {
                const userData = await res.json();
                setIsUserOnline(checkIsOnline(userData.lastActive));
            }
        } catch (e) {}
    };

    const reconstructInboxFromNotifications = async (userId: number) => {
        try {
            const res = await fetch(`https://unicycle-api.onrender.com/api/interaction/notifications/${userId}`);
            if (!res.ok) return;
            const notifs = await res.json();
            
            const processed = JSON.parse(localStorage.getItem(`processed_inbox_${userId}`) || "[]");
            let hasNew = false;

            for (const n of notifs) {
                if (n.message.includes("mesaj gönderdi") && !processed.includes(n.id)) {
                    let senderId = null;
                    let senderName = n.message.replace("💬 ", "").split(" sana")[0].trim();
                    const idMatch = n.message.match(/\[ID:(\d+)\]/);
                    if (idMatch) {
                        senderId = parseInt(idMatch[1]);
                    } else {
                        const searchRes = await fetch(`https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(senderName)}`);
                        if (searchRes.ok) {
                            const users = await searchRes.json();
                            if (users && users.length > 0) {
                                senderId = users[0].id;
                                senderName = users[0].fullName;
                            }
                        }
                    }

                    if (senderId) {
                        let lastText = "Yeni bir mesaj 💬";
                        try {
                            const hist = await fetch(`https://unicycle-api.onrender.com/api/messages/history?user1Id=${userId}&user2Id=${senderId}`);
                            const histData = await hist.json();
                            if (histData.length > 0) lastText = histData[histData.length - 1].content;
                        } catch(e) {}
                        updateInboxLocally(senderId, senderName, lastText, true);
                    }
                    processed.push(n.id);
                    hasNew = true;
                }
            }

            if (hasNew) {
                localStorage.setItem(`processed_inbox_${userId}`, JSON.stringify(processed));
            }
        } catch (e) {}
    };

    const loadInbox = async (userId: number) => {
        try {
            const localData = localStorage.getItem(`unicycle_inbox_${userId}`);
            if (localData) {
                const hiddenChats = JSON.parse(localStorage.getItem(`hidden_chats_${userId}`) || "[]");
                const parsedLocal = JSON.parse(localData);
                setInboxChats(parsedLocal.filter((c: any) => !hiddenChats.includes(c.id)));
            }

            const res = await fetch(`https://unicycle-api.onrender.com/api/messages/inbox/${userId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data) && data.length > 0) {
                    saveInboxToLocal(data, userId);
                }
            }
            reconstructInboxFromNotifications(userId);
        } catch (e) {}
    };

    const loadChatHistory = async (otherUserId: number, myUserId: number) => {
        try {
            const res = await fetch(`https://unicycle-api.onrender.com/api/messages/history?user1Id=${myUserId}&user2Id=${otherUserId}`);
            if (res.ok) {
                const data = await res.json();
                const hiddenMsgs = JSON.parse(localStorage.getItem(`hidden_msgs_${myUserId}`) || "[]");
                const formattedMsgs = data
                    .filter((m: any) => !hiddenMsgs.includes(m.id)) 
                    .map((m: any) => ({
                        id: m.id,
                        text: m.content,
                        isMine: m.sender?.id === myUserId,
                        createdAt: m.createdAt
                    }));
                setMessages(formattedMsgs);
            }
        } catch (e) {}
    };

    const handleDeleteMessage = async (msgId: number) => {
        if (!window.confirm("Bu mesajı silmek istiyor musun?")) return;
        setMessages(prev => prev.filter(m => m.id !== msgId));
        const hiddenMsgs = getHiddenMsgs();
        hiddenMsgs.push(msgId);
        localStorage.setItem(`hidden_msgs_${currentUser.id}`, JSON.stringify(hiddenMsgs));
        try { 
            await fetch(`https://unicycle-api.onrender.com/api/messages/${msgId}`, { method: "DELETE" }); 
            if (currentUser) loadInbox(currentUser.id);
        } catch (err) {}
    };

    const handleDeleteConversation = async (contactId: number, e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (!window.confirm("Bu kişiyle olan tüm sohbeti silmek istiyor musun?")) return;
        setInboxChats(prev => prev.filter(c => c.id !== contactId));
        const hiddenChats = getHiddenChats();
        if (!hiddenChats.includes(contactId)) hiddenChats.push(contactId);
        localStorage.setItem(`hidden_chats_${currentUser.id}`, JSON.stringify(hiddenChats));
        const localInbox = JSON.parse(localStorage.getItem(`unicycle_inbox_${currentUser.id}`) || "[]");
        const updatedLocalInbox = localInbox.filter((c: any) => c.id !== contactId);
        localStorage.setItem(`unicycle_inbox_${currentUser.id}`, JSON.stringify(updatedLocalInbox));
        if (activeChat?.id === contactId) handleBackToInbox();
        try { await fetch(`https://unicycle-api.onrender.com/api/messages/conversation?user1Id=${currentUser.id}&user2Id=${contactId}`, { method: "DELETE" }); } catch(err) {}
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        let userObj = null;
        if (storedUser) {
            try { userObj = JSON.parse(storedUser); setCurrentUser(userObj); } catch (e) {}
        }
        if (!userObj) return;

        loadInbox(userObj.id);

        const socket = new SockJS('https://unicycle-api.onrender.com/ws-chat');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                client.publish({ destination: '/app/chat.connect', body: userObj.id.toString() });

                client.subscribe(`/queue/messages/${userObj.id}`, (msg: any) => {
                    const receivedMessage = JSON.parse(msg.body);
                    if (receivedMessage.sender) {
                        updateInboxLocally(
                            receivedMessage.sender.id, 
                            receivedMessage.sender.fullName || "Kullanıcı", 
                            receivedMessage.content,
                            true 
                        );
                    }
                    if (activeChatRef.current?.id === receivedMessage.sender?.id) {
                        setMessages((prev) => [...prev, { 
                            id: receivedMessage.id || Date.now(), 
                            text: receivedMessage.content, 
                            isMine: false 
                        }]);
                        setIsUserScrolling(false);
                    }
                    setIsOpen(true);
                });
            }
        });

        client.activate();
        setStompClient(client);

        return () => { void client.deactivate(); };
    }, []);

    useEffect(() => {
        const handleOpenChatSignal = (event: any) => {
            const { sellerId, sellerName, productTitle } = event.detail;
            if (!sellerId) return;

            const finalName = sellerName || "Satıcı";
            setActiveChat({ id: sellerId, name: finalName });
            setView('chat');
            setIsOpen(true);
            setIsUserScrolling(false); 
            
            updateInboxLocally(sellerId, finalName, "", false);

            if (currentUser) {
                loadChatHistory(sellerId, currentUser.id);
                fetchUserStatus(sellerId);
            }

            if (productTitle) {
                setChatInput(`Merhaba, '${productTitle}' ilanınla ilgileniyorum. Hala satılık mı?`);
            }
        };

        window.addEventListener("openChatWithContext", handleOpenChatSignal);
        return () => window.removeEventListener("openChatWithContext", handleOpenChatSignal);
    }, [currentUser]);

    useEffect(() => {
        if (chatScrollRef.current && !isUserScrolling) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, view, isOpen]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
        setIsUserScrolling(!isAtBottom);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentUser) {
            interval = setInterval(() => {
                if (isOpen && view === 'chat' && activeChat) {
                    loadChatHistory(activeChat.id, currentUser.id);
                    fetchUserStatus(activeChat.id); 
                } else if (isOpen && view === 'inbox') {
                    loadInbox(currentUser.id);
                } else if (!isOpen) {
                    loadInbox(currentUser.id);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [currentUser, isOpen, view, activeChat]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !currentUser || !activeChat) return;

        if (containsBannedWord(chatInput)) {
            alert("⚠️ Lütfen mesajınızda argo, küfür veya uygunsuz kelimeler kullanmayınız.");
            setChatInput("");
            return;
        }

        let finalContent = chatInput;
        if (replyTo) {
            finalContent = `[REPLY:${replyTo.name}]${replyTo.text}[/REPLY]${chatInput}`;
        }

        const tempId = Date.now();
        setMessages((prev) => [...prev, { id: tempId, text: finalContent, isMine: true }]);
        
        setChatInput("");
        setReplyTo(null); 
        setIsUserScrolling(false); 
        
        updateInboxLocally(activeChat.id, activeChat.name, finalContent, false);

        const chatRequest = {
            senderId: currentUser.id,
            receiverId: activeChat.id,
            content: finalContent
        };

        try {
            await fetch("https://unicycle-api.onrender.com/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(chatRequest)
            });

            await fetch("https://unicycle-api.onrender.com/api/interaction/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: activeChat.id,
                    message: `💬 ${currentUser.fullName} sana bir mesaj gönderdi. [ID:${currentUser.id}]`,
                }),
            });
            
            loadChatHistory(activeChat.id, currentUser.id);
        } catch (err) {}
    };

    const handleOpenChatFromInbox = (chat: InboxItem) => {
        setMessages([]); 
        setActiveChat({ id: chat.id, name: chat.name });
        setView('chat');
        setIsUserScrolling(false); 
        setReplyTo(null); 
        
        updateInboxLocally(chat.id, chat.name, chat.lastMsg, false);
        
        if (currentUser) {
            loadChatHistory(chat.id, currentUser.id);
            fetchUserStatus(chat.id); 
        }
    };

    const handleBackToInbox = () => {
        setActiveChat(null);
        setView('inbox');
        setMessages([]); 
        setChatInput("");
        setReplyTo(null);
    };

    // 🚀 TAŞMA SORUNU ÇÖZÜLDÜ: break-words ve whitespace-pre-wrap eklendi
    const renderMessageText = (text: string, isMine: boolean) => {
        const replyMatch = text.match(/\[REPLY:(.*?)\](.*?)\[\/REPLY\]([\s\S]*)/);
        
        if (replyMatch) {
            const repName = replyMatch[1];
            const repText = replyMatch[2];
            const actualMsg = replyMatch[3];
            
            return (
                <div className="flex flex-col min-w-0">
                    <div className={`rounded p-2 mb-1.5 border-l-4 text-[11px] leading-snug relative break-words whitespace-pre-wrap ${isMine ? 'bg-blue-700/30 border-blue-200' : 'bg-black/5 border-slate-400'}`}>
                        <span className={`font-bold block mb-0.5 truncate ${isMine ? 'text-blue-100' : 'text-slate-600'}`}>{repName}</span>
                        <span className="line-clamp-2 opacity-90">{repText}</span>
                    </div>
                    <span className="break-words whitespace-pre-wrap">{actualMsg}</span>
                </div>
            );
        }
        return <span className="break-words whitespace-pre-wrap">{text}</span>;
    };

    const handleReplyClick = (msg: ChatMessage) => {
        const cleanText = msg.text.replace(/\[REPLY:.*?\](.*?)\[\/REPLY\]/g, '').trim();
        setReplyTo({
            name: msg.isMine ? "Sen" : (activeChat?.name || "Kullanıcı"),
            text: cleanText
        });
        const inputEl = document.getElementById('chat-input-field');
        if (inputEl) inputEl.focus();
    };

    if (!currentUser) return null; 

    return (
        <div className="fixed bottom-5 right-5 z-[9999]">
            {isOpen ? (
                <div className="w-80 sm:w-[350px] h-[450px] bg-white rounded-t-2xl rounded-bl-2xl shadow-[0_-5px_40px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col animate-in slide-in-from-bottom-10 mb-2 overflow-hidden">
                    
                    <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
                        {view === 'chat' && activeChat ? (
                            <div className="flex items-center gap-2">
                                <button onClick={handleBackToInbox} className="text-white hover:text-blue-200 mr-1 font-black text-xl leading-none"> &larr; </button>
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30 relative shrink-0">
                                    {activeChat.name.charAt(0).toUpperCase()}
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${isUserOnline ? 'bg-green-400' : 'bg-red-500'}`}></span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm leading-none truncate">{activeChat.name}</h3>
                                    <span className="text-[10px] text-blue-100">{isUserOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                                </div>
                            </div>
                        ) : (
                            <h3 className="font-bold text-base flex items-center gap-2"> 💬 Mesajlarım </h3>
                        )}
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors text-xl font-bold leading-none shrink-0">✕</button>
                    </div>

                    <div className="flex-1 bg-slate-50 flex flex-col relative custom-scrollbar overflow-hidden">
                        
                        {view === 'chat' && activeChat ? (
                            <div ref={chatScrollRef} onScroll={handleScroll} className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
                                <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-100 rounded-full w-max mx-auto px-3 py-1 mb-2">Güvenli Sohbet</div>
                                
                                {messages.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                        <span className="text-4xl mb-2">👋</span>
                                        <p className="text-xs font-bold text-slate-600">İlk mesajı göndererek<br/>sohbeti başlatın.</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        // 🚀 MESAJ BALONCUKLARINI YAN YANA DİZEN KISIM GÜNCELLENDİ (flex-row-reverse vb.)
                                        <div key={msg.id} className={`group flex flex-col w-full ${msg.isMine ? 'items-end' : 'items-start'}`}>
                                            <div className={`flex items-end gap-2 max-w-[85%] ${msg.isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                
                                                {/* Mesaj Baloncuğu */}
                                                <div className={`min-w-0 break-words rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"}`}>
                                                    {renderMessageText(msg.text, msg.isMine)}
                                                </div>
                                                
                                                {/* Aksiyon Butonları (Sil / Yanıtla) */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 pb-1 shrink-0">
                                                    <button onClick={() => handleReplyClick(msg)} className="text-blue-400 hover:text-blue-600 text-xs" title="Yanıtla">↩️</button>
                                                    {msg.isMine && <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-400 hover:text-red-600 text-xs" title="Mesajı Sil">🗑️</button>}
                                                </div>

                                            </div>
                                            {msg.isMine && (
                                                <span className="text-[9px] text-blue-500 font-bold mt-0.5 mr-1">✓✓ Gönderildi</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-slate-100 bg-white custom-scrollbar">
                                {inboxChats.length === 0 ? (
                                    <div className="text-center flex flex-col items-center justify-center h-full opacity-60 px-4">
                                        <span className="text-4xl mb-3">📫</span>
                                        <p className="text-sm font-bold text-slate-600">Henüz mesajın yok.</p>
                                        <p className="text-xs text-slate-500 mt-1">İlanlar üzerinden satıcılara mesaj gönderdiğinde listeni burada görebilirsin.</p>
                                    </div>
                                ) : (
                                    inboxChats.map((chat) => (
                                        <div key={chat.id} onClick={() => handleOpenChatFromInbox(chat)} className="group p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors relative">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-200 text-lg shrink-0 relative">
                                                {chat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className={`font-bold truncate text-sm ${chat.unread > 0 ? "text-slate-900" : "text-slate-700"}`}> {chat.name} </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className={`text-xs truncate pr-2 ${chat.unread > 0 ? "font-bold text-slate-800" : "text-slate-500"}`}> {chat.lastMsg || "Yeni mesaj..."} </p>
                                                    {chat.unread > 0 && (
                                                        <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm"> {chat.unread} </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={(e) => handleDeleteConversation(chat.id, e)} className="absolute right-4 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-opacity bg-white hover:bg-red-50 rounded-full shadow-sm border border-slate-100" title="Sohbeti Sil">
                                                🗑️
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {view === 'chat' && activeChat && (
                        <div className="bg-white border-t border-slate-100 flex flex-col">
                            {replyTo && (
                                <div className="bg-slate-50 border-l-4 border-blue-500 mx-3 mt-3 p-2.5 rounded-r-md relative shadow-sm">
                                    <span className="font-bold text-blue-600 text-xs block mb-0.5">{replyTo.name}</span>
                                    <p className="text-slate-600 text-xs truncate pr-5">{replyTo.text}</p>
                                    <button onClick={() => setReplyTo(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" title="Alıntıyı İptal Et">✕</button>
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="p-3 flex items-center gap-2">
                                <input 
                                    id="chat-input-field"
                                    type="text" 
                                    placeholder="Bir mesaj yaz..." 
                                    className="flex-1 min-w-0 bg-slate-100 text-slate-800 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={chatInput} 
                                    onChange={(e) => setChatInput(e.target.value)} 
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm">
                                    <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={() => setIsOpen(true)} className="relative bg-blue-600 text-white w-14 h-14 rounded-full shadow-[0_5px_20px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all text-2xl group">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                    {totalUnreadMessages > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 w-5 h-5 text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                            {totalUnreadMessages}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
}