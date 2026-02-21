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

  // SEGURIDAD
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

  const handleAddEvent = async (playerId: number, type: string) => {
    try {
      await axios.post(`${API_BASE_URL}/match-events`, { 
        match_id: match.id, 
        player_id: playerId, 
        event_type: type, 
        minute: parseInt(eventMinute) || 0 
      }, authHeader)
      setEventMinute(''); fetchMatchData();
    } catch (e) { alert('No autorizado o error de datos') }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/match-events/${id}`, authHeader)
      fetchMatchData()
    } catch (e) { alert('Error al eliminar evento') }
  }

  const toggleMatchStatus = async () => {
    try {
      await axios.put(`${API_BASE_URL}/matches/${match.id}/result`, { 
        home_score: match.home_score, 
        away_score: match.away_score, 
        is_played: !match.is_played 
      }, authHeader)
      onClose()
    } catch (e) { alert('Error al cambiar estado') }
  }

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col font-sans overflow-hidden animate-in fade-in duration-300">
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shrink-0 shadow-2xl">
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-all active:scale-90"><ArrowLeft className="text-gray-400" /></button>
        <div className="flex items-center gap-12">
           <div className="text-center group">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1 group-hover:text-indigo-400 transition-colors">LOCAL</div>
              <div className="font-black text-xl uppercase italic truncate max-w-[120px] text-white leading-none mb-2">{match.home_team.club.name}</div>
              <div className="text-4xl font-black italic text-indigo-500">{match.home_score}</div>
           </div>
           <div className="bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center font-black text-xs text-gray-600 border border-gray-700 shadow-inner">VS</div>
           <div className="text-center group">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] mb-1 group-hover:text-indigo-400 transition-colors">VISITA</div>
              <div className="font-black text-xl uppercase italic truncate max-w-[120px] text-white leading-none mb-2">{match.away_team.club.name}</div>
              <div className="text-4xl font-black italic text-indigo-500">{match.away_score}</div>
           </div>
        </div>
        <button onClick={toggleMatchStatus} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${match.is_played ? 'bg-yellow-600 text-black shadow-yellow-600/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>
           {match.is_played ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
           {match.is_played ? 'Reabrir para Edición' : 'Finalizar y Cerrar'}
        </button>
      </header>

      <nav className="bg-gray-900 border-b border-gray-800 flex justify-center gap-2 p-3 shrink-0">
         <button onClick={() => setActiveTab('control')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-800'}`}>Panel de Control</button>
         <button onClick={() => setActiveTab('audit')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-800'}`}>Caja Negra (Log)</button>
      </nav>

      <main className="flex-1 overflow-hidden flex flex-col p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'control' && (
          <div className="flex-1 flex flex-col overflow-hidden gap-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
               
               <section className="bg-gray-900 rounded-[32px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px]"></div>
                  <div className="p-6 border-b border-gray-800 space-y-5 relative">
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-gray-700 font-bold" placeholder="Buscar jugador por nombre o RUT..." />
                     </div>
                     <div className="flex items-center gap-4 bg-gray-950/50 p-3 rounded-2xl border border-gray-800 shadow-inner">
                        <label className="text-[10px] font-black uppercase text-indigo-400 italic tracking-widest ml-2">Minuto de Incidencia:</label>
                        <input type="number" value={eventMinute} onChange={e => setEventMinute(e.target.value)} className="w-24 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm font-black text-center text-white focus:border-indigo-500 outline-none shadow-lg" placeholder="0" />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-3 relative">
                     {filteredPlayers.length > 0 ? filteredPlayers.map(p => (
                       <div key={p.id} className="bg-gray-950/40 p-4 rounded-3xl border border-gray-800 flex items-center justify-between group hover:border-indigo-500/40 transition-all hover:bg-gray-800/30">
                          <div>
                             <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 px-2 py-0.5 rounded inline-block ${p.team_id === match.home_team_id ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>{p.team_id === match.home_team_id ? 'LOCAL' : 'VISITA'}</div>
                             <div className="font-black text-sm uppercase text-gray-200">{p.name} <span className="text-indigo-500 ml-2 font-mono">#{p.number || '-'}</span></div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleAddEvent(p.id, 'GOAL')} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-green-500/20 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-600/10">Gol</button>
                             <button onClick={() => handleAddEvent(p.id, 'YELLOW_CARD')} className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[10px] font-black border border-yellow-500/20 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-yellow-500/10">🟨</button>
                             <button onClick={() => handleAddEvent(p.id, 'RED_CARD')} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black border border-red-500/20 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/10">🟥</button>
                          </div>
                       </div>
                     )) : (
                        <div className="text-center py-20 text-gray-700 font-bold uppercase text-xs tracking-widest italic opacity-50">No se encontraron jugadores</div>
                     )}
                  </div>
               </section>

               <section className="bg-gray-900 rounded-[32px] border border-gray-800 flex flex-col overflow-hidden shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/5 blur-[60px]"></div>
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center relative">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 italic">Timeline del Partido</h3>
                     <Save className="w-5 h-5 text-indigo-500 animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4 relative">
                     {events.length > 0 ? events.sort((a,b) => b.id - a.id).map(e => (
                       <div key={e.id} className="bg-gray-950 p-5 rounded-3xl border border-gray-800 flex items-center justify-between group animate-in slide-in-from-right-4 border-l-4 border-l-indigo-600">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center font-black text-indigo-400 text-lg italic border border-gray-800 shadow-inner">{e.minute}'</div>
                             <div>
                                <div className="text-[10px] font-black uppercase text-indigo-500 mb-1 tracking-widest">{e.event_type === 'GOAL' ? '⚽ GOL ANOTADO' : '🎴 INCIDENCIA'}</div>
                                <div className="text-sm font-black uppercase text-white">{e.player.name}</div>
                             </div>
                          </div>
                          <button onClick={() => handleDeleteEvent(e.id)} className="p-3 text-gray-700 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                       </div>
                     )) : (
                        <div className="text-center py-32 text-gray-700 font-bold uppercase text-[10px] tracking-[0.3em] italic opacity-30">Aún no hay sucesos registrados</div>
                     )}
                  </div>
               </section>

            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden flex flex-col flex-1 shadow-2xl animate-in fade-in">
             <div className="overflow-y-auto p-8 custom-scrollbar space-y-5">
                {audit.map(log => (
                  <div key={log.id} className="flex gap-6 items-start bg-gray-950/50 p-5 rounded-[24px] border border-gray-800 border-l-4 border-l-indigo-600 hover:bg-gray-900 transition-colors">
                     <div className="text-[10px] font-mono text-gray-600 whitespace-nowrap pt-1 uppercase tracking-tighter">{new Date(log.timestamp).toLocaleTimeString()}</div>
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-400/5 px-2 py-0.5 rounded">{log.user?.username || 'Sistema'}</span>
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
