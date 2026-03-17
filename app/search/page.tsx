"use client";

import { useSearchParams } from "next/navigation";

import Link from "next/link";

import { Suspense, useEffect, useState } from "react";

// 📦 Core Search Component

function SearchContent() {
  const searchParams = useSearchParams();

  const rawQuery = searchParams.get("q") || "";

  const [results, setResults] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [searchType, setSearchType] = useState<"products" | "users">(
    "products",
  );

  // 🌐 FETCH DATA FROM BACKEND API

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
          // 🧑‍🎓 Search for Users

          setSearchType("users");

          const res = await fetch(
            `http://localhost:8080/api/users/search?q=${encodeURIComponent(cleanQuery)}`,
          );

          if (res.ok) {
            const data = await res.json();

            setResults(data);
          }
        } else {
          // 🛍️ Search for Products (by title or category)

          setSearchType("products");

          const res = await fetch(
            `http://localhost:8080/api/products/search?q=${encodeURIComponent(cleanQuery)}`,
          );

          if (res.ok) {
            const data = await res.json();

            data.sort((a: any, b: any) => b.id - a.id); // Sort latest first

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

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}

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
            results.map((user: any) => (
              <div
                key={user.id}
                className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black mb-4 group-hover:scale-110 transition-transform">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>

                <h2 className="text-lg font-bold text-slate-800">
                  {user.fullName}
                </h2>

                <p className="text-sm font-medium text-slate-400 mt-1">
                  @{user.fullName.split(" ")[0].toLowerCase()}
                </p>

                {/* 🚀 DEĞİŞTİRİLEN KISIM: Button yerine Link etiketi geldi */}

                <Link
                  href={`/user/${user.id}`}
                  className="mt-6 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 font-bold py-2 px-6 rounded-full transition-colors w-full block text-center"
                >
                  Profili Gör
                </Link>
              </div>
            ))}

          {/* 2. If Search Type is Products */}

          {searchType === "products" &&
            results.map((p: any) => (
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
            ))}
        </div>
      )}
    </div>
  );
}

// 🛡️ Wrapper Component (Suspense Boundary)

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense
        fallback={
          <div className="text-center font-bold text-slate-500 text-xl mt-20 animate-pulse">
            Loading search results...
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </main>
  );
}
