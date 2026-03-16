"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>({});
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 Butonlar için Etkileşim Hafızası
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("none");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch(`http://localhost:8080/api/users/${id}`);
        if (!userRes.ok) throw new Error("Kullanıcı bulunamadı");
        
        const userData = await userRes.json();
        setUser(userData);

        const savedProfile = localStorage.getItem(`profile_${userData.email}`);
        if (savedProfile) {
          setProfileData(JSON.parse(savedProfile));
        }

        const prodRes = await fetch("http://localhost:8080/api/products");
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          const userProducts = allProducts.filter((p: any) => p.user && Number(p.user.id) === Number(id));
          userProducts.sort((a: any, b: any) => b.id - a.id);
          setListings(userProducts);
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🚀 Bağlantı Kurma Fonksiyonu
  const handleConnectClick = () => {
    if (connectionStatus === "none") {
      setConnectionStatus("pending");
      setToastMessage(`🔗 ${user.fullName} kullanıcısına takip isteği gönderildi!`);
      setTimeout(() => setToastMessage(""), 3000);
    } else if (connectionStatus === "pending") {
      setConnectionStatus("none");
      setToastMessage("❌ Takip isteği geri çekildi.");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // 🚀 Mesaj Atma Fonksiyonu
  const handleMessageClick = () => {
    setToastMessage("💬 Mesajlaşma altyapısı çok yakında aktif olacak!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <div className="font-bold text-slate-500 text-lg animate-pulse">Profil yükleniyor...</div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">🕵️‍♀️</div>
      <div className="font-black text-2xl text-slate-800 mb-2">Kullanıcı Bulunamadı</div>
      <Link href="/" className="text-blue-600 font-bold hover:underline">Anasayfaya Dön</Link>
    </div>
  );

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user.fullName}&background=0D8ABC&color=fff&size=256`;
  const displayUniversity = profileData.university || "Piri Reis Üniversitesi"; 
  const displayBio = profileData.bio || "Merhaba! UniCycle'da yeniyim.";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative">
      
      {/* 🌟 BİLDİRİM (TOAST) EKRANI */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm md:text-base whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ZARİF ÜST MENÜ */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1000px] mx-auto px-4 h-16 flex justify-between items-center">
          <button onClick={() => router.back()} className="font-bold text-slate-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-2">
            <span>&larr;</span> Geri Dön
          </button>
          <div className="font-black text-lg text-slate-800">@{user.fullName.split(" ")[0].toLowerCase()}</div>
          <div className="w-20"></div> {/* Ortalamayı sağlamak için boşluk */}
        </div>
      </header>

      {/* 💼 KİBARLAŞTIRILMIŞ PROFİL KARTI (Twitter/LinkedIn Tarzı) */}
      <div className="max-w-[800px] mx-auto mt-6 px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* KAPAK FOTOĞRAFI */}
          <div className="h-32 sm:h-48 w-full relative bg-gradient-to-r from-blue-500 to-indigo-600">
             {profileData.coverImage && (
               <img src={profileData.coverImage} alt="Kapak" className="w-full h-full object-cover" style={{ objectPosition: `center ${profileData.coverY || 50}%` }} />
             )}
          </div>

          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
              
              {/* PROFİL FOTOĞRAFI (Kapağın üstüne biner) */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                <img 
                  src={profileData.profileImage || defaultAvatar} 
                  alt={user.fullName} 
                  className="w-full h-full object-cover origin-center" 
                  style={{ transform: `scale(${profileData.profileZoom || 1}) rotate(${profileData.profileRotate || 0}deg)` }} 
                />
              </div>

              {/* 🚀 DÜZELTİLMİŞ AKSİYON BUTONLARI (Asla Sünmez, Şık Durur) */}
              <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-4">
                <button 
                  onClick={handleMessageClick}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-4 sm:py-2 sm:px-5 rounded-full transition shadow-sm text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <span>💬</span> <span className="hidden sm:inline">Mesaj At</span>
                </button>
                <button 
                  onClick={handleConnectClick}
                  className={`font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full transition shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2 ${
                    connectionStatus === "pending" 
                    ? "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {connectionStatus === "pending" ? (
                    <><span>⏳</span> <span className="hidden sm:inline">İstek Gönderildi</span></>
                  ) : (
                    "Takip Et"
                  )}
                </button>
              </div>
            </div>

            {/* KULLANICI BİLGİLERİ (Sola Dayalı, Derli Toplu) */}
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                {user.fullName} 
                <span className="text-blue-500 text-xl" title="Onaylı Öğrenci">✓</span>
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-0.5">
                @{user.fullName.split(" ")[0].toLowerCase()}
              </p>
              
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                <span>🏫</span> {displayUniversity}
              </div>
              <p className="text-slate-700 mt-3 text-sm font-medium whitespace-pre-wrap max-w-xl">
                {displayBio}
              </p>
            </div>
          </div>
        </div>

        {/* KULLANICININ VİTRİNİ (ÜRÜNLERİ) */}
        <div className="mt-8">
          <h2 className="text-lg font-black text-slate-800 mb-4 pl-2 flex items-center gap-2">
            <span>🛍️</span> Vitrin <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{listings.length}</span>
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-xl font-bold text-gray-800">Vitrin boş!</h3>
              <p className="text-gray-500 font-medium mt-2 text-sm">Kullanıcı şu an herhangi bir ürün satmıyor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {listings.map((p) => (
                <Link href={`/listing-detail/${p.id}`} key={p.id} className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all">
                  <div className="aspect-[4/5] overflow-hidden bg-slate-50 relative p-2">
                    {p.photosBase64 && p.photosBase64.length > 0 ? (
                      <img src={p.photosBase64[0]} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                    {p.priceType === "takas" && <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Takaslık</div>}
                    {p.priceType === "ucretsiz" && <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Ücretsiz</div>}
                  </div>
                  <div className="p-3 flex-1 flex flex-col border-t border-slate-50">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1 mb-1">{p.category}</div>
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">{p.title}</h3>
                    <div className="mt-auto text-base font-black text-slate-900 tracking-tight">
                      {p.priceType === "fiyat" ? `₺${p.price}` : p.priceType === "takas" ? "Takas" : "Bedava"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}