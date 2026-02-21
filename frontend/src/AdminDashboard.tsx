import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { 
  PlusCircle, Users, Calendar, Trophy, Edit, X as CloseIcon, 
  Trash2, Shield, PlayCircle, AlertTriangle, 
  Upload, Lock, LogOut, User as UserIcon,
  UserPlus, ShieldCheck, Clock, Save, UserPlus as IndividualIcon 
} from 'lucide-react'
import MatchControl from './MatchControl'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'matches' | 'roster' | 'players' | 'fixture' | 'users'>('clubs')
  
  // --- SEGURIDAD ---
  const token = localStorage.getItem('renca_token')
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }
  
  const getCurrentUser = () => {
    try {
      if (!token) return null
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.sub
    } catch (e) { return null }
  }
  const currentUser = getCurrentUser()

  // Redirigir si no hay sesión
  if (!currentUser) {
    localStorage.removeItem('renca_token')
    window.location.href = '/'
  }

  // --- ESTADOS ---
  const [clubs, setClubs] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [matchDays, setMatchDays] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [error] = useState<string | null>(null)

  // Estados para creación de usuarios
  const [newUsername, setNewUsername] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')

  // Estados para ficha individual
  const [indivName, setIndivName] = useState('')
  const [indivDni, setIndivDni] = useState('')
  const [indivNumber, setIndivNumber] = useState('')
  const [indivBirthDate, setIndivBirthDate] = useState('')

  const [uploadTeamId, setUploadTeamId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>('')
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
  const [controllingMatch, setControllingMatch] = useState<any>(null)
  const [showPastMatches, setShowPastMatches] = useState(true)

  const [newMatchDayName, setNewMatchDayName] = useState('')
  const [newMatchDayStart, setNewMatchDayStart] = useState('')
  const [newMatchDayEnd, setNewMatchDayEnd] = useState('')

  // --- PETICIONES API ---
  const fetchUsers = async () => {
    if (currentUser !== 'admin_renca') return
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, authHeader)
      setUsers(res.data)
    } catch (e) { console.error(e) }
  }

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
    if (currentUser === 'admin_renca') fetchUsers();
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchTeams(selectedCategory)
      fetchMatches(selectedCategory)
      if(activeTab === 'players') { setUploadTeamId(''); setCurrentRoster([]); }
    }
  }, [selectedCategory, activeTab, fetchTeams, fetchMatches])

  useEffect(() => {
      if(uploadTeamId) fetchTeamRoster(uploadTeamId)
  }, [uploadTeamId, fetchTeamRoster])

  // --- HANDLERS ---
  const handleLogout = () => {
    localStorage.removeItem('renca_token')
    window.location.href = '/'
  }

  const handleCreateIndividualPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTeamId) return alert('Selecciona un equipo primero')
    try {
      await axios.post(`${API_BASE_URL}/players`, {
        team_id: parseInt(uploadTeamId),
        name: indivName,
        dni: indivDni,
        number: indivNumber ? parseInt(indivNumber) : null,
        birth_date: indivBirthDate || null
      }, authHeader)
      setIndivName(''); setIndivDni(''); setIndivNumber(''); setIndivBirthDate('');
      fetchTeamRoster(uploadTeamId)
      alert('Jugador fichado con éxito')
    } catch (e) { alert('Error al fichar jugador') }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/users`, { username: newUsername, password: newUserPassword }, authHeader)
      setNewUsername(''); setNewUserPassword('');
      fetchUsers()
      alert('Usuario creado con éxito')
    } catch (e) { alert('Error al crear usuario') }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('¿Eliminar acceso a este usuario?')) return
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`, authHeader)
      fetchUsers()
    } catch (e) { alert('Error al eliminar') }
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
          const { created, updated } = res.data
          setUploadStatus(`Éxito: ${created} nuevos, ${updated} actualizados.`)
          setUploadFile(null)
          fetchTeamRoster(uploadTeamId)
      } catch (error: any) { setUploadStatus(`Error al procesar archivo.`) }
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
    } catch (error) { alert('Error de datos') }
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
        match_day_id: 1, 
        match_date: fullDate 
      }, authHeader)
      fetchMatches(selectedCategory)
      setHomeTeamId(''); setAwayTeamId('');
      alert('Partido programado')
    } catch (error: any) { alert(error.response?.data?.detail || 'Error al crear') }
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
      <header className="mb-8 flex flex-col lg:flex-row justify-between items-center border-b border-gray-700 pb-6 gap-6">
        <div className="flex items-center gap-6">
           <h1 className="text-3xl font-black italic tracking-tighter text-white">RENCA FC ADMIN</h1>
           <div className="flex items-center gap-3 bg-indigo-600/10 px-4 py-2 rounded-2xl border border-indigo-500/20 shadow-inner">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg"><UserIcon className="w-4 h-4 text-white" /></div>
              <div>
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Sesión Activa</div>
                 <div className="text-sm font-bold text-white leading-none uppercase">{currentUser}</div>
              </div>
           </div>
        </div>

        <div className="flex gap-2 bg-gray-800 p-1.5 rounded-2xl overflow-x-auto w-full lg:w-auto shadow-2xl border border-gray-700">
          {[
              {id: 'clubs', label: 'Clubes', icon: Shield},
              {id: 'matches', label: 'Partidos', icon: PlayCircle},
              {id: 'fixture', label: 'Fechas', icon: Calendar},
              {id: 'players', label: 'Jugadores', icon: Users},
              {id: 'roster', label: 'Inscritos', icon: Trophy},
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
          {currentUser === 'admin_renca' && (
            <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                <UserPlus className="w-4 h-4" /> Usuarios
            </button>
          )}
          <div className="w-px bg-gray-700 mx-2 my-2"></div>
          <button onClick={handleLogout} className="px-5 py-2.5 rounded-xl text-red-400 hover:bg-red-400/10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
      </header>

      {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3"><AlertTriangle className="w-5 h-5" />{error}</div>}

      {/* --- VISTA: USUARIOS --- */}
      {activeTab === 'users' && currentUser === 'admin_renca' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
           <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 h-fit shadow-2xl">
              <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase italic text-indigo-400"><UserPlus className="w-6 h-6" /> Crear Operador</h2>
              <form onSubmit={handleCreateUser} className="space-y-5">
                 <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Usuario</label><input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" required /></div>
                 <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Contraseña</label><input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" required /></div>
                 <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Registrar Acceso</button>
              </form>
           </div>
           <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 shadow-2xl">
              <h3 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-widest italic">Cuentas Activas</h3>
              <div className="space-y-3">
                 {users.map(u => (
                    <div key={u.id} className="bg-gray-900/50 p-4 rounded-2xl flex items-center justify-between border border-gray-800">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"><ShieldCheck className={`w-5 h-5 ${u.username === 'admin_renca' ? 'text-indigo-500' : 'text-gray-500'}`} /></div>
                          <div>
                             <div className="font-black text-sm text-white uppercase">{u.username}</div>
                             <div className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{u.username === 'admin_renca' ? 'Super Administrador' : 'Operador de Liga'}</div>
                          </div>
                       </div>
                       {u.username !== 'admin_renca' && (
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-500/20 hover:text-red-500 p-2 transition-all"><Trash2 className="w-5 h-5" /></button>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* --- VISTA: CLUBES --- */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 h-fit shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tight italic"><PlusCircle className="text-green-500 w-6 h-6" /> Nuevo Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-5">
              <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Nombre</label><input type="text" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold uppercase text-white focus:border-indigo-500 outline-none transition-all" required /></div>
              {categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos' && (<div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Serie Adulto</label><select value={newClubSeries} onChange={(e) => setNewClubSeries(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none"><option value="HONOR">Honor</option><option value="ASCENSO">Ascenso</option></select></div>)}
              <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Logo URL</label><input type="text" value={newClubLogo} onChange={(e) => setNewClubLogo(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none" /></div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg transition-all active:scale-95">Guardar Club</button>
            </form>
          </div>
          <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 max-h-[650px] overflow-y-auto custom-scrollbar shadow-2xl">
             <div className="mb-8"><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Inscribir en Categoría:</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black uppercase text-white outline-none">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
             <ul className="space-y-3">
               {clubs.map(club => (
                 <li key={club.id} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-2xl group border border-gray-800 hover:border-indigo-500/30 transition-all shadow-inner">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-contain" /> : <Shield className="w-5 h-5 text-gray-300" />}
                     </div>
                     <div>
                        <span className="font-black text-sm block text-white uppercase tracking-tight leading-none mb-1">{club.name}</span>
                        {categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos' && <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-400/5 px-2 py-0.5 rounded border border-indigo-400/10">{club.league_series}</span>}
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button onClick={() => setEditingClub(club)} className="text-gray-600 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"><Edit className="w-4 h-4" /></button>
                      {teams.some(t => t.club_id === club.id) ? <span className="text-[9px] font-black bg-gray-950 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-800 uppercase tracking-widest shadow-inner italic">Inscrito</span> : <button onClick={() => handleCreateTeam(club.id)} className="text-[9px] font-black bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg uppercase tracking-widest active:scale-90 transition-all">Inscribir</button>}
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {/* --- VISTA: PARTIDOS --- */}
      {activeTab === 'matches' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-gray-800 p-5 rounded-[24px] flex items-center gap-6 border border-gray-700 shadow-2xl">
             <div className="flex items-center gap-3"><Trophy className="text-yellow-500 w-6 h-6" /><span className="text-[10px] font-black uppercase text-gray-500 tracking-widest italic">Filtrar por Categoría:</span></div>
             <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black uppercase text-white outline-none focus:border-indigo-500 transition-all">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 h-fit shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px]"></div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-3 uppercase tracking-tighter italic text-white relative"><Calendar className="text-indigo-500 w-6 h-6" /> Programar Partido</h3>
                <form onSubmit={handleCreateMatch} className="space-y-5 relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Local</label><select value={homeTeamId} onChange={(e) => { setHomeTeamId(e.target.value); setAwayTeamId(''); }} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs font-bold text-white outline-none" required><option value="">Seleccionar...</option>{teams.map(t => <option key={t.id} value={t.id}>{(categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos') ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)}</select></div>
                    <div><label className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Visita</label><select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs font-bold text-white outline-none" required disabled={!homeTeamId}><option value="">Seleccionar...</option>{teams.filter(t => t.id.toString() !== homeTeamId).filter(t => { if ((categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category !== 'Adultos') || !homeTeamId) return true; const home = teams.find(ht => ht.id.toString() === homeTeamId); return home ? t.club.league_series === home.club.league_series : true; }).map(t => <option key={t.id} value={t.id}>{(categories.find(c => c.id.toString() === selectedCategory.toString())?.parent_category === 'Adultos') ? `[${t.club.league_series[0]}] ` : ''}{t.club.name}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Día</label><input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white outline-none" /></div>
                    <div><label className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Hora</label><input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs text-white outline-none" /></div>
                  </div>
                  <div><label className="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Recinto</label><select value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded-xl text-xs font-bold text-white outline-none"><option value="">Elegir Cancha...</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-lg transition-all active:scale-95 mt-2 text-white">Publicar Encuentro</button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-8">
               <button onClick={() => setShowPastMatches(!showPastMatches)} className="text-[10px] font-black px-4 py-2 rounded-xl border border-gray-700 text-gray-500 hover:text-white transition-all ml-auto block uppercase tracking-widest bg-gray-950/50 shadow-inner">{showPastMatches ? 'Ocultar pasados' : 'Ver todo'}</button>
               {Object.entries(getGroupedMatches()).map(([dayName, dayMatches]) => (
                 dayMatches.length > 0 && (
                   <div key={dayName} className="animate-in slide-in-from-bottom-4"><h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 border-b border-gray-800 pb-2 italic flex items-center gap-2"> <Clock className="w-4 h-4 opacity-50" /> {dayName}</h3><div className="space-y-4">
                       {dayMatches.map(match => (
                         <div key={match.id} className="bg-gray-800 border border-gray-700 p-6 rounded-[32px] shadow-2xl group hover:border-indigo-500/50 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[60px]"></div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-4 border-b border-gray-700/50 pb-3 relative">
                                <span className="font-bold flex items-center gap-2 uppercase tracking-widest"> <Clock className="w-3 h-3 text-indigo-500" /> {new Date(match.match_date).toLocaleString()} • {match.venue?.name}</span>
                                <div className="flex gap-6">
                                    <button onClick={() => setControllingMatch(match)} className="text-green-400 font-black flex items-center gap-1 hover:scale-110 transition-transform tracking-widest uppercase"><PlayCircle className="w-3.5 h-3.5" /> CONTROLAR</button>
                                    <button onClick={async () => { if(confirm('¿Eliminar partido?')) { await axios.delete(`${API_BASE_URL}/matches/${match.id}`, authHeader); fetchMatches(selectedCategory); } }} className="text-red-500/30 hover:text-red-500 transition-all p-1 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between relative">
                                <span className="font-black w-[40%] text-right truncate text-base uppercase italic tracking-tighter text-white">{match.home_team.club.name}</span>
                                <div className={`px-6 py-2 rounded-2xl font-black text-3xl flex gap-4 shadow-inner border-2 ${match.is_played ? 'bg-gray-950 text-gray-700 border-gray-900' : 'bg-indigo-600 text-white border-indigo-400 animate-pulse'}`}>
                                    <span>{match.home_score}</span><span className="opacity-20">-</span><span>{match.away_score}</span>
                                </div>
                                <span className="font-black w-[40%] text-left truncate text-base uppercase italic tracking-tighter text-white">{match.away_team.club.name}</span>
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

      {/* --- VISTA: JUGADORES --- */}
      {activeTab === 'players' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
              <div className="space-y-8">
                  <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-2xl relative overflow-hidden">
                      <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter italic text-white"><Upload className="text-indigo-500 w-6 h-6" /> Carga Masiva (Excel)</h2>
                      <form onSubmit={handleUploadPlayers} className="space-y-6">
                          <div><label className="block text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">Categoría</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black text-white">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                          <div><label className="block text-[10px] text-gray-500 mb-2 uppercase font-black tracking-widest">Equipo</label><select value={uploadTeamId} onChange={(e) => setUploadTeamId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black text-white" required><option value="">Seleccionar...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.club.name}</option>)}</select></div>
                          <input type="file" accept=".xlsx, .xls" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-gray-400 file:bg-indigo-600 file:border-0 file:rounded file:text-white file:font-black file:uppercase file:text-[9px] file:px-3 file:py-1 file:mr-4 cursor-pointer" required />
                          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Procesar Plantilla</button>
                      </form>
                      {uploadStatus && <div className="mt-4 p-3 rounded-lg text-center text-xs font-black uppercase tracking-widest border border-gray-700 bg-gray-900">{uploadStatus}</div>}
                  </div>

                  <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-2xl relative overflow-hidden">
                      <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter italic text-white"><IndividualIcon className="text-green-500 w-6 h-6" /> Fichaje Individual</h2>
                      <form onSubmit={handleCreateIndividualPlayer} className="space-y-4">
                          <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Nombre Completo</label><input type="text" value={indivName} onChange={(e) => setIndivName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" required /></div>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">RUT / DNI</label><input type="text" value={indivDni} onChange={(e) => setIndivDni(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" required /></div>
                             <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Dorsal</label><input type="number" value={indivNumber} onChange={(e) => setIndivNumber(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" /></div>
                          </div>
                          <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1">Fecha de Nacimiento</label><input type="date" value={indivBirthDate} onChange={(e) => setIndivBirthDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white" /></div>
                          <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg" disabled={!uploadTeamId}>Fichar Jugador</button>
                      </form>
                  </div>
              </div>

              <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 flex flex-col h-[800px] shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-8 relative border-b border-gray-700 pb-4"><h3 className="text-xl font-black italic uppercase tracking-tighter text-indigo-400">Jugadores Registrados</h3><span className="text-[10px] font-black bg-gray-900 px-3 py-1.5 rounded-full text-gray-500">{currentRoster.length} FICHAS</span></div>
                  {!uploadTeamId ? <div className="text-gray-700 text-center py-20 italic flex-1 flex flex-col items-center justify-center opacity-30"><Users className="w-20 h-20 mb-4" /><p className="text-sm font-black uppercase tracking-widest">Elige un club</p></div> : 
                      <div className="flex-1 overflow-y-auto custom-scrollbar"><table className="w-full text-left text-sm"><thead className="bg-gray-950 text-gray-500 uppercase font-black text-[10px] sticky top-0 z-10"><tr><th className="px-4 py-4">#</th><th className="px-4 py-4">Nombre</th><th className="px-4 py-4">RUT</th><th className="px-4 py-4 text-right">Gestión</th></tr></thead><tbody className="divide-y divide-gray-800">
                          {currentRoster.map(p => {
                              const birthYear = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
                              const age = birthYear ? new Date().getFullYear() - birthYear : null;
                              return (
                              <tr key={p.id} className="hover:bg-gray-850 group transition-all"><td className="px-4 py-4 text-indigo-500 font-black">{p.number || '-'}</td><td className="px-4 py-4 font-black uppercase text-gray-200 text-xs">{p.name} {age && <span className="text-[9px] text-gray-500 font-normal ml-1">({age} años)</span>}</td><td className="px-4 py-4 text-gray-500 text-[10px] font-mono italic">{p.dni}</td><td className="px-4 py-4 text-right flex gap-4 justify-end"><button onClick={() => setEditingPlayer(p)} className="text-gray-600 hover:text-white transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => handleDeletePlayer(p.id)} className="text-red-500/20 group-hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>
                          )})}
                      </tbody></table></div>
                  }
              </div>
          </div>
      )}

      {/* --- OTROS COMPONENTES --- */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in">
            <div className="bg-gray-800 p-10 rounded-[48px] border border-gray-700 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-10 border-b border-gray-700 pb-6"><h3 className="text-2xl font-black italic tracking-tighter text-white uppercase"><Lock className="w-6 h-6 text-indigo-500 inline mr-2" /> Corregir Ficha</h3><button onClick={() => setEditingPlayer(null)} className="p-2 hover:bg-white/5 rounded-full"><CloseIcon className="w-8 h-8 text-gray-500" /></button></div>
                <form onSubmit={handleUpdatePlayer} className="space-y-6">
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Nombre Completo</label><input type="text" value={editingPlayer.name} onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-4 text-base font-black uppercase text-white outline-none focus:border-indigo-500 transition-all" required /></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">RUT / DNI</label><input type="text" value={editingPlayer.dni || ''} onChange={(e) => setEditingPlayer({...editingPlayer, dni: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-4 text-base font-black uppercase text-white outline-none" required /></div>
                        <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Dorsal</label><input type="number" value={editingPlayer.number || ''} onChange={(e) => setEditingPlayer({...editingPlayer, number: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-4 text-base font-black text-white outline-none" /></div>
                    </div>
                    <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Fecha Nacimiento</label><input type="date" value={editingPlayer.birth_date ? editingPlayer.birth_date.split('T')[0] : ''} onChange={(e) => setEditingPlayer({...editingPlayer, birth_date: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-4 text-white outline-none" /></div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.4em] shadow-2xl transition-all active:scale-95 text-white"><Save className="w-4 h-4" /> Confirmar Cambios</button>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'fixture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
          <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 h-fit shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter italic text-white"><Calendar className="text-blue-400 w-6 h-6" /> Nueva Jornada</h2>
            <form onSubmit={handleCreateMatchDay} className="space-y-5">
              <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Nombre</label><input type="text" value={newMatchDayName} onChange={(e) => setNewMatchDayName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black uppercase text-white outline-none focus:border-indigo-500 transition-all" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Inicio</label><input type="date" value={newMatchDayStart} onChange={(e) => setNewMatchDayStart(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none" required /></div>
                <div><label className="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-1 block">Fin</label><input type="date" value={newMatchDayEnd} onChange={(e) => setNewMatchDayEnd(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none" required /></div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Crear Jornada</button>
            </form>
          </div>
          <div className="bg-gray-800 p-8 rounded-[32px] border border-gray-700 shadow-2xl overflow-y-auto max-h-[600px]">
             <ul className="space-y-3">
               {matchDays.map(day => (
                 <li key={day.id} className="bg-gray-900/50 p-5 rounded-2xl flex items-center justify-between border border-gray-800 group hover:border-gray-600 transition-all">
                   <div><span className="font-black block text-lg italic uppercase tracking-tighter text-white">{day.name}</span><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(day.start_date).toLocaleDateString()} — {new Date(day.end_date).toLocaleDateString()}</span></div>
                   <button onClick={() => handleDeleteMatchDay(day.id)} className="text-red-500/20 group-hover:text-red-500 p-3"><Trash2 className="w-5 h-5" /></button>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
         <div className="bg-gray-800 p-8 rounded-[40px] border border-gray-700 shadow-2xl animate-in fade-in">
             <div className="flex items-center gap-6 mb-10"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Equipos inscritos en:</label><select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm font-black text-white outline-none">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div><h3 className="text-yellow-500 font-black mb-6 border-b border-gray-700 pb-3 uppercase tracking-widest italic">Serie de Honor</h3><div className="grid gap-3">{teams.filter(t => t.club.league_series === 'HONOR').map(t => (<div key={t.id} className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-inner group hover:border-yellow-500/30 transition-all"><img src={t.club.logo_url} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-lg" /><span className="font-black uppercase tracking-tight text-white text-sm">{t.club.name}</span></div>))}</div></div>
                <div><h3 className="text-indigo-400 font-black mb-6 border-b border-gray-700 pb-3 uppercase tracking-widest italic">Serie de Ascenso</h3><div className="grid gap-3">{teams.filter(t => t.club.league_series === 'ASCENSO').map(t => (<div key={t.id} className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-2xl border border-gray-800 shadow-inner group hover:border-indigo-500/30 transition-all"><img src={t.club.logo_url} className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-lg" /><span className="font-black uppercase tracking-tight text-white text-sm">{t.club.name}</span></div>))}</div></div>
             </div>
         </div>
      )}

      {editingClub && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"><div className="bg-gray-800 p-10 rounded-[48px] border border-gray-700 w-full max-w-md shadow-2xl"><div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-6"><h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Editar Club</h3><button onClick={() => setEditingClub(null)} className="p-2 hover:bg-white/5 rounded-full"><CloseIcon className="w-8 h-8 text-gray-500" /></button></div><form onSubmit={handleUpdateClub} className="space-y-6"><div><label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Nombre Oficial</label><input type="text" value={editingClub.name} onChange={(e) => setEditingClub({...editingClub, name: e.target.value})} className="w-full bg-gray-950 border border-gray-700 rounded-2xl p-4 text-base font-black uppercase text-white outline-none" /></div><button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl mt-4">Actualizar Datos</button></form></div></div>
      )}

      {controllingMatch && (
        <MatchControl match={controllingMatch} onClose={() => { setControllingMatch(null); fetchMatches(selectedCategory); }} />
      )}
    </div>
  )
}

export default AdminDashboard
