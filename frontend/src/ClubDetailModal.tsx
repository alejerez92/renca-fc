import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Shield } from 'lucide-react'

const API_BASE_URL = 'https://renca-fc.onrender.com'

function ClubDetailModal({ clubId, onClose }: { clubId: number, onClose: () => void }) {
  const [clubData, setClubData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')

  useEffect(() => {
    fetchInitialData()
  }, [clubId])

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/clubs/${clubId}/details`)
      setClubData(res.data)
      if (res.data.categories.length > 0) {
        setActiveCategory(res.data.categories[0].category_name)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  if (loading || !clubData) return null

  const currentCat = clubData.categories.find((c: any) => c.category_name === activeCategory) || clubData.categories[0]

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 font-sans" onClick={onClose}>
      <div className="bg-gray-900 w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gray-800 p-6 border-b border-gray-700 shrink-0 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-600 shadow-lg">
                 {clubData.logo_url ? <img src={clubData.logo_url} className="w-14 h-14 object-contain" /> : <Shield className="w-10 h-10 text-gray-500" />}
              </div>
              <div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">{clubData.name}</h2>
                 <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest">Ficha Oficial</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
              <X className="w-8 h-8" />
           </button>
        </div>

        {/* Navigation - Categorías */}
        <div className="bg-gray-900 border-b border-gray-800 p-2 overflow-x-auto whitespace-nowrap flex gap-2 shrink-0">
           {clubData.categories.map((cat: any) => (
              <button
                key={cat.category_name}
                onClick={() => setActiveCategory(cat.category_name)}
                className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all ${activeCategory === cat.category_name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              >
                {cat.category_name}
              </button>
           ))}
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
           {!currentCat ? (
             <div className="text-center text-gray-500 py-20 italic">Este club no tiene equipos registrados en esta categoría.</div>
           ) : (
             <div className="space-y-8">
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                      <div className="text-3xl font-black text-white">{currentCat.stats.pts}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Puntos</div>
                   </div>
                   <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                      <div className="text-3xl font-black text-green-400">{currentCat.stats.pg}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Ganados</div>
                   </div>
                   <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                      <div className="text-3xl font-black text-yellow-400">{currentCat.stats.gf}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Goles</div>
                   </div>
                   <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl text-center">
                      <div className="text-3xl font-black text-gray-400">{currentCat.stats.pj}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Partidos</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   
                   {/* Historial */}
                   <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Historial Reciente</h3>
                        <div className="space-y-2">
                           {currentCat.past_matches.length === 0 ? <div className="text-gray-700 text-sm italic">Sin registros.</div> : 
                             currentCat.past_matches.map((m: any) => (
                               <div key={m.id} className="bg-gray-900/50 border border-gray-800 p-3 rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-2 h-2 rounded-full ${m.home_score > m.away_score ? 'bg-green-500' : m.home_score < m.away_score ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                     <span className="text-sm font-bold text-gray-300">vs {m.opponent_name}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <span className="text-[10px] font-bold text-gray-600">{new Date(m.match_date).toLocaleDateString()}</span>
                                     <span className="text-lg font-black text-white">{m.home_score}-{m.away_score}</span>
                                  </div>
                               </div>
                             ))
                           }
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Próximos Encuentros</h3>
                        <div className="space-y-2">
                           {currentCat.upcoming_matches.length === 0 ? <div className="text-gray-700 text-sm italic">Sin programación.</div> : 
                             currentCat.upcoming_matches.map((m: any) => (
                               <div key={m.id} className="bg-indigo-950/10 border border-indigo-900/20 p-3 rounded-xl flex items-center justify-between">
                                  <span className="text-sm font-bold text-indigo-300">vs {m.opponent_name}</span>
                                  <span className="text-xs font-black text-indigo-500">{new Date(m.match_date).toLocaleDateString()}</span>
                               </div>
                             ))
                           }
                        </div>
                      </div>
                   </div>

                   {/* PLANTEL (LIMPIO) */}
                   <div>
                      <div className="flex justify-between items-end mb-4 border-b border-gray-800 pb-2">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Plantel & Estadísticas</h3>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                         <table className="w-full text-left text-sm">
                            <thead className="bg-gray-800/50 text-gray-500 text-[10px] uppercase font-bold">
                               <tr>
                                  <th className="px-4 py-3">Jugador</th>
                                  <th className="px-4 py-3 text-center">Goles</th>
                                  <th className="px-4 py-3 text-center text-yellow-500">TA</th>
                                  <th className="px-4 py-3 text-center text-red-500">TR</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                               {currentCat.players.length === 0 ? <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-700 italic">No hay jugadores inscritos en esta categoría.</td></tr> :
                                 currentCat.players.map((p: any) => (
                                   <tr key={p.id} className="hover:bg-gray-850 transition-colors group">
                                      <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                          {p.number && <span className="text-gray-500 font-mono text-xs w-4 text-right">{p.number}</span>}
                                          {p.name}
                                      </td>
                                      <td className="px-4 py-3 text-center font-bold text-green-400">{p.goals > 0 ? p.goals : '-'}</td>
                                      <td className="px-4 py-3 text-center text-yellow-500 font-bold">{p.yellow_cards > 0 ? p.yellow_cards : '-'}</td>
                                      <td className="px-4 py-3 text-center text-red-500 font-bold">{p.red_cards > 0 ? p.red_cards : '-'}</td>
                                   </tr>
                                 ))
                               }
                            </tbody>
                         </table>
                      </div>
                   </div>

                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  )
}

export default ClubDetailModal
