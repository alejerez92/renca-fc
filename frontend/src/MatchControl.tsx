import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Save, Flag, Trash2, ArrowLeft, Search, Lock, Unlock } from 'lucide-react'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function MatchControl({ match, onClose }: { match: any, onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'control' | 'audit'>('control')
  const [searchQuery, setSearchQuery] = useState('')
  const [eventMinute, setEventMinute] = useState<string>('')

  // SEGURIDAD CRÍTICA
  const token = localStorage.getItem('renca_token')
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  const fetchMatchData = useCallback(async () => {
    try {
      const [eRes, pRes, aRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/matches/${match.id}/events`),
        axios.get(`${API_BASE_URL}/matches/${match.id}/players`),
        axios.get(`${API_BASE_URL}/matches/${match.id}/audit`, authHeader)
      ])
      setEvents(eRes.data)
      setPlayers(pRes.data)
      setAudit(aRes.data)
    } catch (e) { console.error(e) }
  }, [match.id])

  useEffect(() => { fetchMatchData() }, [fetchMatchData])

  // CÁLCULO DE MARCADOR EN TIEMPO REAL
  const currentHomeScore = events.filter(e => e.event_type === 'GOAL' && e.player.team_id === match.home_team_id).length
  const currentAwayScore = events.filter(e => e.event_type === 'GOAL' && e.player.team_id === match.away_team_id).length

  const handleAddEvent = async (playerId: number, type: string) => {
    try {
      await axios.post(`${API_BASE_URL}/match-events`, { 
        match_id: match.id, 
        player_id: playerId, 
        event_type: type, 
        minute: parseInt(eventMinute) || 0 
      }, authHeader)
      setEventMinute(''); 
      fetchMatchData();
    } catch (e) { alert('Error de autorización o servidor') }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/match-events/${id}`, authHeader)
      fetchMatchData()
    } catch (e) { alert('Error al eliminar') }
  }

  const toggleMatchStatus = async () => {
    try {
      // Al cerrar el partido, enviamos los goles calculados para asegurar que la DB se sincronice
      await axios.put(`${API_BASE_URL}/matches/${match.id}/result`, { 
        home_score: currentHomeScore, 
        away_score: currentAwayScore, 
        is_played: !match.is_played 
      }, authHeader)
      onClose()
    } catch (e) { alert('Error al cambiar estado') }
  }

  const homePlayers = players.filter(p => p.team_id === match.home_team_id && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const awayPlayers = players.filter(p => p.team_id === match.away_team_id && p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col font-sans overflow-hidden animate-in fade-in duration-300">
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shrink-0 shadow-2xl">
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-all active:scale-90"><ArrowLeft className="text-gray-400" /></button>
        <div className="flex items-center gap-12">
           <div className="text-center">
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">LOCAL</div>
              <div className="font-black text-xl uppercase italic truncate max-w-[150px] text-white leading-none mb-2">{match.home_team.club.name}</div>
              <div className="text-4xl font-black italic text-white">{currentHomeScore}</div>
           </div>
           <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center font-black text-xs text-gray-600 border border-gray-700 shadow-inner italic">VS</div>
           <div className="text-center">
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-1">VISITA</div>
              <div className="font-black text-xl uppercase italic truncate max-w-[150px] text-white leading-none mb-2">{match.away_team.club.name}</div>
              <div className="text-4xl font-black italic text-white">{currentAwayScore}</div>
           </div>
        </div>
        <button onClick={toggleMatchStatus} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${match.is_played ? 'bg-yellow-600 text-black' : 'bg-green-600 text-white'}`}>
           {match.is_played ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
           {match.is_played ? 'REABRIR' : 'FINALIZAR'}
        </button>
      </header>

      <nav className="bg-gray-900 border-b border-gray-800 flex justify-center gap-2 p-3 shrink-0">
         <button onClick={() => setActiveTab('control')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:bg-gray-800'}`}>Panel de Control</button>
         <button onClick={() => setActiveTab('audit')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:bg-gray-800'}`}>Bitácora (Log)</button>
      </nav>

      <div className="bg-gray-900 p-4 border-b border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-center shrink-0">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-gray-700 font-bold" placeholder="Buscar jugador..." />
         </div>
         <div className="flex items-center gap-3 bg-gray-950 px-4 py-2 rounded-2xl border border-gray-800 shadow-inner shrink-0">
            <label className="text-[10px] font-black uppercase text-gray-500 italic tracking-widest">Minuto:</label>
            <input type="number" value={eventMinute} onChange={e => setEventMinute(e.target.value)} className="w-16 bg-gray-900 border border-gray-700 rounded-xl px-2 py-1 text-sm font-black text-center text-white focus:border-indigo-500 outline-none" placeholder="0" />
         </div>
      </div>

      <main className="flex-1 overflow-hidden p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === 'control' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4">
            
            {/* EQUIPO LOCAL */}
            <section className="lg:col-span-4 bg-gray-900 rounded-[32px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
               <div className="p-4 bg-indigo-600/10 border-b border-gray-800 text-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 italic">LOCAL: {match.home_team.club.name}</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                  {homePlayers.map(p => (
                    <div key={p.id} className="bg-gray-950/40 p-3 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                       <div className="min-w-0 flex-1">
                          <div className="font-black text-xs uppercase text-gray-200 truncate">{p.name} <span className="text-indigo-500 ml-1 font-mono">#{p.number || '-'}</span></div>
                       </div>
                       <div className="flex gap-1.5 ml-4 shrink-0">
                          <button onClick={() => handleAddEvent(p.id, 'GOAL')} className="bg-green-600/20 text-green-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-green-500/20 hover:bg-green-600 hover:text-white transition-all">Gol</button>
                          <button onClick={() => handleAddEvent(p.id, 'YELLOW_CARD')} className="bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-lg text-[9px] font-black border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">🟨</button>
                          <button onClick={() => handleAddEvent(p.id, 'RED_CARD')} className="bg-red-600/20 text-red-500 px-2.5 py-1 rounded-lg text-[9px] font-black border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">🟥</button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* TIMELINE CENTRAL */}
            <section className="lg:col-span-4 bg-gray-950 rounded-[32px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl relative">
               <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 shrink-0">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Timeline del Encuentro</h3>
                  <Save className="w-4 h-4 text-indigo-500 animate-pulse" />
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 relative">
                  {events.sort((a,b) => b.id - a.id).map(e => (
                    <div key={e.id} className="bg-gray-900 p-4 rounded-2xl border border-gray-800 flex items-center justify-between group animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs italic border border-gray-800 shadow-inner ${e.event_type === 'GOAL' ? 'bg-green-600 text-white' : 'bg-gray-800 text-indigo-400'}`}>{e.minute}'</div>
                          <div>
                             <div className="text-[9px] font-black uppercase text-gray-500 mb-0.5">{e.event_type} - {e.player.team_id === match.home_team_id ? 'LOCAL' : 'VISITA'}</div>
                             <div className="text-xs font-black uppercase text-white truncate max-w-[120px]">{e.player.name}</div>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteEvent(e.id)} className="p-2 text-gray-700 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
               </div>
            </section>

            {/* EQUIPO VISITA */}
            <section className="lg:col-span-4 bg-gray-900 rounded-[32px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
               <div className="p-4 bg-violet-600/10 border-b border-gray-800 text-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-violet-400 italic">VISITA: {match.away_team.club.name}</h3>
               </div>
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                  {awayPlayers.map(p => (
                    <div key={p.id} className="bg-gray-950/40 p-3 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-violet-500/40 transition-all">
                       <div className="min-w-0 flex-1">
                          <div className="font-black text-xs uppercase text-gray-200 truncate">{p.name} <span className="text-violet-500 ml-1 font-mono">#{p.number || '-'}</span></div>
                       </div>
                       <div className="flex gap-1.5 ml-4 shrink-0">
                          <button onClick={() => handleAddEvent(p.id, 'GOAL')} className="bg-green-600/20 text-green-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-green-500/20 hover:bg-green-600 hover:text-white transition-all">Gol</button>
                          <button onClick={() => handleAddEvent(p.id, 'YELLOW_CARD')} className="bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-lg text-[9px] font-black border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">🟨</button>
                          <button onClick={() => handleAddEvent(p.id, 'RED_CARD')} className="bg-red-600/20 text-red-500 px-2.5 py-1 rounded-lg text-[9px] font-black border border-red-600/20 hover:bg-red-600 hover:text-white transition-all">🟥</button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

          </div>
        )}

        {activeTab === 'audit' && (
          <div className="h-full bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden flex flex-col shadow-2xl animate-in fade-in">
             <div className="overflow-y-auto p-8 custom-scrollbar space-y-4">
                {audit.map(log => (
                  <div key={log.id} className="flex gap-6 items-start bg-gray-950/50 p-5 rounded-[24px] border border-gray-800 border-l-4 border-l-indigo-600 hover:bg-gray-900 transition-colors">
                     <div className="text-[10px] font-mono text-gray-600 whitespace-nowrap pt-1 uppercase tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()}</div>
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{log.user_name || 'Sistema'}</span>
                           <Flag className="w-3 h-3 text-gray-700" />
                           <span className="text-[10px] font-black uppercase text-gray-500 italic">{log.action}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-300 uppercase tracking-tight italic leading-relaxed">{log.details}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default MatchControl
