"use client";

import React, { useEffect, useState, useRef } from "react"; // 🚀 useRef EKLENDİ, HATA BİTTİ!
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<{type: "user" | "product", item: any}[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0); 

  // 💬 CHAT PANELİ HAFIZASI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{id: number, text: string, isMine: boolean}[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null); // İŞTE SAYFAYI PATLATAN ARKADAŞ BURADA

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        const followMemory = localStorage.getItem(`follows_${parsedUser.id}_${id}`);
        if (followMemory === "true") setIsFollowing(true);

        fetch(`http://localhost:8080/api/interaction/notifications/${parsedUser.id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const deletedNotifs = JSON.parse(localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]");
              const activeNotifs = data.filter((n: any) => !deletedNotifs.includes(n.id));
              setNotificationsCount(activeNotifs.length);
            }
          })
          .catch(err => console.error("Bildirimler çekilemedi:", err));
      } catch (e) { console.error(e); }
    }

    const fetchData = async () => {
      try {
        const userRes = await fetch(`http://localhost:8080/api/users/${id}`);
        if (!userRes.ok) throw new Error("Kullanıcı bulunamadı");
        const userData = await userRes.json();
        setUser(userData);

        const savedProfile = localStorage.getItem(`profile_${userData.email}`);
        if (savedProfile) setProfileData(JSON.parse(savedProfile));

        const prodRes = await fetch("http://localhost:8080/api/products");
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          if (Array.isArray(allProducts)) {
            const userProducts = allProducts.filter((p: any) => p.user && Number(p.user.id) === Number(id));
            setListings(userProducts.sort((a: any, b: any) => b.id - a.id));
          }
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) { setLiveResults([]); return; }
      try {
        const isUserSearch = searchTerm.startsWith("@");
        const query = isUserSearch ? searchTerm.substring(1).trim() : searchTerm.trim();
        if (!query) return;

        let combined: any[] = [];
        if (isUserSearch) {
          const res = await fetch(`http://localhost:8080/api/users/search?q=${encodeURIComponent(query)}`);
          if (res.ok) { const data = await res.json(); if (Array.isArray(data)) combined = data.map((u: any) => ({ type: "user", item: u })); }
        } else {
          const res = await fetch(`http://localhost:8080/api/products/search?q=${encodeURIComponent(query)}`);
          if (res.ok) { const data = await res.json(); if (Array.isArray(data)) combined = data.map((p: any) => ({ type: "product", item: p })); }
        }
        setLiveResults(combined);
      } catch (err) { console.error(err); }
    };
    const timer = setTimeout(() => fetchLive(), 300); return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (searchTerm.trim() !== "") { setIsDropdownOpen(false); router.push(`/search?q=${encodeURIComponent(searchTerm)}`); }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(""), 4000); };

  const handleFollowToggle = async () => {
    if (!currentUser) return showToast("🔒 Takip etmek için giriş yapmalısın!");
    try {
      const res = await fetch("http://localhost:8080/api/interaction/follow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: currentUser.id, followingId: Number(id) })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing); 
        localStorage.setItem(`follows_${currentUser.id}_${id}`, data.isFollowing ? "true" : "false");
        showToast(data.isFollowing ? `✨ ${(user?.fullName || 'Kullanıcı')} takip edildi!` : "💔 Takipten çıkıldı.");
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = { id: Date.now(), text: chatInput, isMine: true };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    setTimeout(() => {
      setMessages((prev) => [...prev, { 
        id: Date.now() + 1, 
        text: "Mesajınız iletildi. Şu an cevap veremiyorum.", 
        isMine: false 
      }]);
    }, 1000);
  };

  if (isLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-slate-500">Yükleniyor...</div>;
  if (!user) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-2xl text-slate-700">Kullanıcı Bulunamadı</div>;

  const safeLiveResults = Array.isArray(liveResults) ? liveResults : [];
  
  // ÇÖKME ÖNLEYİCİ: İsim yoksa 'U' harfini koy, split'te patlamasın
  const safeFullName = user?.fullName || "Kullanıcı";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${safeFullName}&background=0D8ABC&color=fff&size=256`;
  const displayUniversity = profileData?.university || "Piri Reis Üniversitesi"; 
  const displayBio = profileData?.bio || "Merhaba! UniCycle'da yeniyim.";
  const isOwner = currentUser && Number(currentUser.id) === Number(id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative">
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-6">
            
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform group">
                <Image src="/logo.jpeg" alt="UniCycle İkon" width={52} height={52} className="object-contain rounded-md" priority />
                <span className="text-[32px] font-extrabold text-slate-800 hidden md:block">Uni<span className="text-[#20B2AA]">Cycle</span></span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-3xl relative group z-50">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text" placeholder="Ürün, @üye veya ders notu ara..."
                  className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                <span className="absolute left-5 top-3.5 text-slate-400">🔍</span>
                <button type="submit" className="hidden">Ara</button>
              </form>
              {isDropdownOpen && safeLiveResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {safeLiveResults.slice(0, 5).map((result, idx) => (
                    <Link href={result.type === "user" ? `/user/${result.item.id}` : `/listing-detail/${result.item.id}`} key={idx} className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                        {result.type === "user" ? (result.item.fullName || "U").charAt(0).toUpperCase() : '📦'}
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{result.item.fullName || result.item.title}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Link href="/create-listing" className="hidden sm:flex font-black text-blue-600 items-center gap-1">+ İlan Ver</Link>

              {currentUser ? (
                <div className="flex items-center gap-3">
                  <Link href="/notifications" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {notificationsCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {notificationsCount}
                      </span>
                    )}
                  </Link>

                  <Link href="/profile" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold shadow-sm ml-2 text-sm">
                    👤 Hesabım
                  </Link>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 font-bold transition-colors text-sm ml-2">Çıkış</button>
                </div>
              ) : (
                <Link href="/login" className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm">Giriş Yap</Link>
              )}
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-4 sm:px-0 mt-6 mb-12">
        <button onClick={() => router.back()} className="font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 text-sm">&larr; Geri Dön</button>
      </div>

      <div className="max-w-[800px] mx-auto px-4 sm:px-0 relative">
        {toastMessage && <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold">{toastMessage}</div>}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 sm:h-48 w-full relative bg-gradient-to-r from-blue-500 to-indigo-600">
             {profileData?.coverImage && <img src={profileData.coverImage} className="w-full h-full object-cover" style={{ objectPosition: `center ${profileData.coverY || 50}%` }} />}
          </div>
          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                <img src={profileData?.profileImage || defaultAvatar} className="w-full h-full object-cover origin-center" />
              </div>
              <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-4">
                {isOwner ? (
                  <div className="bg-green-50 text-green-700 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm">✨ Senin Profilin</div>
                ) : (
                  <>
                    <button onClick={() => setIsChatOpen(true)} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5">
                      <span>💬</span> <span className="hidden sm:inline">Mesaj At</span>
                    </button>
                    <button onClick={handleFollowToggle} className={`font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full text-xs sm:text-sm ${isFollowing ? "bg-slate-100 text-slate-500" : "bg-blue-600 text-white"}`}>
                      {isFollowing ? "Takibi Bırak" : "Takip Et"}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">{safeFullName} <span className="text-blue-500 text-xl">✓</span></h1>
              <p className="text-sm font-bold text-slate-500 mt-0.5">@{safeFullName.split(" ")[0].toLowerCase()}</p>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600"><span>🏫</span> {displayUniversity}</div>
              <p className="text-slate-700 mt-3 text-sm font-medium">{displayBio}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">🛍️ Vitrin <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{listings.length}</span></h2>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300"><span className="text-5xl block mb-4">📭</span><h3 className="text-xl font-bold">Vitrin boş!</h3></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {listings.map((p) => (
                <Link href={`/listing-detail/${p.id}`} key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
                  <div className="aspect-[4/5] bg-slate-50 p-2 relative">
                    {p.photosBase64?.[0] ? <img src={p.photosBase64[0]} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    {p.priceType === "takas" && <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Takaslık</div>}
                    {p.priceType === "ucretsiz" && <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Ücretsiz</div>}
                  </div>
                  <div className="p-3 flex-1 flex flex-col border-t border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1 mb-1">{p.category}</div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{p.title}</h3>
                    <div className="mt-auto text-base font-black text-blue-600">₺{p.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 💬 SAĞ ALTTAN ÇIKAN AKTİF SOHBET PANELİ 💬 */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-4 sm:right-8 w-80 sm:w-[350px] h-[450px] bg-white rounded-t-2xl shadow-[0_-5px_40px_rgba(0,0,0,0.2)] border border-slate-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-10">
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl flex justify-between items-center cursor-pointer shadow-md" onClick={() => setIsChatOpen(false)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold border border-white/30">
                  {safeFullName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">{safeFullName.split(" ")[0]}</h3>
                <span className="text-[10px] text-blue-100">Çevrimiçi</span>
              </div>
            </div>
            <button className="text-white/80 hover:text-white transition-colors text-xl font-bold">✕</button>
          </div>
          <div ref={chatScrollRef} className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col gap-3">
            <div className="text-center text-[10px] text-slate-400 font-bold bg-slate-100 rounded-full w-max mx-auto px-3 py-1 mb-2">Bugün</div>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <span className="text-4xl mb-2">👋</span>
                <p className="text-xs font-bold text-slate-600">Hemen bir mesaj göndererek<br/>sohbeti başlatın.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.isMine ? "bg-blue-600 text-white self-end rounded-br-sm" : "bg-white text-slate-800 border border-slate-100 self-start rounded-bl-sm"}`}>
                  {msg.text}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input type="text" placeholder="Bir mesaj yaz..." className="flex-1 bg-slate-100 text-slate-800 text-sm px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
            <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm">
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}