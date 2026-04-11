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

export default function ListingDetailPage() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  // 📦 İlan ve UI Hafızası
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  // 👤 Kullanıcı, Beğeni ve Bildirim Hafızası
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0); // Toplam Beğeni Sayısı
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 🔍 Arama Hafızası
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<
    { type: "user" | "product"; item: any }[]
  >([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 💬 Yorum Hafızası
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // 🔔 Navbar sayacını güncelleyen fonksiyon
  const updateNotificationCount = (userId: number) => {
    fetch(
      `https://unicycle-api.onrender.com/api/interaction/notifications/${userId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const deletedNotifs = JSON.parse(
            localStorage.getItem(`deletedNotifs_${userId}`) || "[]",
          );
          const seenNotifs = JSON.parse(
            localStorage.getItem(`seenNotifs_${userId}`) || "[]",
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
  };

  // 1. Sayfa Yüklendiğinde Verileri Çek
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);

      const likes = JSON.parse(
        localStorage.getItem(`likes_${parsedUser.email}`) || "[]",
      );
      setIsLiked(likes.includes(Number(id)));

      updateNotificationCount(parsedUser.id);
      window.addEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
    }

    // İlan detayını çekiyoruz
    fetch("https://unicycle-api.onrender.com/api/products")
      .then((res) => res.json())
      .then((data) => {
        const foundProduct = data.find((p: any) => p.id.toString() === id);
        setProduct(foundProduct);
        setLoading(false);
        fetchComments();
        fetchLikeCount(); // SQL Sayacını Çalıştır
      })
      .catch((err) => {
        console.error("Hata:", err);
        setLoading(false);
      });

    return () =>
      window.removeEventListener("notificationsSeen", () =>
        setNotificationsCount(0),
      );
  }, [id]);

  // 🚀 SQL: BEĞENİ SAYISINI ÇEKME MOTORU
  const fetchLikeCount = async () => {
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/interaction/likes/count/${id}`,
      );
      if (res.ok) {
        const count = await res.json();
        setLikeCount(count);
      }
    } catch (err) {
      console.error("Beğeni sayısı çekilemedi:", err);
    }
  };

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
            const data = await userRes.json();
            if (Array.isArray(data))
              combined = data.map((u: any) => ({ type: "user", item: u }));
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
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/comments/product/${id}`,
      );
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleMessageClick = () => {
    if (!currentUser) return showToast("🔒 Mesaj atmak için giriş yapmalısın!");
    showToast("💬 Satıcıya mesaj penceresi yakında eklenecek!");
  };

  // ❤️ BEĞENME VE BİLDİRİM MOTORU (GÜNCELLENDİ)
  const handleLikeToggle = async () => {
    if (!currentUser) {
      showToast("🔒 Beğenmek için giriş yapmalısın!");
      return;
    }

    const currentLikes = JSON.parse(
      localStorage.getItem(`likes_${currentUser.email}`) || "[]",
    );
    let newLikes;

    if (isLiked) {
      newLikes = currentLikes.filter((favId: number) => favId !== Number(id));
      setLikeCount((prev) => Math.max(0, prev - 1));
      showToast("💔 İlan favorilerden çıkarıldı!");

      // 🚀 SQL: Beğeniyi Sil (CANLI)
      try {
        await fetch(
          `https://unicycle-api.onrender.com/api/interaction/likes?userId=${currentUser.id}&productId=${id}`,
          {
            method: "DELETE",
          },
        );
      } catch (err) {
        console.error("Beğeni veritabanından silinemedi:", err);
      }
    } else {
      newLikes = [...currentLikes, Number(id)];
      setLikeCount((prev) => prev + 1);
      showToast("❤️ İlan favorilere eklendi!");

      // 🚀 SQL: Beğeniyi Ekle (CANLI)
      try {
        await fetch("https://unicycle-api.onrender.com/api/interaction/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            productId: Number(id),
          }),
        });
      } catch (err) {
        console.error("Beğeni veritabanına kaydedilemedi:", err);
      }

      if (product && product.user && product.user.id !== currentUser.id) {
        try {
          await fetch(
            "https://unicycle-api.onrender.com/api/interaction/notifications",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: product.user.id,
                message: `${currentUser.fullName}, "${product.title}" ilanını beğendi.`,
              }),
            },
          );
        } catch (err) {
          console.error("Bildirim gönderilemedi:", err);
        }
      }
    }

    localStorage.setItem(
      `likes_${currentUser.email}`,
      JSON.stringify(newLikes),
    );
    setIsLiked(!isLiked);
  };

  // 💬 YORUM EKLEME MOTORU
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser)
      return showToast("🔒 Yorum yapmak için giriş yapmalısın!");
    if (newComment.trim() === "") return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(
        "https://unicycle-api.onrender.com/api/comments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            productId: Number(id),
            text: newComment,
          }),
        },
      );
      if (res.ok) {
        setNewComment("");
        fetchComments();
        showToast("✅ Yorum başarıyla eklendi!");
        if (product && product.user && product.user.id !== currentUser.id) {
          try {
            await fetch(
              "https://unicycle-api.onrender.com/api/interaction/notifications",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: product.user.id,
                  message: `${currentUser.fullName}, "${product.title}" ilanına bir yorum yaptı.`,
                }),
              },
            );
          } catch (err) {
            console.error("Bildirim gönderilemedi:", err);
          }
        }
      }
    } catch (err) {
      console.error("Yorum eklenemedi", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(
        `https://unicycle-api.onrender.com/api/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        fetchComments();
        showToast("🗑️ Yorum silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("tr-TR") +
      " " +
      date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin text-5xl">⏳</div>
      </div>
    );
  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold text-slate-800">İlan bulunamadı!</h2>
        <Link href="/" className="mt-4 text-blue-600 font-bold hover:underline">
          Ana Sayfaya Dön
        </Link>
      </div>
    );

  const photos =
    product.photosBase64 && product.photosBase64.length > 0
      ? product.photosBase64
      : ["https://via.placeholder.com/800x600?text=Fotograf+Yok"];
  const sellerName = product.user?.fullName || "Bilinmeyen Satıcı";
  const isOwner =
    currentUser &&
    product.user &&
    Number(currentUser.id) === Number(product.user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans relative">
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 hover:scale-105 transition-transform group"
          >
            <Image
              src="/logo.jpeg"
              alt="UniCycle İkon"
              width={52}
              height={52}
              className="object-contain drop-shadow-sm rounded-md"
              priority
            />
            <span className="text-[32px] font-extrabold tracking-tight text-slate-800 hidden md:block">
              Uni<span className="text-[#20B2AA]">Cycle</span>
            </span>
          </Link>

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
              />
              <span className="absolute left-5 top-3.5 text-slate-400">🔍</span>
            </form>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3 relative">
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    {notificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {notificationsCount}
                      </span>
                    )}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
                      <Link
                        href="/notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="block w-full text-center px-4 py-3 bg-slate-50 text-xs font-bold text-blue-600"
                      >
                        Tüm Bildirimleri Gör &rarr;
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm"
                >
                  👤 Hesabım
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 font-bold text-sm ml-2"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 🖥️ ANA İÇERİK */}
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <Link href="/" className="hover:text-blue-600">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-600">{product.category}</span>
          </div>
          <button
            onClick={() => router.back()}
            className="font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm"
          >
            <span>&larr;</span> Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden relative flex items-center justify-center">
                <img
                  src={photos[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-4">
                İlan Açıklaması
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {product.description || "Açıklama yok."}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <MessageSquare className="text-blue-500" size={24} />
                <h3 className="text-xl font-black text-slate-800">
                  Soru ve Yorumlar
                </h3>
                <span className="bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full text-sm">
                  {comments.length}
                </span>
              </div>
              <form onSubmit={handleAddComment} className="mb-8 flex gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black shrink-0">
                  {currentUser
                    ? currentUser.fullName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bir soru sor..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group relative">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold shrink-0">
                      {comment.user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">
                          {comment.user?.fullName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm font-medium">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h1 className="text-2xl font-extrabold text-slate-800 leading-tight mb-4">
                {product.title}
              </h1>
              <div className="mb-6">
                <div className="text-4xl font-black text-blue-600">
                  {product.priceType === "fiyat"
                    ? `${product.price} ₺`
                    : product.priceType === "takas"
                      ? "🤝 Takas"
                      : "🎁 Ücretsiz"}
                </div>
              </div>

              <div className="flex gap-3">
                {/* ❤️ GÜNCELLENMİŞ ESTETİK FAVORİ BUTONU */}
                <button
                  onClick={handleLikeToggle}
                  className={`flex-1 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
                    isLiked
                      ? "bg-red-50 text-red-600 border-red-200 shadow-inner"
                      : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200 shadow-sm"
                  } border`}
                >
                  <div className="flex items-center gap-2">
                    <Heart
                      size={22}
                      className={`${isLiked ? "fill-current text-red-500 scale-110" : "text-slate-400"} transition-transform`}
                    />
                    <span className="text-lg font-black tabular-nums">
                      {likeCount}
                    </span>
                  </div>

                  <div className="w-[1px] h-5 bg-slate-200 opacity-80"></div>

                  <span className="text-[13px] font-black uppercase tracking-wider">
                    {isLiked ? "Favorilerde" : "Favoriye Al"}
                  </span>
                </button>
                <button className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl text-slate-600 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <Link
                href={`/user/${product.user?.id}`}
                className="flex items-center gap-4 mb-6 hover:bg-slate-50 p-3 -mx-3 rounded-2xl transition-all"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold text-slate-800">
                    {sellerName}
                  </h3>
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-400">
                    <ShieldCheck size={16} className="text-green-500" /> Kampüs
                    Onaylı
                  </div>
                </div>
              </Link>
              <button
                onClick={handleMessageClick}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
              >
                Satıcıya Mesaj Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
