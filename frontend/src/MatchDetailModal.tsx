import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { X, Trophy, AlertCircle } from 'lucide-react'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function MatchDetailModal({ match, onClose }: { match: any, onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/matches/${match.id}/events`)
      setEvents(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [match.id])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const homeName = match.home_team?.club?.name || 'Local'
  const awayName = match.away_team?.club?.name || 'Visita'

  const getEventText = (e: any) => {
    const playerName = e.player?.name || 'Jugador'
    const teamName = e.player?.team_id === match.home_team_id ? homeName : awayName
    
    switch(e.event_type) {
      case 'GOAL': return `¡GOL! de ${playerName} para ${teamName}`
      case 'YELLOW_CARD': return `Tarjeta Amarilla para ${playerName} (${teamName})`
      case 'RED_CARD': return `Tarjeta Roja para ${playerName} (${teamName})`
      default: return `${e.event_type} - ${playerName}`
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <header className="p-6 bg-gray-800/50 border-b border-gray-700 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
              <Trophy className="text-yellow-500 w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-white italic">Ficha del Partido</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="flex items-center justify-between gap-4 mb-12">
              <div className="flex-1 text-center space-y-4">
                 <div className="w-24 h-24 bg-white rounded-3xl p-4 mx-auto shadow-2xl flex items-center justify-center border-4 border-gray-800">
                    {match.home_team?.club?.logo_url ? <img src={match.home_team.club.logo_url} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-100 rounded-lg"></div>}
                 </div>
                 <div className="font-black uppercase text-xs tracking-tighter text-gray-300 h-8 flex items-center justify-center leading-none">{homeName}</div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                 <div className="text-6xl font-black italic tracking-tighter text-indigo-500 bg-gray-950 px-10 py-6 rounded-[32px] border border-gray-800 shadow-inner">
                    {match.home_score} - {match.away_score}
                 </div>
                 {match.is_played && <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-4 py-1 rounded-full border border-green-500/20 tracking-widest shadow-lg shadow-green-500/5">Finalizado</span>}
              </div>

              <div className="flex-1 text-center space-y-4">
                 <div className="w-24 h-24 bg-white rounded-3xl p-4 mx-auto shadow-2xl flex items-center justify-center border-4 border-gray-800">
                    {match.away_team?.club?.logo_url ? <img src={match.away_team.club.logo_url} className="w-full h-full object-contain" /> : <div className="w-full h-full bg-gray-100 rounded-lg"></div>}
                 </div>
                 <div className="font-black uppercase text-xs tracking-tighter text-gray-300 h-8 flex items-center justify-center leading-none">{awayName}</div>
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] text-center border-b border-gray-800 pb-4 italic">Línea de Tiempo</h4>
              
              <div className="relative border-l-2 border-gray-800 ml-4 space-y-8 pb-8">
                 {loading ? (
                    <div className="pl-8 py-4 animate-pulse text-gray-600 font-bold uppercase text-[10px] tracking-widest">Cargando cronología...</div>
                 ) : events.length > 0 ? (
                   <>
                     {events.sort((a,b) => a.minute - b.minute).map(e => (
                       <div key={e.id} className="relative pl-8 animate-in slide-in-from-left-4">
                          <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-gray-900 shadow-xl ${e.event_type === 'GOAL' ? 'bg-green-500' : e.event_type === 'YELLOW_CARD' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          <div className="bg-gray-800/40 p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-indigo-400 italic">Minuto {e.minute}'</span>
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{e.event_type === 'GOAL' ? '⚽ GOL' : '🎴 TARJETA'}</span>
                             </div>
                             <p className="text-sm font-bold text-gray-200 uppercase tracking-tight">{getEventText(e)}</p>
                          </div>
                       </div>
                     ))}
                     {match.is_played && (
                        <div className="relative pl-8">
                           <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-gray-900 bg-indigo-600 shadow-xl"></div>
                           <div className="bg-indigo-600/10 p-4 rounded-2xl border border-indigo-500/20">
                              <p className="text-sm font-black text-indigo-400 uppercase italic tracking-widest">🏁 Fin del Encuentro</p>
                           </div>
                        </div>
                     )}
                   </>
                 ) : (
                   <div className="pl-8 flex items-center gap-3 text-gray-600">
                      <AlertCircle className="w-4 h-4" />
                      <p className="font-bold uppercase text-[10px] tracking-widest italic">No hay sucesos registrados para este partido</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal
