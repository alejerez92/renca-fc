import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Save, Clock, Flag, AlertTriangle, XCircle, Trash2, ArrowLeft, Search, Lock, Unlock } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

function MatchControl({ match, onClose }: { match: any, onClose: () => void }) {
  const [players, setPlayers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [eventType, setEventType] = useState<'GOAL' | 'YELLOW_CARD' | 'RED_CARD'>('GOAL')
  const [minute, setMinute] = useState('')

  // Estados para búsqueda
  const [homeSearch, setHomeSearch] = useState('')
  const [awaySearch, setAwaySearch] = useState('')

  // Estado de Bloqueo Local (Para permitir correcciones temporales)
  const [isLocked, setIsLocked] = useState(match.is_played)

  useEffect(() => {
    fetchData()
  }, [match.id])

  const fetchData = async () => {
    try {
      const [playersRes, eventsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/matches/${match.id}/players`),
        axios.get(`${API_BASE_URL}/matches/${match.id}/events`)
      ])
      setPlayers(playersRes.data)
      setEvents(eventsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddEvent = async () => {
    if (isLocked) return
    if (!selectedPlayer || !minute) return alert('Selecciona jugador y minuto')
    try {
      await axios.post(`${API_BASE_URL}/match-events`, {
        match_id: match.id,
        player_id: parseInt(selectedPlayer),
        event_type: eventType,
        minute: parseInt(minute)
      })
      setSelectedPlayer('')
      setMinute('')
      fetchData()
    } catch (error) {
      alert('Error al crear evento')
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (isLocked) return
    if(!confirm('¿Eliminar evento?')) return
    try {
      await axios.delete(`${API_BASE_URL}/match-events/${eventId}`)
      fetchData()
    } catch (error) {
      alert('Error al eliminar evento')
    }
  }

  const homePlayers = players.filter(p => p.team_id === match.home_team_id && p.name.toLowerCase().includes(homeSearch.toLowerCase()))
  const awayPlayers = players.filter(p => p.team_id === match.away_team_id && p.name.toLowerCase().includes(awaySearch.toLowerCase()))

  const currentHomeScore = events.filter(e => e.event_type === 'GOAL' && players.find(p => p.id === e.player_id)?.team_id === match.home_team_id).length
  const currentAwayScore = events.filter(e => e.event_type === 'GOAL' && players.find(p => p.id === e.player_id)?.team_id === match.away_team_id).length

  const handleFinishMatch = async () => {
    if (!confirm('¿Finalizar el partido? Se bloqueará la edición para evitar cambios accidentales.')) return
    try {
      await axios.put(`${API_BASE_URL}/matches/${match.id}/result`, {
        home_score: currentHomeScore,
        away_score: currentAwayScore,
        is_played: true
      })
      onClose()
    } catch (error) {
      alert('Error al finalizar partido')
    }
  }

  const handleUnlockMatch = async () => {
      if(!confirm('ATENCIÓN: Estás desbloqueando un partido finalizado. Esto debería hacerlo solo un administrador. ¿Continuar?')) return
      
      try {
        // En el futuro aquí iría la validación de rol de Admin
        await axios.put(`${API_BASE_URL}/matches/${match.id}/result`, {
            home_score: currentHomeScore,
            away_score: currentAwayScore,
            is_played: false // Lo reabrimos
        })
        setIsLocked(false)
        alert('Partido desbloqueado para correcciones.')
      } catch (error) {
          alert('Error al desbloquear')
      }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 shrink-0 flex items-center justify-between shadow-lg z-10">
        <div className="flex gap-2">
            <button onClick={onClose} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white font-bold transition-colors text-sm">
               <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            
            {isLocked ? (
                <button onClick={handleUnlockMatch} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-lg text-white font-bold transition-colors text-sm border border-yellow-400">
                    <Unlock className="w-4 h-4" /> Desbloquear (Admin)
                </button>
            ) : (
                <button onClick={handleFinishMatch} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-bold transition-colors text-sm shadow-lg shadow-green-900/20">
                    <Flag className="w-4 h-4" /> Finalizar Partido
                </button>
            )}
        </div>

        <div className="flex items-center gap-8">
           <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{match.home_team.club.name}</div>
              <div className="text-4xl font-black text-white leading-none">{currentHomeScore}</div>
           </div>
           <div className="text-gray-500 text-2xl font-light">vs</div>
           <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{match.away_team.club.name}</div>
              <div className="text-4xl font-black text-white leading-none">{currentAwayScore}</div>
           </div>
        </div>
        <div className="w-32 hidden sm:block"></div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {isLocked && (
            <div className="absolute inset-0 z-40 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
                <Lock className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-300">Partido Finalizado</h2>
                <p className="text-gray-400 mt-2">La edición está bloqueada. Contacta al administrador para correcciones.</p>
            </div>
        )}

        {/* 2. LÍNEA DE TIEMPO */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-800 h-1/4 min-h-[120px] overflow-y-auto custom-scrollbar">
           <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 sticky top-0 bg-gray-900/90 py-1 backdrop-blur-sm w-full">Historial de Eventos</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
               {events.slice().reverse().map(event => (
                 <div key={event.id} className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                       <span className="bg-gray-900 text-indigo-400 font-mono font-bold px-2 py-1 rounded text-sm">{event.minute}'</span>
                       <div>
                          <div className="text-xs font-bold text-gray-200 flex items-center gap-1">{event.event_type === 'GOAL' ? '⚽ GOL' : event.event_type === 'YELLOW_CARD' ? '🟨 Amarilla' : '🟥 Roja'}</div>
                          <div className="text-[10px] text-gray-400 uppercase">{event.player.name}</div>
                       </div>
                    </div>
                    {!isLocked && <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-600 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>}
                 </div>
               ))}
             </div>
        </div>

        {/* 3. AREA DE CONTROL */}
        <div className={`flex-1 bg-gray-950 p-4 sm:p-6 overflow-y-auto ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
           <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-center gap-4">
                 <button onClick={() => setEventType('GOAL')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${eventType === 'GOAL' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>⚽ GOL</button>
                 <button onClick={() => setEventType('YELLOW_CARD')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${eventType === 'YELLOW_CARD' ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>🟨 AMARILLA</button>
                 <button onClick={() => setEventType('RED_CARD')} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${eventType === 'RED_CARD' ? 'border-red-500 bg-red-900/30 text-red-400' : 'border-gray-700 bg-gray-800 text-gray-400'}`}>🟥 ROJA</button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                 {/* Local */}
                 <div className="space-y-2">
                    <div className="relative"><Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Buscar..." value={homeSearch} onChange={(e) => setHomeSearch(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white focus:border-indigo-500 outline-none" /></div>
                    <div className={`rounded-xl border-2 overflow-hidden transition-all ${players.find(p => p.id.toString() === selectedPlayer)?.team_id === match.home_team_id ? 'border-indigo-500' : 'border-gray-800'}`}>
                       <div className="bg-gray-900 h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {homePlayers.map(p => (
                             <button key={p.id} onClick={() => setSelectedPlayer(p.id.toString())} className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${selectedPlayer === p.id.toString() ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}><span className="truncate mr-2 text-left">{p.name}</span><span className="font-mono text-xs opacity-50">#{p.number}</span></button>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Visita */}
                 <div className="space-y-2">
                    <div className="relative"><Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" placeholder="Buscar..." value={awaySearch} onChange={(e) => setAwaySearch(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-[11px] text-white focus:border-indigo-500 outline-none" /></div>
                    <div className={`rounded-xl border-2 overflow-hidden transition-all ${players.find(p => p.id.toString() === selectedPlayer)?.team_id === match.away_team_id ? 'border-yellow-500' : 'border-gray-800'}`}>
                       <div className="bg-gray-900 h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                          {awayPlayers.map(p => (
                             <button key={p.id} onClick={() => setSelectedPlayer(p.id.toString())} className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm transition-colors ${selectedPlayer === p.id.toString() ? 'bg-yellow-600 text-white' : 'hover:bg-gray-800 text-gray-300'}`}><span className="truncate mr-2 text-left">{p.name}</span><span className="font-mono text-xs opacity-50">#{p.number}</span></button>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. FOOTER */}
      <div className={`bg-gray-800 border-t border-gray-700 p-4 shrink-0 shadow-2xl z-20 ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
         <div className="max-w-3xl mx-auto flex gap-4">
            <div className="w-24 shrink-0"><input type="number" value={minute} onChange={(e) => setMinute(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white text-center font-bold text-xl rounded-lg h-12 outline-none" placeholder="Min" /></div>
            <button onClick={handleAddEvent} disabled={!selectedPlayer || !minute} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wide rounded-lg h-12 shadow-lg"><Save className="w-5 h-5 inline mr-2" /> Registrar Incidencia</button>
         </div>
      </div>
    </div>
  )
}

export default MatchControl