import React, { useEffect, useState } from "react";
import { init, useWebApp } from "@telegram-apps/sdk";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import "./App.css";

const SUPABASE_URL = "https://ilkfqmztdpbflnzdwlup.supabase.co"; // Замени на URL из Supabase
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsa2ZxbXp0ZHBiZmxuemR3bHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDk0MjIsImV4cCI6MjA3NjQyNTQyMn0.l61PTh2wKXI76BMGzecsNGGvQBjS5wddmvTs6x8YQQ0"; // Замени на anon key
const AUTH_URL = "https://ilkfqmztdpbflnzdwlup.supabase.co/functions/v1/auth-telegram"; // Замени, например, https://your-project.supabase.co/functions/v1/auth-telegram
const OPEN_CASE_URL = "https://ilkfqmztdpbflnzdwlup.supabase.co/functions/v1/spin-roulette"; // Замени, например, https://your-project.supabase.co/functions/v1/open-case

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const webApp = useWebApp();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [cases, setCases] = useState<any[]>([]);
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  useEffect(() => {
    init();
    const tgUser = webApp.initDataUnsafe.user;
    if (tgUser) {
      fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: tgUser.id }),
      })
        .then((res) => res.json())
        .then(async (result) => {
          if (result.success) {
            await supabase.auth.setSession({ access_token: result.token, refresh_token: "" });
            const { data: userData } = await supabase.from("users").select("*").eq("id", result.user_id).single();
            setUser(userData);
            setBalance(userData.balance);
            fetchCases();
            fetchRecentWins();
          }
        })
        .catch((err) => console.error("Auth error:", err));
    }
  }, []);

  const fetchCases = async () => {
    const { data } = await supabase.from("cases").select("*");
    setCases(data || []);
  };

  const fetchRecentWins = async () => {
    const { data } = await supabase
      .from("wins")
      .select("*, items(name, image_url), users(username, avatar_url)")
      .order("won_at", { ascending: false })
      .limit(10);
    setRecentWins(data || []);
  };

  const openCase = async (caseId: number, price: number) => {
    if (balance < price) return alert("Недостаточно баланса!");
    setSpinning(true);
    try {
      const response = await fetch(OPEN_CASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, case_id }),
      });
      const result = await response.json();
      if (result.success) {
        setCurrentItem(result.item);
        setBalance(balance - price);
        fetchRecentWins();
      }
    } catch (e) {
      console.error(e);
    }
    setSpinning(false);
  };

  if (!user) return <div>Загрузка...</div>;

  return (
    <div className="app">
      <div className="top-icons">
        <img src="https://cdn.apps.joltteam.com/brikbuild/gingerbread-man-pixel-art-8bit-cookie-edible-food-gingerbread-man-pixel-pixel-art-5a24f9bbf6c96a8d29720b75.brickImg.jpg" alt="Gingerbread" />
        <img src="https://static.vecteezy.com/system/resources/thumbnails/026/790/007/small_2x/birthday-pixel-icons-celebration-8-bit-80s-90s-old-arcade-game-style-icons-for-game-or-mobile-app-cake-crown-balloons-candle-gift-cupcake-illustration-vector.jpg" alt="Cake" />
        <img src="https://www.brik.co/cdn/shop/articles/gingerbread-man-pixel-art-pixel-art-gingerbread-man-edible-food-cookie-pixel-8bit_880x.png?v=1501262138" alt="Hat" />
      </div>
      <header>
        <div className="balance">
          <span>△ {balance.toFixed(2)}</span>
          <button>+</button>
          <button>G</button>
        </div>
        <h1>ONLY ARTISAN BRICK</h1>
      </header>
      <div className="cases-list">
        {cases.map((c: any) => (
          <div key={c.id} className="case-item">
            <img src={c.image_url} alt={c.name} />
            <p>{c.name}</p>
            <button onClick={() => openCase(c.id, c.price)} disabled={spinning}>
              Открыть за △ {c.price.toFixed(2)}
            </button>
          </div>
        ))}
      </div>
      <div className="warning">
        <p>Ваша модель порака гарантирована. Только фон случайный при выпаде.</p>
      </div>
      <div className="recent-wins">
        <h2>Недавние выигрыши</h2>
        <div className="wins-scroll">
          {recentWins.map((win: any) => (
            <div key={win.id} className="win-item">
              <img src={win.users.avatar_url} alt="Avatar" className="win-avatar" />
              <p>{win.users.username} выиграл {win.items.name}</p>
              <img src={win.items.image_url} alt={win.items.name} className="win-prize" />
            </div>
          ))}
        </div>
      </div>
      {spinning && (
        <motion.div className="open-animation" initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ duration: 2 }}>
          <div className="box">Открываем...</div>
        </motion.div>
      )}
      {currentItem && !spinning && (
        <div className="win-modal">
          <h2>Вы выиграли {currentItem.name}!</h2>
          <img src={currentItem.image_url} alt={currentItem.name} />
          <button onClick={() => setCurrentItem(null)}>OK</button>
        </div>
      )}
    </div>
  );
}

export default App;
