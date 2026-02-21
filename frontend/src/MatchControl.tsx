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

  const fetchMatchData = useCallback(async () => {
    try {
      const [eRes, pRes, aRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/matches/${match.id}/events`),
        axios.get(`${API_BASE_URL}/matches/${match.id}/players`),
        axios.get(`${API_BASE_URL}/matches/${match.id}/audit`)
      ])
      setEvents(eRes.data)
      setPlayers(pRes.data)
      setAudit(aRes.data)
    } catch (e) { console.error(e) }
  }, [match.id])

  useEffect(() => { fetchMatchData() }, [fetchMatchData])

  const handleAddEvent = async (playerId: number, type: string) => {
    try {
      await axios.post(`${API_BASE_URL}/match-events`, { match_id: match.id, player_id: playerId, event_type: type, minute: parseInt(eventMinute) || 0 })
      setEventMinute(''); fetchMatchData();
    } catch (e) { alert('Error') }
  }

  const handleDeleteEvent = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/match-events/${id}`)
      fetchMatchData()
    } catch (e) { alert('Error') }
  }

  const toggleMatchStatus = async () => {
    try {
      await axios.put(`${API_BASE_URL}/matches/${match.id}/result`, { home_score: match.home_score, away_score: match.away_score, is_played: !match.is_played })
      onClose()
    } catch (e) { alert('Error') }
  }

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col font-sans overflow-hidden animate-in fade-in duration-300">
      <header className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ArrowLeft /></button>
        <div className="flex items-center gap-8">
           <div className="text-right">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{match.home_team.club.name}</div>
              <div className="text-3xl font-black italic">{match.home_score}</div>
           </div>
           <div className="bg-gray-800 px-4 py-1 rounded-full text-[10px] font-black text-indigo-400 border border-indigo-500/20">VS</div>
           <div className="text-left">
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{match.away_team.club.name}</div>
              <div className="text-3xl font-black italic">{match.away_score}</div>
           </div>
        </div>
        <button onClick={toggleMatchStatus} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${match.is_played ? 'bg-yellow-600 text-black' : 'bg-green-600 text-white shadow-lg shadow-green-600/20'}`}>
           {match.is_played ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
           {match.is_played ? 'Reabrir Partido' : 'Finalizar Partido'}
        </button>
      </header>

      <nav className="bg-gray-900 border-b border-gray-800 flex justify-center gap-2 p-2 shrink-0">
         <button onClick={() => setActiveTab('control')} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'control' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>Control</button>
         <button onClick={() => setActiveTab('audit')} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-800'}`}>Bitácora</button>
      </nav>

      <main className="flex-1 overflow-hidden flex flex-col p-6 max-w-6xl mx-auto w-full">
        {activeTab === 'control' && (
          <div className="flex-1 flex flex-col overflow-hidden gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
               
               <section className="bg-gray-900 rounded-3xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-gray-800 space-y-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-indigo-500 outline-none transition-all" placeholder="Buscar jugador..." />
                     </div>
                     <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black uppercase text-indigo-400 italic">Minuto Evento:</label>
                        <input type="number" value={eventMinute} onChange={e => setEventMinute(e.target.value)} className="w-20 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-black text-center focus:border-indigo-500 outline-none" placeholder="0" />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                     {filteredPlayers.map(p => (
                       <div key={p.id} className="bg-gray-950/50 p-3 rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                          <div>
                             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{p.team_id === match.home_team_id ? 'Local' : 'Visita'}</div>
                             <div className="font-black text-xs uppercase">{p.name} <span className="text-indigo-500 ml-1">#{p.number || '-'}</span></div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleAddEvent(p.id, 'GOAL')} className="bg-green-600/10 text-green-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-green-500/20 hover:bg-green-600 hover:text-white transition-all">Gol</button>
                             <button onClick={() => handleAddEvent(p.id, 'YELLOW_CARD')} className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">🟨</button>
                             <button onClick={() => handleAddEvent(p.id, 'RED_CARD')} className="bg-red-600/10 text-red-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-red-500/20 hover:bg-red-600 hover:text-white transition-all">🟥</button>
                          </div>
                       </div>
                     ))}
                  </div>
               </section>

               <section className="bg-gray-900 rounded-3xl border border-gray-800 flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">Sucesos del Partido</h3>
                     <Save className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                     {events.sort((a,b) => b.id - a.id).map(e => (
                       <div key={e.id} className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex items-center justify-between group animate-in slide-in-from-right-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center font-black text-indigo-400 text-sm italic border border-gray-800 shadow-inner">{e.minute}'</div>
                             <div>
                                <div className="text-[9px] font-black uppercase text-indigo-500 mb-0.5">{e.event_type}</div>
                                <div className="text-xs font-black uppercase">{e.player.name}</div>
                             </div>
                          </div>
                          <button onClick={() => handleDeleteEvent(e.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                     ))}
                  </div>
               </section>

            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden flex flex-col flex-1 shadow-2xl">
             <div className="overflow-y-auto p-6 custom-scrollbar space-y-4">
                {audit.map(log => (
                  <div key={log.id} className="flex gap-4 items-start bg-gray-950/50 p-4 rounded-2xl border border-gray-800 border-l-4 border-l-indigo-600">
                     <div className="text-[10px] font-mono text-gray-600 whitespace-nowrap pt-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{log.user?.username || 'Sistema'}</span>
                           <Flag className="w-2.5 h-2.5 text-gray-700" />
                           <span className="text-[9px] font-black uppercase text-gray-500">{log.action}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-tight italic">{log.details}</p>
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
