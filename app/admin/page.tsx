"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🎓 Bekleyen Kullanıcı Tipi
interface PendingUser {
  id: number;
  fullName: string;
  email: string;
  documentUrl: string;
  createdAt: string;
}

export default function AdminPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  
  // Belgeyi büyütmek için hafıza
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  useEffect(() => {
    // 🛡️ 1. GÜVENLİK KONTROLÜ (KAPI GÖREVLİSİ)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login"); // Giriş yapmamışsa login'e at
      return;
    }

    const userObj = JSON.parse(storedUser);
    if (userObj.role !== "ADMIN") {
      // Admin değilse Ana Sayfaya kov! 🚫
      router.push("/");
      return;
    }

    setCurrentUser(userObj);
    fetchPendingUsers(userObj.id);
  }, []);

  // 📥 2. ONAY BEKLEYENLERİ GETİR (JAVA'YA İSTEK)
  const fetchPendingUsers = async (adminId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/users/admin/pending?adminId=${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setPendingUsers(data);
      } else {
        setMessage("❌ Kullanıcılar getirilirken hata oluştu.");
      }
    } catch (err) {
      setMessage("❌ Sunucuya bağlanılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 3. KULLANICIYI ONAYLA
  const handleApprove = async (userId: number, userName: string) => {
    if (!window.confirm(`${userName} adlı kullanıcıyı ONAYLAMAK istediğinize emin misiniz?`)) return;
    
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/users/admin/approve/${userId}?adminId=${currentUser.id}`, {
        method: "PUT"
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId)); // Listeden sil
        setMessage(`✅ ${userName} başarıyla onaylandı ve içeri alındı!`);
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  // 🗑️ 4. KULLANICIYI REDDET VE TAMAMEN SİL (HARD DELETE)
  const handleReject = async (userId: number, userName: string) => {
    if (!window.confirm(`DİKKAT! ${userName} adlı kullanıcıyı TAMAMEN SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return;
    
    try {
      const res = await fetch(`https://unicycle-api.onrender.com/api/users/admin/delete/${userId}?adminId=${currentUser.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId)); // Listeden sil
        setMessage(`🗑️ ${userName} sistemden kalıcı olarak silindi.`);
        setTimeout(() => setMessage(""), 4000);
      }
    } catch (err) {
      alert("Bir hata oluştu.");
    }
  };

  // Güvenlik kontrolü bitene kadar beyaz ekran veya loader göster
  if (!currentUser) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white text-xl animate-pulse">Güvenlik Kontrolü Yapılıyor... 🛡️</div></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      
      {/* ÜST BİLGİ (HEADER) */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            👑 Admin Kontrol Paneli
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Hoş geldin Kraliçe {currentUser.fullName}! Onay bekleyen öğrencileri buradan yönetebilirsin.
          </p>
        </div>
        <Link href="/" className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">
          &larr; Pazaryerine Dön
        </Link>
      </div>

      {/* MESAJ KUTUSU */}
      {message && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-xl font-bold shadow-sm animate-in fade-in slide-in-from-top-4 bg-white border-l-4 border-blue-500 text-slate-700">
          {message}
        </div>
      )}

      {/* ANA TABLO/LİSTE */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 px-6 py-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            ⏳ Onay Bekleyen Hesaplar ({pendingUsers.length})
          </h2>
        </div>

        <div className="p-0 sm:p-2 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 font-bold animate-pulse">Veriler çekiliyor...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <span className="text-5xl mb-4">🎉</span>
              <h3 className="text-xl font-black text-slate-700">Bekleyen Kimse Yok!</h3>
              <p className="text-slate-500 font-medium">Bütün öğrenciler onaylanmış durumda. Harika iş çıkardın.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Kullanıcı</th>
                  <th className="p-4 font-bold">E-Posta</th>
                  <th className="p-4 font-bold text-center">Öğrenci Belgesi</th>
                  <th className="p-4 font-bold text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{user.fullName}</div>
                      <div className="text-[11px] text-slate-400">ID: {user.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-600 text-sm">{user.email}</div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedDoc(user.documentUrl)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        📄 Belgeyi İncele
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleReject(user.id, user.fullName)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                        title="Hesabı Kalıcı Olarak Sil"
                      >
                        Reddet & Sil
                      </button>
                      <button 
                        onClick={() => handleApprove(user.id, user.fullName)}
                        className="bg-green-500 text-white hover:bg-green-600 shadow-sm shadow-green-200 px-5 py-2 rounded-lg text-xs font-black transition-all hover:scale-105"
                      >
                        ✅ ONAYLA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🖼️ BELGE GÖSTERME MODALI (POP-UP) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-full flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Başlık */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800">📄 Yüklenen Belge İncelemesi</h3>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 w-8 h-8 rounded-full font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal İçerik (Fotoğraf veya PDF) */}
            <div className="flex-1 p-4 overflow-auto bg-slate-200 flex items-center justify-center min-h-[500px]">
              {selectedDoc.startsWith("data:application/pdf") ? (
                <embed src={selectedDoc} className="w-full h-[600px] rounded-xl shadow-md" type="application/pdf" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={selectedDoc} alt="Öğrenci Belgesi" className="max-w-full max-h-[700px] object-contain rounded-xl shadow-md border border-slate-300" />
              )}
            </div>

            <div className="p-4 bg-slate-50 text-center text-xs text-slate-500 font-medium border-t border-slate-100">
              Onaylamak veya reddetmek için pencereyi kapatıp tablodaki butonları kullanın.
            </div>
          </div>
        </div>
      )}

    </main>
  );
}