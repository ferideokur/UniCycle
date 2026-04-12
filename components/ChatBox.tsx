"use client";

import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function ChatBox() {
    const [isOpen, setIsOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<{ id: number; text: string; isMine: boolean }[]>([]);
    const [stompClient, setStompClient] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const chatScrollRef = useRef<HTMLDivElement>(null);

    // 🚀 Varsayılan isim "Sohbet Kutusu" oldu.
    const [receiverId, setReceiverId] = useState<number | null>(null);
    const [receiverName, setReceiverName] = useState("Sohbet Kutusu");
    const [isUserOnline, setIsUserOnline] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        let userObj = null;
        if (storedUser) {
            try {
                userObj = JSON.parse(storedUser);
                setCurrentUser(userObj);
            } catch (e) { console.error(e); }
        }

        if (!userObj) return;

        const socket = new SockJS('http://localhost:8080/ws-chat');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                client.publish({
                    destination: '/app/chat.connect',
                    body: userObj.id.toString()
                });

                client.subscribe(`/queue/messages/${userObj.id}`, (msg) => {
                    const receivedMessage = JSON.parse(msg.body);
                    setMessages((prev) => [...prev, { 
                        id: receivedMessage.id || Date.now(), 
                        text: receivedMessage.content, 
                        isMine: false 
                    }]);
                    setIsOpen(true); 
                });
            },
        });

        client.activate();
        setStompClient(client);

        return () => { void client.deactivate(); };
    }, []);

    useEffect(() => {
        const handleOpenChatSignal = (event: any) => {
            const { sellerId, sellerName, productTitle } = event.detail;
            
            setReceiverId(sellerId);
            setReceiverName(sellerName || "Satıcı");
            setIsOpen(true); 
            
            if (productTitle) {
                setChatInput(`Merhaba, '${productTitle}' ilanınla ilgileniyorum. Hala satılık mı?`);
            }
        };

        window.addEventListener("openChatWithContext", handleOpenChatSignal);
        return () => {
            window.removeEventListener("openChatWithContext", handleOpenChatSignal);
        };
    }, []);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !stompClient || !currentUser || !receiverId) return;

        const messageContent = chatInput;
        
        const newMsg = { id: Date.now(), text: messageContent, isMine: true };
        setMessages((prev) => [...prev, newMsg]);
        setChatInput("");

        const chatRequest = {
            senderId: currentUser.id,
            receiverId: receiverId,
            content: messageContent
        };

        stompClient.publish({
            destination: '/app/chat.sendMessage',
            body: JSON.stringify(chatRequest)
        });
    };

    if (!currentUser) return null; 

    return (
        <div className="fixed bottom-5 right-5 z-[9999]">
            {isOpen ? (
                <div className="w-80 sm:w-[350px] h-[450px] bg-white rounded-t-2xl rounded-bl-2xl shadow-[0_-5px_40px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col animate-in slide-in-from-bottom-10 mb-2">
                    <div 
                        className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center cursor-pointer shadow-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">
                                    {/* 💡 SİHİR BURADA: Kişi varsa baş harfi, yoksa mesaj ikonu göster */}
                                    {receiverId ? receiverName.charAt(0).toUpperCase() : "💬"}
                                </div>
                                {/* 💡 Kişi varsa yeşil nokta göster, yoksa gizle */}
                                {receiverId && (
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-blue-600 rounded-full ${isUserOnline ? 'bg-green-400' : 'bg-red-500'}`}></span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-none">{receiverName}</h3>
                                <span className="text-[10px] text-blue-100">
                                    {/* 💡 Kişi yoksa Bekleniyor yaz */}
                                    {receiverId ? (isUserOnline ? 'Çevrimiçi' : 'Çevrimdışı') : 'Mesaj bekleniyor...'}
                                </span>
                            </div>
                        </div>
                        <button className="text-white/80 hover:text-white transition-colors text-xl font-bold">✕</button>
                    </div>

                    <div ref={chatScrollRef} className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3">
                        <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-100 rounded-full w-max mx-auto px-3 py-1 mb-2">Bugün</div>
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                {/* 💡 İçi boşken kafa karıştırmayan profesyonel bilgilendirme */}
                                <span className="text-4xl mb-2">{receiverId ? "👋" : "📫"}</span>
                                <p className="text-xs font-bold text-slate-600">
                                    {receiverId 
                                        ? "Hemen bir mesaj göndererek\nsohbeti başlatın." 
                                        : "Sohbet başlatmak için bir ilan üzerinden 'Satıcıya Mesaj Gönder' butonuna tıklayın."}
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.isMine ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 self-start rounded-bl-sm"}`}>
                                    {msg.text}
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 rounded-b-2xl">
                        <input 
                            type="text" 
                            placeholder={receiverId ? "Bir mesaj yaz..." : "Sohbet edilecek kişi seçilmedi"} 
                            className="flex-1 bg-slate-100 text-slate-800 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            disabled={!receiverId}
                        />
                        <button type="submit" disabled={!chatInput.trim() || !receiverId} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm">
                            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </form>
                </div>
            ) : (
                <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-[0_5px_20px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all text-2xl">
                    💬
                </button>
            )}
        </div>
    );
}