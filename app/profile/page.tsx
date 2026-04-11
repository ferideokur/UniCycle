"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; 

const UNIVERSITIES = [
  "Acıbadem Üniversitesi", "Akdeniz Üniversitesi", "Anadolu Üniversitesi", "Ankara Üniversitesi", 
  "Atatürk Üniversitesi", "Bahçeşehir Üniversitesi", "Başkent Üniversitesi", "Bilkent Üniversitesi", 
  "Boğaziçi Üniversitesi", "Bursa Uludağ Üniversitesi", "Celal Bayar Üniversitesi", "Çanakkale Onsekiz Mart Üniversitesi", 
  "Çukurova Üniversitesi", "Dicle Üniversitesi", "Dokuz Eylül Üniversitesi", "Ege Üniversitesi", 
  "Erciyes Üniversitesi", "Eskişehir Osmangazi Üniversitesi", "Fırat Üniversitesi", "Galatasaray Üniversitesi", 
  "Gazi Üniversitesi", "Gaziantep Üniversitesi", "Gebze Teknik Üniversitesi", "Hacettepe Üniversitesi", 
  "Hasan Kalyoncu Üniversitesi", "Isparta Süleyman Demirel Üniversitesi", "İbn Haldun Üniversitesi", 
  "İstanbul Aydın Üniversitesi", "İstanbul Bilgi Üniversitesi", "İstanbul Kültür Üniversitesi", 
  "İstanbul Medipol Üniversitesi", "İstanbul Okan Üniversitesi", "İstanbul Sabahattin Zaim Üniversitesi", 
  "İstanbul Teknik Üniversitesi (İTÜ)", "İstanbul Ticaret Üniversitesi", "İstanbul Üniversitesi", 
  "İzmir Ekonomi Üniversitesi", "İzmir Katip Çelebi Üniversitesi", "İzmir Yüksek Teknoloji Enstitüsü (İYTE)", 
  "Kadir Has Üniversitesi", "Karadeniz Teknik Üniversitesi (KTÜ)", "Kırıkkale Üniversitesi", 
  "Kocaeli Üniversitesi", "Koç Üniversitesi", "Marmara Üniversitesi", "Mef Üniversitesi", 
  "Mimar Sinan Güzel Sanatlar Üniversitesi", "Muğla Sıtkı Koçman Üniversitesi", "Ondokuz Mayıs Üniversitesi", 
  "Orta Doğu Teknik Üniversitesi (ODTÜ)", "Özyeğin Üniversitesi", "Pamukkale Üniversitesi", "Piri Reis Üniversitesi", 
  "Sabancı Üniversitesi", "Sakarya Üniversitesi", "Selçuk Üniversitesi", "TOBB Ekonomi ve Teknoloji Üniversitesi", 
  "Trakya Üniversitesi", "Türk-Alman Üniversitesi", "Yeditepe Üniversitesi", "Yıldız Teknik Üniversitesi (YTÜ)", 
  "Diğer..."
];

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: number, fullName: string, email: string } | null>(null);

  const [newName, setNewName] = useState(""); 
  const [passwordConfirm, setPasswordConfirm] = useState(""); 
  const [bio, setBio] = useState("Hoş geldin! Burası senin kişisel vitrinin.");
  const [university, setUniversity] = useState("Piri Reis Üniversitesi");
  const [customUniversity, setCustomUniversity] = useState(""); 
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileRotate, setProfileRotate] = useState(0); 
  const [coverY, setCoverY] = useState(50); 

  const [isEditMode, setIsEditMode] = useState(false); 
  const [activeModal, setActiveModal] = useState<"none" | "cover" | "profile" | "info">("none");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<{type: "user" | "product", item: any}[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 🔔 BİLDİRİM VE AÇILIR MENÜ HAFIZASI
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // 💬 CHAT (MESAJLAŞMA) GERÇEK SİSTEM HAFIZALARI
  const [isMessagesListOpen, setIsMessagesListOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<{id: number, name: string} | null>(null);
  const [chatInput, setChatInput] = useState("");
  
  const [inboxChats, setInboxChats] = useState<any[]>([]); 
  const [messages, setMessages] = useState<{id: number, text: string, isMine: boolean}[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const totalUnreadMessages = inboxChats.reduce((total, chat) => total + chat.unread, 0);

  const fetchInbox = async (userId: number) => {
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/messages/inbox/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setInboxChats(data);
      }
    } catch (e) {
      console.error("Gelen kutusu çekilemedi", e);
    }
  };

  const fetchChatHistory = async (otherUserId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/messages/history?user1Id=${user.id}&user2Id=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        const formattedMsgs = data.map((m: any) => ({
          id: m.id,
          text: m.content,
          isMine: m.sender.id === user.id
        }));
        setMessages(formattedMsgs);
      }
    } catch (e) {
      console.error("Mesaj geçmişi çekilemedi", e);
    }
  };

  const loadProfileData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setNewName(parsedUser.fullName); 

      const userProfileKey = `profile_${parsedUser.email}`;
      const savedProfile = localStorage.getItem(userProfileKey);

      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        if (data.bio) setBio(data.bio);
        if (data.university) {
          if (UNIVERSITIES.includes(data.university)) {
            setUniversity(data.university);
            setCustomUniversity("");
          } else { 
            setUniversity("Diğer..."); 
            setCustomUniversity(data.university); 
          }
        }
        if (data.profileImage) setProfileImage(data.profileImage);
        if (data.coverImage) setCoverImage(data.coverImage);
        if (data.profileZoom) setProfileZoom(data.profileZoom);
        if (data.profileRotate) setProfileRotate(data.profileRotate);
        if (data.coverY) setCoverY(data.coverY);
      }

      fetchMyRealListings(parsedUser.id);
      fetchInbox(parsedUser.id); 
      
      fetch(`https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const deletedNotifs = JSON.parse(localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]");
            const seenNotifs = JSON.parse(localStorage.getItem(`seenNotifs_${parsedUser.id}`) || "[]");
            const activeNotifs = data.filter((n: any) => !deletedNotifs.includes(n.id)).reverse();
            const unreadNotifs = activeNotifs.filter((n: any) => !seenNotifs.includes(n.id));
            setNotificationsCount(unreadNotifs.length);
            setNotificationsList(activeNotifs);
          }
        }).catch(err => console.error(err));

      window.addEventListener('notificationsSeen', () => setNotificationsCount(0));
    }
  };

  const fetchMyRealListings = async (userId: number) => {
    setIsLoadingListings(true);
    try {
      const response = await fetch("https://unicycle-api.onrender.com/api/products");
      if (response.ok) {
        const allProducts = await response.json();
        const myOwnProducts = allProducts.filter((product: any) => product.user && product.user.id === userId);
        setMyListings(myOwnProducts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingListings(false);
    }
  };

  const handleDeleteListing = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    const isConfirmed = window.confirm("Bu ilanı tamamen silmek istediğine emin misin? Bu işlem geri alınamaz.");
    if (!isConfirmed) return;
    try {
      const response = await fetch(`https://unicycle-api.onrender.com/api/products/${productId}`, { method: "DELETE" });
      if (response.ok) {
        setMyListings(prevListings => prevListings.filter(listing => listing.id !== productId));
        alert("İlan başarıyla silindi! 🗑️");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProfileData();
    return () => window.removeEventListener('notificationsSeen', () => setNotificationsCount(0));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (user) {
      interval = setInterval(() => {
        fetchInbox(user.id);
        if (activeChatUser) {
          fetchChatHistory(activeChatUser.id);
        }
      }, 3000); 
    }
    return () => clearInterval(interval);
  }, [user, activeChatUser]);

  const handleCancel = () => {
    loadProfileData(); 
    setActiveModal("none");
    setPasswordConfirm("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/"; 
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) { setLiveResults([]); return; }
      try {
        const isUserSearch = searchTerm.startsWith("@");
        const query = isUserSearch ? searchTerm.substring(1).trim() : searchTerm.trim();
        if (!query) return;

        let combined: {type: "user" | "product", item: any}[] = [];
        if (isUserSearch) {
          const userRes = await fetch(`https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(query)}`);
          if (userRes.ok) {
            const users = await userRes.json();
            if(Array.isArray(users)) combined = users.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const prodRes = await fetch(`https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(query)}`);
          if (prodRes.ok) {
            const products = await prodRes.json();
            if(Array.isArray(products)) {
              products.sort((a: any, b: any) => b.id - a.id);
              combined = products.map((p: any) => ({ type: "product", item: p }));
            }
          }
        }
        setLiveResults(combined);
      } catch (error) { console.error(error); }
    };
    const timer = setTimeout(() => fetchLive(), 300); 
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeChatUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1200; 
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

        if (type === "profile") { setProfileImage(compressedDataUrl); setProfileZoom(1); setProfileRotate(0); }
        if (type === "cover") { setCoverImage(compressedDataUrl); setCoverY(50); }
      };
    };
    reader.readAsDataURL(file);
  };

  const saveAllData = async (isInfoUpdate = false) => {
    if (isInfoUpdate) {
      if (university === "Diğer..." && customUniversity.trim() === "") { alert("Lütfen üniversitenizin adını girin!"); return; }
      if (newName.trim() !== user?.fullName) {
        if (passwordConfirm.trim() === "") { alert("İsmini değiştirmek için mevcut şifreni girmelisin!"); return; }
      }
    }
    try {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 600)); 
      const finalUniversity = university === "Diğer..." ? customUniversity.trim() : university;

      if (isInfoUpdate && newName.trim() !== user?.fullName) {
        const updatedUser = { ...user, fullName: newName.trim() };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser as any); 
      }

      const userProfileKey = `profile_${user?.email}`;
      localStorage.setItem(userProfileKey, JSON.stringify({
        bio, university: finalUniversity, profileImage, coverImage, profileZoom, profileRotate, coverY
      }));

      setIsSaving(false);
      setActiveModal("none");
      setPasswordConfirm(""); 
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const openChatWith = (chatUser: {id: number, name: string}) => {
    setActiveChatUser(chatUser);
    setIsMessagesListOpen(false);
    fetchChatHistory(chatUser.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !activeChatUser) return;

    const content = chatInput;
    setChatInput(""); 

    setMessages(prev => [...prev, { id: Date.now(), text: content, isMine: true }]);

    try {
      const res = await fetch("https://unicycle-api.onrender.com/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: activeChatUser.id,
          content: content
        })
      });
      if(res.ok) {
        fetchChatHistory(activeChatUser.id); 
        fetchInbox(user.id); 
      }
    } catch(e) {
      console.error("Mesaj gönderilemedi", e);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user ? user.fullName : "Kullanıcı"}&background=0D8ABC&color=fff&size=256`;
  const displayUniversity = university === "Diğer..." ? customUniversity : university;

  return (
    // 🔥 YATAY KAYMA (TAŞMA) ENGELİ
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans w-full overflow-x-hidden flex flex-col">
      
      {showToast && (
        <div className="fixed top-28 right-8 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 flex items-center gap-2">
          <span>✅</span> Değişiklikler Kaydedildi!
        </div>
      )}

      {/* 🚀 ANASAYFA İLE %100 AYNI OLAN ÜST MENÜ NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* 1. SATIR: Logo ve Sağ Butonlar */}
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6 pt-1 sm:pt-0">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer">
                <Image src="/logo.jpeg" alt="UniCycle İkon" width={36} height={36} className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all rounded-md sm:w-[52px] sm:h-[52px]" priority />
                <span className="text-xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

            {/* Masaüstü Arama Çubuğu */}
            <div className="hidden md:flex flex-1 max-w-3xl relative group z-50">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input type="text" placeholder="Ürün, @üye veya ders notu ara..." className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent font-medium" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} />
                <span className="absolute left-5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                <button type="submit" className="hidden">Ara</button>
              </form>

              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {liveResults.slice(0, 5).map((result, idx) => (
                     <Link href={result.type === "user" ? `/user/${result.item.id}` : `/listing-detail/${result.item.id}`} key={idx} className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors">
                       <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                         {result.type === "user" ? result.item.fullName.charAt(0).toUpperCase() : '📦'}
                       </div>
                       <div>
                         <div className="font-bold text-slate-800 text-sm">{result.item.fullName || result.item.title}</div>
                       </div>
                     </Link>
                  ))}
                  <div className="px-5 py-2.5 border-t border-slate-100 text-center bg-slate-50 mt-1 cursor-pointer hover:bg-slate-100 transition-colors" onClick={handleSearchSubmit}>
                    <span className="text-xs font-bold text-blue-600">Tüm sonuçları gör &rarr;</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Butonlar (Zil, Profil, İlan Ver - Shrink-0 Korumasıyla) */}
            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              <Link href="/create-listing" className="hidden md:flex font-black text-blue-600 hover:text-blue-800 items-center gap-1 transition-colors">
                <span className="text-xl">+</span> İlan Ver
              </Link>
              
              {user ? (
                 <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                   
                   {/* Bildirim Zili */}
                   <div className="relative shrink-0">
                     <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors shrink-0" title="Bildirimler">
                       <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                       </svg>
                       {notificationsCount > 0 && (
                         <span className="absolute top-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                           {notificationsCount}
                         </span>
                       )}
                     </button>

                     {/* Kare Bildirim Paneli */}
                     {isNotificationOpen && (
                       <div className="absolute top-full right-[-10px] sm:right-0 mt-3 w-[280px] sm:w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                         <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                           <span className="font-bold text-slate-800">Bildirimler</span>
                           {notificationsCount > 0 && (
                             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{notificationsCount} Yeni</span>
                           )}
                         </div>

                         <div className="max-h-80 overflow-y-auto custom-scrollbar">
                           {notificationsList.length === 0 ? (
                             <div className="px-4 py-8 text-center text-slate-500 text-sm font-medium">Şu an hiç bildirimin yok.</div>
                           ) : (
                             notificationsList.slice(0, 5).map((notif) => {
                               let icon = "✨"; let bg = "bg-blue-100"; let text = "text-blue-600";
                               const msgLower = notif.message.toLowerCase();
                               if (msgLower.includes("takip")) { icon = "🌸"; bg = "bg-pink-100"; text = "text-pink-600"; }
                               else if (msgLower.includes("ilan") || msgLower.includes("ekledi")) { icon = "📦"; bg = "bg-orange-100"; text = "text-orange-600"; }
                               else if (msgLower.includes("beğen") || msgLower.includes("favori")) { icon = "❤️"; bg = "bg-red-100"; text = "text-red-600"; }
                               else if (msgLower.includes("yorum")) { icon = "💬"; bg = "bg-green-100"; text = "text-green-600"; }

                               return (
                                 <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center">
                                   <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${bg} flex items-center justify-center ${text} text-base sm:text-lg shrink-0`}>{icon}</div>
                                   <div className="flex-1">
                                     <p className="text-xs sm:text-sm text-slate-700">{notif.message}</p>
                                     <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{notif.createdAt ? new Date(notif.createdAt).toLocaleDateString('tr-TR') : "Yeni"}</p>
                                   </div>
                                 </div>
                               );
                             })
                           )}
                         </div>
                         <Link href="/notifications" onClick={() => setIsNotificationOpen(false)} className="block w-full text-center px-4 py-3 bg-slate-50 text-xs font-bold text-blue-600 hover:bg-slate-100 transition-colors">
                           Tüm Bildirimleri Gör &rarr;
                         </Link>
                       </div>
                     )}
                   </div>

                   {/* Profil Butonu (Mobilde Tam Daire) */}
                   <Link href="/profile" className="flex items-center justify-center gap-2 bg-blue-600 text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-all shrink-0">
                     <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs shrink-0">👤</div>
                     <span className="hidden sm:block ml-2 text-sm">Hesabım</span>
                   </Link>

                   <button onClick={handleLogout} className="hidden md:block text-slate-400 hover:text-red-500 font-bold transition-colors text-sm ml-2 shrink-0">Çıkış</button>
                 </div>
              ) : (
                 <Link href="/login" className="flex items-center justify-center bg-slate-800 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold hover:bg-black transition-colors text-xs sm:text-sm shrink-0">Giriş Yap</Link>
              )}
            </div>
          </div>

          {/* 2. SATIR: Sadece Mobil İçin Arama Çubuğu */}
          <div className="md:hidden pb-3 pt-2 w-full relative z-40">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input type="text" placeholder="Ürün, @üye veya ders notu ara..." className="w-full bg-slate-100 text-slate-800 rounded-full py-2.5 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent font-medium text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} />
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            </form>
            {isDropdownOpen && liveResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                {liveResults.slice(0, 4).map((result, idx) => (
                  <Link href={result.type === "user" ? `/user/${result.item.id}` : `/listing-detail/${result.item.id}`} key={`mob-${idx}`} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 border-b border-slate-50">
                    <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden flex shrink-0 items-center justify-center">
                      {result.type === "user" ? <span className="font-bold text-blue-600">{result.item.fullName.charAt(0).toUpperCase()}</span> : <span className="text-xs">📦</span>}
                    </div>
                    <div className="flex-1 truncate"><div className="font-bold text-slate-800 truncate text-xs">{result.item.fullName || result.item.title}</div></div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 💼 VİTRİN VE PROFİL BİLGİLERİ */}
      <div className="max-w-5xl mx-auto mt-0 sm:mt-6 bg-white sm:rounded-t-[2.5rem] sm:rounded-b-2xl shadow-sm border-0 sm:border border-gray-200 overflow-hidden w-full relative">
        
        {/* 🔥 Kapak Fotoğrafı */}
        <div className="h-32 sm:h-64 w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
           {coverImage && <img src={coverImage} alt="Kapak" className="w-full h-full object-cover" style={{ objectPosition: `center ${coverY}%` }} />}
           {isEditMode && (
             <button onClick={() => setActiveModal("cover")} className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm text-gray-800 font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 hover:bg-white animate-in fade-in text-[10px] sm:text-base">
               📷 Kapağı Düzenle
             </button>
           )}
        </div>

        <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
          {/* 🔥 Profil Fotoğrafı ve Butonlar */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div onClick={() => isEditMode && setActiveModal("profile")} className={`w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 relative flex items-center justify-center shrink-0 ${isEditMode ? "cursor-pointer group" : ""}`}>
              <img src={profileImage || defaultAvatar} alt="Profil" className="w-full h-full object-cover origin-center" style={{ transform: `scale(${profileZoom}) rotate(${profileRotate}deg)` }} />
              {isEditMode && <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity animate-in fade-in"><span className="text-white text-xl sm:text-3xl">📷</span></div>}
            </div>

            {/* Düzenle Butonları */}
            <div className="flex gap-1.5 sm:gap-3 mb-1 sm:mb-2 shrink-0">
              {isEditMode && (
                <button onClick={() => setActiveModal("info")} className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full transition shadow-sm flex items-center gap-1 sm:gap-2 text-[10px] sm:text-base whitespace-nowrap">
                  <span>📝</span> Bilgiler
                </button>
              )}
              <button onClick={() => setIsEditMode(!isEditMode)} className={`font-bold py-1.5 px-3 sm:py-2 sm:px-5 rounded-full transition shadow-sm flex items-center gap-1 sm:gap-2 border text-[10px] sm:text-base whitespace-nowrap ${isEditMode ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {isEditMode ? <span>✅ Bitti</span> : <span>✏️ Düzenle</span>}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 flex items-center gap-1 sm:gap-2">
              {user ? user.fullName : "Yükleniyor..."} 
              <span className="text-blue-500 text-sm sm:text-xl" title="Onaylı Öğrenci">✓</span>
            </h1>
            <p className="text-xs sm:text-lg font-bold text-gray-600 mt-1 flex items-center gap-1.5 sm:gap-2">👩‍🎓 {displayUniversity}</p>
            <p className="text-xs sm:text-[15px] text-gray-700 mt-2 sm:mt-4 max-w-2xl font-medium whitespace-pre-wrap leading-relaxed">{bio}</p>
          </div>

          <div className="flex gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <div className="cursor-pointer hover:underline">
              <span className="font-black text-gray-900 mr-1 text-sm sm:text-base">{myListings.length}</span>
              <span className="font-medium text-gray-500 text-xs sm:text-base">Ürün</span>
            </div>
          </div>
        </div>
      </div>

      {/* İLANLAR BÖLÜMÜ */}
      <div className="max-w-5xl mx-auto mt-4 sm:mt-6 px-4 sm:px-0 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-black text-gray-800">Vitrinim</h2>
            {myListings.length > 0 && <Link href="/create-listing" className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 text-xs sm:text-base">+ Yeni İlan</Link>}
          </div>

          {isLoadingListings ? (
            <div className="text-center py-10 sm:py-16">
              <span className="animate-spin text-3xl sm:text-4xl block mb-4">⏳</span>
              <p className="font-bold text-gray-500 text-xs sm:text-base">Veritabanına bağlanılıyor...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-10 sm:py-16 bg-gray-50 rounded-2xl sm:rounded-[2rem] border border-dashed border-gray-300 px-4">
              <span className="text-4xl sm:text-6xl block mb-3 sm:mb-4">🛍️</span>
              <h3 className="text-base sm:text-2xl font-bold text-gray-800">Vitrinin henüz boş!</h3>
              <p className="text-xs sm:text-base text-gray-500 font-medium mt-2 mb-6 sm:mb-8">Kullanmadığın eşyaları satarak hemen para kazanmaya başla.</p>
              <Link href="/create-listing" className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-full transition shadow-md inline-block text-xs sm:text-base">İlk İlanını Ver</Link>
            </div>
          ) : (
            // 🔥 MOBİLDE YAN YANA 2'Lİ İLAN (KUSURSUZ GÖRÜNÜM)
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {myListings.map((listing) => (
                <div key={listing.id} className="group cursor-pointer">
                  <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-2 sm:mb-3 border border-gray-200 relative shadow-sm group-hover:shadow-md transition-shadow">
                    {listing.photosBase64 && listing.photosBase64.length > 0 ? (
                      <img src={listing.photosBase64[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : <div className="w-full h-full flex items-center justify-center bg-gray-200 text-2xl sm:text-3xl">📦</div>}
                    
                    {listing.priceType === "takas" && <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Takaslık</div>}
                    {listing.priceType === "ucretsiz" && <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Ücretsiz</div>}

                    <button onClick={(e) => handleDeleteListing(listing.id, e)} className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full shadow-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110" title="İlanı Sil">🗑️</button>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1 mb-0.5 sm:mb-1" title={listing.title}>{listing.title}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 line-clamp-1">{listing.category}</p>
                    <div className="text-sm sm:text-lg font-black text-gray-900">{listing.priceType === "fiyat" ? `₺${listing.price}` : (listing.priceType === "takas" ? "Takas" : "Bedava")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 💬 GERÇEK VERİTABANI İLE MESAJLAŞMA (INBOX) SİSTEMİ */}
      {/* ---------------------------------------------------------------------- */}
      
      {!isMessagesListOpen && !activeChatUser && (
        <button 
          onClick={() => setIsMessagesListOpen(true)}
          className="fixed bottom-6 right-4 sm:right-6 z-[9990] bg-[#20B2AA] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-teal-700 transition-all group"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 group-hover:animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          
          {totalUnreadMessages > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 w-4 h-4 sm:w-5 sm:h-5 text-[9px] sm:text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
              {totalUnreadMessages}
            </span>
          )}
        </button>
      )}

      {/* 2. GERÇEK GELEN KUTUSU LİSTESİ */}
      {isMessagesListOpen && (
        <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-80 md:w-[350px] h-[75vh] sm:h-[450px] bg-white rounded-t-2xl shadow-[0_-5px_40px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center shadow-md">
            <h3 className="font-extrabold text-base flex items-center gap-2">💬 Mesajlar</h3>
            <button onClick={() => setIsMessagesListOpen(false)} className="text-white/60 hover:text-white font-bold text-xl sm:text-lg">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-slate-100 bg-white custom-scrollbar">
            {inboxChats.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-20 font-medium px-4">
                Henüz mesajın yok. İlk adımı sen at!
              </div>
            ) : (
              inboxChats.map((chat) => (
                <div key={chat.id} onClick={() => openChatWith(chat)} className="p-4 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 border border-blue-200 text-sm sm:text-base shrink-0">
                    {chat.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`font-bold truncate text-sm ${chat.unread > 0 ? "text-slate-900" : "text-slate-700"}`}>{chat.name}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                        {new Date(chat.time).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate ${chat.unread > 0 ? "font-bold text-slate-800" : "text-slate-500"}`}>{chat.lastMsg}</p>
                      {chat.unread > 0 && <span className="bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ml-2 shrink-0">{chat.unread}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. GERÇEK AKTİF SOHBET PENCERESİ */}
      {activeChatUser && (
        <div className="fixed bottom-0 right-0 sm:right-4 md:right-8 w-full sm:w-80 md:w-[350px] h-[75vh] sm:h-[450px] bg-white rounded-t-2xl shadow-[0_-5px_40px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10">
          <div className="bg-[#20B2AA] text-white px-3 sm:px-4 py-3 rounded-t-2xl flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => { setActiveChatUser(null); setIsMessagesListOpen(true); }} className="text-white/80 hover:text-white mr-0.5 sm:mr-1 font-black text-xl sm:text-lg">&larr;</button>
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border border-white/30">
                  {activeChatUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#20B2AA] rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-none">{activeChatUser.name}</h3>
                <span className="text-[9px] sm:text-[10px] text-teal-100">Çevrimiçi</span>
              </div>
            </div>
            <button onClick={() => setActiveChatUser(null)} className="text-white/80 hover:text-white transition-colors font-bold text-xl sm:text-lg">✕</button>
          </div>

          <div ref={chatScrollRef} className="flex-1 bg-slate-50 p-3 sm:p-4 overflow-y-auto flex flex-col gap-2 sm:gap-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-[9px] sm:text-[10px] text-slate-400 font-bold bg-slate-100 rounded-full w-max mx-auto px-3 py-1 mb-2">Henüz mesaj yok. İlk adımı sen at!</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-[13px] shadow-sm ${msg.isMine ? "bg-[#20B2AA] text-white self-end rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 self-start rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-2 sm:p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input 
              type="text" placeholder="Mesaj yaz..." 
              className="flex-1 bg-slate-100 text-slate-800 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
              value={chatInput} onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" disabled={!chatInput.trim()} className="w-9 h-9 sm:w-10 sm:h-10 bg-[#20B2AA] hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>
      )}

      {/* 📸 MODALLAR AYNEN KORUNDU SADECE RESPONSIVE YAPILDI */}
      {/* MODAL 1: KAPAK */}
      {activeModal === "cover" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg sm:text-xl font-black text-gray-800">Kapak Düzenle</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-2xl sm:text-3xl">✕</button>
            </div>
            <div className="p-4 sm:p-8 bg-gray-50/30">
              <div onClick={() => coverInputRef.current?.click()} className="h-32 sm:h-48 w-full rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition relative overflow-hidden bg-gray-200 shadow-inner">
                {coverImage && <img src={coverImage} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `center ${coverY}%` }} />}
                <div className="absolute bg-black/60 text-white font-bold py-1.5 sm:py-2 px-4 sm:px-6 rounded-full flex items-center gap-2 hover:scale-105 transition text-xs sm:text-base">📷 Fotoğraf Seç</div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={(e) => handleImageUpload(e, "cover")} />
              
              {coverImage && (
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-xs sm:text-sm font-bold text-gray-600 whitespace-nowrap">↕️ Yukarı/Aşağı:</span>
                  <input type="range" min="0" max="100" value={coverY} onChange={(e) => setCoverY(parseInt(e.target.value))} className="w-full accent-gray-700" />
                  <button onClick={() => setCoverImage(null)} className="text-red-500 font-bold text-xs sm:text-sm whitespace-nowrap hover:bg-red-50 px-3 py-1.5 rounded-lg transition w-full sm:w-auto">🗑️ Kaldır</button>
                </div>
              )}
            </div>
            <div className="p-4 sm:p-6 bg-white border-t flex justify-end gap-2 sm:gap-3">
              <button onClick={handleCancel} className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-gray-500 hover:bg-gray-100 text-sm sm:text-base">İptal</button>
              <button onClick={() => saveAllData(false)} disabled={isSaving} className="px-6 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-white bg-[#20B2AA] hover:bg-teal-700 min-w-[100px] sm:min-w-[140px] shadow-md transition-all text-sm sm:text-base">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROFİL */}
      {activeModal === "profile" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg sm:text-xl font-black text-gray-800">Profil Fotoğrafı</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-2xl sm:text-3xl">✕</button>
            </div>
            <div className="p-4 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-center bg-gray-50/30">
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-white shrink-0 shadow-lg flex items-center justify-center">
                <img src={profileImage || defaultAvatar} className="w-full h-full object-cover origin-center" style={{ transform: `scale(${profileZoom}) rotate(${profileRotate}deg)` }} />
              </div>
              <div className="flex-1 w-full space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-600">🔍 Yakınlaştır</span>
                    <span className="text-[10px] sm:text-xs font-black text-teal-700 bg-teal-50 px-2 py-1 rounded-md">{profileZoom}x</span>
                  </div>
                  <input type="range" min="1" max="3" step="0.1" value={profileZoom} onChange={(e) => setProfileZoom(parseFloat(e.target.value))} className="w-full accent-gray-700" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-bold text-gray-600">🔄 Düzelt (Döndür)</span>
                    <span className="text-[10px] sm:text-xs font-black text-teal-700 bg-teal-50 px-2 py-1 rounded-md">{profileRotate}°</span>
                  </div>
                  <input type="range" min="-45" max="45" step="1" value={profileRotate} onChange={(e) => setProfileRotate(parseFloat(e.target.value))} className="w-full accent-gray-700" />
                </div>
                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button onClick={() => profileInputRef.current?.click()} className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg sm:rounded-xl transition shadow-sm text-xs sm:text-base">📷 Yeni Seç</button>
                  {profileImage && <button onClick={() => { setProfileImage(null); setProfileZoom(1); setProfileRotate(0); }} className="text-red-500 font-bold py-2 sm:py-2.5 px-3 sm:px-4 hover:bg-red-50 rounded-lg sm:rounded-xl transition text-xs sm:text-base">🗑️ Kaldır</button>}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={profileInputRef} onChange={(e) => handleImageUpload(e, "profile")} />
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-white border-t flex justify-end gap-2 sm:gap-3">
              <button onClick={handleCancel} className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-gray-500 hover:bg-gray-100 text-sm sm:text-base">İptal</button>
              <button onClick={() => saveAllData(false)} disabled={isSaving} className="px-6 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-white bg-[#20B2AA] hover:bg-teal-700 min-w-[100px] sm:min-w-[140px] shadow-md transition-all text-sm sm:text-base">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BİLGİLER */}
      {activeModal === "info" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg sm:text-xl font-black text-gray-800">Bilgilerini Düzenle</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-2xl sm:text-3xl">✕</button>
            </div>
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto bg-white custom-scrollbar">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Ad Soyad</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-gray-200 font-bold text-sm sm:text-base" />
                </div>
                {newName.trim() !== user?.fullName && (
                  <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg sm:rounded-xl animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs sm:text-sm font-bold text-red-700 mb-1">🔒 Güvenlik Doğrulaması</label>
                    <p className="text-[10px] sm:text-xs text-red-600 mb-2 sm:mb-3 font-medium">İsmini değiştirmek için mevcut şifreni girmelisin.</p>
                    <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Şifrenizi girin..." className="w-full bg-white text-gray-900 rounded-lg sm:rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-200 text-sm" />
                  </div>
                )}
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Üniversiten</label>
                  <select value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-gray-200 font-semibold text-xs sm:text-sm appearance-none">
                    {UNIVERSITIES.map((uni, index) => <option key={index} value={uni}>{uni}</option>)}
                  </select>
                </div>
                {university === "Diğer..." && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs sm:text-sm font-bold text-red-600 mb-1 sm:mb-2">Lütfen Üniversitenizin Adını Yazın *</label>
                    <input type="text" value={customUniversity} onChange={(e) => setCustomUniversity(e.target.value)} placeholder="Örn: X Teknik Üniversitesi" className="w-full bg-red-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-200 font-semibold text-sm" required />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 sm:mb-2">Hakkımda</label>
                <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bölümünü, neler sattığını veya ilgi alanlarını yaz..." className="w-full bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] border border-gray-200 resize-none font-medium text-sm sm:text-base" />
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-gray-50/50 border-t flex justify-end gap-2 sm:gap-3">
              <button onClick={handleCancel} className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition text-sm sm:text-base">İptal</button>
              <button onClick={() => saveAllData(true)} disabled={isSaving} className="px-6 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-white bg-[#20B2AA] hover:bg-teal-700 min-w-[100px] sm:min-w-[140px] shadow-md transition-all hover:scale-105 text-sm sm:text-base">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )} 
    </div>
  );
}