// App.tsx
import { useState, useEffect } from 'react';
import fullMissionLists from './data/full_mission_lists.json';

const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getWeekKey = (dateStr: string) => {
  const date = new Date(dateStr);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // 해당 주의 일요일
  return start.toISOString().split('T')[0];
};

const getMonthKey = (dateStr: string) => {
  const date = new Date(dateStr);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return firstDay.toISOString().split('T')[0]; // YYYY-MM-01
};

const getStorageKey = (username: string, date: string) => `mission-${username}-${date}`;
const getWeeklyKey = (username: string, weekStart: string) => `weekly-${username}-${weekStart}`;
const getCheckKey = (username: string, key: string) => `checked-${username}-${key}`;

const sampleDailyMissions = fullMissionLists.selfLoveMissions;
const sampleWeeklyMissions = fullMissionLists.generalMissions;

type HistoryItem = {
  date: string;       // 화면용 (예: "2025-02-10", "2025-02-02 (주간)")
  rawDate: string;    // YYYY-MM-DD (그룹/정렬용)
  mission: string;
  isWeekly: boolean;
  checked: boolean;
  key: string;        // localStorage key
};

export default function App() {
  const [username, setUsername] = useState('');
  const [inputName, setInputName] = useState('');
  const [todayMission, setTodayMission] = useState<string[]>([]);
  const [weeklyMission, setWeeklyMission] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const today = getToday();
  const thisWeek = getWeekKey(today);

  const handleEnter = () => {
    if (!inputName.trim()) return alert('이름을 입력해주세요.');
    setUsername(inputName.trim());
  };

  useEffect(() => {
    if (username) {
      const allKeys = Object.keys(localStorage);

      // ✅ 오늘 일일 미션
      const todayKey = getStorageKey(username, today);
      let todayStored = localStorage.getItem(todayKey);
      if (!todayStored) {
        todayStored =
          sampleDailyMissions[Math.floor(Math.random() * sampleDailyMissions.length)];
        localStorage.setItem(todayKey, todayStored);
      }
      setTodayMission(prev => (todayStored ? [...prev, todayStored] : prev));

      // ✅ 이번 주 주간 미션
      const weekKey = getWeeklyKey(username, thisWeek);
      let weeklyStored = localStorage.getItem(weekKey);
      if (!weeklyStored) {
        weeklyStored =
          sampleWeeklyMissions[Math.floor(Math.random() * sampleWeeklyMissions.length)];
        localStorage.setItem(weekKey, weeklyStored);
      }
      setWeeklyMission(prev => (weeklyStored ? [...prev, weeklyStored] : prev));

      // ✅ 사용자 히스토리
      const userHistory: HistoryItem[] = allKeys
        .filter(
          k =>
            k.includes(`${username}`) &&
            (k.startsWith('mission-') || k.startsWith('weekly-')),
        )
        .map(k => {
          const isWeekly = k.startsWith('weekly');
          const parts = k.split('-'); // ["mission", username, yyyy, mm, dd]
          const rawDate = parts.slice(2).join('-'); // YYYY-MM-DD
          const displayDate = isWeekly ? `${rawDate} (주간)` : rawDate;
          const mission = localStorage.getItem(k) || '';
          const checkedKey = getCheckKey(username, k);
          const checked = localStorage.getItem(checkedKey) === 'true';
          return {
            date: displayDate,
            rawDate,
            mission,
            isWeekly,
            checked,
            key: k,
          };
        })
        .sort((a, b) => b.rawDate.localeCompare(a.rawDate)); // 최신 날짜 우선

      setHistory(userHistory);
    }
  }, [username, today, thisWeek]);

  const toggleCheck = (key: string, current: boolean) => {
    const checkKey = getCheckKey(username, key);
    localStorage.setItem(checkKey, (!current).toString());
    setHistory(prev =>
      prev.map(item =>
        item.key === key ? { ...item, checked: !current } : item,
      ),
    );
  };

  // ✅ 일일 / 주간 히스토리 분리
  const dailyMissions = history.filter(h => !h.isWeekly);
  const weeklyMissionsHistory = history.filter(h => h.isWeekly);

  // ✅ 공통 진행률 계산
  const getProgress = (done: number, total: number) => {
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { percent, done, total };
  };

  // ✅ 일일 미션 → 주 단위 그룹
  const weeklyDailyGroups = dailyMissions.reduce<Record<string, HistoryItem[]>>(
    (acc, item) => {
      const weekKey = getWeekKey(item.rawDate); // 그 날짜의 주 시작일
      if (!acc[weekKey]) acc[weekKey] = [];
      acc[weekKey].push(item);
      return acc;
    },
    {},
  );

  // ✅ 주간 미션 → 월 단위 그룹
  const monthlyWeeklyGroups = weeklyMissionsHistory.reduce<
    Record<string, HistoryItem[]>
  >((acc, item) => {
    const monthKey = getMonthKey(item.rawDate); // 해당 주 시작일이 포함된 달의 1일
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  // ✅ 주 라벨 (예: 2025-02-02 ~ 2025-02-08)
  const formatWeekLabel = (weekStartStr: string) => {
    const start = new Date(weekStartStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endStr = end.toISOString().split('T')[0];
    return `${weekStartStr} ~ ${endStr}`;
  };

  // ✅ 월 라벨 (예: 2025-02)
  const formatMonthLabel = (monthKey: string) => {
    return monthKey.slice(0, 7); // YYYY-MM
  };

  // 전체 일일 / 주간 진행률 요약
  const dailyProgressAll = getProgress(
    dailyMissions.filter(h => h.checked).length,
    dailyMissions.length,
  );
  const weeklyProgressAll = getProgress(
    weeklyMissionsHistory.filter(h => h.checked).length,
    weeklyMissionsHistory.length,
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="w-full border-b bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              🎯 Random Mission Picker
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              오늘 · 이번 주 · 이번 달 감성 루틴을 관리해보세요.
            </p>
          </div>

          {!username && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="사용자 이름 입력"
                className="border border-slate-300 bg-slate-50 px-3 py-1.5 rounded-md w-full sm:w-48 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
              />
              <button
                onClick={handleEnter}
                className="whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md shadow-sm transition"
              >
                입장
              </button>
            </div>
          )}

          {username && (
            <div className="text-sm text-slate-600 text-center sm:text-right">
              <p>
                👤 <span className="font-semibold">{username}</span> 님
              </p>
              <p className="text-xs text-slate-400">
                오늘은 <span className="font-mono">{today}</span> 입니다.
              </p>
            </div>
          )}
        </div>
      </header>

      {!username ? (
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white shadow-md rounded-xl p-6 max-w-md w-full text-center space-y-3">
            <p className="text-slate-700 text-sm">
              랜덤 미션을 시작하려면 <br />
              <span className="font-semibold">사용자 이름</span>을 입력해주세요.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="예: hana, yujin..."
                className="border border-slate-300 bg-slate-50 px-3 py-1.5 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
              />
              <button
                onClick={handleEnter}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md shadow-sm transition"
              >
                입장
              </button>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {/* 3분할 레이아웃 */}
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-[1.1fr,1.1fr,1.1fr]">
            {/* LEFT: 오늘 + 이번 주 요약 */}
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">오늘</p>
                <p className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  📅 <span className="font-mono">{today}</span>
                </p>
              </div>

              <div className="space-y-3">
                <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/60 flex justify-between items-start gap-3">
  <div>
    <p className="text-xs text-slate-500 mb-1">오늘의 미션</p>
    <p className="text-sm font-medium text-slate-800">
      {todayMission.length > 0
        ? todayMission.join(', ')
        : '아직 미션이 없습니다.'}
    </p>
  </div>

  {todayMission.length > 0 && (
    <input
      type="checkbox"
      className="h-4 w-4 accent-blue-500 mt-1"
      checked={
        localStorage.getItem(
          getCheckKey(username, getStorageKey(username, today)),
        ) === 'true'
      }
      onChange={() =>
        toggleCheck(
          getStorageKey(username, today),
          localStorage.getItem(
            getCheckKey(username, getStorageKey(username, today)),
          ) === 'true',
        )
      }
    />
  )}
</div>

               <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/60 flex justify-between items-start gap-3">
  <div>
    <p className="text-xs text-slate-500 mb-1">이번 주 미션</p>
    <p className="text-sm font-medium text-slate-800">
      {weeklyMission.length > 0
        ? weeklyMission.join(', ')
        : '아직 미션이 없습니다.'}
    </p>
  </div>

  {weeklyMission.length > 0 && (
    <input
      type="checkbox"
      className="h-4 w-4 accent-emerald-500 mt-1"
      checked={
        localStorage.getItem(
          getCheckKey(username, getWeeklyKey(username, thisWeek)),
        ) === 'true'
      }
      onChange={() =>
        toggleCheck(
          getWeeklyKey(username, thisWeek),
          localStorage.getItem(
            getCheckKey(username, getWeeklyKey(username, thisWeek)),
          ) === 'true',
        )
      }
    />
  )}
</div>
              </div>

              <div className="border-t border-slate-100 pt-3 mt-1 space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">
                  전체 진행률 요약
                </h2>

                <div className="space-y-2 text-xs text-slate-600">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>일일 미션</span>
                      <span>
                        {dailyProgressAll.done} / {dailyProgressAll.total} (
                        {dailyProgressAll.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-400 rounded-full transition-all"
                        style={{ width: `${dailyProgressAll.percent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span>주간 미션</span>
                      <span>
                        {weeklyProgressAll.done} / {weeklyProgressAll.total} (
                        {weeklyProgressAll.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-emerald-400 rounded-full transition-all"
                        style={{ width: `${weeklyProgressAll.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  ✔ 체크하면 자동으로 저장됩니다. <br />
                  📌 일일 미션은 주 단위로, 주간 미션은 월 단위로 모아서 보여줍니다.
                </p>
              </div>
            </section>

            {/* MIDDLE: 주 단위 일일 미션 리스트 */}
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  ✅ 주 단위 일일 미션 기록
                </h2>
                <span className="text-[11px] text-slate-400">
                  최근 주부터 순서대로
                </span>
              </div>

              <div className="mt-2 space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {Object.keys(weeklyDailyGroups).length === 0 && (
                  <p className="text-xs text-slate-400">
                    아직 기록된 일일 미션이 없습니다.
                  </p>
                )}

                {Object.entries(weeklyDailyGroups)
                  .sort(([a], [b]) => b.localeCompare(a)) // 최신 주 먼저
                  .map(([weekKey, items]) => {
                    const done = items.filter(i => i.checked).length;
                    const progress = getProgress(done, items.length);
                    return (
                      <div
                        key={weekKey}
                        className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-xs text-slate-700">
                            🗓 {formatWeekLabel(weekKey)}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {progress.done} / {progress.total} (
                            {progress.percent}%)
                          </span>
                        </div>

                        <ul className="space-y-1.5">
                          {items.map((h, idx) => (
                            <li
                              key={`${weekKey}-${idx}`}
                              className="flex justify-between items-center gap-2 border-b border-slate-100 pb-1 last:border-none"
                            >
                              <span className="text-[11px] text-slate-700 text-left leading-snug">
                                <span className="font-mono font-semibold mr-1">
                                  {h.date}
                                </span>
                                {h.mission}
                              </span>
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 accent-blue-500"
                                checked={h.checked}
                                onChange={() => toggleCheck(h.key, h.checked)}
                              />
                            </li>
                          ))}
                        </ul>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-blue-400 rounded-full transition-all"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* RIGHT: 월 단위 주간 미션 리스트 */}
            <section className="bg-white rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  📘 월 단위 주간 미션 기록
                </h2>
                <span className="text-[11px] text-slate-400">
                  최근 달부터 순서대로
                </span>
              </div>

              <div className="mt-2 space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {Object.keys(monthlyWeeklyGroups).length === 0 && (
                  <p className="text-xs text-slate-400">
                    아직 기록된 주간 미션이 없습니다.
                  </p>
                )}

                {Object.entries(monthlyWeeklyGroups)
                  .sort(([a], [b]) => b.localeCompare(a)) // 최신 월 먼저
                  .map(([monthKey, items]) => {
                    const done = items.filter(i => i.checked).length;
                    const progress = getProgress(done, items.length);
                    return (
                      <div
                        key={monthKey}
                        className="border border-slate-100 rounded-lg p-3 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-xs text-slate-700">
                            🗓 {formatMonthLabel(monthKey)}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {progress.done} / {progress.total} (
                            {progress.percent}%)
                          </span>
                        </div>

                        <ul className="space-y-1.5">
                          {items.map((h, idx) => (
                            <li
                              key={`${monthKey}-${idx}`}
                              className="flex justify-between items-center gap-2 border-b border-slate-100 pb-1 last:border-none"
                            >
                              <span className="text-[11px] text-slate-700 text-left leading-snug">
                                <span className="font-mono font-semibold mr-1">
                                  {h.date}
                                </span>
                                {h.mission}
                              </span>
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 accent-emerald-500"
                                checked={h.checked}
                                onChange={() => toggleCheck(h.key, h.checked)}
                              />
                            </li>
                          ))}
                        </ul>

                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 bg-emerald-400 rounded-full transition-all"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
