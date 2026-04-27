"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const [user, setUser] = useState<{
    id: number;
    fullName: string;
    email: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const likesKey = `likes_${parsedUser.email}`;
    const likedIds = JSON.parse(localStorage.getItem(likesKey) || "[]");

    if (likedIds.length === 0) {
      setIsLoading(false);
      return;
    }

    fetch("https://unicycle-api.onrender.com/api/products")
      .then((res) => res.json())
      .then((allProducts) => {
        if (Array.isArray(allProducts)) {
          const favProducts = allProducts.filter((p: any) =>
            likedIds.includes(p.id),
          );
          setFavorites(favProducts.reverse());
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Favoriler çekilirken hata:", err);
        setIsLoading(false);
      });
  }, []);

  const removeFavorite = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    setFavorites((prev) => prev.filter((p) => p.id !== productId));

    const likesKey = `likes_${user.email}`;
    const currentLikes = JSON.parse(localStorage.getItem(likesKey) || "[]");
    const newLikes = currentLikes.filter((id: number) => id !== productId);
    localStorage.setItem(likesKey, JSON.stringify(newLikes));

    try {
      await fetch(
        `https://unicycle-api.onrender.com/api/interaction/likes?userId=${user.id}&productId=${productId}`,
        { method: "DELETE" },
      );
    } catch (err) {
      console.error("Beğeni arka planda silinemedi:", err);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans w-full overflow-x-hidden flex flex-col">
      {/* 🚀 ÜST MENÜ */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer"
            >
              <div className="relative w-9 h-9 sm:w-12 sm:h-12 flex shrink-0">
                <Image
                  src="/logo.jpeg"
                  alt="UniCycle İkon"
                  fill
                  className="object-contain drop-shadow-sm transition-all rounded-md"
                  priority
                />
              </div>
              <span className="text-xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2 font-bold text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-full"
            >
              <span className="text-sm">Profilime Dön</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        {/* ✨ YENİ: PREMIUM BAŞLIK ALANI (HERO BANNER) */}
        <div className="relative overflow-hidden bg-white rounded-[2rem] p-6 sm:p-8 mb-8 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative z-10 w-full">
            <button
              onClick={() => router.back()}
              className="font-bold text-slate-400 hover:text-blue-600 flex items-center gap-2 text-xs mb-3 transition-colors"
            >
              &larr; Geri Dön
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shadow-inner border border-red-100 shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  Favorilerim
                  {!isLoading && favorites.length > 0 && (
                    <span className="text-xs sm:text-sm bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full font-bold">
                      {favorites.length} İlan
                    </span>
                  )}
                </h1>
                <p className="text-slate-500 font-medium mt-2 text-xs sm:text-sm max-w-md leading-relaxed">
                  Gözüne kestirdiğin tüm harika kampüs fırsatları burada.
                </p>
              </div>
            </div>
          </div>

          {/* Arka Plan Dekoratif Parlaması (Hafifletildi) */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-br from-red-50 to-transparent rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none opacity-50"></div>
        </div>

        {/* ⏳ YÜKLENİYOR İSKELETİ */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col animate-pulse"
              >
                <div className="aspect-[4/5] bg-slate-100 w-full"></div>
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="h-3 bg-slate-200 rounded-full w-5/6"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          /* 📭 YENİ: DAHA ESTETİK BOŞ DURUM EKRANI */
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 sm:p-20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                💔
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 tracking-tight">
                Koleksiyonun Bomboş!
              </h3>
              <p className="text-slate-500 font-medium text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Henüz hiçbir ilanı favorilerine eklememişsin. Kampüsteki en
                güzel fırsatları kaçırmamak için beğendiğin ilanlara kalp bırak!
              </p>
              <Link
                href="/"
                className="bg-slate-900 hover:bg-blue-600 text-white font-black py-4 px-10 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1"
              >
                İlanları Keşfetmeye Başla
              </Link>
            </div>
          </div>
        ) : (
          /* 🎁 YENİ: GELİŞTİRİLMİŞ İLAN KARTLARI */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {favorites.map((p: any) => (
              <Link
                href={`/listing-detail/${p.id}`}
                key={p.id}
                className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col relative z-10"
              >
                {/* 💔 CAM EFEKTLİ (GLASSMORPHISM) FAVORİDEN ÇIKAR BUTONU */}
                <button
                  onClick={(e) => removeFavorite(e, p.id)}
                  className="absolute top-3 right-3 z-30 p-2.5 rounded-full shadow-lg backdrop-blur-md bg-white/80 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 border border-white/50"
                  title="Favorilerden Çıkar"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>

                <div className="aspect-[4/5] relative overflow-hidden bg-slate-50">
                  {p.photosBase64 && p.photosBase64.length > 0 ? (
                    <>
                      <img
                        src={p.photosBase64[0]}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Kartın altına doğru hafif siyah geçiş (yazılar daha net okunsun diye) */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-50 group-hover:scale-110 transition-transform duration-700">
                      📦
                    </div>
                  )}
                  {p.priceType === "takas" && (
                    <div className="absolute top-3 left-3 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                      Takas
                    </div>
                  )}
                  {p.priceType === "ucretsiz" && (
                    <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                      Ücretsiz
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col bg-white">
                  <div className="flex justify-between items-center mb-2.5 gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1 flex-1">
                      {p.category}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-md shrink-0">
                      @
                      {p.user && p.user.fullName
                        ? p.user.fullName.split(" ")[0]
                        : "Öğrenci"}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
                    {p.title}
                  </h2>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {p.priceType === "fiyat"
                        ? `₺${p.price}`
                        : p.priceType === "takas"
                          ? "Takas"
                          : "Bedava"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
