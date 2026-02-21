import { useState, useEffect } from 'react'
import axios from 'axios'
import { Trophy, Users, Menu, X, Shield, Calendar, Clock, Lock } from 'lucide-react'
import MatchDetailModal from './MatchDetailModal'
import ClubDetailModal from './ClubDetailModal'

const API_BASE_URL = 'https://renca-fc.onrender.com'

interface Category {
  id: number
  name: string
  parent_category: string | null
}

interface LeaderboardEntry {
  club_id: number
  club_name: string
  logo_url: string | null
  pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; pts: number
}

function PublicDashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'adultos'>(1)
  const [adultSeries, setAdultSeries] = useState<'HONOR' | 'ASCENSO'>('HONOR')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeView, setActiveView] = useState<'table' | 'fixture' | 'scorers'>('table')
  
  const [matchDays, setMatchDays] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [scorers, setScorers] = useState<any[]>([])
  const [showAllMatchDays, setShowAllMatchDays] = useState(false)
  const [viewingMatch, setViewingMatch] = useState<any>(null)
  const [viewingClub, setViewingClub] = useState<number | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchMatchDays()
  }, [])

  useEffect(() => {
    if (activeView === 'fixture') {
      fetchMatches()
      const interval = setInterval(fetchMatches, 10000)
      return () => clearInterval(interval)
    } else if (activeView === 'scorers') {
      fetchScorers()
    } else if (selectedCategoryId) {
      fetchLeaderboard()
    }
  }, [selectedCategoryId, adultSeries, activeView])

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/categories`)
      setCategories(res.data)
      if (res.data.length > 0 && !selectedCategoryId) setSelectedCategoryId(res.data[0].id)
    } catch (e) { console.error(e) }
  }

  const fetchMatchDays = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/match-days`)
      setMatchDays(res.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchLeaderboard = async () => {
    try {
      let url = `${API_BASE_URL}/leaderboard/${selectedCategoryId}?series=${adultSeries}`
      if (String(selectedCategoryId) === 'adultos') url = `${API_BASE_URL}/leaderboard/aggregated/adultos?series=${adultSeries}`
      const res = await axios.get(url)
      setLeaderboard(res.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchMatches = async () => {
    if (selectedCategoryId === 'adultos') return setMatches([])
    try {
      const res = await axios.get(`${API_BASE_URL}/matches/${selectedCategoryId}?series=${adultSeries}`)
      setMatches(res.data || [])
    } catch (e) { console.error(e) }
  }

  const fetchScorers = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/top-scorers/${selectedCategoryId}?series=${adultSeries}`)
        setScorers(res.data || [])
    } catch (e) { console.error(e); setScorers([]) }
  }

  const getMatchesByDay = () => {
    const grouped: Record<string, any[]> = {}
    if (!matchDays) return {}
    const now = new Date()
    let visibleDays = showAllMatchDays ? matchDays : matchDays.filter(day => new Date(day.end_date) >= now)
    if (visibleDays.length === 0 && matchDays.length > 0 && !showAllMatchDays) visibleDays = [[...matchDays].sort((a,b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]]
    visibleDays.forEach(day => { grouped[day.name] = [] })
    if (showAllMatchDays) grouped['Otros'] = []
    matches.forEach(m => {
      const mDate = new Date(m.match_date)
      let found = false
      for (const d of visibleDays) {
        const start = new Date(d.start_date); const end = new Date(d.end_date); end.setHours(23,59,59,999)
        if (mDate >= start && mDate <= end) { grouped[d.name].push(m); found = true; break }
      }
      if (!found && showAllMatchDays) grouped['Otros']?.push(m)
    })
    return grouped
  }

  const getCategoryName = () => {
    if (selectedCategoryId === 'adultos') return `General Adultos - ${adultSeries}`
    return categories.find(c => c.id === selectedCategoryId)?.name || 'Cargando...'
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col shadow-2xl z-20`}>
        <div className="p-6 flex items-center gap-3">
          <Trophy className="text-yellow-500 w-8 h-8 flex-shrink-0" />
          {isSidebarOpen && <h1 className="text-xl font-bold tracking-tight uppercase italic">Renca FC</h1>}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          <button onClick={() => { setSelectedCategoryId('adultos'); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${selectedCategoryId === 'adultos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-gray-700 text-gray-400'}`}>
            <Users className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">General Adultos</span>}
          </button>
          <div className="h-px bg-gray-700 my-2 mx-3"></div>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => { setSelectedCategoryId(cat.id); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${selectedCategoryId === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-gray-700 text-gray-400'}`}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-gray-700 rounded text-gray-300">{cat.name.substring(0, 2)}</div>
              {isSidebarOpen && <span className="text-sm font-medium truncate">{cat.name}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button onClick={() => window.location.href = '/login'} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:text-white hover:bg-indigo-600/20 transition-all group">
            <Lock className="w-4 h-4" />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex justify-center p-2 hover:bg-gray-700 rounded-lg">{isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col bg-gray-950">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center px-8 justify-between sticky top-0 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter italic">
               {getCategoryName()}
             </h2>
             {(selectedCategoryId === 'adultos' || categories.find(c => c.id === selectedCategoryId)?.parent_category === 'Adultos') && (
               <div className="flex bg-gray-950 rounded-full p-1 border border-gray-800 shadow-inner">
                  <button onClick={() => setAdultSeries('HONOR')} className={`px-4 py-1 rounded-full text-[10px] font-black transition-all ${adultSeries === 'HONOR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>HONOR</button>
                  <button onClick={() => setAdultSeries('ASCENSO')} className={`px-4 py-1 rounded-full text-[10px] font-black transition-all ${adultSeries === 'ASCENSO' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>ASCENSO</button>
               </div>
             )}
          </div>
          
          <div className="flex gap-2 bg-gray-950 p-1 rounded-xl border border-gray-800">
             <button onClick={() => setActiveView('table')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'table' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>TABLA</button>
             <button onClick={() => setActiveView('fixture')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'fixture' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>FIXTURE</button>
             <button onClick={() => setActiveView('scorers')} className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'scorers' ? 'bg-gray-800 text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>GOLEADORES</button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-500">
          {activeView === 'table' && (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-950 text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] italic">
                        <th className="px-6 py-5">Pos</th>
                        <th className="px-6 py-5">Club</th>
                        <th className="px-6 py-5 text-center">PJ</th>
                        <th className="px-6 py-5 text-center text-green-500">PG</th>
                        <th className="px-6 py-5 text-center text-yellow-500">PE</th>
                        <th className="px-6 py-5 text-center text-red-500">PP</th>
                        <th className="px-6 py-5 text-center">GF</th>
                        <th className="px-6 py-5 text-center">GC</th>
                        <th className="px-6 py-5 text-center">DG</th>
                        <th className="px-6 py-5 text-center text-white bg-indigo-600/10">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {leaderboard.map((entry, index) => (
                          <tr key={index} className="hover:bg-gray-850 transition-colors group">
                            <td className="px-6 py-5 font-black text-gray-600 group-hover:text-white transition-colors italic">{index + 1}</td>
                            <td className="px-6 py-5 cursor-pointer" onClick={() => setViewingClub(entry.club_id)}>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg group-hover:scale-110 transition-transform">{entry.logo_url ? <img src={entry.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-5 h-5 text-gray-300" />}</div>
                                <span className="font-black uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{entry.club_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center font-bold">{entry.pj}</td>
                            <td className="px-6 py-5 text-center text-green-500/80 font-bold">{entry.pg}</td>
                            <td className="px-6 py-5 text-center text-yellow-500/80 font-bold">{entry.pe}</td>
                            <td className="px-6 py-5 text-center text-red-500/80 font-bold">{entry.pp}</td>
                            <td className="px-6 py-5 text-center text-gray-400 font-bold">{entry.gf}</td>
                            <td className="px-6 py-5 text-center text-gray-400 font-bold">{entry.gc}</td>
                            <td className="px-6 py-5 text-center font-black text-indigo-300 italic">{entry.dg > 0 ? `+${entry.dg}` : entry.dg}</td>
                            <td className="px-6 py-5 text-center bg-indigo-600/5 font-black text-indigo-400 text-lg italic">{entry.pts}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

          {activeView === 'fixture' && (
            <div className="space-y-10">
              <div className="flex justify-end">
                <button onClick={() => setShowAllMatchDays(!showAllMatchDays)} className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] border border-indigo-500/20 px-4 py-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 transition-all">{showAllMatchDays ? 'Ocultar fechas pasadas' : 'Ver fixture completo'}</button>
              </div>
              {Object.entries(getMatchesByDay()).map(([dayName, dayMatches]) => (
                dayMatches.length > 0 && (
                  <div key={dayName} className="animate-in slide-in-from-bottom-4">
                    <h3 className="text-xs font-black text-yellow-500 mb-6 uppercase tracking-[0.3em] border-l-4 border-yellow-500 pl-4 italic">{dayName}</h3>
                    <div className="grid gap-4">
                      {dayMatches.map((m) => (
                        <div key={m.id} onClick={() => setViewingMatch(m)} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl flex flex-col gap-4 hover:border-indigo-500/50 transition-all cursor-pointer shadow-xl group relative overflow-hidden active:scale-[0.98]">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px]"></div>
                          <div className="flex items-center justify-between relative">
                            <div className="flex-1 text-right font-black uppercase text-sm tracking-tight pr-6 group-hover:text-indigo-400 transition-colors" onClick={(e) => { e.stopPropagation(); setViewingClub(m.home_team?.club?.id); }}>{m.home_team?.club?.name || 'Local'}</div>
                            <div className="flex flex-col items-center gap-2 shrink-0">
                               <div className="bg-gray-950 px-6 py-3 rounded-2xl flex items-center gap-4 border border-gray-800 shadow-inner">
                                  <span className="text-3xl font-black italic text-white">{m.home_score}</span>
                                  <span className="text-gray-700 font-black text-xs uppercase tracking-widest">vs</span>
                                  <span className="text-3xl font-black italic text-white">{m.away_score}</span>
                               </div>
                               <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.match_date).toLocaleDateString()}</div>
                                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(m.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                               </div>
                            </div>
                            <div className="flex-1 text-left font-black uppercase text-sm tracking-tight pl-6 group-hover:text-indigo-400 transition-colors" onClick={(e) => { e.stopPropagation(); setViewingClub(m.away_team?.club?.id); }}>{m.away_team?.club?.name || 'Visita'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {activeView === 'scorers' && (
            <div className="space-y-16">
               <div className="flex flex-col sm:flex-row items-end justify-center gap-8 pt-10">
                  {[1, 0, 2].map((pos) => {
                      const scorer = scorers[pos];
                      if(!scorer) return null;
                      return (
                        <div key={scorer.player_id} className={`flex flex-col items-center group w-full sm:w-56 ${pos === 0 ? 'mb-8 sm:mb-12 scale-110 z-10' : ''}`}>
                           <div className="relative mb-4">
                              <div className={`rounded-[32px] flex items-center justify-center border-4 shadow-2xl transition-all group-hover:scale-110 bg-white ${pos === 0 ? 'w-32 h-32 border-yellow-500' : pos === 1 ? 'w-24 h-24 border-gray-400' : 'w-24 h-24 border-orange-600'}`}>
                                 {scorer.club_logo ? <img src={scorer.club_logo} className="w-16 h-16 object-contain" /> : <Shield className="w-10 h-10 text-gray-200" />}
                              </div>
                              <div className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg border-2 shadow-lg ${pos === 0 ? 'bg-yellow-500 border-yellow-300 text-yellow-900' : pos === 1 ? 'bg-gray-400 border-gray-200 text-gray-800' : 'bg-orange-600 border-orange-400 text-orange-100'}`}>
                                 {pos + 1}
                              </div>
                           </div>
                           <h4 className="font-black text-center text-sm truncate w-full uppercase tracking-tighter text-white">{scorer.player_name}</h4>
                           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1 italic">{scorer.club_name}</p>
                           <div className="mt-4 bg-indigo-600 px-6 py-2 rounded-2xl text-white font-black text-2xl italic shadow-lg shadow-indigo-600/30">{scorer.goals} <span className="text-[10px] font-black not-italic ml-1">GOLES</span></div>
                        </div>
                      )
                  })}
               </div>

               <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                     <thead className="bg-gray-950 text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] italic">
                        <tr><th className="px-8 py-5">Ranking</th><th className="px-8 py-5">Jugador</th><th className="px-8 py-5">Club</th><th className="px-8 py-5 text-center bg-indigo-600/10 text-white">Goles</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800">
                        {scorers.map((s, index) => (
                           <tr key={s.player_id} className="hover:bg-gray-850 transition-colors group">
                              <td className="px-8 py-5 font-black text-gray-600 italic">{index + 1}</td>
                              <td className="px-8 py-5 font-black text-gray-200 uppercase text-xs">{s.player_name}</td>
                              <td className="px-8 py-5 text-[10px] text-gray-500 uppercase font-black tracking-widest">{s.club_name}</td>
                              <td className="px-8 py-5 text-center font-black text-indigo-400 text-xl italic">{s.goals}</td>
                           </tr>
                        ))}
                        {scorers.length === 0 && <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-600 font-bold uppercase text-xs tracking-widest italic opacity-50">No hay registros de goleadores todavía</td></tr>}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {viewingMatch && <MatchDetailModal match={viewingMatch} onClose={() => setViewingMatch(null)} />}
      {viewingClub && <ClubDetailModal clubId={viewingClub} onClose={() => setViewingClub(null)} />}
    </div>
  )
}

export default PublicDashboard
