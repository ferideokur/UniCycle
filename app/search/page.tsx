"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

// 📦 Arama İşlemini Yapan ve Sonuçları Gösteren İç Bileşen
function AramaIcerigi() {
  const searchParams = useSearchParams();
  const arananKelime = searchParams.get("q") || ""; // URL'den aranan kelimeyi al

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌐 JAVA'DAN İLANLARI ÇEKME
  useEffect(() => {
    const fetchAramaSonuclari = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8080/api/products");
        if (response.ok) {
          const data = await response.json();
          // Sadece aranan kelimeyi içerenleri filtrele (büyük/küçük harf duyarsız)
          const filtrelenmisData = data.filter((p: any) =>
            p.title?.toLowerCase().includes(arananKelime.toLowerCase())
          );
          
          // Yeniden eskiye sırala
          filtrelenmisData.sort((a: any, b: any) => b.id - a.id);
          setProducts(filtrelenmisData);
        } else {
          console.error("Sunucudan ilanlar alınamadı.");
        }
      } catch (error) {
        console.error("Java'ya bağlanılamadı.", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (arananKelime) {
      fetchAramaSonuclari();
    } else {
      setIsLoading(false);
    }
  }, [arananKelime]); // arananKelime değiştiğinde bu fonksiyonu tekrar çalıştır

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Üst Bilgi Kısmı */}
      <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Arama Sonuçları
          </h1>
          <p className="text-lg text-slate-500 mt-2 font-medium">
            <span className="font-bold text-blue-600">"{arananKelime}"</span> araması için {isLoading ? "..." : products.length} sonuç bulundu.
          </p>
        </div>
        <Link 
          href="/" 
          className="hidden md:flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          &larr; Anasayfaya Dön
        </Link>
      </div>

      {/* ⏳ SKELETON LOADING (YÜKLENİYOR EKRANI) */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col animate-pulse">
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
      ) : products.length === 0 ? (
        /* 🕵️‍♀️ SONUÇ BULUNAMADI EKRANI */
        <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm mt-4">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
            🕵️‍♀️
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3">
            Aradığın şeyi bulamadık...
          </h3>
          <p className="text-slate-500 font-medium text-lg mb-8 max-w-md mx-auto">
            Görünüşe göre kampüste henüz kimse "<span className="font-bold text-slate-700">{arananKelime}</span>" ile ilgili bir ilan eklememiş. Farklı kelimelerle aramayı deneyebilirsin.
          </p>
          <Link
            href="/"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 px-8 rounded-full transition-colors inline-block"
          >
            Tüm İlanlara Göz At
          </Link>
        </div>
      ) : (
        /* 📦 GERÇEK ÜRÜN KARTLARI (ANASAYFA İLE AYNI TASARIM) */
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((p: any) => (
            <Link
              href={`/listing-detail/${p.id}`}
              key={p.id}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col"
            >
              {/* FOTOĞRAF ALANI */}
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
                  <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                    Takas
                  </div>
                )}
                {p.priceType === "ucretsiz" && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                    Ücretsiz
                  </div>
                )}
              </div>

              {/* BİLGİ ALANI */}
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

// 🛡️ Ana Sayfa Bileşeni (Suspense Koruması)
export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={<div className="text-center font-bold text-slate-500 text-xl mt-20 animate-pulse">Arama sonuçları yükleniyor...</div>}>
        <AramaIcerigi />
      </Suspense>
    </main>
  );
}