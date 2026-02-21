import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { PlusCircle, Save, Users, Calendar, Trophy, Edit, X as CloseIcon, Trash2, Shield, PlayCircle, History, AlertTriangle, Upload, FileSpreadsheet, Lock } from 'lucide-react'
import MatchControl from './MatchControl'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'matches' | 'roster' | 'players' | 'fixture' | 'audit'>('clubs')
  
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

  // Estado para subida y gestión de jugadores
  const [uploadTeamId, setUploadTeamId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [currentRoster, setCurrentRoster] = useState<any[]>([])
  const [editingPlayer, setEditingPlayer] = useState<any>(null)

  // Form Clubes
  const [newClubName, setNewClubName] = useState('')
  const [newClubLogo, setNewClubLogo] = useState('')
  const [newClubSeries, setNewClubSeries] = useState('HONOR')
  const [editingClub, setEditingClub] = useState<any>(null)

  // Form Partidos
  const [homeTeamId, setHomeTeamId] = useState('')
  const [awayTeamId, setAwayTeamId] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchTime, setMatchTime] = useState('')
  const [matchVenue, setMatchVenue] = useState('')
  const [editingMatch, setEditingMatch] = useState<any>(null)
  const [controllingMatch, setControllingMatch] = useState<any>(null)
  const [showPastMatches, setShowPastMatches] = useState(true)

  // Form Fechas (Fixture)
  const [newMatchDayName, setNewMatchDayName] = useState('')
  const [newMatchDayStart, setNewMatchDayStart] = useState('')
  const [newMatchDayEnd, setNewMatchDayEnd] = useState('')

  // --- PETICIONES API ---
  const fetchClubs = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/clubs`)
        setClubs(res.data)
    } catch (e) { console.error(e); setError("Error cargando clubes"); }
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
    } catch (e) { console.error(e); setError("Error cargando categorías"); }
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
          const res = await axios.get(`${API_BASE_URL}/audit-logs`)
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
      
      const interval = setInterval(() => {
        if (activeTab === 'matches') fetchMatches(selectedCategory)
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [selectedCategory, activeTab, fetchTeams, fetchMatches])

  useEffect(() => {
      if (activeTab === 'audit') fetchAuditLogs()
  }, [activeTab])

  useEffect(() => {
      if(uploadTeamId) fetchTeamRoster(uploadTeamId)
  }, [uploadTeamId, fetchTeamRoster])

  // --- HANDLERS ---
  const handleUploadPlayers = async (e: React.FormEvent) => {
      e.preventDefault()
      if(!uploadTeamId || !uploadFile) return alert('Selecciona equipo y archivo')
      
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      setUploadStatus('Subiendo...')
      setUploadErrors([])
      try {
          const res = await axios.post(`${API_BASE_URL}/players/upload?team_id=${uploadTeamId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          })
          const { created_count, updated_count, errors } = res.data
          setUploadStatus(`Éxito: ${created_count} nuevos, ${updated_count} actualizados.`)
          setUploadErrors(errors || [])
          setUploadFile(null)
          fetchTeamRoster(uploadTeamId)
      } catch (error: any) {
          setUploadStatus(`Error crítico al procesar archivo.`)
          setUploadErrors([error.response?.data?.detail || 'Error interno del servidor'])
      }
  }

  const handleUpdatePlayer = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!editingPlayer) return
      try {
          await axios.put(`${API_BASE_URL}/players/${editingPlayer.id}`, {
              name: editingPlayer.name,
              number: editingPlayer.number ? parseInt(editingPlayer.number) : null,
              dni: editingPlayer.dni,
              birth_date: editingPlayer.birth_date
          })
          setEditingPlayer(null)
          fetchTeamRoster(uploadTeamId)
      } catch (error) { alert('Error al actualizar jugador') }
  }

  const handleDeletePlayer = async (playerId: number) => {
      if(!confirm('¿Eliminar jugador permanentemente?')) return
      try {
          await axios.delete(`${API_BASE_URL}/players/${playerId}`)
          fetchTeamRoster(uploadTeamId)
      } catch (error) { alert('Error al eliminar') }
  }

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/clubs`, { name: newClubName, logo_url: newClubLogo, league_series: newClubSeries })
      setNewClubName(''); setNewClubLogo(''); fetchClubs();
      alert('Club creado')
    } catch (error) { alert('Error') }
  }

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClub) return
    try {
      await axios.put(`${API_BASE_URL}/clubs/${editingClub.id}`, { name: editingClub.name, logo_url: editingClub.logo_url, league_series: editingClub.league_series })
      fetchClubs(); setEditingClub(null);
    } catch (error) { alert('Error') }
  }

  const handleCreateTeam = async (clubId: number) => {
    if (!selectedCategory) return alert('Selecciona categoría')
    try {
      await axios.post(`${API_BASE_URL}/teams`, { club_id: clubId, category_id: parseInt(selectedCategory) })
      fetchTeams(selectedCategory)
    } catch (error) { alert('Ya existe') }
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullDate = matchDate && matchTime ? `${matchDate}T${matchTime}:00` : null
    try {
      await axios.post(`${API_BASE_URL}/matches`, { category_id: parseInt(selectedCategory), home_team_id: parseInt(homeTeamId), away_team_id: parseInt(awayTeamId), venue_id: matchVenue ? parseInt(matchVenue) : null, match_date: fullDate })
      fetchMatches(selectedCategory)
      setHomeTeamId(''); setAwayTeamId('');
    } catch (error: any) { alert(error.response?.data?.detail || 'Error') }
  }

  const handleUpdateMatchDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMatch) return
    const fullDate = editingMatch.date && editingMatch.time ? `${editingMatch.date}T${editingMatch.time}:00` : null
    try {
      await axios.put(`${API_BASE_URL}/matches/${editingMatch.id}`, { category_id: parseInt(selectedCategory), home_team_id: parseInt(editingMatch.home_team_id), away_team_id: parseInt(editingMatch.away_team_id), venue_id: editingMatch.venue_id ? parseInt(editingMatch.venue_id) : null, match_date: fullDate })
      fetchMatches(selectedCategory); setEditingMatch(null);
    } catch (error) { alert('Error') }
  }

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm('¿Eliminar?')) return
    try { await axios.delete(`${API_BASE_URL}/matches/${matchId}`); fetchMatches(selectedCategory); } catch (error) { alert('Error') }
  }

  const openEditMatchModal = (match: any) => {
    const dateObj = new Date(match.match_date)
    setEditingMatch({ id: match.id, home_team_id: match.home_team_id, away_team_id: match.away_team_id, venue_id: match.venue_id, date: match.match_date ? dateObj.toISOString().split('T')[0] : '', time: match.match_date ? dateObj.toTimeString().slice(0, 5) : '' })
  }

  const handleCreateMatchDay = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/match-days`, { name: newMatchDayName, start_date: new Date(newMatchDayStart).toISOString(), end_date: new Date(newMatchDayEnd).toISOString() })
      fetchMatchDays(); setNewMatchDayName(''); setNewMatchDayStart(''); setNewMatchDayEnd('');
    } catch (error) { alert('Error') }
  }

  const handleDeleteMatchDay = async (id: number) => {
    if(!confirm('¿Eliminar esta fecha?')) return
    try { await axios.delete(`${API_BASE_URL}/match-days/${id}`); fetchMatchDays(); } catch (error) { alert('Error') }
  }

  // --- HELPERS ---
  const isAdultCategory = () => {
    return categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos'
  }

  const getPlayerAgeStatus = (birthDate: string | null) => {
      if (!birthDate) return { status: 'unknown', age: null }
      
      const birthYear = new Date(birthDate).getFullYear()
      const currentYear = new Date().getFullYear()
      const age = currentYear - birthYear

      const category = categories.find(c => c.id.toString() === selectedCategory.toString())
      
      // Si no hay reglas de edad para esta categoría, solo mostramos la edad
      if (!category || category.min_age === 0) return { status: 'ok', age }

      if (age >= category.min_age) return { status: 'ok', age }
      if (age >= category.exception_min_age) return { status: 'exception', age }
      return { status: 'invalid', age }
  }

  const countExceptions = () => {
      if (!currentRoster.length) return 0
      return currentRoster.filter(p => getPlayerAgeStatus(p.birth_date).status === 'exception').length
  }

  const getCategoryRules = () => {
      const cat = categories.find(c => c.id.toString() === selectedCategory.toString())
      if (!cat || cat.min_age === 0) return null
      return cat
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-indigo-500" /> Renca FC Admin</h1>
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
        </div>
      </header>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3"><AlertTriangle className="w-5 h-5" />{error}</div>}

      {/* --- VISTA: CLUBES --- */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><PlusCircle className="text-green-500 w-5 h-5" /> Nuevo Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div><label className="text-xs text-gray-400">Nombre</label><input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
              {isAdultCategory() && (<div><label className="text-xs text-gray-400">Serie Adulto</label><select value={newClubSeries} onChange={(e) => setNewClubSeries(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2"><option value="HONOR">Honor</option><option value="ASCENSO">Ascenso</option></select></div>)}
              <div><label className="text-xs text-gray-400">Logo URL</label><input type="text" value={newClubLogo} onChange={(e) => setNewClubLogo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" /></div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold">Guardar Club</button>
            </form>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-h-[600px] overflow-y-auto">
             <div className="mb-4"><label className="text-xs text-gray-400">Inscribir en:</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
             <ul className="space-y-2">
               {clubs.map(club => (
                 <li key={club.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg group">
                   <div className="flex items-center gap-2">
                     {isAdultCategory() && <span className={`text-[10px] px-1 rounded font-bold ${club.league_series === 'HONOR' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{club.league_series[0]}</span>}
                     <span className="font-medium">{club.name}</span>
                     <button onClick={() => setEditingClub(club)} className="opacity-0 group-hover:opacity-100 text-gray-400"><Edit className="w-3 h-3" /></button>
                   </div>
                   {teams.some(t => t.club_id === club.id) ? <span className="text-xs text-gray-500 italic">Inscrito</span> : <button onClick={() => handleCreateTeam(club.id)} className="text-xs bg-blue-600 px-3 py-1 rounded">Inscribir</button>}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {/* --- VISTA: PARTIDOS --- */}
      {activeTab === 'matches' && (
        <div className="space-y-8">
           <div className="bg-gray-800 p-4 rounded-xl flex items-center gap-4 border border-gray-700">
             <Trophy className="text-yellow-500 w-5 h-5" />
             <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg p-2 max-w-xs">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="text-blue-400 w-5 h-5" /> Programar Partido</h3>
                <form onSubmit={handleCreateMatch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">Local</label>
                      <select value={homeTeamId} onChange={(e) => { setHomeTeamId(e.target.value); setAwayTeamId(''); }} className="w-full bg-gray-700 p-2 rounded text-sm" required>
                        <option value="">Local...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{isAdultCategory() ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold">Visita</label>
                      <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm" required disabled={!homeTeamId}>
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
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm" />
                    <input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm" />
                  </div>
                  <select value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-sm"><option value="">Estadio...</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold">Crear Partido</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-6">
               <button onClick={() => setShowPastMatches(!showPastMatches)} className="text-xs font-bold px-3 py-1 rounded-lg border border-gray-700 text-gray-400 ml-auto block">{showPastMatches ? 'Ocultar fechas pasadas' : 'Ver todas'}</button>
               {Object.entries(getGroupedMatches()).map(([dayName, dayMatches]) => (
                 dayMatches.length > 0 && (
                   <div key={dayName}><h3 className="text-sm font-bold text-indigo-400 uppercase mb-3 border-b border-gray-800 pb-1">{dayName}</h3><div className="space-y-3">
                       {dayMatches.map(match => (
                         <div key={match.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-2 border-b border-gray-700 pb-1">
                                <span>{new Date(match.match_date).toLocaleString()} • {match.venue?.name}</span>
                                <div className="flex gap-3">
                                    <button onClick={() => setControllingMatch(match)} className="text-green-400 font-bold flex items-center gap-1"><PlayCircle className="w-3 h-3" /> CONTROLAR</button>
                                    <button onClick={() => openEditMatchModal(match)} className="text-gray-400 flex items-center gap-1"><Edit className="w-3 h-3" /> Editar</button>
                                    <button onClick={() => handleDeleteMatch(match.id)} className="text-red-500/50 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold w-1/3 text-right truncate text-sm">{match.home_team.club.name}</span>
                                <div className={`px-3 py-1 rounded-lg font-black text-xl flex gap-2 ${match.is_played ? 'bg-gray-900 text-gray-500' : 'bg-indigo-600 text-white animate-pulse'}`}>
                                    <span>{match.home_score}</span><span className="opacity-20">-</span><span>{match.away_score}</span>
                                </div>
                                <span className="font-bold w-1/3 text-left truncate text-sm">{match.away_team.club.name}</span>
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

      {/* --- VISTA: FECHAS (FIXTURE) --- */}
      {activeTab === 'fixture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="text-blue-400 w-5 h-5" /> Nueva Fecha</h2>
            <form onSubmit={handleCreateMatchDay} className="space-y-4">
              <div><label className="text-xs text-gray-400">Nombre (ej: Fecha 1)</label><input type="text" value={newMatchDayName} onChange={(e) => setNewMatchDayName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400">Desde</label><input type="date" value={newMatchDayStart} onChange={(e) => setNewMatchDayStart(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
                <div><label className="text-xs text-gray-400">Hasta</label><input type="date" value={newMatchDayEnd} onChange={(e) => setNewMatchDayEnd(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2" required /></div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold">Crear Fecha</button>
            </form>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <h3 className="font-semibold text-gray-300 mb-3 border-b border-gray-700 pb-2">Fechas Configuradas</h3>
             <ul className="space-y-3">
               {matchDays.map(day => (
                 <li key={day.id} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                   <div><span className="font-bold block text-lg">{day.name}</span><span className="text-xs text-gray-400">{new Date(day.start_date).toLocaleDateString()} - {new Date(day.end_date).toLocaleDateString()}</span></div>
                   <button onClick={() => handleDeleteMatchDay(day.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-5 h-5" /></button>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {/* --- VISTA: JUGADORES (CARGA MASIVA Y GESTIÓN) --- */}
      {activeTab === 'players' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Upload className="text-blue-400" /> Carga Masiva (Excel)</h2>
                  <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg mb-6 text-sm text-blue-200">
                      <p className="font-bold mb-2 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Instrucciones:</p>
                      <ul className="list-disc pl-5 space-y-1">
                          <li>El archivo debe ser <strong>.xlsx</strong></li>
                          <li>Columnas: <strong>Nombre</strong>, <strong>RUT</strong></li>
                          <li>Opcionales: <strong>Numero</strong>, <strong>Nacimiento</strong></li>
                      </ul>
                  </div>
                  
                  <form onSubmit={handleUploadPlayers} className="space-y-4">
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Categoría</label>
                          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-700 p-2 rounded border border-gray-600">
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Equipo / Club</label>
                          <select value={uploadTeamId} onChange={(e) => setUploadTeamId(e.target.value)} className="w-full bg-gray-700 p-2 rounded border border-gray-600" required>
                              <option value="">Seleccionar Equipo...</option>
                              {teams.map(t => <option key={t.id} value={t.id}>{t.club.name} ({t.club.league_series})</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-gray-400 mb-1">Archivo Excel</label>
                          <input type="file" accept=".xlsx, .xls" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" required />
                      </div>
                      
                      <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                          <Upload className="w-5 h-5" /> Subir Jugadores
                      </button>
                  </form>
                  
                  {uploadStatus && (
                      <div className={`mt-4 p-3 rounded-lg text-sm font-bold ${uploadStatus.includes('Error') ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-green-900/50 text-green-300 border border-green-700'}`}>
                          {uploadStatus}
                      </div>
                  )}

                  {uploadErrors.length > 0 && (
                      <div className="mt-4 p-4 bg-red-950/50 border border-red-800 rounded-xl">
                          <h4 className="text-red-400 font-bold text-xs uppercase mb-2">Errores Detectados:</h4>
                          <ul className="text-[10px] text-red-300 space-y-1 list-disc pl-4 max-h-40 overflow-y-auto">
                              {uploadErrors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                      </div>
                  )}
              </div>
              
              {/* Lado Derecho: Lista de Jugadores */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col h-[600px]">
                  <h3 className="text-lg font-bold mb-4 text-gray-300 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span>Plantel Actual</span>
                        {uploadTeamId && <span className="text-xs font-normal text-gray-500">{currentRoster.length} Jugadores</span>}
                      </div>
                      {getCategoryRules() && (
                          <div className="text-[10px] flex gap-3 font-normal">
                              <span className="text-gray-400">Regla: &gt;{getCategoryRules()?.min_age} años</span>
                              <span className={`${countExceptions() > (getCategoryRules()?.max_exceptions || 0) ? 'text-red-400 font-bold' : 'text-yellow-500'}`}>
                                  Excepciones: {countExceptions()} / {getCategoryRules()?.max_exceptions}
                              </span>
                          </div>
                      )}
                  </h3>
                  
                  {!uploadTeamId ? (
                      <div className="text-gray-500 text-center py-20 italic flex-1 flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 mb-4 opacity-20" />
                          Selecciona un equipo para ver y gestionar su plantilla.
                      </div>
                  ) : (
                      <div className="flex-1 overflow-y-auto pr-2">
                          {currentRoster.length === 0 ? (
                              <div className="text-center text-gray-500 py-10">No hay jugadores cargados aún.</div>
                          ) : (
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-900/50 text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                                      <tr>
                                          <th className="px-3 py-2">#</th>
                                          <th className="px-3 py-2">Nombre</th>
                                          <th className="px-3 py-2">RUT</th>
                                          <th className="px-3 py-2">Edad (Estado)</th>
                                          <th className="px-3 py-2 text-right">Acción</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700">
                                      {currentRoster.map(p => {
                                          const { status, age } = getPlayerAgeStatus(p.birth_date)
                                          return (
                                          <tr key={p.id} className="group hover:bg-gray-750">
                                              <td className="px-3 py-2 text-gray-400">{p.number || '-'}</td>
                                              <td className="px-3 py-2 font-medium">{p.name}</td>
                                              <td className="px-3 py-2 text-gray-400 text-xs">{p.dni || '-'}</td>
                                              <td className="px-3 py-2 text-xs">
                                                  {status === 'ok' && <span className="text-green-400 flex items-center gap-1">✅ {age} años</span>}
                                                  {status === 'exception' && <span className="text-yellow-500 flex items-center gap-1">⚠️ {age} años</span>}
                                                  {status === 'invalid' && <span className="text-red-400 flex items-center gap-1">❌ {age} años</span>}
                                                  {status === 'unknown' && <span className="text-gray-500">-</span>}
                                              </td>
                                              <td className="px-3 py-2 text-right flex gap-2 justify-end">
                                                  <button onClick={() => setEditingPlayer(p)} className="text-blue-400 hover:text-blue-300 p-1">
                                                      <Edit className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={() => handleDeletePlayer(p.id)} className="text-red-500/50 hover:text-red-500 p-1">
                                                      <Trash2 className="w-4 h-4" />
                                                  </button>
                                              </td>
                                          </tr>
                                      )})}
                                  </tbody>
                              </table>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- MODAL EDITAR JUGADOR --- */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 w-full max-w-md">
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-500"><Lock className="w-4 h-4" /> SuperAdmin Editor</h3>
                    <button onClick={() => setEditingPlayer(null)}><CloseIcon className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                </div>
                <div className="mb-4 text-xs text-gray-400 bg-gray-900/50 p-3 rounded border border-gray-700">
                    <p>⚠️ Estás editando datos sensibles de un jugador. Asegúrate de tener respaldo físico (cédula).</p>
                </div>
                <form onSubmit={handleUpdatePlayer} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400">Nombre Completo</label>
                        <input type="text" value={editingPlayer.name} onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">RUT / DNI</label>
                            <input type="text" value={editingPlayer.dni || ''} onChange={(e) => setEditingPlayer({...editingPlayer, dni: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white uppercase" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Dorsal</label>
                            <input type="number" value={editingPlayer.number || ''} onChange={(e) => setEditingPlayer({...editingPlayer, number: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Fecha de Nacimiento</label>
                        <input type="date" value={editingPlayer.birth_date ? editingPlayer.birth_date.split('T')[0] : ''} onChange={(e) => setEditingPlayer({...editingPlayer, birth_date: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white" />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingPlayer(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- VISTA: ROSTER (INSCRITOS) --- */}
      {activeTab === 'roster' && (
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <div className="flex items-center gap-4 mb-6"><label className="text-gray-400">Equipos inscritos en:</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg p-2 max-w-xs">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><h3 className="text-yellow-500 font-bold mb-3 border-b border-gray-700 pb-2">Serie de Honor</h3><ul className="space-y-2">{teams.filter(t => t.club.league_series === 'HONOR').map(t => (<li key={t.id} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded"><img src={t.club.logo_url} className="w-6 h-6 rounded-full object-contain bg-gray-800" /><span>{t.club.name}</span></li>))}</ul></div>
                <div><h3 className="text-blue-500 font-bold mb-3 border-b border-gray-700 pb-2">Serie de Ascenso</h3><ul className="space-y-2">{teams.filter(t => t.club.league_series === 'ASCENSO').map(t => (<li key={t.id} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded"><img src={t.club.logo_url} className="w-6 h-6 rounded-full object-contain bg-gray-800" /><span>{t.club.name}</span></li>))}</ul></div>
             </div>
         </div>
      )}

      {/* --- VISTA: AUDITORÍA --- */}
      {activeTab === 'audit' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center"><h2 className="text-xl font-bold flex items-center gap-2"><History className="text-indigo-400 w-5 h-5" /> Caja Negra</h2><button onClick={fetchAuditLogs} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg font-bold">Actualizar</button></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-900/50 text-gray-500 uppercase font-bold text-[10px]"><tr><th className="px-6 py-4">Fecha/Hora</th><th className="px-6 py-4">Partido</th><th className="px-6 py-4">Acción</th><th className="px-6 py-4">Detalles</th></tr></thead><tbody className="divide-y divide-gray-700">
                  {auditLogs.map(log => (<tr key={log.id} className="hover:bg-gray-750 transition-colors"><td className="px-6 py-4 text-xs font-mono text-gray-400">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4 font-bold text-gray-300">{log.match_info}</td><td className="px-6 py-4"><span className="px-2 py-1 rounded text-[10px] font-black bg-blue-900/30 text-blue-400 border border-blue-800">{log.action}</span></td><td className="px-6 py-4 text-gray-400 italic">{log.details}</td></tr>))}
              </tbody></table></div>
          </div>
      )}

      {/* --- MODALES --- */}
      {editingClub && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 p-6 rounded-xl border border-gray-600 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Editar Club</h3><button onClick={() => setEditingClub(null)}><CloseIcon className="w-5 h-5" /></button></div><form onSubmit={handleUpdateClub} className="space-y-4"><input type="text" value={editingClub.name} onChange={(e) => setEditingClub({...editingClub, name: e.target.value})} className="w-full bg-gray-700 p-2 rounded" /><select value={editingClub.league_series} onChange={(e) => setEditingClub({...editingClub, league_series: e.target.value})} className="w-full bg-gray-700 p-2 rounded"><option value="HONOR">Honor</option><option value="ASCENSO">Ascenso</option></select><input type="text" value={editingClub.logo_url || ''} onChange={(e) => setEditingClub({...editingClub, logo_url: e.target.value})} className="w-full bg-gray-700 p-2 rounded" /><button type="submit" className="w-full bg-indigo-600 py-2 rounded font-bold">Guardar</button></form></div></div>
      )}

      {editingMatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 p-6 rounded-xl border border-gray-600 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">Editar Partido</h3><button onClick={() => setEditingMatch(null)}><CloseIcon className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleUpdateMatchDetails} className="space-y-4">
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Local</label>
                <select value={editingMatch.home_team_id} onChange={(e) => setEditingMatch({...editingMatch, home_team_id: e.target.value, away_team_id: ''})} className="w-full bg-gray-700 p-2 rounded text-sm">
                    {teams.map(t => <option key={t.id} value={t.id}>{isAdultCategory() ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Visita</label>
                <select value={editingMatch.away_team_id} onChange={(e) => setEditingMatch({...editingMatch, away_team_id: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-sm">
                    <option value="">Visita...</option>
                    {teams
                        .filter(t => t.id.toString() !== editingMatch.home_team_id.toString())
                        .filter(t => {
                            if (!isAdultCategory() || !editingMatch.home_team_id) return true
                            const home = teams.find(ht => ht.id.toString() === editingMatch.home_team_id.toString())
                            return home ? t.club.league_series === home.club.league_series : true
                        })
                        .map(t => <option key={t.id} value={t.id}>{isAdultCategory() ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)
                    }
                </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <input type="date" value={editingMatch.date} onChange={(e) => setEditingMatch({...editingMatch, date: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
                <input type="time" value={editingMatch.time} onChange={(e) => setEditingMatch({...editingMatch, time: e.target.value})} className="w-full bg-gray-700 p-2 rounded" />
            </div>
            <select value={editingMatch.venue_id || ''} onChange={(e) => setEditingMatch({...editingMatch, venue_id: e.target.value})} className="w-full bg-gray-700 p-2 rounded"><option value="">Estadio...</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            <button type="submit" className="w-full bg-indigo-600 py-2 rounded font-bold">Guardar Cambios</button>
        </form></div></div>
      )}

      {controllingMatch && (
        <MatchControl match={controllingMatch} onClose={() => { setControllingMatch(null); fetchMatches(selectedCategory); }} />
      )}
    </div>
  )
}

export default AdminDashboard
