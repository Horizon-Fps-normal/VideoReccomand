"use client";

/* Remote poster URLs are user-configured TMDB/TVMaze assets; next/image would require a fixed domain allowlist. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Status = "watching" | "watchlist" | "completed";

type Show = {
  id: string;
  titleEn: string;
  titleZh: string;
  year: number;
  genre: string[];
  type: string;
  description: string;
  rating: number;
  popularity: number;
  seasons: number;
  country: "US" | "GB";
  posterUrl?: string;
  aliases?: string[];
  status?: Status;
  seasonRatings?: Record<number, number>;
  disliked?: boolean;
};

const STORAGE_KEY = "series-scout-library-v1";
const TMDB_KEY_STORAGE = "series-scout-tmdb-key-v1";
const DISMISSED_STORAGE_KEY = "series-scout-dismissed-v1";

const CATALOG: Show[] = [
  { id: "breaking-bad", titleEn: "Breaking Bad", titleZh: "绝命毒师", year: 2008, genre: ["犯罪", "剧情", "惊悚"], type: "犯罪剧情", description: "一位高中化学老师在绝境中走上制毒之路，逐渐改变了自己和身边所有人的命运。", rating: 9.5, popularity: 94, seasons: 5, country: "US" },
  { id: "better-call-saul", titleEn: "Better Call Saul", titleZh: "风骚律师", year: 2015, genre: ["犯罪", "剧情"], type: "犯罪剧情", description: "在成为索尔·古德曼之前，吉米·麦吉尔努力寻找一条属于自己的路。", rating: 9.4, popularity: 88, seasons: 6, country: "US" },
  { id: "the-wire", titleEn: "The Wire", titleZh: "火线", year: 2002, genre: ["犯罪", "剧情"], type: "犯罪群像", description: "从警察、毒贩、政客到记者，多方视角交织出一座城市的真实切面。", rating: 9.3, popularity: 76, seasons: 5, country: "US" },
  { id: "the-sopranos", titleEn: "The Sopranos", titleZh: "黑道家族", year: 1999, genre: ["犯罪", "剧情"], type: "犯罪家庭", description: "黑帮老大在家庭、事业与心理治疗之间，艰难地维持着自己的世界。", rating: 9.2, popularity: 79, seasons: 6, country: "US" },
  { id: "chernobyl", titleEn: "Chernobyl", titleZh: "切尔诺贝利", year: 2019, genre: ["历史", "剧情", "惊悚"], type: "历史迷你剧", description: "一场灾难、一场谎言，以及几个人为真相付出的代价。", rating: 9.3, popularity: 91, seasons: 1, country: "US" },
  { id: "succession", titleEn: "Succession", titleZh: "继承之战", year: 2018, genre: ["剧情", "黑色幽默"], type: "家族剧情", description: "传媒帝国的继承人们，为了父亲的认可和公司的控制权不断角力。", rating: 8.9, popularity: 93, seasons: 4, country: "US" },
  { id: "severance", titleEn: "Severance", titleZh: "人生切割术", year: 2022, genre: ["科幻", "悬疑", "剧情"], type: "科幻悬疑", description: "一群员工把工作记忆与生活记忆彻底分开，却发现公司藏着更大的秘密。", rating: 8.7, popularity: 97, seasons: 2, country: "US" },
  { id: "the-bear", titleEn: "The Bear", titleZh: "熊家餐馆", year: 2022, genre: ["剧情", "喜剧"], type: "职场剧情", description: "一位年轻主厨回到芝加哥，接手家族小餐馆，也重新面对自己的伤口。", rating: 8.5, popularity: 95, seasons: 3, country: "US" },
  { id: "true-detective", titleEn: "True Detective", titleZh: "真探", year: 2014, genre: ["犯罪", "悬疑", "剧情"], type: "犯罪悬疑", description: "不同年代、不同探员，追查那些久久无法结案的黑暗案件。", rating: 8.9, popularity: 89, seasons: 4, country: "US" },
  { id: "mad-men", titleEn: "Mad Men", titleZh: "广告狂人", year: 2007, genre: ["剧情"], type: "时代剧情", description: "在六十年代的纽约广告业，身份、欲望和时代变迁彼此碰撞。", rating: 8.7, popularity: 73, seasons: 7, country: "US" },
  { id: "mindhunter", titleEn: "Mindhunter", titleZh: "心灵猎人", year: 2017, genre: ["犯罪", "悬疑", "剧情"], type: "犯罪心理", description: "两名探员试图理解连环杀手的思维，开创犯罪心理侧写的新方法。", rating: 8.6, popularity: 90, seasons: 2, country: "US" },
  { id: "the-last-of-us", titleEn: "The Last of Us", titleZh: "最后生还者", year: 2023, genre: ["科幻", "剧情", "冒险"], type: "末日剧情", description: "末日后的世界里，一个男人护送一名女孩穿越危险地带。", rating: 8.7, popularity: 96, seasons: 2, country: "US" },
  { id: "sherlock", titleEn: "Sherlock", titleZh: "神探夏洛克", year: 2010, genre: ["犯罪", "悬疑", "剧情"], type: "英剧悬疑", description: "现代伦敦的天才侦探与他的室友，用推理破解一桩桩奇案。", rating: 9.1, popularity: 92, seasons: 4, country: "GB" },
  { id: "fleabag", titleEn: "Fleabag", titleZh: "伦敦生活", year: 2016, genre: ["喜剧", "剧情"], type: "英剧喜剧", description: "一位生活混乱、嘴很毒的伦敦女性，在幽默中直面失去与亲密关系。", rating: 8.7, popularity: 84, seasons: 2, country: "GB" },
  { id: "ted-lasso", titleEn: "Ted Lasso", titleZh: "足球教练", year: 2020, genre: ["喜剧", "剧情", "运动"], type: "英剧喜剧", description: "一个美国橄榄球教练来到英国执教足球队，用乐观和善意改变一群人。", rating: 8.8, popularity: 91, seasons: 3, country: "US" },
  { id: "the-queens-gambit", titleEn: "The Queen's Gambit", titleZh: "后翼弃兵", year: 2020, genre: ["剧情", "时代"], type: "成长迷你剧", description: "一位孤儿少女在棋盘上寻找天赋，也与自己的孤独和成瘾抗争。", rating: 8.5, popularity: 93, seasons: 1, country: "US" },
  { id: "shameless-us", titleEn: "Shameless", titleZh: "无耻之徒", year: 2011, genre: ["喜剧", "剧情"], type: "家庭喜剧", description: "芝加哥南区的加拉格尔一家，在混乱、贫穷与彼此扶持中努力生活。", rating: 8.5, popularity: 88, seasons: 11, country: "US" },
  { id: "friends", titleEn: "Friends", titleZh: "老友记", year: 1994, genre: ["喜剧", "爱情"], type: "情景喜剧", description: "六位好友在纽约共同生活、工作和成长，分享生活中最快乐与狼狈的时刻。", rating: 8.9, popularity: 95, seasons: 10, country: "US", aliases: ["六人行"], },
];

const POSTER_URLS: Record<string, string> = {
  "breaking-bad": "https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg",
  "better-call-saul": "https://static.tvmaze.com/uploads/images/original_untouched/501/1253515.jpg",
  "the-wire": "https://static.tvmaze.com/uploads/images/original_untouched/504/1260189.jpg",
  "the-sopranos": "https://static.tvmaze.com/uploads/images/original_untouched/4/11341.jpg",
  chernobyl: "https://static.tvmaze.com/uploads/images/original_untouched/193/482599.jpg",
  succession: "https://static.tvmaze.com/uploads/images/original_untouched/453/1134275.jpg",
  severance: "https://static.tvmaze.com/uploads/images/original_untouched/548/1371406.jpg",
  "the-bear": "https://static.tvmaze.com/uploads/images/original_untouched/629/1574642.jpg",
  "true-detective": "https://static.tvmaze.com/uploads/images/original_untouched/490/1226764.jpg",
  "mad-men": "https://static.tvmaze.com/uploads/images/original_untouched/2/5589.jpg",
  mindhunter: "https://static.tvmaze.com/uploads/images/original_untouched/501/1253490.jpg",
  "the-last-of-us": "https://static.tvmaze.com/uploads/images/original_untouched/563/1409008.jpg",
  sherlock: "https://static.tvmaze.com/uploads/images/original_untouched/171/428042.jpg",
  fleabag: "https://static.tvmaze.com/uploads/images/original_untouched/192/482341.jpg",
  "ted-lasso": "https://static.tvmaze.com/uploads/images/original_untouched/634/1585930.jpg",
  "the-queens-gambit": "https://static.tvmaze.com/uploads/images/original_untouched/510/1275203.jpg",
  "shameless-us": "https://static.tvmaze.com/uploads/images/original_untouched/486/1215661.jpg",
  friends: "https://static.tvmaze.com/uploads/images/original_untouched/41/104565.jpg",
};

const LOCAL_QUERY_ALIASES: Record<string, string[]> = {
  "老友记": ["Friends"], "六人行": ["Friends"], "权力的游戏": ["Game of Thrones"], "生活大爆炸": ["The Big Bang Theory"],
  "行尸走肉": ["The Walking Dead"], "黑镜": ["Black Mirror"], "纸牌屋": ["House of Cards"], "西部世界": ["Westworld"],
  "怪奇物语": ["Stranger Things"], "绝命毒师": ["Breaking Bad"], "风骚律师": ["Better Call Saul"], "无耻之徒": ["Shameless"],
  "继承之战": ["Succession"], "人生切割术": ["Severance"], "熊家餐馆": ["The Bear"], "神探夏洛克": ["Sherlock"],
  "伦敦生活": ["Fleabag"], "足球教练": ["Ted Lasso"],
};

const GENRE_MAP: Record<number, string> = { 18: "剧情", 35: "喜剧", 80: "犯罪", 9648: "悬疑", 10759: "动作", 10765: "科幻", 10768: "历史", 10751: "家庭", 10764: "真人秀" };

function statusLabel(status?: Status) {
  return status === "completed" ? "已看完" : status === "watching" ? "观看中" : "想看";
}

function averageSeasonScore(show: Show) {
  const scores = Object.values(show.seasonRatings ?? {});
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
}

function stripHtml(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "暂无简介";
}

async function searchTvMaze(query: string): Promise<Show[]> {
  const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("TVMaze 请求失败");
  const data = await response.json() as Array<{ show?: Record<string, unknown> }>;
  const results = data.map((item) => item.show).filter((show): show is Record<string, unknown> => Boolean(show)).filter((show) => {
    const country = show.country as Record<string, unknown> | null;
    const code = typeof country?.code === "string" ? country.code : "";
    return !code || code === "US" || code === "GB";
  }).slice(0, 8).map((show) => {
    const rating = show.rating as Record<string, unknown> | null;
    const genres = Array.isArray(show.genres) ? show.genres.filter((genre): genre is string => typeof genre === "string") : [];
    return {
      id: `tvmaze-${String(show.id)}`,
      titleEn: String(show.name ?? "未命名剧集"),
      titleZh: String(show.name ?? "未命名剧集"),
      year: Number(String(show.premiered ?? "0").slice(0, 4)) || 0,
      genre: genres,
      type: "在线搜索结果",
      description: stripHtml(show.summary),
      rating: Number(rating?.average ?? 0),
      popularity: Number(rating?.average ?? 0) * 10,
      seasons: 1,
      country: (show.country as Record<string, unknown> | null)?.code === "GB" ? "GB" : "US",
      posterUrl: typeof (show.image as Record<string, unknown> | null)?.original === "string" ? String((show.image as Record<string, unknown>).original) : undefined,
    } satisfies Show;
  });
  return Promise.all(results.map(async (show) => ({ ...show, seasons: await fetchTvMazeSeasonCount(show.id.replace("tvmaze-", ""), show.seasons) })));
}

async function fetchTvMazeSeasonCount(id: string, fallback: number) {
  try {
    const response = await fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}?embed=episodes`);
    if (!response.ok) return fallback;
    const data = await response.json() as { _embedded?: { episodes?: Array<{ season?: number }> } };
    const seasons = (data._embedded?.episodes ?? []).map((episode) => Number(episode.season ?? 0)).filter((season) => season > 0);
    return seasons.length ? Math.max(...seasons) : fallback;
  } catch {
    return fallback;
  }
}

async function enrichShowSeasons(show: Show, tmdbKey: string) {
  if (show.id.startsWith("tvmaze-")) {
    return { ...show, seasons: await fetchTvMazeSeasonCount(show.id.replace("tvmaze-", ""), show.seasons) };
  }
  if (show.id.startsWith("tmdb-") && tmdbKey.trim()) {
    try {
      const id = show.id.replace("tmdb-", "");
      const response = await fetch(`https://api.themoviedb.org/3/tv/${encodeURIComponent(id)}?api_key=${encodeURIComponent(tmdbKey.trim())}&language=zh-CN`);
      if (response.ok) {
        const data = await response.json() as { number_of_seasons?: number };
        return { ...show, seasons: Number(data.number_of_seasons ?? show.seasons) || show.seasons };
      }
    } catch {
      return show;
    }
  }
  return show;
}

export default function Home() {
  const [library, setLibrary] = useState<Show[]>([]);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Show[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeView, setActiveView] = useState<"discover" | "library">("discover");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tmdbKey, setTmdbKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [dataNotice, setDataNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // The first client render must wait for browser-only localStorage data to avoid a hydration mismatch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Show[];
      setLibrary(saved);
      setTmdbKey(localStorage.getItem(TMDB_KEY_STORAGE) ?? "");
      setDismissedIds(JSON.parse(localStorage.getItem(DISMISSED_STORAGE_KEY) ?? "[]") as string[]);
    } catch {
      setLibrary([]);
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [hydrated, library]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(dismissedIds));
  }, [dismissedIds, hydrated]);

  /* Existing remote entries may have been added before season details were fetched. */
  useEffect(() => {
    if (!hydrated || !library.length) return;
    let cancelled = false;
    void Promise.all(library.map((show) => enrichShowSeasons(show, tmdbKey))).then((enriched) => {
      if (!cancelled && enriched.some((show, index) => show.seasons !== library[index].seasons)) setLibrary(enriched);
    });
    return () => { cancelled = true; };
  }, [hydrated, library, tmdbKey]);

  const recommendation = useMemo(() => {
    const savedIds = new Set(library.map((show) => show.id));
    const favoriteGenres = new Set(
      library.flatMap((show) => (averageSeasonScore(show) >= 8 ? show.genre : [])),
    );
    const candidates = CATALOG.filter((show) => !savedIds.has(show.id) && !show.disliked && !dismissedIds.includes(show.id));
    return [...candidates].sort((a, b) => {
      const score = (show: Show) => show.rating * 10 + show.popularity / 10 + show.genre.filter((genre) => favoriteGenres.has(genre)).length * 4;
      return score(b) - score(a);
    })[0] ?? null;
  }, [dismissedIds, library]);

  const visibleLibrary = library.filter((show) => filter === "all" || show.status === filter);

  async function addShow(show: Show, status: Status = "watchlist") {
    const enrichedShow = await enrichShowSeasons(show, tmdbKey);
    setLibrary((current) => current.some((item) => item.id === enrichedShow.id) ? current.map((item) => item.id === enrichedShow.id ? { ...item, ...enrichedShow, status } : item) : [...current, { ...enrichedShow, status, seasonRatings: {} }]);
    setActiveView("library");
    setExpandedId(enrichedShow.id);
  }

  function updateShow(id: string, patch: Partial<Show>) {
    setLibrary((current) => current.map((show) => show.id === id ? { ...show, ...patch } : show));
  }

  function removeShow(id: string) {
    if (!window.confirm("确定要从我的片单中删除这部剧吗？评分和状态也会一起删除。")) return;
    setLibrary((current) => current.filter((show) => show.id !== id));
    setExpandedId(null);
  }

  async function searchShows(event?: FormEvent) {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    const searchTerms = [cleanQuery, ...(LOCAL_QUERY_ALIASES[cleanQuery] ?? [])];
    const localResults = CATALOG.filter((show) => `${show.titleEn} ${show.titleZh} ${(show.aliases ?? []).join(" ")} ${show.genre.join(" ")}`.toLowerCase().includes(cleanQuery.toLowerCase()));
    setSearchResults(localResults);
    setSearchError("");
    setSearching(true);
    try {
      let remoteResults: Show[] = [];
      if (tmdbKey.trim()) {
        const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${encodeURIComponent(tmdbKey.trim())}&language=zh-CN&query=${encodeURIComponent(cleanQuery)}`);
        if (!response.ok) throw new Error("TMDB 请求失败");
        const data = await response.json() as { results?: Array<Record<string, unknown>> };
        remoteResults = (data.results ?? []).filter((item) => {
          const countries = Array.isArray(item.origin_country) ? item.origin_country : [];
          return countries.length === 0 || countries.includes("US") || countries.includes("GB");
        }).slice(0, 8).map((item) => ({
          id: `tmdb-${String(item.id)}`,
          titleEn: String(item.original_name ?? item.name ?? "未命名剧集"),
          titleZh: String(item.name ?? item.original_name ?? "未命名剧集"),
          year: Number(String(item.first_air_date ?? "0").slice(0, 4)) || 0,
          genre: (Array.isArray(item.genre_ids) ? item.genre_ids : []).map((id) => GENRE_MAP[Number(id)]).filter(Boolean),
          type: "在线搜索结果",
          description: String(item.overview ?? "暂无简介"),
          rating: Number(item.vote_average ?? 0),
          popularity: Number(item.popularity ?? 0),
          seasons: 1,
          country: Array.isArray(item.origin_country) && item.origin_country.includes("GB") ? "GB" : "US",
          posterUrl: typeof item.poster_path === "string" ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
        }));
      } else {
        const remoteLists = await Promise.all(searchTerms.map((term) => searchTvMaze(term)));
        remoteResults = Array.from(new Map(remoteLists.flat().map((show) => [show.id, show])).values());
      }
      const merged = [...localResults, ...remoteResults.filter((remote) => !localResults.some((local) => local.id === remote.id))];
      setSearchResults(merged);
    } catch {
      setSearchError("在线搜索暂时失败，已保留本地搜索结果。稍后再试，或在设置中配置 TMDB Key。");
    } finally {
      setSearching(false);
    }
  }

  function saveKey(value: string) {
    setTmdbKey(value);
    localStorage.setItem(TMDB_KEY_STORAGE, value);
  }

  function exportData() {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), library, dismissedIds }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `series-scout-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setDataNotice("已导出本地数据（不包含 TMDB Key）");
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as { library?: Show[]; dismissedIds?: string[] } | Show[];
      const importedLibrary = Array.isArray(data) ? data : data.library;
      if (!Array.isArray(importedLibrary)) throw new Error("invalid backup");
      setLibrary(importedLibrary);
      if (!Array.isArray(data)) setDismissedIds(Array.isArray(data.dismissedIds) ? data.dismissedIds : []);
      setDataNotice(`已导入 ${importedLibrary.length} 部剧`);
    } catch {
      setDataNotice("导入失败：请选择 Series Scout 导出的 JSON 文件");
    }
    event.target.value = "";
  }

  if (!hydrated) return <main className="loading-screen">正在打开你的剧集清单…</main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><div><strong>Series Scout</strong><small>你的下一部美剧</small></div></div>
        <nav className="nav-list" aria-label="主导航">
          <button className={activeView === "discover" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("discover")}><span>?</span>发现新剧</button>
          <button className={activeView === "library" ? "nav-item active" : "nav-item"} onClick={() => setActiveView("library")}><span>?</span>我的片单 <em>{library.length}</em></button>
        </nav>
        <div className="sidebar-note"><span className="note-dot" />本地保存<br /><small>只在这台设备上记住你的选择</small></div>
        <button className="settings-link" onClick={() => setShowSettings(true)}><span>?</span>数据设置</button>
      </aside>

      <section className="content">
        <header className="topbar"><div><p className="eyebrow">SERIES SCOUT / 01</p><h1>{activeView === "discover" ? "不如交给我来选。" : "你的观剧轨迹。"}</h1></div><button className="mobile-settings" onClick={() => setShowSettings(true)}>?</button></header>

        {activeView === "discover" ? <>
          <section className="recommendation-card">
            <div className="recommendation-copy"><div className="section-kicker"><span className="pulse" />基于高分与热度，为你挑的下一部</div><p className="recommendation-label">NEXT UP</p>
              {recommendation ? <><h2>{recommendation.titleZh}</h2><p className="english-title">{recommendation.titleEn}</p><div className="meta-row"><span className="score"><b>★</b> {recommendation.rating.toFixed(1)}</span><span>{recommendation.year}</span><span>{recommendation.seasons} 季</span><span>{recommendation.type}</span></div><p className="description">{recommendation.description}</p><div className="recommendation-actions"><button className="primary-button" onClick={() => addShow(recommendation, "watching")}>开始看这部</button><button className="ghost-button" onClick={() => setDismissedIds((current) => current.includes(recommendation.id) ? current : [...current, recommendation.id])}>不想看</button></div></> : <><h2>先把看过的剧告诉我</h2><p className="description">添加几部你看过或想看的剧，我就能把下一部推荐得更贴合你。</p><button className="primary-button" onClick={() => document.getElementById("search-box")?.focus()}>开始添加</button></>}
            </div>
            <div className="recommendation-art">{recommendation?.posterUrl || (recommendation && POSTER_URLS[recommendation.id]) ? <img className="recommendation-poster" src={recommendation?.posterUrl ?? POSTER_URLS[recommendation?.id ?? ""]} alt={`${recommendation?.titleZh ?? "推荐剧集"}封面`} /> : <><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-center">{recommendation ? recommendation.titleEn.slice(0, 1) : "?"}</div></>}<span className="art-caption">ONE<br />GOOD<br />SHOW</span></div>
          </section>

          <section className="search-section"><div className="section-heading"><div><p className="eyebrow">BUILD YOUR LIBRARY</p><h3>添加你看过的剧</h3></div><span className="section-hint">搜索中文名或英文名</span></div><form className="search-form" onSubmit={searchShows}><span className="search-icon">?</span><input id="search-box" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：绝命毒师 / Severance" aria-label="搜索剧集" /><button type="submit">{searching ? "搜索中…" : "搜索"}</button></form>{searchError && <p className="search-error">{searchError}</p>}{searchResults.length > 0 && <div className="search-results">{searchResults.map((show) => <ShowSearchCard key={show.id} show={show} onAdd={addShow} isAdded={library.some((item) => item.id === show.id)} />)}</div>}</section>

          <section className="starter-panels"><div className="starter-panel"><span className="panel-number">01</span><div><h4>高分必看</h4><p>从评价最稳的剧集开始，少走弯路。</p></div><span className="panel-arrow">↗</span></div><div className="starter-panel"><span className="panel-number">02</span><div><h4>当下热门</h4><p>把正在被讨论的好剧放进候选。</p></div><span className="panel-arrow">↗</span></div><div className="starter-panel"><span className="panel-number">03</span><div><h4>记录并评分</h4><p>按季打分，慢慢形成你的口味档案。</p></div><span className="panel-arrow">↗</span></div></section>
        </> : <section className="library-view"><div className="library-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>一共 {library.length} 部剧</h2></div><button className="primary-button compact" onClick={() => setActiveView("discover")}>＋ 添加剧集</button></div><div className="filter-row">{(["all", "watching", "watchlist", "completed"] as const).map((item) => <button key={item} className={filter === item ? "filter-pill active" : "filter-pill"} onClick={() => setFilter(item)}>{item === "all" ? "全部" : statusLabel(item)} <span>{item === "all" ? library.length : library.filter((show) => show.status === item).length}</span></button>)}</div>{library.length === 0 ? <div className="empty-library"><div className="empty-icon">＋</div><h3>你的片单还是空的</h3><p>从搜索开始，把看过的剧和想看的剧都记录下来。</p><button className="primary-button" onClick={() => setActiveView("discover")}>去发现新剧</button></div> : visibleLibrary.length === 0 ? <div className="empty-library compact-empty"><h3>这个分类还没有剧</h3><p>可以切换分类，或者去发现新剧。</p></div> : <div className="library-list">{visibleLibrary.map((show) => <LibraryCard key={show.id} show={show} expanded={expandedId === show.id} onToggle={() => setExpandedId(expandedId === show.id ? null : show.id)} onUpdate={updateShow} onDelete={removeShow} />)}</div>}</section>}
      </section>

      {showSettings && <div className="modal-backdrop" onClick={() => setShowSettings(false)}><div className="settings-modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setShowSettings(false)}>×</button><p className="eyebrow">DATA SETTINGS</p><h2>连接 TMDB 搜索</h2><p>不填也可以使用内置剧库。填写 TMDB API Key 后，可以搜索更多美剧和英剧。Key 只保存在本地。</p><label>TMDB API Key<input type="password" value={tmdbKey} onChange={(event) => saveKey(event.target.value)} placeholder="粘贴你的 API Key" /></label><a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">ȥ TMDB 获取 API Key ↗</a><div className="data-tools"><button className="ghost-button" onClick={exportData}>导出本地数据</button><label className="import-button">导入备份<input type="file" accept="application/json" onChange={importData} /></label></div>{dataNotice && <p className="data-notice">{dataNotice}</p>}<button className="primary-button full" onClick={() => setShowSettings(false)}>完成</button></div></div>}
    </main>
  );
}

function ShowSearchCard({ show, onAdd, isAdded }: { show: Show; onAdd: (show: Show, status?: Status) => void; isAdded: boolean }) {
  const poster = show.posterUrl ?? POSTER_URLS[show.id];
  return <article className="search-result-card"><div className="mini-poster">{poster ? <img src={poster} alt={`${show.titleZh}封面`} /> : show.titleEn.slice(0, 1)}</div><div className="result-info"><h4>{show.titleZh} <small>{show.titleEn}</small></h4><p><span className="score">★ {show.rating ? show.rating.toFixed(1) : "—"}</span> · {show.year || "年份未知"} · {show.genre.join(" / ") || "美剧 / 英剧"}</p></div><button className={isAdded ? "added-button" : "outline-button"} disabled={isAdded} onClick={() => onAdd(show)}>{isAdded ? "已添加" : "＋ 添加"}</button></article>;
}

function LibraryCard({ show, expanded, onToggle, onUpdate, onDelete }: { show: Show; expanded: boolean; onToggle: () => void; onUpdate: (id: string, patch: Partial<Show>) => void; onDelete: (id: string) => void }) {
  const ratings = show.seasonRatings ?? {};
  const poster = show.posterUrl ?? POSTER_URLS[show.id];
  return <article className={expanded ? "library-card expanded" : "library-card"}><div className="library-card-main"><div className="poster-block">{poster ? <img src={poster} alt={`${show.titleZh}封面`} /> : show.titleEn.slice(0, 1)}</div><div className="library-info"><div className="card-topline"><span className={`status-tag ${show.status}`}>{statusLabel(show.status)}</span><span className="show-year">{show.year}</span></div><h3>{show.titleZh}</h3><p className="english-title">{show.titleEn}</p><p className="card-meta">{show.type} · {show.seasons} 季 · 大众评分 {show.rating.toFixed(1)}</p></div><div className="card-actions"><button className="rate-button" onClick={onToggle}>{expanded ? "收起评分" : "按季评分"}</button><button className={show.disliked ? "negative-button active" : "negative-button"} onClick={() => onUpdate(show.id, { disliked: !show.disliked })}>{show.disliked ? "已标记不好看" : "不好看"}</button><button className="delete-button" onClick={() => onDelete(show.id)}>删除</button></div></div>{expanded && <div className="season-panel"><div><p className="eyebrow">SEASON SCORE</p><h4>给每一季留下你的分数</h4></div><div className="season-grid">{Array.from({ length: show.seasons }, (_, index) => index + 1).map((season) => <div className="season-row" key={season}><span>第 {season} 季</span><div className="rating-buttons">{Array.from({ length: 10 }, (_, index) => index + 1).map((score) => <button key={score} aria-label={`第${season}季评分${score}分`} className={ratings[season] === score ? "rating-dot selected" : "rating-dot"} onClick={() => onUpdate(show.id, { seasonRatings: { ...ratings, [season]: score } })}>{score}</button>)}</div><strong>{ratings[season] ? `${ratings[season]} / 10` : "未评分"}</strong></div>)}</div><div className="status-actions"><span>看完所有已播季后：</span>{(["watching", "watchlist", "completed"] as Status[]).map((status) => <button key={status} className={show.status === status ? "status-choice selected" : "status-choice"} onClick={() => onUpdate(show.id, { status })}>{statusLabel(status)}</button>)}</div></div>}</article>;
}
