"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

// 🌟 TRENDYOL TARZI YUVARLAK HIZLI ERİŞİM BUTONLARI
const QUICK_LINKS = [
  {
    title: "Ders Notu",

    icon: "📝",

    filter: "Ders Notları & Özetler",

    color: "bg-blue-50 text-blue-600 border-blue-100",
  },

  {
    title: "Telefon",

    icon: "📱",

    filter: "Cep Telefonu",

    color: "bg-slate-100 text-slate-700 border-slate-200",
  },

  {
    title: "Laptop",

    icon: "💻",

    filter: "Bilgisayar & Laptop",

    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },

  {
    title: "Kitaplar",

    icon: "📚",

    filter: "Ders & Sınav Kitapları",

    color: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },

  {
    title: "Ev Eşyası",

    icon: "🏠",

    filter: "Öğrenci Evi Mobilyası",

    color: "bg-sky-50 text-sky-600 border-sky-100",
  },

  {
    title: "Kozmetik",

    icon: "💄",

    filter: "Makyaj Ürünleri",

    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState("TÜMÜ");

  const [user, setUser] = useState<{
    id: number;

    fullName: string;

    email: string;
  } | null>(null);

  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  // 🚀 CANLI ARAMA (LIVE SEARCH) HAFIZASI

  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 🔔 BİLDİRİM VE AÇILIR MENÜ HAFIZASI

  const [notificationsCount, setNotificationsCount] = useState(0);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  // 📜 ALT MENÜ (FOOTER) POP-UP HAFIZASI

  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;

    title: string;

    content: string;
  }>({
    isOpen: false,

    title: "",

    content: "",
  });

  const openInfoModal = (title: string, content: string) => {
    setInfoModal({ isOpen: true, title, content });
  };

  // 🌐 JAVA'DAN GERÇEK İLANLARI ÇEKME MOTORU

  const fetchAllListings = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://unicycle-api.onrender.com/api/products",
      );

      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data)) {
          data.sort((a: any, b: any) => b.id - a.id);

          setProducts(data);
        }
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
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);

        const likes = JSON.parse(
          localStorage.getItem(`likes_${parsedUser.email}`) || "[]",
        );

        setLikedProducts(likes);

        // 🔔 GERÇEK BİLDİRİMLERİ ÇEK

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

              const activeNotifs = data

                .filter((n: any) => !deletedNotifs.includes(n.id))

                .reverse();

              const unreadNotifs = activeNotifs.filter(
                (n: any) => !seenNotifs.includes(n.id),
              );

              setNotificationsCount(unreadNotifs.length);

              setNotificationsList(activeNotifs);
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

    fetchAllListings();

    return () =>
      window.removeEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
  }, []);

  // 🚀 CANLI ARAMA ETKİSİ

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

        let combined: { type: "user" | "product"; item: any }[] = [];

        if (isUserSearch) {
          const userRes = await fetch(
            `https://unicycle-api.onrender.com/api/users/search?q=${encodeURIComponent(query)}`,
          );

          if (userRes.ok) {
            const users = await userRes.json();

            if (Array.isArray(users))
              combined = users.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const prodRes = await fetch(
            `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(query)}`,
          );

          if (prodRes.ok) {
            const products = await prodRes.json();

            if (Array.isArray(products)) {
              products.sort((a: any, b: any) => b.id - a.id);

              combined = products.map((p: any) => ({
                type: "product",

                item: p,
              }));
            }
          }
        }

        setLiveResults(combined);
      } catch (error) {
        console.error("Canlı arama hatası:", error);
      }
    };

    const timer = setTimeout(() => fetchLive(), 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleLogout = () => {
    localStorage.removeItem("user");

    setUser(null);

    setLikedProducts([]);

    window.location.href = "/";
  };

  // 💖 BEĞENİ VE BİLDİRİM GÖNDERME MOTORU

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

      // SQL'den Beğeniyi Sil

      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/interaction/likes?userId=${user.id}&productId=${productObject.id}`,

          { method: "DELETE" },
        );
      } catch (err) {
        console.error("Beğeni silinemedi:", err);
      }
    } else {
      newLikes.push(productObject.id);

      // SQL'e Beğeniyi Kaydet

      try {
        await fetch("https://unicycle-api.onrender.com/api/interaction/likes", {
          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({
            userId: user.id,

            productId: productObject.id,
          }),
        });
      } catch (err) {
        console.error("Beğeni kaydedilemedi:", err);
      }

      // 🚀 BİLDİRİM GÖNDERME

      if (productObject.user && productObject.user.id !== user.id) {
        try {
          await fetch(
            "https://unicycle-api.onrender.com/api/interaction/notifications",

            {
              method: "POST",

              headers: { "Content-Type": "application/json" },

              body: JSON.stringify({
                userId: productObject.user.id,

                message: `${user.fullName}, "${productObject.title}" adlı ilanını beğendi.`,
              }),
            },
          );
        } catch (err) {
          console.error("Bildirim gönderilemedi:", err);
        }
      }
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchTerm.trim() !== "") {
      setIsDropdownOpen(false);

      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  // 🗓️ AKADEMİK TAKVİME GÖRE AKILLI BANNER

  const getBannerContent = () => {
    const today = new Date();

    const month = today.getMonth() + 1;

    const year = today.getFullYear();

    if (year === 2025 && (month === 9 || month === 10)) {
      return {
        tag: "YENİ DÖNEM",

        title: "Güz Dönemi Başladı!",

        desc: "Kampüse hoş geldin! Ders notları, kitaplar ve eşyalar UniCycle'da seni bekliyor.",

        btn: "İlanları Keşfet",

        filterGroup: null,

        filterItem: "TÜMÜ",

        icon: "🎒",
      };
    } else if (year === 2025 && month === 11) {
      return {
        tag: "SINAV HAFTASI",

        title: "Güz Vizeleri Geldi Çattı!",

        desc: "Sınav stresi yapma! Üst dönemlerin ders notları ve özetleriyle hemen çalışmaya başla.",

        btn: "Ders Notlarını İncele",

        filterGroup: "📚 Akademik & Okul",

        filterItem: "Ders Notları & Özetler",

        icon: "📝",
      };
    } else if (
      (year === 2025 && month === 12) ||
      (year === 2026 && month === 1)
    ) {
      return {
        tag: "FİNAL DÖNEMİ",

        title: "Finaller Kapıda!",

        desc: "Dönemi kurtaran o son çıkmış sorular burada! Hemen incele, finalleri rahat geç.",

        btn: "Çıkmış Sorulara Bak",

        filterGroup: "📚 Akademik & Okul",

        filterItem: "Çıkmış Sorular",

        icon: "🎓",
      };
    } else if (year === 2026 && (month === 2 || month === 3)) {
      return {
        tag: "BAHAR DÖNEMİ",

        title: "Bahar Dönemi Başladı!",

        desc: "Eksik kitaplarını ve laboratuvar malzemelerini kampüsten uygun fiyata temin et.",

        btn: "Kitapları Keşfet",

        filterGroup: "📚 Akademik & Okul",

        filterItem: "Ders & Sınav Kitapları",

        icon: "📚",
      };
    } else if (year === 2026 && month === 4) {
      return {
        tag: "VİZE HAFTASI",

        title: "Bahar Vizeleri Başlıyor!",

        desc: "Vizelere az kaldı! Piri Reis'in en güncel ders notları ve özetleriyle sınavlara bomba gibi hazırlan.",

        btn: "Notları İncele",

        filterGroup: "📚 Akademik & Okul",

        filterItem: "Ders Notları & Özetler",

        icon: "✍️",
      };
    } else if (year === 2026 && (month === 5 || month === 6)) {
      return {
        tag: "FİNAL DÖNEMİ",

        title: "Final Haftası Yaklaşıyor!",

        desc: "Yaz tatiline çıkmadan önceki son viraj! Çıkmış sorularla son tekrarlarını yap.",

        btn: "Çıkmış Sorular",

        filterGroup: "📚 Akademik & Okul",

        filterItem: "Çıkmış Sorular",

        icon: "🎯",
      };
    } else {
      return {
        tag: "YAZ TATİLİ",

        title: "Kampüste Yaz Geldi!",

        desc: "Kullanmadığın ders kitaplarını ve eşyalarını satarak tatil harçlığını çıkarmanın tam zamanı.",

        btn: "Hemen İlan Ver",

        link: "/create-listing",

        icon: "🏖️",
      };
    }
  };

  const bannerData = getBannerContent();

  const handleBannerClick = () => {
    if (bannerData.link) {
      router.push(bannerData.link);
    } else {
      setExpandedGroup(bannerData.filterGroup || null);

      setActiveFilter(bannerData.filterItem || "TÜMÜ");
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
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans w-full overflow-x-hidden flex flex-col">
      {/* 🚀 ÜST MENÜ */}

      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100 flex flex-col">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-6 pt-1 sm:pt-0">
            {/* ✨ LOGO (KARE SİLİNDİ, ŞEFFAF VE SADE YAPILDI) */}

            <div className="flex-shrink-0">
              <Link
                href="/"
                onClick={() => {
                  setActiveFilter("TÜMÜ");

                  setExpandedGroup(null);

                  setSearchTerm("");
                }}
                className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform group cursor-pointer"
              >
                <Image
                  src="/logo.jpeg"
                  alt="UniCycle İkon"
                  width={44}
                  height={44}
                  className="object-contain bg-transparent mix-blend-multiply transition-all sm:w-[52px] sm:h-[52px]"
                  priority
                />

                <span className="text-2xl sm:text-[32px] font-extrabold tracking-tight text-slate-800">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

            {/* 🚀 MASAÜSTÜ ARAMA ÇUBUĞU */}

            <div className="hidden md:flex flex-1 max-w-3xl relative group z-50 px-8">
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

              {/* 🌟 AÇILIR MENÜ (DROPDOWN) */}

              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-8 right-8 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
                  {liveResults.slice(0, 5).map((result, idx) => {
                    if (result.type === "user") {
                      return (
                        <Link
                          href={`/user/${result.item.id}`}
                          key={`u-${result.item.id}-${idx}`}
                          className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0 text-sm">
                            {result.item.fullName
                              ? result.item.fullName.charAt(0).toUpperCase()
                              : "U"}
                          </div>

                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {result.item.fullName}
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium">
                              Kullanıcı • @
                              {result.item.fullName.split(" ")[0].toLowerCase()}
                            </div>
                          </div>
                        </Link>
                      );
                    } else {
                      return (
                        <Link
                          href={`/listing-detail/${result.item.id}`}
                          key={`p-${result.item.id}-${idx}`}
                          className="flex items-center gap-3 px-5 py-2 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden flex shrink-0 border border-slate-200">
                            {result.item.photosBase64 &&
                            result.item.photosBase64[0] ? (
                              <img
                                src={result.item.photosBase64[0]}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="m-auto text-lg">📦</span>
                            )}
                          </div>

                          <div className="flex-1 truncate">
                            <div className="font-bold text-slate-800 truncate text-sm">
                              {result.item.title}
                            </div>

                            <div className="text-[11px] font-bold text-blue-600 mt-0.5">
                              {result.item.priceType === "fiyat"
                                ? `₺${result.item.price}`
                                : result.item.priceType === "takas"
                                  ? "Takas"
                                  : "Ücretsiz"}
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  })}

                  <div
                    className="px-5 py-2.5 border-t border-slate-100 text-center bg-slate-50 mt-1 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={handleSearchSubmit}
                  >
                    <span className="text-xs font-bold text-blue-600">
                      Tüm sonuçları gör &rarr;
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 🚀 BUTONLAR */}

            <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
              {/* + İlan Ver (MASAÜSTÜ) */}

              <Link
                href="/create-listing"
                className="hidden md:flex font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {/* + İlan Ver (MOBİL) */}

              <Link
                href="/create-listing"
                className="flex md:hidden font-black text-[#20B2AA] hover:text-teal-700 items-center gap-1 transition-colors text-[11px] sm:text-base border border-[#20B2AA] px-2 py-1.5 rounded-lg"
              >
                <span className="text-sm">+</span> İlan
              </Link>

              {user ? (
                <div className="flex items-center gap-2 sm:gap-4 relative">
                  {/* 🔔 ZİL BUTONU VE BİLDİRİM PANELİ */}

                  <div className="relative shrink-0">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
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
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                          {notificationsCount}
                        </span>
                      )}
                    </button>

                    {/* 📦 KARE BİLDİRİM PANELİ */}

                    {isNotificationOpen && (
                      <div className="absolute top-full right-[-50px] sm:right-0 mt-3 w-[300px] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
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

                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {notificationsList.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-500 text-sm font-medium">
                              Şu an hiç bildirimin yok.
                            </div>
                          ) : (
                            notificationsList.slice(0, 5).map((notif: any) => {
                              // 🔥 SENKRONİZE EDİLMİŞ, DOĞRU EMOJİ MANTIĞI
                              let icon = "🔔";
                              let bg = "bg-blue-100";
                              let text = "text-blue-600";
                              const msgLower =
                                notif.message?.toLowerCase() || "";

                              // Önemli: "İlanını beğendi" cümlesinde "ilan" kelimesi "beğen"i ezmesin diye sıralamayı değiştirdik
                              if (
                                msgLower.includes("beğen") ||
                                msgLower.includes("favori")
                              ) {
                                icon = "❤️";
                                bg = "bg-red-100";
                                text = "text-red-600";
                              } else if (
                                msgLower.includes("mesaj") ||
                                msgLower.includes("yorum") ||
                                msgLower.includes("soru")
                              ) {
                                icon = "💬";
                                bg = "bg-green-100";
                                text = "text-green-600";
                              } else if (msgLower.includes("takip")) {
                                icon = "🌸";
                                bg = "bg-pink-100";
                                text = "text-pink-600";
                              } else if (
                                msgLower.includes("ilan") ||
                                msgLower.includes("ekledi")
                              ) {
                                icon = "📦";
                                bg = "bg-orange-100";
                                text = "text-orange-600";
                              }

                              return (
                                <div
                                  key={notif.id}
                                  className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer flex gap-3 items-center"
                                >
                                  <div
                                    className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${text} text-lg shrink-0`}
                                  >
                                    {icon}
                                  </div>

                                  <div className="flex-1">
                                    <p className="text-sm text-slate-700">
                                      {notif.message}
                                    </p>

                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {notif.createdAt
                                        ? new Date(
                                            notif.createdAt,
                                          ).toLocaleDateString("tr-TR")
                                        : "Yeni"}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
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
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-all"
                  >
                    <div className="w-5 h-5 sm:w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] sm:text-xs shrink-0">
                      👤
                    </div>

                    <span className="hidden sm:block text-sm">Hesabım</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="hidden sm:block text-slate-400 hover:text-red-500 font-bold transition-colors text-sm shrink-0"
                  >
                    Çıkış
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center bg-slate-800 text-white px-5 sm:px-6 py-2.5 rounded-full font-bold hover:bg-black transition-colors text-sm shrink-0"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 📱 SADECE MOBİL İÇİN ARAMA ÇUBUĞU (TAM EKRAN ENTEGRE) */}

        <div className="md:hidden pb-3 pt-2 w-full relative z-40 px-4 bg-white border-t border-slate-50 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <input
              type="text"
              placeholder="Ürün, @üye veya ders notu ara..."
              className="w-full bg-[#F3F4F6] text-slate-800 rounded-full py-2.5 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-[#20B2AA] transition-all border border-transparent font-medium text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);

                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            />

            <span className="absolute left-7 top-2.5 text-slate-400 text-lg">
              🔍
            </span>
          </form>

          {/* Mobil Açılır Menü */}

          {isDropdownOpen && liveResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-b-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
              {liveResults.slice(0, 4).map((result, idx) => (
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
                        {result.item.fullName.charAt(0).toUpperCase()}
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

      {/* 🖥️ ANA DÜZEN (Sol Menü + Sağ İçerik) */}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 flex gap-8 items-start w-full">
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

        <section className="flex-1 min-w-0 w-full">
          {/* 🔥 YUVARLAK İKONLAR (MOBİL) */}

          <div className="block lg:hidden bg-white -mx-4 px-4 py-5 mb-4 border-b border-slate-100 shadow-sm">
            <div className="flex justify-between overflow-x-auto custom-scrollbar gap-4">
              {QUICK_LINKS.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveFilter(link.filter);

                    setExpandedGroup(null);
                  }}
                  className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                >
                  <div
                    className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-2xl shadow-sm border ${link.color}`}
                  >
                    {link.icon}
                  </div>

                  <span className="text-[10px] font-bold text-slate-700 w-16 text-center leading-tight">
                    {link.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 🔥 MOBİL KATEGORİ MENÜSÜ */}

          <div className="block lg:hidden mb-6">
            <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 -mx-4 px-4">
              <button
                onClick={() => {
                  setExpandedGroup(null);

                  setActiveFilter("TÜMÜ");
                }}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm ${activeFilter === "TÜMÜ" ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}
              >
                Tümü
              </button>

              {Object.keys(CATEGORY_MAP).map((cat) => {
                let shortName = cat.split(" ")[1] || cat.split(" ")[0];

                shortName = shortName.replace(/,/g, ""); // Virgülleri uçurduk

                return (
                  <button
                    key={cat}
                    onClick={() => handleMainCategoryClick(cat)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-full font-bold text-sm ${expandedGroup === cat ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"}`}
                  >
                    {shortName}
                  </button>
                );
              })}
            </div>

            {expandedGroup && CATEGORY_MAP[expandedGroup] && (
              <div className="flex overflow-x-auto custom-scrollbar gap-2 mt-2 pb-2 -mx-4 px-4 animate-in fade-in">
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

          {/* 🌟 DİNAMİK BANNER */}

          {activeFilter === "TÜMÜ" && searchTerm === "" && (
            <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 mb-8 sm:mb-10 text-white shadow-xl relative overflow-hidden flex items-center">
              <div className="relative z-10 max-w-lg">
                <span className="bg-white/20 backdrop-blur-sm text-white font-black px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs mb-3 sm:mb-4 inline-block tracking-widest uppercase">
                  {bannerData.tag}
                </span>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 leading-tight tracking-tight">
                  {bannerData.title}
                </h2>

                <p className="text-base sm:text-lg font-medium opacity-90 mb-5 sm:mb-6 leading-relaxed">
                  {bannerData.desc}
                </p>

                <button
                  onClick={handleBannerClick}
                  className="bg-white text-blue-700 font-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg hover:scale-105 transition-transform text-sm sm:text-base"
                >
                  {bannerData.btn}
                </button>
              </div>

              <div className="absolute right-0 -bottom-10 opacity-20 md:opacity-40 text-[120px] sm:text-[150px] md:text-[220px] leading-none transform -rotate-12 pointer-events-none">
                {bannerData.icon}
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-4 sm:mb-6 pb-2 sm:pb-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {searchTerm
                ? `"${searchTerm}" araması`
                : activeFilter === "TÜMÜ"
                  ? "Kampüsün En Yenileri"
                  : `${activeFilter}`}
            </h3>

            <div className="text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">
              Sırala: En Yeni ▾
            </div>
          </div>

          {/* ⏳ PROFESYONEL İSKELET YÜKLEME */}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col animate-pulse"
                >
                  <div className="aspect-[4/5] bg-slate-200 w-full"></div>

                  <div className="p-3 sm:p-4 flex-1 flex flex-col gap-3 sm:gap-4">
                    <div className="flex justify-between items-center mt-1">
                      <div className="h-2 sm:h-2.5 bg-slate-200 rounded-full w-1/3"></div>

                      <div className="h-4 sm:h-5 bg-slate-100 rounded-md w-1/4"></div>
                    </div>

                    <div className="space-y-2 mt-1 sm:mt-2">
                      <div className="h-3 sm:h-3.5 bg-slate-200 rounded-full w-5/6"></div>

                      <div className="h-3 sm:h-3.5 bg-slate-200 rounded-full w-4/6"></div>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-4 sm:pt-6">
                      <div className="h-4 sm:h-5 bg-slate-300 rounded-full w-1/3"></div>

                      <div className="h-3 sm:h-4 bg-slate-100 rounded-md w-1/4 border border-slate-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 sm:py-20 bg-white rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-sm mt-4 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl sm:text-5xl mx-auto mb-4 sm:mb-6">
                🕵️‍♀️
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 sm:mb-3">
                Buralar biraz ıssız...
              </h3>

              <p className="text-slate-500 font-medium text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
                Sanki kampüste kimse bu kategoride bir şey satmıyor. İlk adımı
                sen atmaya ne dersin?
              </p>

              <Link
                href="/create-listing"
                className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 sm:py-4 px-8 sm:px-10 rounded-xl sm:rounded-2xl transition shadow-xl shadow-blue-200 inline-block hover:-translate-y-1 text-sm sm:text-base"
              >
                Hemen İlan Ver
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {filteredProducts.map((p: any) => {
                const isLiked = likedProducts.includes(p.id);

                return (
                  <Link
                    href={`/listing-detail/${p.id}`}
                    key={p.id}
                    className="group bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer w-full h-full relative z-10"
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-slate-100">
                      {p.photosBase64 && p.photosBase64.length > 0 ? (
                        <img
                          src={p.photosBase64[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl">
                          📦
                        </div>
                      )}

                      {p.priceType === "takas" && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-purple-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg shadow-md uppercase tracking-wider backdrop-blur-sm">
                          Takas
                        </div>
                      )}

                      {p.priceType === "ucretsiz" && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-green-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md sm:rounded-lg shadow-md uppercase tracking-wider backdrop-blur-sm">
                          Ücretsiz
                        </div>
                      )}

                      {/* TIKLANMA ÇAKIŞMASINI ÖNLEYEN KALP BUTONU */}

                      <button
                        onClick={(e) => toggleLike(e, p)}
                        className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-110 active:scale-95 z-30 ${isLiked ? "bg-red-500/90 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"}`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-1">
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider line-clamp-1 flex-1">
                          {p.category}
                        </span>

                        <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shrink-0">
                          @
                          {p.user && p.user.fullName
                            ? p.user.fullName.split(" ")[0]
                            : "Öğrenci"}
                        </span>
                      </div>

                      <h2 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </h2>

                      <div className="mt-auto flex items-end justify-between">
                        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {p.priceType === "fiyat"
                            ? `₺${p.price}`
                            : p.priceType === "takas"
                              ? "Takas"
                              : "Bedava"}
                        </div>

                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg">
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

      {/* 📜 FOOTER BİLGİ POP-UP'I (MODAL) */}

      {infoModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg sm:text-xl font-black text-slate-800">
                {infoModal.title}
              </h2>

              <button
                onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                className="text-slate-400 hover:text-red-500 text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 text-sm sm:text-base text-slate-600 font-medium whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
              {infoModal.content}
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 sm:py-2.5 px-5 sm:px-6 rounded-xl transition-colors shadow-md text-sm sm:text-base"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌊 FOOTER */}

      <footer className="bg-white border-t border-slate-200 py-8 sm:py-12 px-6 mt-10 rounded-t-[2rem] sm:rounded-t-[3rem] shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 text-center md:text-left">
            <div className="mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                Uni<span className="text-[#20B2AA]">Cycle</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm mx-auto md:mx-0">
              Kampüs içindeki güvenli 2. el pazar yerin. Sadece üniversite
              öğrencilerine özel, doğrulanmış ve güvenilir alışveriş deneyimi.
            </p>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-slate-800 font-bold mb-3 sm:mb-4 text-sm sm:text-base">
              Platform
            </h4>

            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-slate-500">
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Nasıl Çalışır?",

                      "UniCycle'da alışveriş yapmak çok kolay!\n\n1. Kendi üniversitenin e-postasıyla kayıt ol.\n2. İhtiyacın olmayan eşyalarını ilan olarak ekle.\n3. Kampüsündeki diğer öğrencilerle mesajlaşarak güvenle alışveriş yap!",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Nasıl Çalışır?
                </button>
              </li>

              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Güvenlik İpuçları",

                      "Alışverişlerinde güvenliğin için şu kurallara dikkat et:\n\n• Sadece kampüs içindeki güvenli ve kalabalık alanlarda (kütüphane, kafeterya vb.) buluşun.\n• Kimseye önceden para veya kapora göndermeyin.\n• Şüpheli durumlarda ilanları bize şikayet edin.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Güvenlik İpuçları
                </button>
              </li>

              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Kampüs Kuralları",

                      "Bu platform tamamen öğrencilere aittir.\n\n• Saygılı bir iletişim dili kullanmak zorunludur.\n• Sadece yasal ve kampüs kurallarına uygun ürünler satılabilir (Ders notu, kitap, eşya vb.).\n• Kopya veya telif hakkı ihlali içeren materyallerin satışı yasaktır.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Kampüs Kuralları
                </button>
              </li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h4 className="text-slate-800 font-bold mb-3 sm:mb-4 text-sm sm:text-base">
              İletişim
            </h4>

            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-medium text-slate-500">
              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Destek Merkezi",

                      "Yaşadığın bir sorun mu var?\n\nEkibimize destek@unicycle.com adresinden ulaşabilirsin. Bütün taleplere 24 saat içinde geri dönüş sağlıyoruz.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Destek Merkezi
                </button>
              </li>

              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Bize Ulaşın",

                      "Adres: UniCycle Öğrenci İnovasyon Merkezi, Teknopark Binası, 3. Kat\n\nE-posta: iletisim@unicycle.com\nTelefon: +90 (850) 123 45 67",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  Bize Ulaşın
                </button>
              </li>

              <li>
                <button
                  onClick={() =>
                    openInfoModal(
                      "Sıkça Sorulan Sorular",

                      "S: Üye olmak ücretli mi?\nC: Hayır, UniCycle üniversite öğrencileri için tamamen ücretsizdir.\n\nS: Kargo ile ürün gönderebilir miyim?\nC: Platformumuz kampüs içi elden teslim odaklıdır ancak satıcı ile anlaşırsanız kargo da yapabilirsiniz.",
                    )
                  }
                  className="hover:text-blue-600 transition-colors"
                >
                  S.S.S.
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto mt-6 sm:mt-12 pt-4 sm:pt-8 border-t border-slate-100 text-center text-[10px] sm:text-xs font-medium text-slate-400">
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

      `,
        }}
      />
    </main>
  );
}
