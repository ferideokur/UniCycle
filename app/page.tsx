"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
  const [user, setUser] = useState<any>(null);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

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
      console.error(error);
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
      fetch(
        `https://unicycle-api.onrender.com/api/interaction/notifications/${parsedUser.id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setNotificationsCount(data.length);
            setNotificationsList(data.reverse());
          }
        })
        .catch((err) => console.error(err));
    }
    fetchAllListings();
  }, []);

  useEffect(() => {
    const fetchLive = async () => {
      if (searchTerm.trim().length < 2) {
        setLiveResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://unicycle-api.onrender.com/api/products/search?q=${encodeURIComponent(searchTerm)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.map((p: any) => ({ type: "product", item: p })));
        }
      } catch (e) {
        console.error(e);
      }
    };
    const timer = setTimeout(fetchLive, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleBannerClick = () => {
    setExpandedGroup("📚 Akademik & Okul");
    setActiveFilter("Ders Notları & Özetler");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() !== "")
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const toggleLike = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return alert("Giriş yapmalısın!");
    let newLikes = [...likedProducts];
    if (newLikes.includes(product.id)) {
      newLikes = newLikes.filter((id) => id !== product.id);
      await fetch(
        `https://unicycle-api.onrender.com/api/interaction/likes?userId=${user.id}&productId=${product.id}`,
        { method: "DELETE" },
      );
    } else {
      newLikes.push(product.id);
      await fetch("https://unicycle-api.onrender.com/api/interaction/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
    }
    setLikedProducts(newLikes);
    localStorage.setItem(`likes_${user.email}`, JSON.stringify(newLikes));
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 font-sans w-full overflow-x-hidden flex flex-col">
      {/* 🚀 ÜST MENÜ */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 h-20 flex justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logo.jpeg"
              alt="UniCycle"
              width={44}
              height={44}
              className="rounded-md"
              priority
            />
            <span className="text-2xl sm:text-[32px] font-extrabold text-slate-800">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-3xl relative group">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Ürün ara..."
                className="w-full bg-slate-100 rounded-full py-3 px-6 pl-14 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
              <span className="absolute left-5 top-3.5 text-slate-400">🔍</span>
            </form>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/create-listing" className="font-black text-[#20B2AA]">
              + İlan
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs"
              >
                Hesabım
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-slate-800 text-white px-4 py-2 rounded-full font-bold text-xs"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 mt-6 flex gap-8 w-full">
        {/* İçerik ve Banner Buraya Gelecek */}
        <section className="flex-1 min-w-0">
          {/* Hızlı Erişim İkonları */}
          <div className="flex justify-between overflow-x-auto gap-4 py-4 mb-4 border-b">
            {QUICK_LINKS.map((link, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFilter(link.filter)}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
              >
                <div
                  className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-2xl border ${link.color}`}
                >
                  {link.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-700 w-16 text-center">
                  {link.title}
                </span>
              </div>
            ))}
          </div>

          {/* Banner */}
          <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 sm:p-12 mb-8 text-white relative overflow-hidden">
            <h2 className="text-3xl sm:text-5xl font-black mb-4">
              Vize Haftası Başlıyor!
            </h2>
            <button
              onClick={handleBannerClick}
              className="bg-white text-blue-700 font-black px-8 py-3 rounded-full"
            >
              Notları İncele
            </button>
            <div className="absolute right-0 -bottom-10 opacity-20 text-[150px] pointer-events-none">
              📝
            </div>
          </div>

          {/* Ürün Kartları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              <p>Yükleniyor...</p>
            ) : (
              products
                .filter(
                  (p) => activeFilter === "TÜMÜ" || p.category === activeFilter,
                )
                .map((p) => (
                  <Link
                    href={`/listing-detail/${p.id}`}
                    key={p.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border"
                  >
                    <div className="aspect-[4/5] relative bg-slate-100">
                      {p.photosBase64?.[0] && (
                        <img
                          src={p.photosBase64[0]}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={(e) => toggleLike(e, p)}
                        className={`absolute top-2 right-2 p-2 rounded-full ${likedProducts.includes(p.id) ? "bg-red-500 text-white" : "bg-white text-gray-400"}`}
                      >
                        ❤️
                      </button>
                    </div>
                    <div className="p-3">
                      <h2 className="text-sm font-bold truncate">{p.title}</h2>
                      <div className="text-lg font-black text-slate-900">
                        ₺{p.price}
                      </div>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
