import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import fullMissions from "./data/full_mission_lists.json";

export default function App() {
  const [daily, setDaily] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<string[]>([]);
  const [history, setHistory] = useState<
    { date: string; daily: string; weekly: string[] }[]
  >([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("mission_history");
    if (saved) {
      const parsed = JSON.parse(saved);
      const todayMission = parsed.find((h: any) => h.date === today);
      if (todayMission) {
        setDaily(todayMission.daily);
        setWeekly(todayMission.weekly);
        setHistory(parsed);
        return;
      }
    }
    const newDaily = pickRandom(fullMissions.selfLoveMissions);
    const newWeekly = pickNRandom(
      fullMissions.generalMissions,
      Math.random() > 0.5 ? 1 : 2
    );
    const newRecord = { date: today, daily: newDaily, weekly: newWeekly };
    const updated = [...(saved ? JSON.parse(saved) : []), newRecord];
    localStorage.setItem("mission_history", JSON.stringify(updated));
    setDaily(newDaily);
    setWeekly(newWeekly);
    setHistory(updated);
  }, []);

  function pickRandom(list: string[]) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pickNRandom(list: string[], n: number) {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-rose-100 flex flex-col items-center justify-start py-10 px-4">
      <motion.h1
        className="text-3xl font-bold text-rose-700 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🌷 오늘의 미션
      </motion.h1>

      {daily && (
        <div className="w-full max-w-xl bg-white shadow-md mb-6 rounded-2xl p-6 text-center text-lg font-semibold text-rose-800">
          💖 자기애 미션: {daily}
        </div>
      )}

      {weekly.length > 0 && (
        <div className="w-full max-w-xl bg-white shadow-md rounded-2xl p-6 text-center text-lg font-semibold text-pink-800">
          📅 주간 실천 미션:
          <ul className="mt-2 list-disc list-inside space-y-1 text-base text-left">
            {weekly.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 w-full max-w-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-4">🕓 지난 미션 보기</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {history.map((h, i) => (
            <li key={i} className="border-b pb-2">
              <strong>{h.date}</strong> — 💖 {h.daily} / 📅{" "}
              {h.weekly.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
