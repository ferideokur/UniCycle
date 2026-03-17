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

  // 🔔 Navbar sayacını güncelleyen akıllı fonksiyon
  const updateNotificationCount = (userId: number) => {
    fetch(`http://localhost:8080/api/interaction/notifications/${userId}`)
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
    fetch("http://localhost:8080/api/products")
      .then((res) => res.json())
      .then((data) => {
        const foundProduct = data.find((p: any) => p.id.toString() === id);
        setProduct(foundProduct);
        setLoading(false);
        fetchComments();
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
            `http://localhost:8080/api/users/search?q=${encodeURIComponent(query)}`,
          );
          if (userRes.ok) {
            const data = await userRes.json();
            if (Array.isArray(data))
              combined = data.map((u: any) => ({ type: "user", item: u }));
          }
        } else {
          const prodRes = await fetch(
            `http://localhost:8080/api/products/search?q=${encodeURIComponent(query)}`,
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
        `http://localhost:8080/api/comments/product/${id}`,
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

  // ❤️ BEĞENME VE BİLDİRİM MOTORU
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
      showToast("💔 İlan favorilerden çıkarıldı!");
    } else {
      newLikes = [...currentLikes, Number(id)];
      showToast("❤️ İlan favorilere eklendi!");

      // Bildirim Gönder (Kendisi değilse)
      if (product && product.user && product.user.id !== currentUser.id) {
        try {
          await fetch("http://localhost:8080/api/interaction/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: product.user.id,
              message: `${currentUser.fullName}, "${product.title}" ilanını beğendi.`,
            }),
          });
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

  // 💬 YORUM EKLEME VE BİLDİRİM MOTORU
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser)
      return showToast("🔒 Yorum yapmak için giriş yapmalısın!");
    if (newComment.trim() === "") return;

    setIsSubmittingComment(true);

    try {
      const res = await fetch("http://localhost:8080/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          productId: Number(id),
          text: newComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
        showToast("✅ Yorum başarıyla eklendi!");

        // Bildirim Gönder (Kendisi değilse)
        if (product && product.user && product.user.id !== currentUser.id) {
          try {
            await fetch("http://localhost:8080/api/interaction/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: product.user.id,
                message: `${currentUser.fullName}, "${product.title}" ilanına bir yorum yaptı.`,
              }),
            });
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
        `http://localhost:8080/api/comments/${commentId}`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin text-5xl">⏳</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <h2 className="text-2xl font-bold text-slate-800">İlan bulunamadı!</h2>
        <Link href="/" className="mt-4 text-blue-600 font-bold hover:underline">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

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
      {/* 🌟 BİLDİRİM (TOAST) */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-top-5 text-sm whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* 🚀 ÜST MENÜ NAVBAR (Full Entegre) */}
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
                <span className="text-[32px] font-extrabold tracking-tight text-slate-800 hidden md:block">
                  Uni<span className="text-[#20B2AA]">Cycle</span>
                </span>
              </Link>
            </div>

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
                <button type="submit" className="hidden">
                  Ara
                </button>
              </form>

              {isDropdownOpen && liveResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-[100] py-2">
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
                              Kullanıcı
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

            <div className="flex items-center gap-4">
              <Link
                href="/create-listing"
                className="hidden sm:flex font-black text-blue-600 hover:text-blue-800 items-center gap-1 transition-colors"
              >
                <span className="text-xl">+</span> İlan Ver
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-3 relative">
                  {/* 🔔 BİLDİRİMLER */}
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
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
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
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-blue-700 shadow-sm ml-2 text-sm transition-all"
                  >
                    👤 Hesabım
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
                  className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🖥️ ANA DÜZEN */}
      <div className="max-w-6xl mx-auto mt-8 px-4">
        {/* 🔙 BREADCRUMBS VE GERİ DÖN */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Ana Sayfa
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-600">{product.category}</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 truncate max-w-[200px]">
              {product.title}
            </span>
          </div>
          <button
            onClick={() => router.back()}
            className="font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm"
          >
            <span>&larr;</span> Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 📸 SOL TARAF (8 Kolon) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
              <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden relative flex items-center justify-center border border-slate-100">
                <img
                  src={photos[activeImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
              {photos.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                  {photos.map((photo: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? "border-blue-600 shadow-md scale-105" : "border-transparent hover:border-blue-300 opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={photo}
                        className="w-full h-full object-cover"
                        alt={`Küçük foto ${index}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-slate-800 mb-4 border-b pb-4">
                İlan Açıklaması
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                {product.description ||
                  "Satıcı bu ilan için henüz bir açıklama girmemiş."}
              </p>
            </div>

            {/* 💬 YORUMLAR */}
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

              {/* Yorum Formu */}
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
                    placeholder="Satıcıya bir soru sor veya yorum bırak..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-700 disabled:text-slate-300 transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>

              {/* Yorum Listesi */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-400 font-medium py-4">
                    Henüz yorum yapılmamış. İlk soruyu sen sor!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const commentUser =
                      comment.user?.fullName || "Bilinmeyen Kullanıcı";
                    const canDelete =
                      currentUser &&
                      (currentUser.id === comment.user?.id || isOwner);

                    return (
                      <div
                        key={comment.id}
                        className="flex gap-4 group relative"
                      >
                        <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold shrink-0 mt-1">
                          {commentUser.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm capitalize">
                              {commentUser}
                              {comment.user?.id === product.user?.id && (
                                <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Satıcı
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm font-medium">
                            {comment.text}
                          </p>
                        </div>

                        {/* Silme Butonu */}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="absolute top-2 right-[-10px] opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all bg-white p-1.5 rounded-md shadow-sm border border-slate-100"
                            title="Yorumu Sil"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 💼 SAĞ TARAF (4 Kolon) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h1 className="text-2xl font-extrabold text-slate-800 leading-tight mb-4">
                {product.title}
              </h1>

              <div className="mb-6">
                {product.priceType === "fiyat" && (
                  <div className="text-4xl font-black text-blue-600">
                    {product.price}{" "}
                    <span className="text-2xl text-blue-400">₺</span>
                  </div>
                )}
                {product.priceType === "takas" && (
                  <div className="text-3xl font-black text-purple-600 flex items-center gap-2">
                    🤝 Takasa Açık
                  </div>
                )}
                {product.priceType === "ucretsiz" && (
                  <div className="text-3xl font-black text-green-600 flex items-center gap-2">
                    🎁 Ücretsiz
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                    Kategori
                  </span>
                  <span className="text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-lg text-sm">
                    {product.category}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                    Durum
                  </span>
                  <span className="text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-lg text-sm">
                    {product.itemCondition || "Belirtilmemiş"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">
                    İlan No
                  </span>
                  <span className="text-slate-400 font-bold text-sm">
                    #{product.id}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleLikeToggle}
                  className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${isLiked ? "bg-red-50 text-red-500 border border-red-100" : "bg-red-50 hover:bg-red-100 text-red-500 border border-transparent"}`}
                >
                  <Heart size={20} className={isLiked ? "fill-current" : ""} />{" "}
                  {isLiked ? "Favorilerden Çıkar" : "Favoriye Al"}
                </button>
                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Share2 size={20} /> Paylaş
                </button>
              </div>
            </div>

            {/* SATICI PROFİL KARTI */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
                  {sellerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 capitalize">
                    {sellerName}
                  </h3>
                  <div className="flex items-center gap-1 text-sm font-bold text-slate-400 mt-1">
                    <ShieldCheck size={16} className="text-green-500" /> Kampüs
                    Onaylı
                  </div>
                </div>
              </div>

              {isOwner ? (
                <div className="w-full bg-green-50 text-green-700 font-black py-4 rounded-xl border border-green-200 flex items-center justify-center gap-2 text-sm shadow-sm">
                  <span>✨</span> Bu senin ilanın
                </div>
              ) : (
                <button
                  onClick={handleMessageClick}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                >
                  Satıcıya Mesaj Gönder
                </button>
              )}

              <div className="mt-4 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                <MapPin size={14} /> Piri Reis Üniversitesi Kampüsü
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
}
