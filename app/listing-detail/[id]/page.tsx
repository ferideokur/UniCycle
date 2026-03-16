"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react"; // Kalp ikonu

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  // Seçili Fotoğraf İndeksi ve Beğeni Durumu
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // 🚀 NAVBAR HAFIZALARI (Anasayfadan eklendi)
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<{type: "user" | "product", item: any}[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  useEffect(() => {
    // 1. Kullanıcıyı ve Beğenilerini Çek
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
      // Anasayfadaki gibi localStorage'dan beğenileri al
      const likes = JSON.parse(localStorage.getItem(`likes_${parsedUser.email}`) || "[]");
      setIsLiked(likes.includes(Number(id)));
    }

    // 2. İlanı ve Yorumları Çek
    const fetchData = async () => {
      try {
        const prodRes = await fetch("http://localhost:8080/api/products");
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          setProduct(allProducts.find((p: any) => p.id === Number(id)));
        }
        fetchComments();
      } catch (error) { console.error("Veri çekilemedi:", error); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  // 🚀 CANLI ARAMA ETKİSİ (Navbar için)
  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) { setLiveResults([]); return; }
      try {
        const isUserSearch = searchTerm.startsWith("@");
        const query = isUserSearch ? searchTerm.substring(1).trim() : searchTerm.trim();
        if (!query) return;

        let combined: {type: "user" | "product", item: any}[] = [];
        if (isUserSearch) {
          const userRes = await fetch(`http://localhost:8080/api/users/search?q=${encodeURIComponent(query)}`);
          if (userRes.ok) combined = (await userRes.json()).map((u: any) => ({ type: "user", item: u }));
        } else {
          const prodRes = await fetch(`http://localhost:8080/api/products/search?q=${encodeURIComponent(query)}`);
          if (prodRes.ok) {
            const products = await prodRes.json();
            products.sort((a: any, b: any) => b.id - a.id);
            combined = products.map((p: any) => ({ type: "product", item: p }));
          }
        }
        setLiveResults(combined);
      } catch (error) { console.error("Canlı arama hatası:", error); }
    };
    const timer = setTimeout(() => fetchLive(), 300); 
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (searchTerm.trim() !== "") {
      setIsDropdownOpen(false); 
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/comments/product/${id}`);
      if (res.ok) setComments(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    showToast("💬 Satıcıya mesaj penceresi yakında eklenecek!");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return showToast("🔒 Yorum yapmak için giriş yapmalısın!");
    if (newComment.trim() === "") return;

    try {
      const res = await fetch("http://localhost:8080/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, productId: id, text: newComment })
      });
      if (res.ok) {
        setNewComment("");
        fetchComments();
        showToast("✅ Yorum başarıyla eklendi!");
      }
    } catch (err) { console.error("Yorum eklenemedi"); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if(!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchComments();
        showToast("🗑️ Yorum silindi.");
      }
    } catch (err) { console.error(err); }
  };

  // ❤️ GERÇEK BEĞENME (LİKE) SİSTEMİ
  const handleLikeToggle = () => {
    if (!currentUser) {
      showToast("🔒 Beğenmek için giriş yapmalısın!");
      return;
    }
    
    const currentLikes = JSON.parse(localStorage.getItem(`likes_${currentUser.email}`) || "[]");
    let newLikes;
    
    if (isLiked) {
      newLikes = currentLikes.filter((favId: number) => favId !== Number(id));
      showToast("💔 İlan favorilerden çıkarıldı!");
    } else {
      newLikes = [...currentLikes, Number(id)];
      showToast("❤️ İlan favorilere eklendi!");
    }
    
    localStorage.setItem(`likes_${currentUser.email}`, JSON.stringify(newLikes));
    setIsLiked(!isLiked);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + " " + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <div className="min-h-screen bg-[#F8FAFC]"></div>;
  if (!product) return <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-bold text-slate-500">İlan bulunamadı.</div>;

  const sellerInitial = product.user?.fullName ? product.user.fullName.charAt(0).toUpperCase() : "Ö";
  const sellerName = product.user?.fullName || "Öğrenci";
  const isOwner = currentUser && product.user && Number(currentUser.id) === Number(product.user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative">
      
      {/* 🌟 BİLDİRİM (TOAST) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ÜST MENÜ (ANASAYFA İLE BİREBİR AYNI) */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-6">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform group">
                <Image src="/logo.jpeg" alt="UniCycle İkon" width={52} height={52} className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all rounded-md" priority />
                <span className="text-[32px] font-extrabold tracking-tight text-slate-800 hidden md:block">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

            {/* 🚀 ZARİFLEŞTİRİLMİŞ ARAMA ÇUBUĞU VE AÇILIR MENÜ */}
            <div className="hidden md:flex flex-1 max-w-3xl relative group z-50">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Ürün, @üye veya ders notu ara..."
                  className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent font-medium"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                />
                <span className="absolute left-5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  🔍
                </span>
                <button type="submit" className="hidden">Ara</button>
              </form>

              {/* 🌟 KİBAR VE ŞIK AÇILIR MENÜ (DROPDOWN) */}
              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {liveResults.slice(0, 5).map((result, idx) => {
                    if (result.type === "user") {
                      return (
                        <Link href={`/user/${result.item.id}`} key={`u-${result.item.id}-${idx}`} className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors">
                          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                            {result.item.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{result.item.fullName}</div>
                            <div className="text-[11px] text-slate-500 font-medium">Kullanıcı • @{result.item.fullName.split(" ")[0].toLowerCase()}</div>
                          </div>
                        </Link>
                      );
                    } else {
                      return (
                        <Link href={`/listing-detail/${result.item.id}`} key={`p-${result.item.id}-${idx}`} className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden flex shrink-0 border border-slate-200">
                            {result.item.photosBase64 && result.item.photosBase64[0] ? (
                              <img src={result.item.photosBase64[0]} className="w-full h-full object-cover" />
                            ) : <span className="m-auto text-lg">📦</span>}
                          </div>
                          <div className="flex-1 truncate">
                            <div className="font-bold text-slate-800 truncate text-sm">{result.item.title}</div>
                            <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                              {result.item.priceType === "fiyat" ? `₺${result.item.price}` : result.item.priceType === "takas" ? "Takas" : "Ücretsiz"}
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  })}
                  <div className="px-5 py-2.5 border-t border-slate-100 text-center bg-slate-50 mt-1 cursor-pointer hover:bg-slate-100 transition-colors" onClick={handleSearchSubmit}>
                    <span className="text-xs font-bold text-blue-600">Tüm sonuçları gör &rarr;</span>
                  </div>
                </div>
              )}
            </div>

            {/* 🚀 BUTONLAR VE BİLDİRİM KALBİ */}
            <div className="flex items-center gap-4">
              <Link href="/create-listing" className="hidden sm:flex font-black text-blue-600 hover:text-blue-800 items-center gap-1 transition-colors">
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-4 relative">
                  
                  {/* ❤️ BİLDİRİM KALBİ */}
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)} 
                    className="relative p-1.5 text-slate-400 hover:text-red-500 transition-colors" 
                    title="Bildirimler"
                  >
                    <svg className="w-7 h-7" fill={isNotificationOpen ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  </button>

                  {/* 🔔 BİLDİRİM DROPDOWN MENÜSÜ */}
                  {isNotificationOpen && (
                    <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="font-bold text-slate-800">Bildirimler</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">2 Yeni</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-lg shrink-0">🌸</div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700"><span className="font-bold">Sude Özcan</span> seni takip etmeye başladı.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">2 saat önce</p>
                          </div>
                        </div>
                        <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg shrink-0">📦</div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-700"><span className="font-bold">Feride Okur</span> yeni bir ilan ekledi.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">5 saat önce</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Link href="/profile" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all">
                    👤 {currentUser.fullName.split(" ")[0]}
                  </Link>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 font-bold transition-colors text-sm">
                    Çıkış
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-black transition-colors">
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🔙 GERİ DÖN BUTONU */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-0 mt-6 mb-2">
        <button onClick={() => router.back()} className="font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm">
          <span>&larr;</span> Geri Dön
        </button>
      </div>

      {/* 📦 KOMPAKT İLAN ALANI */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* SOL: FOTOĞRAF ALANI */}
          <div className="w-full md:w-1/2 bg-slate-50 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 p-8">
            
            {/* Ana Büyük Resim */}
            <div className="w-full max-w-[300px] aspect-[4/5] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {product.photosBase64 && product.photosBase64.length > 0 ? (
                <img src={product.photosBase64[activeImageIndex]} alt={product.title} className="w-full h-full object-contain p-2 transition-opacity duration-300" />
              ) : (
                <div className="text-6xl">📦</div>
              )}
              {product.priceType === "takas" && <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase shadow-sm">Takaslık</div>}
              {product.priceType === "ucretsiz" && <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase shadow-sm">Ücretsiz</div>}
            </div>

            {/* Küçük Resimler (Thumbnails) */}
            {product.photosBase64 && product.photosBase64.length > 1 && (
              <div className="flex gap-2 mt-4 max-w-[300px] overflow-x-auto pb-2 scrollbar-hide">
                {product.photosBase64.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-blue-500 shadow-md scale-105' : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Resim ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SAĞ: İLAN BİLGİLERİ */}
          <div className="w-full md:w-1/2 p-8 flex flex-col">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider w-max mb-3">
              {product.category}
            </span>

            {/* Başlık ve Kalp (Beğen) Butonu Yan Yana */}
            <div className="flex justify-between items-start gap-4 mb-2">
              <h1 className="text-2xl font-black text-slate-800 leading-snug">{product.title}</h1>
              <button 
                onClick={handleLikeToggle} 
                className={`shrink-0 p-2 rounded-full transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-400'}`}
                title="Favorilere Ekle"
              >
                <Heart size={26} strokeWidth={2} className={isLiked ? "fill-red-500" : ""} />
              </button>
            </div>

            <div className="text-3xl font-black text-slate-900 mb-6">
              {product.priceType === "fiyat" ? `₺${product.price}` : product.priceType === "takas" ? "Takas Edilir" : "Tamamen Bedava"}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 font-bold text-xs">Durum</span>
                <span className="text-slate-800 font-bold text-xs bg-white px-2.5 py-1 rounded border border-slate-200">{product.itemCondition || "Belirtilmemiş"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold text-xs">İlan No</span>
                <span className="text-slate-800 font-bold text-xs">#{product.id + 1000}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-black text-slate-800 mb-2">Açıklama</h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">{product.description || "Satıcı açıklama eklememiş."}</p>
            </div>

            {/* SATICI PROFİLİ VE AKSİYON BUTONLARI */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <Link href={`/user/${product.user?.id}`} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl hover:bg-slate-100 transition-colors mb-4 border border-slate-100">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-lg shrink-0">{sellerInitial}</div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-sm">{sellerName} <span className="text-blue-500 text-xs">✓</span></div>
                  <div className="text-[11px] font-bold text-slate-500">Satıcı Profiline Git &rarr;</div>
                </div>
              </Link>

              <div className="flex gap-3">
                {isOwner ? (
                  <div className="flex-1 bg-green-50 text-green-700 font-black py-3 rounded-xl border border-green-200 flex items-center justify-center gap-2 text-sm">
                    <span>✨</span> Bu senin ilanın
                  </div>
                ) : (
                  <button onClick={handleMessageClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm">
                    <span>💬</span> Mesaj At
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 💬 YORUMLAR (SQL BAĞLANTILI VE GÜVENLİ) */}
        <div className="mt-6 bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <span>📝</span> Ürün Soruları & Yorumlar ({comments.length})
          </h3>

          <div className="space-y-4 mb-6">
            {comments.length === 0 ? (
              <div className="text-sm font-bold text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Henüz soru sorulmamış. İlk soran sen ol!
              </div>
            ) : (
              comments.map((comment: any) => {
                const canDelete = currentUser && (currentUser.id === comment.user?.id || isOwner);

                return (
                  <div key={comment.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        {comment.user?.fullName} 
                        {comment.user?.id === product.user?.id && <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full uppercase">Satıcı</span>}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400">{formatDate(comment.createdAt)}</div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium">{comment.text}</p>

                    {canDelete && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all bg-white p-1.5 rounded-md shadow-sm border border-slate-100" title="Yorumu Sil">
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Yorum Yapma Formu */}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Ürün hakkında merak ettiklerini sor..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 transition-all"
            />
            <button type="submit" className="bg-slate-800 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm shadow-md">
              Gönder
            </button>
          </form>
          {!currentUser && <p className="text-xs text-red-500 font-bold mt-3 pl-2">* Soru sormak için giriş yapmalısınız.</p>}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />
    </div>
  );
}