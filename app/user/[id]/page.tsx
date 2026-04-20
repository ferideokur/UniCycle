"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Heart,
  Share2,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Send,
} from "lucide-react";

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
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        // Takip durumunu hafızadan kontrol et
        const followMemory = localStorage.getItem(
          `follows_${parsedUser.id}_${id}`,
        );
        if (followMemory === "true") setIsFollowing(true);

        // Bildirimleri çek
        fetch(
          `https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const deletedNotifs = JSON.parse(
                localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]",
              );
              const activeNotifs = data.filter(
                (n: any) => !deletedNotifs.includes(n.id),
              );
              setNotificationsCount(activeNotifs.length);
            }
          })
          .catch((err) => console.error("Bildirimler çekilemedi:", err));
      } catch (e) {
        console.error(e);
      }
    }

    const fetchData = async () => {
      try {
        // Kullanıcı bilgisini çek (Önbelleği kırarak her seferinde güncel veriyi alırız)
        const userRes = await fetch(
          `https://unicycle-api.onrender.com/api/users/${id}`,
          {
            cache: "no-store",
          },
        );
        if (!userRes.ok) throw new Error("Kullanıcı bulunamadı");
        const userData = await userRes.json();
        setUser(userData);

        // Profil detaylarını çek (Kendi profili ise localStorage'dan resimleri alır)
        const savedProfile = localStorage.getItem(`profile_${userData.email}`);
        if (savedProfile) setProfileData(JSON.parse(savedProfile));

        // Kullanıcının ilanlarını çek
        const prodRes = await fetch(
          "https://unicycle-api.onrender.com/api/products",
        );
        if (prodRes.ok) {
          const allProducts = await prodRes.json();
          if (Array.isArray(allProducts)) {
            const userProducts = allProducts.filter(
              (p: any) => p.user && Number(p.user.id) === Number(id),
            );
            setListings(userProducts.sort((a: any, b: any) => b.id - a.id));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) {
        setLiveResults([]);
        return;
      }
      try {
        const isUserSearch = searchTerm.startsWith("@");
        const query = isUserSearch
          ? searchTerm.substring(1).trim()
          : searchTerm.trim();
        if (!query) return;

        let combined: any[] = [];
        if (isUserSearch) {
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(query)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data))
              combined = data.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(query)}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data))
              combined = data.map((p: any) => ({ type: "product", item: p }));
          }
        }
        setLiveResults(combined);
      } catch (err) {
        console.error(err);
      }
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

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/users/${currentUser.id}/logout`,
          { method: "POST" },
        );
      } catch (e) {
        console.error("Çıkış yapılırken sunucuya ulaşılamadı.");
      }
    }
    localStorage.removeItem("user");
    setCurrentUser(null);
    window.location.href = "/";
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // 🚀 TAKİP ETME VE BİLDİRİM GÖNDERME MOTORU
  const handleFollowToggle = async () => {
    if (!currentUser) return showToast("🔒 Takip etmek için giriş yapmalısın!");
    if (Number(currentUser.id) === Number(id))
      return showToast("Kendini takip edemezsin! 😅");

    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);

    try {
      await fetch("https://unicycle-api.onrender.com/api/interaction/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUser.id,
          followingId: Number(id),
        }),
      });

      localStorage.setItem(
        `follows_${currentUser.id}_${id}`,
        newFollowState ? "true" : "false",
      );
      showToast(
        newFollowState
          ? `✨ ${user?.fullName || "Kullanıcı"} takip edildi!`
          : "💔 Takipten çıkıldı.",
      );

      if (newFollowState) {
        await fetch(
          "https://unicycle-api.onrender.com/api/interaction/notifications",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: Number(id),
              message: `${currentUser.fullName} seni takip etmeye başladı.`,
            }),
          },
        );
      }
    } catch (err) {
      console.error("Takip işlemi başarısız:", err);
      setIsFollowing(!newFollowState);
      showToast("❌ İşlem başarısız, tekrar dene.");
    }
  };

  // 🔥 GLOBAL CHATBOX'A SİNYAL GÖNDERİYORUZ
  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    if (user) {
      window.dispatchEvent(
        new CustomEvent("openChatWithContext", {
          detail: {
            sellerId: user.id,
            sellerName: user.fullName,
            productTitle: "", // Profil sayfasından gidildiği için ilan adı boş
          },
        }),
      );
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-bold text-slate-500">
        <div className="animate-spin text-4xl sm:text-5xl">⏳</div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold text-slate-800">
          Kullanıcı bulunamadı!
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 font-bold hover:underline"
        >
          Geri Dön
        </button>
      </div>
    );

  const safeLiveResults = Array.isArray(liveResults) ? liveResults : [];
  const safeFullName = user?.fullName || "Kullanıcı";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${safeFullName}&background=0D8ABC&color=fff&size=256`;

  // 🎓 İŞTE BÜYÜK ÇÖZÜM BURASI: Önce Veritabanına Bak, Bulamazsan Belirtilmemiş Yaz!
  const displayUniversity = user?.university || "Üniversite Belirtilmemiş";
  const displayBio = profileData?.bio || "Merhaba! UniCycle'da yeniyim.";
  const isOwner = currentUser && Number(currentUser.id) === Number(id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative w-full overflow-x-hidden flex flex-col">
      {/* 🌟 BİLDİRİM (TOAST) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ÜST MENÜ NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center gap-2 sm:gap-6 pt-1 sm:pt-0">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer"
            >
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 flex shrink-0">
                <Image
                  src="/logo.jpeg"
                  alt="UniCycle İkon"
                  fill
                  className="object-contain drop-shadow-sm transition-all rounded-md mix-blend-multiply"
                  priority
                />
              </div>
              <span className="text-xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </Link>
          </div>

          <div className="desktop-search flex-1 max-w-3xl relative group z-50 px-8">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Ürün, @üye veya ders notu ara..."
                className="w-full bg-slate-100 text-slate-800 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-[#20B2AA] transition-all border border-transparent font-medium"
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
              <button type="submit" className="hidden">
                Ara
              </button>
            </form>
            {isDropdownOpen && safeLiveResults.length > 0 && (
              <div className="absolute top-full left-8 right-8 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                {safeLiveResults.slice(0, 5).map((result, idx) => (
                  <Link
                    href={
                      result.type === "user"
                        ? `/user/${result.item.id}`
                        : `/listing-detail/${result.item.id}`
                    }
                    key={idx}
                    className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                      {result.type === "user"
                        ? (result.item.fullName || "U").charAt(0).toUpperCase()
                        : "📦"}
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {result.item.fullName || result.item.title}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
            <Link
              href="/create-listing"
              className="hidden md:flex font-black text-[#20B2AA] items-center gap-1 transition-colors hover:text-teal-700"
            >
              <span className="text-xl">+</span> İlan Ver
            </Link>
            <Link
              href="/create-listing"
              className="flex md:hidden font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors text-[11px] sm:text-base border border-[#20B2AA] px-2 py-1.5 rounded-lg"
            >
              <span className="text-sm">+</span> İlan
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/notifications"
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                  {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-md">
                      {notificationsCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-bold shadow-md hover:bg-blue-700 transition-colors"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs">
                    👤
                  </div>
                  <span className="hidden sm:block text-sm">Hesabım</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-slate-400 hover:text-red-500 font-bold transition-colors text-sm ml-2"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-black transition-colors"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>

        {/* 🚀 MOBİL ARAMA ÇUBUĞU */}
        <div className="mobile-search pb-3 pt-1 w-full relative z-40 px-4 bg-white border-b border-gray-100 shadow-sm">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full relative flex gap-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Ürün, @üye veya ders notu ara..."
                className="w-full bg-[#F3F4F6] text-slate-800 rounded-lg py-2.5 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-[#20B2AA] transition-all font-medium text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-lg">
                🔍
              </span>
            </div>
          </form>
          {isDropdownOpen && safeLiveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
              {safeLiveResults.slice(0, 4).map((result, idx) => (
                <Link
                  href={
                    result.type === "user"
                      ? `/user/${result.item.id}`
                      : `/listing-detail/${result.item.id}`
                  }
                  key={`mob-${idx}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 border-b border-slate-50"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden flex shrink-0 items-center justify-center">
                    {result.type === "user" ? (
                      <span className="font-bold text-blue-600">
                        {(result.item.fullName || "U").charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs">📦</span>
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-bold text-slate-800 truncate text-xs">
                      {result.item.fullName || result.item.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 🔙 GERİ DÖN */}
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 mt-4 sm:mt-6 mb-6">
        <button
          onClick={() => router.back()}
          className="font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 text-xs sm:text-sm"
        >
          &larr; Geri Dön
        </button>
      </div>

      {/* 👤 PROFİL KARTI */}
      <div className="max-w-[800px] mx-auto w-full px-4 sm:px-0 relative">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 sm:h-48 w-full relative bg-gradient-to-r from-blue-500 to-indigo-600">
            {profileData?.coverImage && (
              <img
                src={profileData.coverImage}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `center ${profileData.coverY || 50}%`,
                }}
              />
            )}
          </div>

          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                <img
                  src={profileData?.profileImage || defaultAvatar}
                  className="w-full h-full object-cover origin-center"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-4">
                {isOwner ? (
                  <div className="bg-green-50 text-green-700 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm border border-green-200">
                    ✨ Senin Profilin
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleMessageClick}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-1.5 px-4 rounded-full text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />{" "}
                      <span className="hidden sm:inline">Mesaj At</span>
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      className={`font-bold py-1.5 px-4 sm:py-2 sm:px-6 rounded-full text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5 ${isFollowing ? "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                    >
                      {isFollowing ? (
                        <>
                          <span className="text-green-500 font-black">✓</span>{" "}
                          Takip Ediliyor
                        </>
                      ) : (
                        "Takip Et"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
                {safeFullName}{" "}
                <ShieldCheck className="text-blue-500 w-5 h-5 sm:w-7 sm:h-7" />
              </h1>
              <p className="text-sm font-bold text-slate-500 mt-0.5">
                @{safeFullName.split(" ")[0].toLowerCase()}
              </p>

              {/* 🎓 ÜNİVERSİTE ALANI */}
              <p className="text-xs sm:text-lg font-bold text-gray-600 mt-2">
                👩‍🎓 {displayUniversity}
              </p>

              <p className="text-slate-700 mt-3 text-sm font-medium leading-relaxed">
                {displayBio}
              </p>
            </div>
          </div>
        </div>

        {/* 🛍️ VİTRİN */}
        <div className="mt-8 mb-8 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg sm:text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            🛍️ {safeFullName.split(" ")[0]}'in Vitrini{" "}
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-sm">
              {listings.length}
            </span>
          </h2>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-xl font-bold text-slate-600">
                Kullanıcının henüz bir ilanı yok.
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {listings.map((p) => (
                <Link
                  href={`/listing-detail/${p.id}`}
                  key={p.id}
                  className="group block relative cursor-pointer"
                >
                  <div className="aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 mb-2 relative border shadow-sm group-hover:shadow-md transition">
                    {p.photosBase64?.[0] ? (
                      <img
                        src={p.photosBase64[0]}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                    {p.priceType === "takas" && (
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                        Takaslık
                      </div>
                    )}
                    {p.priceType === "ucretsiz" && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-sm">
                        Ücretsiz
                      </div>
                    )}
                  </div>
                  <div>
                    <h3
                      className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-1 mb-0.5 sm:mb-1"
                      title={p.title}
                    >
                      {p.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 line-clamp-1">
                      {p.category}
                    </p>
                    <div className="text-sm sm:text-lg font-black text-gray-900">
                      {p.priceType === "fiyat"
                        ? `₺${p.price}`
                        : p.priceType === "takas"
                          ? "Takas"
                          : "Bedava"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🌊 FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-auto rounded-t-[3rem] shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-sm">
              Kampüs içindeki güvenli 2. el pazar yerin. Sadece üniversite
              öğrencilerine özel, doğrulanmış ve güvenilir alışveriş deneyimi.
            </p>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-500">
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Nasıl Çalışır?
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Güvenlik İpuçları
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Kampüs Kuralları
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold mb-4">İletişim</h4>
            <ul className="space-y-2 text-sm font-medium text-slate-500">
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Destek Merkezi
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  Bize Ulaşın
                </button>
              </li>
              <li>
                <button className="hover:text-blue-600 transition-colors">
                  S.S.S.
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
          © 2026 UniCycle. Tüm hakları saklıdır.
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        @media (min-width: 640px) { .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; } }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
        .desktop-search { display: none; }
        .mobile-search { display: block; }
        @media (min-width: 768px) { .desktop-search { display: flex; } .mobile-search { display: none; } }
      `,
        }}
      />
    </div>
  );
}
