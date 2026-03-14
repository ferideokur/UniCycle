"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation"; // 1. YENİ EKLENDİ: Yönlendirme için router

// 📦 SİHİRLİ KATEGORİ HARİTASI
const CATEGORY_MAP: Record<string, string[]> = {
  "📚 Akademik & Okul": [
    "Ders Notları & Özetler",
    "Çıkmış Sorular",
    "Ders & Sınav Kitapları",
    "Yabancı Dil (YDS/TOEFL vb.)",
    "Kırtasiye & Çizim Malzemeleri",
    "Laboratuvar & Mimarlık Malzemeleri",
  ],
  "👗 Kadın": [
    "Kadın Üst Giyim",
    "Kadın Alt Giyim",
    "Kadın Dış Giyim",
    "Kadın Ayakkabı",
    "Kadın Çanta",
    "Kadın Aksesuar & Takı",
    "Abiye & Mezuniyet Elbisesi",
  ],
  "👔 Erkek": [
    "Erkek Üst Giyim",
    "Erkek Alt Giyim",
    "Erkek Dış Giyim",
    "Erkek Ayakkabı",
    "Erkek Çanta & Cüzdan",
    "Erkek Aksesuar & Saat",
    "Takım Elbise",
  ],
  "💄 Kozmetik & Bakım": [
    "Makyaj Ürünleri",
    "Parfüm & Deodorant",
    "Cilt & Yüz Bakımı",
    "Saç Bakımı & Şekillendirici",
    "Unisex Bakım",
  ],
  "📱 Elektronik & Teknoloji": [
    "Cep Telefonu",
    "Telefon Aksesuar & Kılıf",
    "Bilgisayar & Laptop",
    "Tablet",
    "Kulaklık & Ses Sistemleri",
    "Akıllı Saat & Bileklik",
    "Oyun Bilgisayarı & Ekipman",
    "Kamera & Fotoğraf Makinesi",
  ],
  "🏠 Yaşam, Ev & Yurt": [
    "Öğrenci Evi Mobilyası",
    "Yurt Eşyaları",
    "Küçük Ev Aletleri",
    "Mutfak Gereçleri",
    "Kupa & Termos",
    "Nevresim & Yatak Örtüsü",
    "Ev Dekorasyon",
  ],
  "🎸 Hobi, Oyun & Spor": [
    "Roman & Okuma Kitabı",
    "Kutu Oyunları",
    "PlayStation / Konsol Oyunları",
    "Spor & Kamp Malzemeleri",
    "Müzik Aletleri",
    "Bisiklet & Scooter",
    "Etkinlik & Konser Bileti",
  ],
  "🎒 Kampüs İçi Hizmet": [
    "Özel Ders Verenler",
    "Çeviri & Ödev Yardımı",
    "Ev Arkadaşı Arayanlar",
    "Eşya Kiralama",
    "Kayıp Eşya",
    "Diğer Her Şey",
  ],
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 2. YENİ EKLENDİ: Router'ı tanımlıyoruz
  const router = useRouter();

  // 🧠 ÇİFT KATMANLI KATEGORİ HAFIZASI
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("TÜMÜ");

  const [user, setUser] = useState<{
    id: number;
    fullName: string;
    email: string;
  } | null>(null);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  // 🌐 JAVA'DAN GERÇEK İLANLARI ÇEKME MOTORU
  const fetchAllListings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/products");
      if (response.ok) {
        const data = await response.json();
        // İlanları en yeniden en eskiye (ID'si büyükten küçüğe) sıralayalım
        data.sort((a: any, b: any) => b.id - a.id);
        setProducts(data);
      } else {
        console.error("Sunucudan ilanlar alınamadı.");
      }
    } catch (error) {
      console.error("Java'ya bağlanılamadı. Arka planda açık mı?", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const likes = JSON.parse(
        localStorage.getItem(`likes_${parsedUser.email}`) || "[]",
      );
      setLikedProducts(likes);
    }

    // Gerçek Veritabanından (Java) İlanları Çek
    fetchAllListings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setLikedProducts([]);
  };

  const toggleLike = (e: React.MouseEvent, productId: number) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      alert("Beğenmek için giriş yapmalısın!");
      return;
    }

    let newLikes = [...likedProducts];
    if (newLikes.includes(productId)) {
      newLikes = newLikes.filter((id) => id !== productId);
    } else {
      newLikes.push(productId);
    }

    setLikedProducts(newLikes);
    localStorage.setItem(`likes_${user.email}`, JSON.stringify(newLikes));
  };

  const handleMainCategoryClick = (mainCat: string) => {
    if (expandedGroup === mainCat) {
      setExpandedGroup(null);
      setActiveFilter("TÜMÜ");
    } else {
      setExpandedGroup(mainCat);
      setActiveFilter(mainCat);
    }
  };

  // 3. YENİ EKLENDİ: Arama işlemini tetikleyen fonksiyon
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Sayfanın yenilenmesini engeller
    if (searchTerm.trim() !== "") {
      // Kullanıcıyı arama sayfasına parametre ile gönder
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesCategory = false;
    if (activeFilter === "TÜMÜ") {
      matchesCategory = true;
    } else if (CATEGORY_MAP[activeFilter]) {
      matchesCategory = CATEGORY_MAP[activeFilter].includes(p.category);
    } else {
      matchesCategory = p.category === activeFilter;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      {/* 🚀 ÜST MENÜ */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-6">
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-3 hover:scale-105 transition-transform group"
              >
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

            {/* 4. DEĞİŞTİRİLDİ: div yerine form kullandık ki Enter tuşu çalışsın */}
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
              {/* Görünmez bir submit butonu ekliyoruz ki form Enter ile tetiklensin */}
              <button type="submit" className="hidden">Ara</button>
            </form>

            <div className="flex items-center gap-5">
              <Link
                href="/create-listing"
                className="hidden sm:flex font-black text-blue-600 hover:text-blue-800 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
                  >
                    👤 {user.fullName.split(" ")[0]}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 font-bold transition-colors text-sm"
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-black transition-colors"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🖥️ ANA DÜZEN (Sol Menü + Sağ İçerik) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex gap-8 items-start">
        {/* 🗂️ AKORDEON SOL MENÜ */}
        <aside className="w-72 hidden lg:block sticky top-28 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-lg text-slate-800 mb-5 pl-2">
            Kategoriler
          </h3>

          <ul className="space-y-1">
            <li>
              <button
                onClick={() => {
                  setExpandedGroup(null);
                  setActiveFilter("TÜMÜ");
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all mb-2 ${activeFilter === "TÜMÜ" ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Tüm İlanlar
              </button>
            </li>

            {Object.entries(CATEGORY_MAP).map(([mainCat, subCats]) => {
              const isExpanded = expandedGroup === mainCat;
              const isMainActive = activeFilter === mainCat;

              return (
                <li key={mainCat} className="mb-1">
                  <button
                    onClick={() => handleMainCategoryClick(mainCat)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between ${
                      isExpanded || isMainActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }`}
                  >
                    <span className="truncate">{mainCat}</span>
                    <span
                      className={`text-xs transition-transform duration-300 ml-2 ${isExpanded ? "rotate-90 text-blue-600" : "text-slate-400"}`}
                    >
                      ▶
                    </span>
                  </button>

                  {isExpanded && (
                    <ul className="pl-6 pr-2 py-2 space-y-1 border-l-2 border-blue-100 ml-6 mt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      {subCats.map((subCat) => {
                        const isSubActive = activeFilter === subCat;
                        return (
                          <li key={subCat}>
                            <button
                              onClick={() => setActiveFilter(subCat)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                isSubActive
                                  ? "bg-blue-600 text-white shadow-sm"
                                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                            >
                              {subCat}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* 🛍️ SAĞ İÇERİK ALANI */}
        <section className="flex-1 min-w-0">
          <div className="block lg:hidden mb-6">
            <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2">
              <button
                onClick={() => {
                  setExpandedGroup(null);
                  setActiveFilter("TÜMÜ");
                }}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm ${activeFilter === "TÜMÜ" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
              >
                Tümü
              </button>
              {Object.keys(CATEGORY_MAP).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleMainCategoryClick(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm ${expandedGroup === cat ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {expandedGroup && CATEGORY_MAP[expandedGroup] && (
              <div className="flex overflow-x-auto custom-scrollbar gap-2 mt-2 pb-2 animate-in fade-in">
                {CATEGORY_MAP[expandedGroup].map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setActiveFilter(subCat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilter === subCat ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeFilter === "TÜMÜ" && searchTerm === "" && (
            <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-12 mb-10 text-white shadow-xl relative overflow-hidden flex items-center">
              <div className="relative z-10 max-w-lg">
                <span className="bg-white/20 backdrop-blur-sm text-white font-black px-4 py-1.5 rounded-full text-xs mb-4 inline-block tracking-widest">
                  YENİ DÖNEM BAŞLIYOR
                </span>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                  Vizeler Yaklaşıyor!
                </h2>
                <p className="text-lg font-medium opacity-90 mb-6 leading-relaxed">
                  Üst dönemlerin ders notlarını, çıkmış sorularını ve
                  kitaplarını hemen keşfet. Hazır notlar seni bekliyor.
                </p>
                <button className="bg-white text-blue-700 font-black px-8 py-3.5 rounded-full shadow-lg hover:scale-105 transition-transform">
                  Notları İncele
                </button>
              </div>
              <div className="absolute right-0 -bottom-10 opacity-20 md:opacity-40 text-[150px] md:text-[220px] leading-none transform -rotate-12">
                📚
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-6 pb-4">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {searchTerm
                ? `"${searchTerm}" araması`
                : activeFilter === "TÜMÜ"
                  ? "Kampüsün En Yenileri"
                  : `${activeFilter}`}
            </h3>
            <div className="text-sm font-bold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">
              Sırala: En Yeni ▾
            </div>
          </div>

          {/* ⏳ PROFESYONEL İSKELET YÜKLEME (SKELETON LOADING) EKRANI */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
              {/* 8 adet boş, yanıp sönen (pulse) kart iskeleti */}
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
                    <div className="mt-auto flex items-end justify-between pt-6">
                      <div className="h-5 bg-slate-300 rounded-full w-1/3"></div>
                      <div className="h-4 bg-slate-100 rounded-md w-1/4 border border-slate-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            /* 🕵️‍♀️ BOŞ EKRAN */
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm mt-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
                🕵️‍♀️
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">
                Buralar biraz ıssız...
              </h3>
              <p className="text-slate-500 font-medium text-lg mb-8 max-w-md mx-auto">
                Sanki kampüste kimse bu kategoride bir şey satmıyor. İlk adımı
                sen atmaya ne dersin?
              </p>
              <Link
                href="/create-listing"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-10 rounded-2xl transition shadow-xl shadow-blue-200 inline-block hover:-translate-y-1"
              >
                Hemen İlan Ver
              </Link>
            </div>
          ) : (
            /* 📦 GERÇEK ÜRÜN KARTLARI (JAVA'DAN GELEN VERİLER) */
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((p: any) => {
                const isLiked = likedProducts.includes(p.id);

                return (
                  <Link
                    href={`/listing-detail/${p.id}`}
                    key={p.id}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 flex flex-col"
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
                        <div className="absolute top-3 left-3 bg-purple-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider backdrop-blur-sm">
                          Takas
                        </div>
                      )}
                      {p.priceType === "ucretsiz" && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider backdrop-blur-sm">
                          Ücretsiz
                        </div>
                      )}

                      {/* ❤️ BEĞENİ BUTONU */}
                      <button
                        onClick={(e) => toggleLike(e, p.id)}
                        className={`absolute top-3 right-3 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-10 ${
                          isLiked
                            ? "bg-red-500/90 text-white"
                            : "bg-white/90 text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <svg
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
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
                        <div className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded-lg">
                          {p.itemCondition ? p.itemCondition.split(" ")[0] : ""}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-scrollbar::-webkit-scrollbar { height: 0px; }`,
        }}
      />

      {/* 🌊 AÇIK RENK, MİNİMALİST FOOTER */}
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
    </main>
  );
}