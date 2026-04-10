"use client";

import { useEffect } from "react";

export default function GlobalPing() {
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let pingTimer: NodeJS.Timeout;

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const userId = parsedUser.id;

        // 1. SİTEYE GİRER GİRMEZ İLK SİNYAL (Ben buradayım!)
        fetch(`https://unicycle-api.onrender.com/api/users/${userId}/ping`, {
          method: "POST",
        }).catch((e) => console.log("Ping hatası:", e));

        // 2. HER 1 DAKİKADA BİR TEKRARLAYAN SİNYAL (Hala buradayım!)
        pingTimer = setInterval(() => {
          fetch(`https://unicycle-api.onrender.com/api/users/${userId}/ping`, {
            method: "POST",
          }).catch((e) => console.log("Ping hatası:", e));
        }, 60000);
      } catch (e) {
        console.error("Global Ping Error:", e);
      }
    }

    // Kullanıcı sekmeyi kapatırsa motoru durdur
    return () => {
      if (pingTimer) clearInterval(pingTimer);
    };
  }, []);

  // Ekrana HİÇBİR ŞEY çizmiyoruz. Tamamen görünmez bir hayalet komponent! 👻
  return null;
}
