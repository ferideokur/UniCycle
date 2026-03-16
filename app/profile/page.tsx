"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; // 🚀 YENİ EKLENDİ: Arama yönlendirmesi için

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

  // 🚀 GERÇEK VERİTABANINDAN GELECEK İLANLARI TUTAN HAFIZA
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  // 🚀 YENİ EKLENDİ: Arama state'i ve router
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadProfileData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setNewName(parsedUser.fullName); 

      // Profil Görsel vs Ayarları (Local'den çekiliyor şimdilik)
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

      // 🚀 JAVA'DAN GERÇEK İLANLARI ÇEKME FONKSİYONUNU ÇAĞIR
      fetchMyRealListings(parsedUser.id);
    }
  };

  // 🌐 JAVA'YA BAĞLANAN VE İLANLARI ÇEKEN KISIM
  const fetchMyRealListings = async (userId: number) => {
    setIsLoadingListings(true);
    try {
      const response = await fetch("http://localhost:8080/api/products");
      if (response.ok) {
        const allProducts = await response.json();
        const myOwnProducts = allProducts.filter((product: any) => product.user && product.user.id === userId);
        setMyListings(myOwnProducts);
      } else {
        console.error("İlanlar çekilemedi, sunucu hatası.");
      }
    } catch (error) {
      console.error("Java'ya bağlanılamadı. Arka planda açık mı?", error);
    } finally {
      setIsLoadingListings(false);
    }
  };

  // 🗑️ JAVA'YA "BU İLANI SİL" EMRİ VEREN MOTOR
  const handleDeleteListing = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); // Karta tıklamayı engeller, sadece butona tıklar

    const isConfirmed = window.confirm("Bu ilanı tamamen silmek istediğine emin misin? Bu işlem geri alınamaz.");
    if (!isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:8080/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Ekranda o an gördüğümüz listeden de sildiğimiz ilanı anında uçuruyoruz!
        setMyListings(prevListings => prevListings.filter(listing => listing.id !== productId));
        alert("İlan başarıyla silindi! 🗑️");
      } else {
        alert("İlan silinirken bir hata oluştu.");
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Sunucuya ulaşılamıyor. Java çalışıyor mu?");
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleCancel = () => {
    loadProfileData(); 
    setActiveModal("none");
    setPasswordConfirm("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/"; 
  };

  // 🚀 YENİ EKLENDİ: Arama Submit Fonksiyonu
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

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

        if (type === "profile") { 
          setProfileImage(compressedDataUrl); 
          setProfileZoom(1); 
          setProfileRotate(0); 
        }
        if (type === "cover") { 
          setCoverImage(compressedDataUrl); 
          setCoverY(50); 
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const saveAllData = async (isInfoUpdate = false) => {
    if (isInfoUpdate) {
      if (university === "Diğer..." && customUniversity.trim() === "") {
        alert("Lütfen üniversitenizin adını girin!");
        return;
      }
      if (newName.trim() !== user?.fullName) {
        if (passwordConfirm.trim() === "") {
          alert("İsmini değiştirmek için güvenlik amacıyla mevcut şifreni girmelisin!");
          return;
        }
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
      const profileData = {
        bio: bio,
        university: finalUniversity,
        profileImage: profileImage,
        coverImage: coverImage,
        profileZoom: profileZoom,
        profileRotate: profileRotate, 
        coverY: coverY
      };
      
      localStorage.setItem(userProfileKey, JSON.stringify(profileData));

      setIsSaving(false);
      setActiveModal("none");
      setPasswordConfirm(""); 
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error) {
      console.error("Kaydetme hatası:", error);
      alert("Beklenmeyen bir hata oluştu.");
      setIsSaving(false);
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user ? user.fullName : "Kullanıcı"}&background=0D8ABC&color=fff&size=256`;
  const displayUniversity = university === "Diğer..." ? customUniversity : university;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 relative font-sans">
      
      {showToast && (
        <div className="fixed top-28 right-8 z-[200] bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 flex items-center gap-2">
          <span>✅</span> Değişiklikler Kaydedildi!
        </div>
      )}

      {/* 🚀 ÜST MENÜ (Anasayfa ile birebir aynı yapıldı) */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-6">
            
            {/* LOGO */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform group">
                <Image
                  src="/logo.jpeg"
                  alt="UniCycle İkon"
                  width={52}
                  height={52}
                  className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all rounded-md"
                  priority
                />
                <span className="text-[32px] font-extrabold tracking-tight text-slate-800">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

            {/* ARAMA ÇUBUĞU */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-3xl relative group">
              <input
                type="text"
                placeholder="Ürün, @üye veya ders notu ara..."
                className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                🔍
              </span>
              <button type="submit" className="hidden">Ara</button>
            </form>

            {/* BUTONLAR */}
            <div className="flex items-center gap-5">
              <Link
                href="/create-listing"
                className="hidden sm:flex font-black text-blue-600 hover:text-blue-800 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 font-bold transition-colors text-sm"
              >
                Çıkış Yap
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 💼 VİTRİN */}
      <div className="max-w-5xl mx-auto mt-6 bg-white rounded-t-[2.5rem] rounded-b-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* 1️⃣ KAPAK FOTOĞRAFI ALANI */}
        <div className="h-64 w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
           {coverImage && (
             <img src={coverImage} alt="Kapak" className="w-full h-full object-cover" style={{ objectPosition: `center ${coverY}%` }} />
           )}
           {isEditMode && (
             <button 
               onClick={() => setActiveModal("cover")}
               className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 font-bold py-2 px-5 rounded-full shadow-lg flex items-center gap-2 hover:bg-white animate-in fade-in"
             >
               📷 Kapağı Düzenle
             </button>
           )}
        </div>

        <div className="px-8 pb-8">
          <div className="flex justify-between items-end -mt-16 mb-4 relative z-10">
            
            {/* 2️⃣ PROFİL FOTOĞRAFI ALANI */}
            <div 
              onClick={() => isEditMode && setActiveModal("profile")}
              className={`w-36 h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 relative flex items-center justify-center ${isEditMode ? "cursor-pointer group" : ""}`}
            >
              <img src={profileImage || defaultAvatar} alt="Profil" className="w-full h-full object-cover origin-center" style={{ transform: `scale(${profileZoom}) rotate(${profileRotate}deg)` }} />
              {isEditMode && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity animate-in fade-in">
                  <span className="text-white text-3xl">📷</span>
                </div>
              )}
            </div>

            {/* 3️⃣ KİLİT/DÜZENLEME MODU BUTONLARI */}
            <div className="flex gap-3 mb-2">
              {isEditMode && (
                <button 
                  onClick={() => setActiveModal("info")} 
                  className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold py-2 px-5 rounded-full transition shadow-sm flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                >
                  <span>📝</span> Bilgiler
                </button>
              )}
              
              <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`font-bold py-2 px-5 rounded-full transition shadow-sm flex items-center gap-2 border ${
                  isEditMode 
                    ? 'bg-green-500 text-white border-green-600 hover:bg-green-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {isEditMode ? <span>✅ Bitti</span> : <span>✏️ Düzenle</span>}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
              {user ? user.fullName : "Yükleniyor..."} 
              <span className="text-blue-500 text-xl" title="Onaylı Öğrenci">✓</span>
            </h1>
            <p className="text-lg font-bold text-gray-600 mt-1 flex items-center gap-2">
              👩‍🎓 {displayUniversity}
            </p>
            <p className="text-gray-700 mt-4 max-w-2xl font-medium whitespace-pre-wrap leading-relaxed text-[15px]">
              {bio}
            </p>
          </div>

          {/* 🚀 ÜRÜN SAYACI */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-100">
            <div className="cursor-pointer hover:underline">
              <span className="font-black text-gray-900 mr-1">{myListings.length}</span>
              <span className="font-medium text-gray-500">Ürün</span>
            </div>
          </div>

        </div>
      </div>

      {/* 🛍️ ALT KISIM (VİTRİNİM) */}
      <div className="max-w-5xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">Vitrinim</h2>
            {myListings.length > 0 && (
              <Link href="/create-listing" className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1">
                + Yeni İlan
              </Link>
            )}
          </div>

          {/* YÜKLENİYOR DURUMU */}
          {isLoadingListings ? (
            <div className="text-center py-16">
              <span className="animate-spin text-4xl block mb-4">⏳</span>
              <p className="font-bold text-gray-500">Veritabanına bağlanılıyor...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-300">
              <span className="text-6xl block mb-4">🛍️</span>
              <h3 className="text-2xl font-bold text-gray-800">Vitrinin henüz boş!</h3>
              <p className="text-gray-500 font-medium mt-2 mb-8">Kullanmadığın eşyaları veya ders notlarını satarak hemen para kazanmaya başla.</p>
              <Link href="/create-listing" className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-8 rounded-full transition shadow-md inline-block">
                İlk İlanını Ver
              </Link>
            </div>
          ) : (
            /* 🚀 EĞER İLAN VARSA KARTLARI DİZ */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {myListings.map((listing) => (
                <div key={listing.id} className="group cursor-pointer">
                  
                  {/* Ürün Fotoğrafı */}
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-3 border border-gray-200 relative shadow-sm group-hover:shadow-md transition-shadow">
                    {listing.photosBase64 && listing.photosBase64.length > 0 ? (
                      <img src={listing.photosBase64[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-3xl">📦</div>
                    )}
                    
                    {/* Fiyat Tipi Rozetleri */}
                    {listing.priceType === "takas" && <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Takaslık</div>}
                    {listing.priceType === "ucretsiz" && <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">Ücretsiz</div>}

                    {/* 🗑️ YENİ EKLENEN SİL BUTONU */}
                    <button 
                      onClick={(e) => handleDeleteListing(listing.id, e)} 
                      className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                      title="İlanı Sil"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Ürün Bilgileri */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1" title={listing.title}>{listing.title}</h3>
                    <p className="text-xs text-gray-500 mb-1 line-clamp-1">{listing.category}</p>
                    <div className="text-lg font-black text-gray-900">
                      {listing.priceType === "fiyat" ? `₺${listing.price}` : (listing.priceType === "takas" ? "Takas" : "Bedava")}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* 🛠️ MODÜLER DÜZENLEME PENCERELERİ (Değişmedi) */}
      {/* ---------------------------------------------------------------------------------- */}

      {/* 📸 MODAL 1: SADECE KAPAK FOTOĞRAFI DÜZENLEYİCİ */}
      {activeModal === "cover" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">Kapak Fotoğrafını Düzenle</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-3xl">✕</button>
            </div>
            <div className="p-8 bg-gray-50/30">
              <div onClick={() => coverInputRef.current?.click()} className="h-48 w-full rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition relative overflow-hidden bg-gray-200 shadow-inner">
                {coverImage && <img src={coverImage} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `center ${coverY}%` }} />}
                <div className="absolute bg-black/60 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 hover:scale-105 transition">📷 Fotoğraf Seç</div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={(e) => handleImageUpload(e, "cover")} />
              
              {coverImage && (
                <div className="mt-6 flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm font-bold text-gray-600 whitespace-nowrap">↕️ Yukarı/Aşağı Kaydır:</span>
                  <input type="range" min="0" max="100" value={coverY} onChange={(e) => setCoverY(parseInt(e.target.value))} className="w-full accent-gray-700" />
                  <button onClick={() => setCoverImage(null)} className="text-red-500 font-bold text-sm whitespace-nowrap hover:bg-red-50 px-3 py-1.5 rounded-lg transition">🗑️ Kaldır</button>
                </div>
              )}
            </div>
            <div className="p-6 bg-white border-t flex justify-end gap-3">
              <button onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">İptal</button>
              <button onClick={() => saveAllData(false)} disabled={isSaving} className="px-10 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md transition-all">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📸 MODAL 2: SADECE PROFİL FOTOĞRAFI DÜZENLEYİCİ */}
      {activeModal === "profile" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">Profil Fotoğrafını Düzenle</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-3xl">✕</button>
            </div>
            <div className="p-8 flex flex-col md:flex-row gap-8 items-center bg-gray-50/30">
              <div className="relative w-48 h-48 bg-gray-100 rounded-full overflow-hidden border-4 border-white shrink-0 shadow-lg flex items-center justify-center">
                <img src={profileImage || defaultAvatar} className="w-full h-full object-cover origin-center" style={{ transform: `scale(${profileZoom}) rotate(${profileRotate}deg)` }} />
              </div>
              <div className="flex-1 w-full space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-600">🔍 Yakınlaştır</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{profileZoom}x</span>
                  </div>
                  <input type="range" min="1" max="3" step="0.1" value={profileZoom} onChange={(e) => setProfileZoom(parseFloat(e.target.value))} className="w-full accent-gray-700" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-600">🔄 Düzelt (Döndür)</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{profileRotate}°</span>
                  </div>
                  <input type="range" min="-45" max="45" step="1" value={profileRotate} onChange={(e) => setProfileRotate(parseFloat(e.target.value))} className="w-full accent-gray-700" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => profileInputRef.current?.click()} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-2.5 px-4 rounded-xl transition shadow-sm">📷 Yeni Seç</button>
                  {profileImage && <button onClick={() => { setProfileImage(null); setProfileZoom(1); setProfileRotate(0); }} className="text-red-500 font-bold py-2.5 px-4 hover:bg-red-50 rounded-xl transition">🗑️ Kaldır</button>}
                </div>
                <input type="file" accept="image/*" className="hidden" ref={profileInputRef} onChange={(e) => handleImageUpload(e, "profile")} />
              </div>
            </div>
            <div className="p-6 bg-white border-t flex justify-end gap-3">
              <button onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">İptal</button>
              <button onClick={() => saveAllData(false)} disabled={isSaving} className="px-10 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md transition-all">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📝 MODAL 3: SADECE BİLGİLERİ DÜZENLEYİCİ */}
      {activeModal === "info" && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-800">Profil Bilgilerini Düzenle</h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800 text-3xl">✕</button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto bg-white">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ad Soyad</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 font-bold" />
                </div>
                {newName.trim() !== user?.fullName && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-red-700 mb-1">🔒 Güvenlik Doğrulaması</label>
                    <p className="text-xs text-red-600 mb-3 font-medium">İsmini değiştirmek için mevcut şifreni girmelisin.</p>
                    <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Şifrenizi girin..." className="w-full bg-white text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-200" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Üniversiten</label>
                  <select value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 font-semibold">
                    {UNIVERSITIES.map((uni, index) => (
                      <option key={index} value={uni}>{uni}</option>
                    ))}
                  </select>
                </div>
                {university === "Diğer..." && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-red-600 mb-2">Lütfen Üniversitenizin Adını Yazın *</label>
                    <input type="text" value={customUniversity} onChange={(e) => setCustomUniversity(e.target.value)} placeholder="Örn: X Teknik Üniversitesi" className="w-full bg-red-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-200 font-semibold" required />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hakkımda</label>
                <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bölümünü, neler sattığını veya ilgi alanlarını yaz..." className="w-full bg-gray-50 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 resize-none font-medium" />
              </div>

            </div>
            <div className="p-6 bg-gray-50/50 border-t flex justify-end gap-3">
              <button onClick={handleCancel} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition">İptal</button>
              <button onClick={() => saveAllData(true)} disabled={isSaving} className="px-10 py-3 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md transition-all hover:scale-105">
                {isSaving ? "⏳..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )} 

    </div>
  );
}