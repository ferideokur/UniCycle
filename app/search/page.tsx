"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";

// 📦 Core Search Component
function SearchContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") || "";
  const router = useRouter();

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchType, setSearchType] = useState<"products" | "users">(
    "products",
  );

  // 🚀 HEADER VE KULLANICI HAFIZASI (Ana Sayfadan Alındı)
  const [searchInput, setSearchInput] = useState(rawQuery);
  const [user, setUser] = useState<any>(null);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  // 🔔 BİLDİRİM HAFIZASI
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 1. URL Değiştiğinde Arama Kutusunu Güncelle
  useEffect(() => {
    setSearchInput(rawQuery);
  }, [rawQuery]);

  // 2. Kullanıcı, Beğeniler ve Bildirimleri Çek
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const likes = JSON.parse(
          localStorage.getItem(`likes_${parsedUser.email}`) || "[]",
        );
        setLikedProducts(likes);

        // Bildirim Sayısını Çek
        fetch(
          `https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`,
        )
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const deletedNotifs = JSON.parse(
                localStorage.getItem(`deletedNotifs_${parsedUser.id}`) || "[]",
              );
              const seenNotifs = JSON.parse(
                localStorage.getItem(`seenNotifs_${parsedUser.id}`) || "[]",
              );
              const activeNotifs = data.filter(
                (n: any) => !deletedNotifs.includes(n.id),
              );
              const unreadNotifs = activeNotifs.filter(
                (n: any) => !seenNotifs.includes(n.id),
              );
              setNotificationsCount(unreadNotifs.length);
            }
          })
          .catch((err) => console.error("Bildirimler çekilemedi:", err));

        window.addEventListener("notificationsSeen", () =>
          setNotificationsCount(0),
        );
      } catch (e) {
        console.error(e);
      }
    }
    return () =>
      window.removeEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
  }, []);

  // 3. 🌐 JAVA'DAN ARAMA SONUÇLARINI ÇEKME
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setResults([]);

      try {
        const isUserSearch = rawQuery.startsWith("@");
        const cleanQuery = isUserSearch
          ? rawQuery.substring(1).trim()
          : rawQuery.trim();

        if (!cleanQuery) {
          setIsLoading(false);
          return;
        }

        if (isUserSearch) {
          setSearchType("users");
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(cleanQuery)}`,
          );
          if (res.ok) {
            const data = await res.json();
            setResults(data);
          }
        } else {
          setSearchType("products");
          const res = await fetch(
            `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(cleanQuery)}`,
          );
          if (res.ok) {
            const data = await res.json();
            data.sort((a: any, b: any) => b.id - a.id);
            setResults(data);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [rawQuery]);

  // 🚀 AKSİYON FONKSİYONLARI
  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setLikedProducts([]);
    window.location.href = "/";
  };

  const toggleLike = async (e: React.MouseEvent, productObject: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      alert("Beğenmek için giriş yapmalısın!");
      return;
    }

    let newLikes = [...likedProducts];
    const isAlreadyLiked = newLikes.includes(productObject.id);

    if (isAlreadyLiked) {
      newLikes = newLikes.filter((id) => id !== productObject.id);
    } else {
      newLikes.push(productObject.id);
      // Bildirim Gönder
      if (productObject.user && productObject.user.id !== user.id) {
        try {
          await fetch("https://unicycle-api.onrender.com/api/interaction/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: productObject.user.id,
              message: `${user.fullName}, "${productObject.title}" adlı ilanını beğendi.`,
            }),
          });
        } catch (err) {
          console.error("Bildirim gönderilemedi:", err);
        }
      }
    }
    setLikedProducts(newLikes);
    localStorage.setItem(`likes_${user.email}`, JSON.stringify(newLikes));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      {/* 🚀 ÜST MENÜ (Ana Sayfa İle Birebir Aynı) */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-200 shadow-sm h-20 flex items-center">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center gap-6">
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-3 hover:scale-105 transition-transform group"
            >
              <Image
                src="/logo.jpeg"
                alt="UniCycle İkon"
                width={48}
                height={48}
                className="rounded-md shadow-sm"
                priority
              />
              <span className="text-2xl font-extrabold text-slate-800 hidden lg:block">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </Link>
          </div>

          {/* AKTİF ARAMA ÇUBUĞU */}
          <div className="flex-1 max-w-3xl relative">
            <form onSubmit={handleNewSearch} className="w-full relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  🔍
                </span>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-100 border border-transparent text-slate-800 rounded-full pl-12 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all font-medium shadow-inner"
                placeholder="Yeni bir kelime veya @kullanıcı ara..."
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-full text-sm transition-colors"
              >
                Ara
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Link
              href="/create-listing"
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors hidden md:block"
            >
              + İlan Ver
            </Link>

            {user ? (
              <div className="flex items-center gap-3 relative">
                {/* 🔔 BİLDİRİM ÇANI VE DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Bildirimler"
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
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {notificationsCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="font-bold text-slate-800">
                          Bildirimler
                        </span>
                        {notificationsCount > 0 && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {notificationsCount} Yeni
                          </span>
                        )}
                      </div>
                      <Link
                        href="/notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="block w-full text-center px-4 py-3 bg-slate-50 text-xs font-bold text-blue-600 hover:bg-slate-100 transition-colors"
                      >
                        Tüm Bildirimleri Gör &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all ml-2"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">
                    👤
                  </div>
                  <span className="hidden sm:block">Hesabım</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 font-bold transition-colors text-sm ml-2"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-black transition-colors text-sm"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 📊 ARAMA SONUÇLARI İÇERİĞİ */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Arama Sonuçları
            </h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">
              <span className="font-bold text-blue-600">"{rawQuery}"</span>{" "}
              araması için {isLoading ? "..." : results.length} sonuç bulundu.
            </p>
          </div>
          <Link
            href="/"
            className="hidden md:flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            &larr; Anasayfaya Dön
          </Link>
        </div>

        {/* ⏳ SKELETON LOADING */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col animate-pulse"
              >
                <div className="aspect-[4/5] bg-slate-200 w-full"></div>
                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-center mt-1">
                    <div className="h-2.5 bg-slate-200 rounded-full w-1/3"></div>
                    <div className="h-5 bg-slate-100 rounded-md w-1/4"></div>
                  </div>
                  <div className="space-y-2.5 mt-2">
                    <div className="h-3.5 bg-slate-200 rounded-full w-5/6"></div>
                    <div className="h-3.5 bg-slate-200 rounded-full w-4/6"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          /* 🕵️‍♀️ NO RESULTS FOUND */
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm mt-4">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              🕵️‍♀️
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3">
              Aradığın şeyi bulamadık...
            </h3>
            <p className="text-slate-500 font-medium text-lg mb-8 max-w-md mx-auto">
              Görünüşe göre kampüste henüz kimse "
              <span className="font-bold text-slate-700">{rawQuery}</span>" ile
              ilgili bir şey paylaşmamış.
            </p>
            <Link
              href="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-8 rounded-full transition-colors inline-block"
            >
              Tüm İlanlara Göz At
            </Link>
          </div>
        ) : (
          /* 🎯 RESULTS RENDERING */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {/* 1. If Search Type is Users */}
            {searchType === "users" &&
              results.map((userItem: any) => (
                <div
                  key={userItem.id}
                  className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black mb-4 group-hover:scale-110 transition-transform">
                    {userItem.fullName
                      ? userItem.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {userItem.fullName}
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                    @
                    {userItem.fullName
                      ? userItem.fullName.split(" ")[0].toLowerCase()
                      : "user"}
                  </p>

                  <Link
                    href={`/user/${userItem.id}`}
                    className="mt-6 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 font-bold py-2 px-6 rounded-full transition-colors w-full block text-center"
                  >
                    Profili Gör
                  </Link>
                </div>
              ))}

            {/* 2. If Search Type is Products */}
            {searchType === "products" &&
              results.map((p: any) => {
                const isLiked = likedProducts.includes(p.id);

                return (
                  <Link
                    href={`/listing-detail/${p.id}`}
                    key={p.id}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col"
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                      {p.photosBase64 && p.photosBase64.length > 0 ? (
                        <img
                          src={p.photosBase64[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">
                          📦
                        </div>
                      )}
                      {p.priceType === "takas" && (
                        <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase">
                          Takas
                        </div>
                      )}
                      {p.priceType === "ucretsiz" && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase">
                          Ücretsiz
                        </div>
                      )}

                      {/* 🚀 EKLENEN KISIM: Kalp Butonu ve Bildirim Gönderme */}
                      <button
                        onClick={(e) => toggleLike(e, p)}
                        className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-10 ${isLiked ? "bg-red-500/90 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"}`}
                      >
                        <svg
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1 pr-2">
                          {p.category}
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md shrink-0">
                          @{p.user ? p.user.fullName.split(" ")[0] : "Öğrenci"}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </h2>
                      <div className="mt-auto flex items-end justify-between">
                        <div className="text-lg font-black text-slate-900 tracking-tight">
                          {p.priceType === "fiyat"
                            ? `₺${p.price}`
                            : p.priceType === "takas"
                              ? "Takas"
                              : "Bedava"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      {/* 🌊 FOOTER EKLENDİ (Bütünlük İçin) */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 mt-10 rounded-t-[3rem] shadow-sm">
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
          <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-xs font-medium text-slate-400 col-span-1 md:col-span-4">
            © 2026 UniCycle. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}

// 🛡️ Wrapper Component (Suspense Boundary)
export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Suspense
        fallback={
          <div className="text-center font-bold text-slate-500 text-xl mt-40 animate-pulse">
            Sayfa Yükleniyor...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </main>
  );
}
