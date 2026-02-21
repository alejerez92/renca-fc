import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { X } from 'lucide-react'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function MatchDetailModal({ match, onClose }: { match: any, onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([])

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/matches/${match.id}/events`)
      setEvents(res.data)
    } catch (e) { console.error(e) }
  }, [match.id])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Sacamos los nombres y logos con seguridad extrema
  const homeName = match.home_team?.club?.name || 'Equipo Local'
  const homeLogo = match.home_team?.club?.logo_url
  const awayName = match.away_team?.club?.name || 'Equipo Visita'
  const awayLogo = match.away_team?.club?.logo_url

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        <header className="p-6 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
           <h3 className="font-black uppercase tracking-widest text-xs text-gray-400 italic">Detalle del Encuentro</h3>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X className="w-6 h-6" /></button>
        </header>

        <div className="p-8 space-y-8">
           <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center space-y-3">
                 <div className="w-20 h-20 bg-white rounded-2xl p-3 mx-auto shadow-xl flex items-center justify-center">
                    {homeLogo ? <img src={homeLogo} className="w-full h-full object-contain" /> : <div className="text-[10px] text-gray-400 font-bold uppercase">Sin Logo</div>}
                 </div>
                 <div className="font-black uppercase text-sm">{homeName}</div>
              </div>
              <div className="text-5xl font-black italic tracking-tighter text-indigo-500 bg-gray-950 px-8 py-4 rounded-3xl border border-gray-800 shadow-inner">
                 {match.home_score || 0} - {match.away_score || 0}
              </div>
              <div className="flex-1 text-center space-y-3">
                 <div className="w-20 h-20 bg-white rounded-2xl p-3 mx-auto shadow-xl flex items-center justify-center">
                    {awayLogo ? <img src={awayLogo} className="w-full h-full object-contain" /> : <div className="text-[10px] text-gray-400 font-bold uppercase">Sin Logo</div>}
                 </div>
                 <div className="font-black uppercase text-sm">{awayName}</div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] text-center border-b border-gray-800 pb-2">Cronología</h4>
              <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                 {events.length > 0 ? events.sort((a,b) => a.minute - b.minute).map(e => (
                   <div key={e.id} className={`flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700 ${e.player?.team_id === match.home_team_id ? 'border-l-4 border-l-indigo-500' : 'flex-row-reverse border-r-4 border-r-indigo-500'}`}>
                      <div className="font-black text-indigo-400 italic text-sm w-10 text-center">{e.minute}'</div>
                      <div className="flex-1 font-bold text-xs uppercase text-gray-200">
                         {e.player?.name || 'Jugador'} <span className="text-gray-500 ml-1">({e.event_type})</span>
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-10 text-gray-600 font-bold uppercase text-[10px] tracking-widest italic">No hay sucesos registrados</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default MatchDetailModal
