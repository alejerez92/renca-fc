import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Clock, AlertTriangle, XCircle } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

function MatchDetailModal({ match, onClose }: { match: any, onClose: () => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/matches/${match.id}/events`)
        setEvents(res.data)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [match.id])

  // Separar eventos por equipo para mostrar goleadores bajo el escudo
  const homeEvents = events.filter(e => e.player.team_id === match.home_team_id)
  const awayEvents = events.filter(e => e.player.team_id === match.away_team_id)

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header con Marcador */}
        <div className="bg-gray-800 p-8 border-b border-gray-700 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-2 text-xs text-gray-500 uppercase tracking-widest font-bold">
            {match.is_played ? 'Finalizado' : 'En Juego'} • {new Date(match.match_date).toLocaleDateString()}
          </div>

          <div className="flex items-center justify-between">
             {/* Local */}
             <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 shadow-lg">
                   <img src={match.home_team.club.logo_url} className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight mb-2">{match.home_team.club.name}</h3>
                <div className="text-5xl font-black text-white">{match.home_score}</div>
             </div>

             {/* VS */}
             <div className="px-4">
                <div className="text-2xl text-gray-600 font-light">VS</div>
             </div>

             {/* Visita */}
             <div className="flex-1 text-center">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-gray-800 shadow-lg">
                   <img src={match.away_team.club.logo_url} className="w-12 h-12 object-contain" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight mb-2">{match.away_team.club.name}</h3>
                <div className="text-5xl font-black text-white">{match.away_score}</div>
             </div>
          </div>
        </div>

        {/* Incidencias / Goleadores */}
        <div className="p-6 bg-gray-950 min-h-[300px]">
           <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 text-center border-b border-gray-800 pb-2">Incidencias del Partido</h4>
           
           {events.length === 0 ? (
             <div className="text-center text-gray-600 py-8 italic text-sm">No hay incidencias registradas.</div>
           ) : (
             <div className="space-y-3">
               {events.slice().reverse().map(event => (
                 <div key={event.id} className="flex items-center justify-center gap-4 text-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className={`flex-1 text-right ${event.player.team_id === match.home_team_id ? 'text-white font-bold' : 'text-gray-600'}`}>
                       {event.player.team_id === match.home_team_id && event.player.name}
                    </div>
                    
                    <div className="w-16 flex justify-center shrink-0">
                       <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 font-mono text-indigo-400 font-bold text-xs flex items-center gap-2">
                          {event.minute}'
                          {event.event_type === 'GOAL' && <span>⚽</span>}
                          {event.event_type === 'YELLOW_CARD' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                          {event.event_type === 'RED_CARD' && <XCircle className="w-3 h-3 text-red-500" />}
                       </div>
                    </div>

                    <div className={`flex-1 text-left ${event.player.team_id === match.away_team_id ? 'text-white font-bold' : 'text-gray-600'}`}>
                       {event.player.team_id === match.away_team_id && event.player.name}
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default MatchDetailModal
