import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { PlusCircle, Save, Users, Calendar, Trophy, Edit, X as CloseIcon, Trash2, Shield, PlayCircle, History, AlertTriangle, Upload, FileSpreadsheet, Lock, LogOut } from 'lucide-react'
import MatchControl from './MatchControl'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'matches' | 'roster' | 'players' | 'fixture' | 'audit'>('clubs')
  
  // --- SEGURIDAD ---
  const token = localStorage.getItem('renca_token')
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  // --- ESTADOS ---
  const [clubs, setClubs] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [matchDays, setMatchDays] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const [uploadTeamId, setUploadTeamId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [currentRoster, setCurrentRoster] = useState<any[]>([])
  const [editingPlayer, setEditingPlayer] = useState<any>(null)

  const [newClubName, setNewClubName] = useState('')
  const [newClubLogo, setNewClubLogo] = useState('')
  const [newClubSeries, setNewClubSeries] = useState('HONOR')
  const [editingClub, setEditingClub] = useState<any>(null)

  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchTime, setMatchTime] = useState('')
  const [matchVenue, setMatchVenue] = useState('')
  const [editingMatch, setEditingMatch] = useState<any>(null)
  const [controllingMatch, setControllingMatch] = useState<any>(null)
  const [showPastMatches, setShowPastMatches] = useState(true)

  const [newMatchDayName, setNewMatchDayName] = useState('')
  const [newMatchDayStart, setNewMatchDayStart] = useState('')
  const [newMatchDayEnd, setNewMatchDayEnd] = useState('')

  // --- PETICIONES API ---
  const fetchClubs = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/clubs`)
        setClubs(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchVenues = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/venues`)
        setVenues(res.data)
    } catch (e) { console.error(e); }
  }

  const fetchCategories = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/categories`)
        const data = res.data
        setCategories(data)
        if (data.length > 0 && !selectedCategory) setSelectedCategory(data[0].id.toString())
    } catch (e) { console.error(e) }
  }

  const fetchTeams = useCallback(async (catId: string) => {
    if (!catId) return
    try {
        const res = await axios.get(`${API_BASE_URL}/teams/${catId}`)
        setTeams(res.data)
    } catch (e) { console.error(e); }
  }, [])
  
  const fetchMatches = useCallback(async (catId: string) => {
    if (!catId) return
    try {
        const res = await axios.get(`${API_BASE_URL}/matches/${catId}`)
        setMatches(res.data)
    } catch (e) { console.error(e); }
  }, [])

  const fetchMatchDays = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/match-days`)
        setMatchDays(res.data)
    } catch (e) { console.error(e); }
  }

  const fetchAuditLogs = async () => {
      try {
          const res = await axios.get(`${API_BASE_URL}/audit-logs`, authHeader)
          setAuditLogs(res.data)
      } catch (error) { console.error(error); }
  }

  const fetchTeamRoster = useCallback(async (teamId: string) => {
      if(!teamId) { setCurrentRoster([]); return; }
      try {
          const res = await axios.get(`${API_BASE_URL}/teams/${teamId}/players`)
          setCurrentRoster(res.data)
      } catch (error) { console.error(error); setCurrentRoster([]) }
  }, [])

  // --- EFECTOS ---
  useEffect(() => {
    fetchClubs(); fetchCategories(); fetchVenues(); fetchMatchDays();
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchTeams(selectedCategory)
      fetchMatches(selectedCategory)
      if(activeTab === 'players') { setUploadTeamId(''); setCurrentRoster([]); }
    }
  }, [selectedCategory, activeTab, fetchTeams, fetchMatches])

  useEffect(() => {
      if (activeTab === 'audit') fetchAuditLogs()
  }, [activeTab])

  useEffect(() => {
      if(uploadTeamId) fetchTeamRoster(uploadTeamId)
  }, [uploadTeamId, fetchTeamRoster])

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.removeItem('renca_token')
    window.location.reload()
  }

  const handleUploadPlayers = async (e: React.FormEvent) => {
      e.preventDefault()
      if(!uploadTeamId || !uploadFile) return alert('Selecciona equipo y archivo')
      
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      setUploadStatus('Subiendo...')
      try {
          const res = await axios.post(`${API_BASE_URL}/players/upload?team_id=${uploadTeamId}`, formData, {
              headers: { ...authHeader.headers, 'Content-Type': 'multipart/form-data' }
          })
          const { created, updated, errors } = res.data
          setUploadStatus(`Éxito: ${created} nuevos, ${updated} actualizados.`)
          setUploadErrors(errors || [])
          setUploadFile(null)
          fetchTeamRoster(uploadTeamId)
      } catch (error: any) {
          setUploadStatus(`Error al procesar archivo.`)
          setUploadErrors([error.response?.data?.detail || 'Error interno'])
      }
  }

  const handleUpdatePlayer = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingPlayer) return
      try {
          await axios.post(`${API_BASE_URL}/players`, {
              team_id: parseInt(uploadTeamId),
              name: editingPlayer.name,
              number: editingPlayer.number ? parseInt(editingPlayer.number) : null,
              dni: editingPlayer.dni,
              birth_date: editingPlayer.birth_date || null
          }, authHeader)
          setEditingPlayer(null)
          fetchTeamRoster(uploadTeamId)
          alert('Datos actualizados')
      } catch (error: any) { alert(error.response?.data?.detail || 'Error al guardar') }
  }

  const handleDeletePlayer = async (playerId: number) => {
      if(!confirm('¿Eliminar jugador?')) return
      try {
          await axios.delete(`${API_BASE_URL}/players/${playerId}`, authHeader)
          fetchTeamRoster(uploadTeamId)
      } catch (error) { alert('Error al eliminar') }
  }

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/clubs`, { name: newClubName, logo_url: newClubLogo, league_series: newClubSeries }, authHeader)
      setNewClubName(''); setNewClubLogo(''); fetchClubs();
      alert('Club creado')
    } catch (error) { alert('Error de autenticación o de datos') }
  }

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClub) return
    try {
      await axios.put(`${API_BASE_URL}/clubs/${editingClub.id}`, { name: editingClub.name, logo_url: editingClub.logo_url, league_series: editingClub.league_series }, authHeader)
      fetchClubs(); setEditingClub(null);
    } catch (error) { alert('Error') }
  }

  const handleCreateTeam = async (clubId: number) => {
    if (!selectedCategory) return alert('Selecciona categoría')
    try {
      await axios.post(`${API_BASE_URL}/teams`, { club_id: clubId, category_id: parseInt(selectedCategory) }, authHeader)
      fetchTeams(selectedCategory)
    } catch (error) { alert('Ya existe este equipo en la categoría') }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullDate = matchDate && matchTime ? `${matchDate}T${matchTime}:00` : null
    try {
      await axios.post(`${API_BASE_URL}/matches`, { 
        category_id: parseInt(selectedCategory), 
        home_team_id: parseInt(homeTeamId), 
        away_team_id: parseInt(awayTeamId), 
        venue_id: matchVenue ? parseInt(matchVenue) : null, 
        match_day_id: 1, // Default por ahora
        match_date: fullDate 
      }, authHeader)
      fetchMatches(selectedCategory)
      setHomeTeamId(''); setAwayTeamId('');
      alert('Partido programado')
    } catch (error: any) { alert(error.response?.data?.detail || 'No autorizado') }
  }

  const handleCreateMatchDay = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/match-days`, { name: newMatchDayName, start_date: newMatchDayStart, end_date: newMatchDayEnd }, authHeader)
      fetchMatchDays(); setNewMatchDayName(''); setNewMatchDayStart(''); setNewMatchDayEnd('');
    } catch (error) { alert('Error') }
  }

  const handleDeleteMatchDay = async (id: number) => {
    if(!confirm('¿Eliminar esta fecha?')) return
    try { await axios.delete(`${API_BASE_URL}/match-days/${id}`, authHeader); fetchMatchDays(); } catch (error) { alert('Error') }
  }

  const isAdultCategory = () => {
    return categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos'
  }

  const getPlayerAgeStatus = (birthDate: string | null) => {
      if (!birthDate) return { status: 'unknown', age: null }
      const birthYear = new Date(birthDate).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear
      return { status: 'ok', age }
  }

  const getGroupedMatches = () => {
    const grouped: Record<string, any[]> = {}
    const now = new Date()
    const visibleDays = showPastMatches ? matchDays : matchDays.filter(day => new Date(day.end_date) >= now)
    visibleDays.forEach(day => { grouped[day.name] = [] })
    grouped['Otros / Sin Fecha'] = []

    matches.forEach(match => {
      if (!match.match_date) { grouped['Otros / Sin Fecha'].push(match); return; }
      const mDate = new Date(match.match_date)
      let found = false
      for (const day of visibleDays) {
        const start = new Date(day.start_date); const end = new Date(day.end_date); end.setHours(23, 59, 59, 999)
        if (mDate >= start && mDate <= end) { grouped[day.name].push(match); found = true; break }
      }
      if (!found && (showPastMatches || mDate >= now)) grouped['Otros / Sin Fecha'].push(match)
    })
    return grouped
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 italic tracking-tighter"><Users className="text-indigo-500" /> RENCA FC ADMIN</h1>
        <div className="flex gap-2 bg-gray-800 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
          {[
              {id: 'clubs', label: 'Clubes', icon: Shield},
              {id: 'matches', label: 'Partidos', icon: PlayCircle},
              {id: 'fixture', label: 'Fechas', icon: Calendar},
              {id: 'players', label: 'Jugadores', icon: Users},
              {id: 'roster', label: 'Inscritos', icon: Trophy},
              {id: 'audit', label: 'Auditoría', icon: History},
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
          <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 flex items-center gap-2 text-sm font-bold"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </header>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3"><AlertTriangle className="w-5 h-5" />{error}</div>}

      {/* --- VISTA: CLUBES --- */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><PlusCircle className="text-green-500 w-5 h-5" /> Nuevo Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase font-black">Nombre</label><input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
              {isAdultCategory() && (<div><label className="text-xs text-gray-400 uppercase font-black">Serie Adulto</label><select value={newClubSeries} onChange={(e) => setNewClubSeries(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2"><option value="HONOR">Honor</option><option value="ASCENSO">Ascenso</option></select></div>)}
              <div><label className="text-xs text-gray-400 uppercase font-black">Logo URL</label><input type="text" value={newClubLogo} onChange={(e) => setNewClubLogo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" /></div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg transition-all">Guardar Club</button>
            </form>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-h-[600px] overflow-y-auto custom-scrollbar shadow-xl">
             <div className="mb-6"><label className="text-xs text-gray-400 uppercase font-black">Inscribir en:</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 font-bold">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
             <ul className="space-y-2">
               {clubs.map(club => (
                 <li key={club.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg group border border-gray-800 hover:border-gray-600 transition-all">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-white rounded-lg p-1 flex items-center justify-center">
                        {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-4 h-4 text-gray-400" />}
                     </div>
                     <div>
                        <span className="font-bold text-sm block">{club.name}</span>
                        {isAdultCategory() && <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{club.league_series}</span>}
                     </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setEditingClub(club)} className="text-gray-500 hover:text-white p-1"><Edit className="w-4 h-4" /></button>
                      {teams.some(t => t.club_id === club.id) ? <span className="text-[10px] font-black bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-700">INSCRITO</span> : <button onClick={() => handleCreateTeam(club.id)} className="text-[10px] font-black bg-indigo-600 px-2 py-1 rounded shadow-lg">INSCRIBIR</button>}
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {/* --- VISTA: PARTIDOS --- */}
      {activeTab === 'matches' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 border border-gray-700 shadow-lg">
             <Trophy className="text-yellow-500 w-5 h-5" />
             <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg p-2 font-bold">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="text-blue-400 w-5 h-5" /> Programar Partido</h3>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black">Local</label>
                      <select value={homeTeamId} onChange={(e) => { setHomeTeamId(e.target.value); setAwayTeamId(''); }} className="w-full bg-gray-700 p-2 rounded text-xs font-bold" required>
                        <option value="">Local...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{isAdultCategory() ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-black">Visita</label>
                      <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-xs font-bold" required disabled={!homeTeamId}>
                        <option value="">Visita...</option>
                        {teams
                          .filter(t => t.id.toString() !== homeTeamId)
                          .filter(t => {
                             if (!isAdultCategory() || !homeTeamId) return true
                             const home = teams.find(ht => ht.id.toString() === homeTeamId)
                             return home ? t.club.league_series === home.club.league_series : true
                          })
                          .map(t => <option key={t.id} value={t.id}>{isAdultCategory() ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)
                        }
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-xs" />
                    <input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-xs" />
                  </div>
                  <select value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-xs font-bold"><option value="">Estadio...</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg">Crear Partido</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-6">
               <button onClick={() => setShowPastMatches(!showPastMatches)} className="text-[10px] font-black px-3 py-1 rounded-lg border border-gray-700 text-gray-500 hover:text-white transition-all ml-auto block uppercase tracking-widest">{showPastMatches ? 'Ocultar pasados' : 'Ver todo'}</button>
               {Object.entries(getGroupedMatches()).map(([dayName, dayMatches]) => (
                 dayMatches.length > 0 && (
                   <div key={dayName} className="animate-in slide-in-from-bottom-2"><h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 border-b border-gray-800 pb-1 italic">{dayName}</h3><div className="space-y-3">
                       {dayMatches.map(match => (
                         <div key={match.id} className="bg-gray-800 border border-gray-700 p-4 rounded-2xl shadow-lg group hover:border-indigo-500/50 transition-all">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-3 border-b border-gray-700/50 pb-2">
                                <span className="font-bold">{new Date(match.match_date).toLocaleString()} • {match.venue?.name}</span>
                                <div className="flex gap-4">
                                    <button onClick={() => setControllingMatch(match)} className="text-green-400 font-black flex items-center gap-1 hover:scale-110 transition-transform"><PlayCircle className="w-3 h-3" /> CONTROLAR</button>
                                    <button onClick={() => {}} className="text-gray-500 hover:text-white flex items-center gap-1"><Edit className="w-3 h-3" /> Editar</button>
                                    <button onClick={async () => { if(confirm('¿Eliminar?')) { await axios.delete(`${API_BASE_URL}/matches/${match.id}`, authHeader); fetchMatches(selectedCategory); } }} className="text-red-500/30 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-black w-1/3 text-right truncate text-sm uppercase italic">{match.home_team.club.name}</span>
                                <div className={`px-4 py-1 rounded-xl font-black text-2xl flex gap-3 shadow-inner ${match.is_played ? 'bg-gray-950 text-gray-600' : 'bg-indigo-600 text-white animate-pulse'}`}>
                                    <span>{match.home_score}</span><span className="opacity-20">-</span><span>{match.away_score}</span>
                                </div>
                                <span className="font-black w-1/3 text-left truncate text-sm uppercase italic">{match.away_team.club.name}</span>
                            </div>
                         </div>
                       ))}
                   </div></div>
                 )
               ))}
             </div>
           </div>
        </div>
      )}

      {/* --- VISTA: FECHAS --- */}
      {activeTab === 'fixture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="text-blue-400 w-5 h-5" /> Nueva Fecha</h2>
            <form onSubmit={handleCreateMatchDay} className="space-y-4">
              <div><label className="text-xs text-gray-400 uppercase font-black">Nombre (ej: Fecha 1)</label><input type="text" value={newMatchDayName} onChange={(e) => setNewMatchDayName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 font-bold" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 uppercase font-black">Desde</label><input type="date" value={newMatchDayStart} onChange={(e) => setNewMatchDayStart(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
                <div><label className="text-xs text-gray-400 uppercase font-black">Hasta</label><input type="date" value={newMatchDayEnd} onChange={(e) => setNewMatchDayEnd(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg transition-all">Crear Fecha</button>
            </form>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
             <h3 className="text-[10px] font-black text-gray-500 mb-4 border-b border-gray-700 pb-2 uppercase tracking-widest italic">Fechas Configuradas</h3>
             <ul className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
               {matchDays.map(day => (
                 <li key={day.id} className="bg-gray-900/50 p-4 rounded-xl flex items-center justify-between border border-gray-800 group hover:border-gray-600 transition-all">
                   <div><span className="font-black block text-lg italic uppercase tracking-tighter">{day.name}</span><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(day.start_date).toLocaleDateString()} — {new Date(day.end_date).toLocaleDateString()}</span></div>
                   <button onClick={() => handleDeleteMatchDay(day.id)} className="text-red-500/20 group-hover:text-red-500 p-2 transition-colors"><Trash2 className="w-5 h-5" /></button>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {/* --- VISTA: JUGADORES --- */}
      {activeTab === 'players' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-xl">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Upload className="text-blue-400 w-5 h-5" /> Carga Masiva (Excel)</h2>
                  <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-xl mb-6 text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                      <p className="mb-2 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Formato Requerido:</p>
                      <ul className="list-disc pl-5 space-y-1">
                          <li>Nombre, RUT (Obligatorios)</li>
                          <li>Numero, Nacimiento (Opcionales)</li>
                      </ul>
                  </div>
                  
                  <form onSubmit={handleUploadPlayers} className="space-y-4">
                      <div><label className="block text-[10px] text-gray-500 mb-1 uppercase font-black">Categoría</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-700 p-2 rounded border border-gray-600 font-bold">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                      <div><label className="block text-[10px] text-gray-500 mb-1 uppercase font-black">Equipo / Club</label><select value={uploadTeamId} onChange={(e) => setUploadTeamId(e.target.value)} className="w-full bg-gray-700 p-2 rounded border border-gray-600 font-bold" required><option value="">Seleccionar...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.club.name}</option>)}</select></div>
                      <div><label className="block text-[10px] text-gray-500 mb-1 uppercase font-black">Archivo Excel</label><input type="file" accept=".xlsx, .xls" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-xs file:bg-indigo-600 file:border-0 file:rounded file:text-white file:font-black file:uppercase file:text-[9px] file:px-3 file:py-1 file:mr-4 cursor-pointer" required /></div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Procesar Plantilla</button>
                  </form>
                  {uploadStatus && <div className={`mt-4 p-3 rounded-lg text-xs font-black uppercase tracking-widest text-center ${uploadStatus.includes('Error') ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-green-900/20 text-green-400 border border-green-800/30'}`}>{uploadStatus}</div>}
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col h-[650px] shadow-xl">
                  <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold italic uppercase tracking-tighter text-indigo-400">Plantel Actual</h3><span className="text-[10px] font-black bg-gray-900 px-2 py-1 rounded text-gray-500">{currentRoster.length} JUGADORES</span></div>
                  {!uploadTeamId ? <div className="text-gray-600 text-center py-20 italic flex-1 flex flex-col items-center justify-center gap-4"><Users className="w-16 h-16 opacity-10" /><p className="text-xs font-bold uppercase tracking-widest">Selecciona un equipo para gestionar</p></div> : 
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar"><table className="w-full text-left text-sm"><thead className="bg-gray-900 text-gray-500 text-[10px] uppercase font-black sticky top-0 z-10 italic tracking-widest"><tr><th className="px-3 py-3">#</th><th className="px-3 py-3">Jugador</th><th className="px-3 py-3">RUT</th><th className="px-3 py-3 text-right">Acción</th></tr></thead><tbody className="divide-y divide-gray-800">
                          {currentRoster.map(p => (
                              <tr key={p.id} className="hover:bg-gray-750 transition-colors group"><td className="px-3 py-3 text-indigo-400 font-black">{p.number || '-'}</td><td className="px-3 py-3 font-bold uppercase text-gray-200 text-xs">{p.name}</td><td className="px-3 py-3 text-gray-500 text-xs font-mono italic">{p.dni}</td><td className="px-3 py-3 text-right flex gap-3 justify-end"><button onClick={() => setEditingPlayer(p)} className="text-gray-500 hover:text-white"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeletePlayer(p.id)} className="text-red-500/20 group-hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td></tr>
                          ))}
                      </tbody></table></div>
                  }
              </div>
          </div>
      )}

      {/* --- MODAL EDITAR JUGADOR --- */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-2 text-indigo-400 uppercase"><Lock className="w-5 h-5 text-indigo-500" /> Editor de Ficha</h3>
                    <button onClick={() => setEditingPlayer(null)} className="p-2 hover:bg-white/5 rounded-full"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleUpdatePlayer} className="space-y-5">
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Nombre Completo</label><input type="text" value={editingPlayer.name} onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold uppercase text-white focus:border-indigo-500 transition-all outline-none" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">RUT / DNI</label><input type="text" value={editingPlayer.dni || ''} onChange={(e) => setEditingPlayer({...editingPlayer, dni: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold uppercase text-white" required /></div>
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Dorsal</label><input type="number" value={editingPlayer.number || ''} onChange={(e) => setEditingPlayer({...editingPlayer, number: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white" /></div>
                    </div>
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Fecha Nacimiento</label><input type="date" value={editingPlayer.birth_date ? editingPlayer.birth_date.split('T')[0] : ''} onChange={(e) => setEditingPlayer({...editingPlayer, birth_date: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" /></div>
                    <div className="pt-4 flex flex-col gap-3">
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"><Save className="w-4 h-4" /> Guardar Cambios</button>
                        <button type="button" onClick={() => setEditingPlayer(null)} className="w-full py-3 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest">Cancelar Edición</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- VISTA: AUDITORÍA --- */}
      {activeTab === 'audit' && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50"><h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 uppercase"><History className="text-indigo-400 w-5 h-5" /> Bitácora de Movimientos</h2><button onClick={fetchAuditLogs} className="text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg shadow-lg uppercase tracking-widest">Actualizar</button></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-900 text-gray-500 uppercase font-black text-[10px] italic tracking-widest"><tr><th className="px-6 py-4">Fecha/Hora</th><th className="px-6 py-4">Partido/Contexto</th><th className="px-6 py-4">Acción</th><th className="px-6 py-4">Detalles</th><th className="px-6 py-4">Operador</th></tr></thead><tbody className="divide-y divide-gray-800">
                  {auditLogs.map(log => (<tr key={log.id} className="hover:bg-gray-750 transition-colors"><td className="px-6 py-4 text-[10px] font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4 font-black text-gray-200 text-xs uppercase italic">{log.match_info}</td><td className="px-6 py-4"><span className="px-2 py-1 rounded text-[9px] font-black bg-indigo-950 text-indigo-400 border border-indigo-900 uppercase tracking-tighter">{log.action}</span></td><td className="px-6 py-4 text-xs text-gray-400 font-bold uppercase tracking-tight">{log.details}</td><td className="px-6 py-4 text-xs font-black text-indigo-500 uppercase italic">{log.user_name}</td></tr>))}
              </tbody></table></div>
          </div>
      )}

      {/* --- OTROS MODALES --- */}
      {editingClub && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 w-full max-w-md shadow-2xl animate-in zoom-in-95"><div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4"><h3 className="text-xl font-black italic tracking-tighter uppercase">Editar Club</h3><button onClick={() => setEditingClub(null)} className="p-2 hover:bg-white/5 rounded-full"><CloseIcon className="w-6 h-6 text-gray-500" /></button></div><form onSubmit={handleUpdateClub} className="space-y-5"><div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Nombre</label><input type="text" value={editingClub.name} onChange={(e) => setEditingClub({...editingClub, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold uppercase text-white outline-none" /></div><div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Serie</label><select value={editingClub.league_series} onChange={(e) => setEditingClub({...editingClub, league_series: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold uppercase text-white outline-none"><option value="HONOR">Honor</option><option value="ASCENSO">Ascenso</option></select></div><div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Logo URL</label><input type="text" value={editingClub.logo_url || ''} onChange={(e) => setEditingClub({...editingClub, logo_url: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none" /></div><button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all mt-4">Actualizar Datos</button></form></div></div>
      )}

      {controllingMatch && (
        <MatchControl match={controllingMatch} onClose={() => { setControllingMatch(null); fetchMatches(selectedCategory); }} />
      )}
    </div>
  )
}

export default AdminDashboard
