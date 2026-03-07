"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// 📦 ANA SAYFA İLE %100 AYNI OLAN KATEGORİ AĞACI
const CATEGORY_GROUPS = [
  { 
    label: "📚 Akademik & Okul", 
    options: ["Ders Notları & Özetler", "Çıkmış Sorular", "Ders & Sınav Kitapları", "Yabancı Dil (YDS/TOEFL vb.)", "Kırtasiye & Çizim Malzemeleri", "Laboratuvar & Mimarlık Malzemeleri"] 
  },
  { 
    label: "👗 Kadın", 
    options: ["Kadın Üst Giyim", "Kadın Alt Giyim", "Kadın Dış Giyim", "Kadın Ayakkabı", "Kadın Çanta", "Kadın Aksesuar & Takı", "Abiye & Mezuniyet Elbisesi"] 
  },
  { 
    label: "👔 Erkek", 
    options: ["Erkek Üst Giyim", "Erkek Alt Giyim", "Erkek Dış Giyim", "Erkek Ayakkabı", "Erkek Çanta & Cüzdan", "Erkek Aksesuar & Saat", "Takım Elbise"] 
  },
  { 
    label: "💄 Kozmetik & Kişisel Bakım", 
    options: ["Makyaj Ürünleri", "Parfüm & Deodorant", "Cilt Bakımı", "Saç Bakımı", "Unisex Kozmetik"] 
  },
  { 
    label: "👶 Çocuk & Bebek", 
    options: ["Çocuk Giyim", "Çocuk Ayakkabı", "Oyuncak", "Bebek Bakım"] 
  },
  { 
    label: "📱 Elektronik & Teknoloji", 
    options: ["Cep Telefonu & Aksesuar", "Bilgisayar & Tablet", "Kulaklık & Ses Sistemleri", "Küçük Ev Aletleri"] 
  },
  { 
    label: "🏠 Yaşam & Ev", 
    options: ["Ev Eşyası & Mobilya", "Ev Dekorasyon", "Mutfak Gereçleri", "Kupa & Termos"] 
  },
  { 
    label: "🎸 Hobi, Eğlence & Spor", 
    options: ["Roman & Okuma Kitabı", "Oyun & Konsol", "Spor & Kamp Malzemeleri", "Müzik Aletleri"] 
  },
  { 
    label: "🎒 Kampüs İçi & Diğer", 
    options: ["Hizmet (Özel Ders, Çeviri vs.)", "Diğer Her Şey"] 
  }
];

export default function CreateListingPage() {
  const router = useRouter();
  
  // 🧠 KULLANICI KİMLİĞİ (Java'ya Göndermek İçin ID'yi tutuyoruz)
  const [userId, setUserId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Ders Notları & Özetler");
  const [condition, setCondition] = useState("İkinci El - Temiz"); 
  const [description, setDescription] = useState("");
  
  const [priceType, setPriceType] = useState<"fiyat" | "ucretsiz" | "takas">("fiyat");
  const [price, setPrice] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("İlan vermek için giriş yapmalısınız!");
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(userStr);
      setUserId(parsedUser.id); // Java veritabanındaki benzersiz ID'si
      setUserEmail(parsedUser.email); 
    }
  }, [router]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 5) {
      alert("En fazla 5 adet fotoğraf yükleyebilirsiniz.");
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200; 

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhotos(prev => [...prev, compressedDataUrl]);
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  // 🚀 GERÇEK JAVA BACKEND'E İSTEK (POST) ATAN KISIM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      alert("Lütfen ilanınız için en az bir fotoğraf yükleyin!");
      return;
    }
    if (priceType === "fiyat" && (!price || parseFloat(price) <= 0)) {
      alert("Lütfen geçerli bir fiyat girin.");
      return;
    }

    setIsSubmitting(true);

    const finalPrice = priceType === "fiyat" ? price : "0";
    
    // Java DTO'sunun beklediği paket (Birebir isimler aynı olmalı)
    const listingPayload = {
      userId: userId, 
      title: title,
      category: category,
      itemCondition: condition,
      priceType: priceType, 
      price: parseFloat(finalPrice), 
      description: description,
      photosBase64: photos 
    };

    try {
      // 🚀 JAVA'YA İSTEK ATIYORUZ (Doğru adres: /api/products)
      const response = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listingPayload),
      });

      if (response.ok) {
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        const errorMsg = await response.text();
        alert("Hata: " + errorMsg);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Backend'e bağlanılamadı:", error);
      alert("Sunucuya ulaşılamıyor. Arka planda Java açık mı?");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      
      {/* 🚀 ÜST MENÜ */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex-1">
            <Link href="/" className="inline-block transform hover:scale-105 transition-transform">
              <Image src="/logo.png.jpeg" alt="UniCycle Logo" width={80} height={80} className="object-contain mix-blend-multiply contrast-125" priority />
            </Link>
          </div>
          <div className="flex-1 text-center hidden sm:block">
            <h1 className="text-xl font-black text-slate-800">Yeni İlan Oluştur 📦</h1>
          </div>
          <div className="flex-1 flex justify-end">
            <Link href="/profile" className="font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full">
              İptal Et ✕
            </Link>
          </div>
        </div>
      </header>

      {/* 💼 İLAN VERME FORMU */}
      <div className="max-w-2xl mx-auto mt-10 px-4">
        
        {showSuccess ? (
          <div className="bg-white rounded-[2rem] shadow-xl p-12 text-center animate-in zoom-in duration-300 border border-green-100 mt-10">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
              ✅
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">İlanın Yayında!</h2>
            <p className="text-slate-500 font-medium text-lg">Ürünün kampüs vitrinine eklendi. Bol kazançlar!</p>
          </div>
        ) : (
          
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-8 sm:p-10">
            
            <div className="space-y-10">
              
              {/* 📸 1. ÇOKLU FOTOĞRAF GALERİSİ */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400">Ürün Görselleri *</label>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">{photos.length}/5</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  
                  {photos.map((photoUrl, index) => (
                    <div key={index} className="relative w-32 h-32 rounded-2xl shrink-0 border border-slate-200 shadow-sm group">
                      <img src={photoUrl} alt={`Ürün ${index + 1}`} className="w-full h-full object-cover rounded-2xl" />
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-[10px] font-black text-center py-1 rounded-lg backdrop-blur-sm">KAPAK</div>
                      )}
                      <button 
                        type="button" onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full font-bold shadow-md hover:bg-red-600 hover:scale-110 transition-all z-10 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 shrink-0 transition-colors"
                    >
                      <span className="text-3xl mb-1 text-blue-400">📷</span>
                      <span className="text-xs font-bold text-blue-600">Fotoğraf Ekle</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handlePhotoUpload} />
              </div>

              <hr className="border-slate-100" />

              {/* 📝 2. BAŞLIK VE KATEGORİ */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2">İlan Başlığı *</label>
                  <input 
                    type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Örn: Finansal Yönetim Çıkmış Sorular (2025)" 
                    className="w-full bg-slate-50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Kategori *</label>
                    <select 
                      value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 rounded-2xl py-4 px-4 outline-none font-bold text-slate-800 border border-slate-200 cursor-pointer appearance-none"
                    >
                      {CATEGORY_GROUPS.map((group, idx) => (
                        <optgroup key={idx} label={group.label} className="font-black text-slate-500 bg-white">
                          {group.options.map(option => (
                            <option key={option} value={option} className="font-semibold text-slate-800">{option}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Kullanım Durumu *</label>
                    <select 
                      value={condition} onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-slate-50 rounded-2xl py-4 px-4 outline-none font-bold text-slate-800 border border-slate-200 cursor-pointer appearance-none"
                    >
                      <option>Sıfır / Etiketi Üzerinde</option>
                      <option>İkinci El - Yeni Gibi</option>
                      <option>İkinci El - Kullanılmış (Sorunsuz)</option>
                      <option>Deforme / Hasarlı (Açıklamada Belirtilmiş)</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* 💰 3. FİYATLANDIRMA VE DEĞERLENDİRME */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Nasıl Değerlendireceksin?</label>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                  <button 
                    type="button" onClick={() => setPriceType("fiyat")} 
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${priceType === "fiyat" ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Satmak İstiyorum
                  </button>
                  <button 
                    type="button" onClick={() => setPriceType("takas")} 
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${priceType === "takas" ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Takas Düşünüyorum
                  </button>
                  <button 
                    type="button" onClick={() => setPriceType("ucretsiz")} 
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${priceType === "ucretsiz" ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Ücretsiz Ver
                  </button>
                </div>

                {priceType === "fiyat" && (
                  <div className="relative animate-in fade-in slide-in-from-top-2 max-w-sm">
                    <span className="absolute left-6 top-4 font-black text-slate-400 text-lg">₺</span>
                    <input 
                      type="number" required={priceType === "fiyat"} value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="0" min="1"
                      className="w-full bg-white rounded-2xl py-4 pl-12 pr-5 focus:ring-2 focus:ring-blue-500 outline-none font-black text-2xl text-slate-800 border-2 border-blue-100 shadow-sm"
                    />
                  </div>
                )}
                {priceType === "takas" && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center gap-3 animate-in fade-in">
                    <span className="text-2xl">🤝</span>
                    <p className="text-sm font-bold text-purple-700">Ürünün kampüste takas tekliflerine açık olarak listelenecek.</p>
                  </div>
                )}
                {priceType === "ucretsiz" && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3 animate-in fade-in">
                    <span className="text-2xl">🎁</span>
                    <p className="text-sm font-bold text-green-700">Harika bir hareket! Ürünün ihtiyacı olan bir öğrenciye hediye edilecek.</p>
                  </div>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* 📝 4. AÇIKLAMA */}
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Detaylı Açıklama</label>
                <textarea 
                  rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ürünün detaylarından, varsa ufak kusurlarından ve kampüste nerede teslim edebileceğinden bahset..." 
                  className="w-full bg-slate-50 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 transition-all border border-slate-200 resize-none"
                />
              </div>

              {/* 🚀 5. GÖNDER BUTONU */}
              <div className="pt-4">
                <button 
                  type="submit" disabled={isSubmitting}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-lg text-white shadow-xl transition-all transform flex items-center justify-center gap-3 
                    ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 shadow-blue-200'}`}
                >
                  {isSubmitting ? <><span className="animate-spin text-2xl">⏳</span> İlan Kaydediliyor...</> : "İlanı Yayına Al 🚀"}
                </button>
              </div>

            </div>
          </form>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  );
}