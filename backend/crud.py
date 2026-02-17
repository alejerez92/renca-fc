from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, desc
from models import Club, Category, Team, Match, MatchEvent, Player, Venue, MatchDay, AuditLog, User
import schemas
import pandas as pd

# --- Users ---
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session):
    return db.query(User).all()

def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        if db_user.username == "admin_renca":
            return False # No se puede borrar al super admin
        db.delete(db_user)
        db.commit()
        return True
    return False

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Players ---
def create_player(db: Session, player: schemas.PlayerCreate):
    # Limpiar RUT
    dni_clean = player.dni.replace('.', '').replace('-', '').upper()
    
    # Verificar si ya existe
    existing = db.query(Player).filter(Player.dni == dni_clean).first()
    if existing:
        return None
        
    db_player = Player(
        team_id=player.team_id,
        name=player.name,
        dni=dni_clean,
        number=player.number,
        birth_date=player.birth_date
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

# --- Creación ---
def create_match_day(db: Session, match_day: schemas.MatchDayCreate):
    db_match_day = MatchDay(**match_day.model_dump())
    db.add(db_match_day)
    db.commit()
    db.refresh(db_match_day)
    return db_match_day

def update_match_day(db: Session, match_day_id: int, match_day: schemas.MatchDayCreate):
    db_match_day = db.query(MatchDay).filter(MatchDay.id == match_day_id).first()
    if db_match_day:
        db_match_day.name = match_day.name
        db_match_day.start_date = match_day.start_date
        db_match_day.end_date = match_day.end_date
        db.commit()
        db.refresh(db_match_day)
    return db_match_day

def delete_match_day(db: Session, match_day_id: int):
    db_match_day = db.query(MatchDay).filter(MatchDay.id == match_day_id).first()
    if db_match_day:
        db.delete(db_match_day)
        db.commit()
        return True
    return False

def create_club(db: Session, club: schemas.ClubCreate):
    db_club = Club(name=club.name, logo_url=club.logo_url, league_series=club.league_series)
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club

def update_club(db: Session, club_id: int, club_data: schemas.ClubCreate):
    db_club = db.query(Club).filter(Club.id == club_id).first()
    if db_club:
        db_club.name = club_data.name
        db_club.logo_url = club_data.logo_url
        db_club.league_series = club_data.league_series
        db.commit()
        db.refresh(db_club)
    return db_club

def create_team(db: Session, team: schemas.TeamCreate):
    # Verificar si ya existe el equipo en esa categoría
    existing_team = db.query(Team).filter(
        Team.club_id == team.club_id, 
        Team.category_id == team.category_id
    ).first()
    if existing_team:
        return existing_team
    
    db_team = Team(**team.model_dump())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

def create_match(db: Session, match: schemas.MatchCreate):
    # Verificar si ya existe este enfrentamiento exacto en esa categoría y fecha
    # Comparamos la fecha completa (incluyendo hora) para máxima precisión
    existing = db.query(Match).filter(
        Match.category_id == match.category_id,
        Match.home_team_id == match.home_team_id,
        Match.away_team_id == match.away_team_id,
        Match.match_date == match.match_date
    ).first()
    
    if existing:
        return None # Retornamos None para indicar que no se creó por duplicidad
        
    db_match = Match(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

def update_match_result(db: Session, match_id: int, result: schemas.MatchUpdateResult, user_id: int = None):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if db_match:
        db_match.home_score = result.home_score
        db_match.away_score = result.away_score
        db_match.is_played = result.is_played
        
        # Registrar Auditoría
        status_msg = "PARTIDO FINALIZADO" if result.is_played else "PARTIDO REABIERTO"
        db.add(AuditLog(match_id=match_id, user_id=user_id, action="STATUS_CHANGE", details=f"{status_msg} - Marcador {result.home_score}-{result.away_score}"))
        
        db.commit()
        db.refresh(db_match)
    return db_match

def get_audit_logs(db: Session, limit: int = 100):
    return db.query(AuditLog).options(joinedload(AuditLog.match), joinedload(AuditLog.user)).order_by(AuditLog.timestamp.desc()).limit(limit).all()

def get_match_audit_logs(db: Session, match_id: int):
    return db.query(AuditLog).options(joinedload(AuditLog.user)).filter(AuditLog.match_id == match_id).order_by(AuditLog.timestamp.desc()).all()

def update_match_details(db: Session, match_id: int, match: schemas.MatchUpdate):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if db_match:
        db_match.home_team_id = match.home_team_id
        db_match.away_team_id = match.away_team_id
        db_match.venue_id = match.venue_id
        db_match.match_date = match.match_date
        db.commit()
        db.refresh(db_match)
    return db_match

def delete_match(db: Session, match_id: int):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if db_match:
        db.delete(db_match)
        db.commit()
        return True
    return False

def delete_team(db: Session, team_id: int):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team:
        # Opcional: Verificar si ya tiene partidos jugados antes de borrar
        db.delete(team)
        db.commit()
        return True
    return False

# --- Eventos y Jugadores ---
def get_match_players(db: Session, match_id: int):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        return []
    
    # Obtener jugadores de ambos equipos
    home_players = db.query(Player).filter(Player.team_id == match.home_team_id).all()
    away_players = db.query(Player).filter(Player.team_id == match.away_team_id).all()
    
    return home_players + away_players

def get_match_events(db: Session, match_id: int):
    return db.query(MatchEvent).options(joinedload(MatchEvent.player)).filter(MatchEvent.match_id == match_id).order_by(MatchEvent.minute).all()

def create_match_event(db: Session, event: schemas.MatchEventCreate, user_id: int = None):
    db_event = MatchEvent(**event.model_dump())
    db.add(db_event)
    
    # Si es gol, actualizar marcador del partido
    if event.event_type == "GOAL":
        match = db.query(Match).filter(Match.id == event.match_id).first()
        player = db.query(Player).filter(Player.id == event.player_id).first()
        
        if match and player:
            if player.team_id == match.home_team_id:
                match.home_score += 1
            elif player.team_id == match.away_team_id:
                match.away_score += 1
            
    # Registrar Auditoría con NOMBRE REAL
    player_name = db.query(Player.name).filter(Player.id == event.player_id).scalar() or "Jugador Desconocido"
    log_msg = f"{event.event_type} - {player_name} (Min {event.minute})"
    db.add(AuditLog(match_id=event.match_id, user_id=user_id, action="EVENT_ADDED", details=log_msg))

    db.commit()
    db.refresh(db_event)
    return db_event

def delete_match_event(db: Session, event_id: int, user_id: int = None):
    db_event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not db_event:
        return False
        
    # Obtener nombre antes de borrar para el log
    player_name = db.query(Player.name).filter(Player.id == db_event.player_id).scalar() or "Jugador Desconocido"

    # Si es gol, restar marcador antes de borrar
    if db_event.event_type == "GOAL":
        match = db.query(Match).filter(Match.id == db_event.match_id).first()
        player = db.query(Player).filter(Player.id == db_event.player_id).first()
        
        if match and player:
            if player.team_id == match.home_team_id:
                match.home_score = max(0, match.home_score - 1)
            elif player.team_id == match.away_team_id:
                match.away_score = max(0, match.away_score - 1)
    
    # Registrar Auditoría
    log_msg = f"{db_event.event_type} ELIMINADO - {player_name}"
    db.add(AuditLog(match_id=db_event.match_id, user_id=user_id, action="EVENT_REMOVED", details=log_msg))

    db.delete(db_event)
    db.commit()
    return True

# --- Lectura ---
def get_match_days(db: Session):
    return db.query(MatchDay).order_by(MatchDay.start_date).all()

def get_clubs(db: Session):
    return db.query(Club).all()

def get_venues(db: Session):
    return db.query(Venue).all()

def get_teams_by_category(db: Session, category_id: int):
    return db.query(Team).filter(Team.category_id == category_id).all()

def get_matches_by_category(db: Session, category_id: int, series: str = None):
    query = db.query(Match).options(
        joinedload(Match.home_team).joinedload(Team.club),
        joinedload(Match.away_team).joinedload(Team.club),
        joinedload(Match.venue)
    ).filter(Match.category_id == category_id)
    
    if series:
        # Filtramos partidos donde el club local sea de la serie solicitada
        # (Como ya bloqueamos que no jueguen mezclados, basta con filtrar un equipo)
        query = query.join(Team, Match.home_team_id == Team.id).join(Club).filter(Club.league_series == series)
        
    return query.order_by(Match.match_date).all()

def get_upcoming_matches(db: Session, category_id: int = None):
    query = db.query(Match).filter(Match.is_played == False).options(
        joinedload(Match.home_team).joinedload(Team.club),
        joinedload(Match.away_team).joinedload(Team.club),
        joinedload(Match.home_team).joinedload(Team.category),
        joinedload(Match.venue)
    )
    if category_id:
        query = query.filter(Match.category_id == category_id)
    return query.order_by(Match.match_date).all()

def get_leaderboard(db: Session, category_id: int, series: str = "HONOR"):
    # Obtener equipos de la categoría filtrados por la serie del club
    teams = db.query(Team).join(Club).filter(
        Team.category_id == category_id,
        Club.league_series == series
    ).all()
    
    category = db.query(Category).filter(Category.id == category_id).first()
    
    leaderboard = []
    for team in teams:
        stats = {
            "club_id": team.club.id,
            "club_name": team.club.name,
            "logo_url": team.club.logo_url,
            "pj": 0, "pg": 0, "pe": 0, "pp": 0,
            "gf": 0, "gc": 0, "dg": 0, "pts": 0
        }
        
        # TABLA EN VIVO: Considerar partidos finalizados O partidos con goles (en progreso)
        matches = db.query(Match).filter(
            or_(Match.is_played == True, Match.home_score > 0, Match.away_score > 0),
            or_(Match.home_team_id == team.id, Match.away_team_id == team.id)
        ).all()
        
        for m in matches:
            stats["pj"] += 1
            if m.home_team_id == team.id:
                stats["gf"] += m.home_score
                stats["gc"] += m.away_score
                if m.home_score > m.away_score:
                    stats["pg"] += 1
                    stats["pts"] += category.points_win
                elif m.home_score == m.away_score:
                    stats["pe"] += 1
                    stats["pts"] += category.points_draw
                else:
                    stats["pp"] += 1
            else:
                stats["gf"] += m.away_score
                stats["gc"] += m.home_score
                if m.away_score > m.home_score:
                    stats["pg"] += 1
                    stats["pts"] += category.points_win
                elif m.away_score == m.home_score:
                    stats["pe"] += 1
                    stats["pts"] += category.points_draw
                else:
                    stats["pp"] += 1
        
        stats["dg"] = stats["gf"] - stats["gc"]
        leaderboard.append(stats)
    
    # Ordenar: Puntos desc, DG desc, GF desc
    return sorted(leaderboard, key=lambda x: (x["pts"], x["dg"], x["gf"]), reverse=True)

def get_aggregated_adultos_leaderboard(db: Session, series: str = "HONOR"):
    # Esta función suma los puntos de Primera, Segunda y Tercera Adulto
    # Filtrando por la serie del club (HONOR o ASCENSO)
    adult_categories = db.query(Category).filter(Category.parent_category == "Adultos").all()
    cat_ids = [c.id for c in adult_categories]
    
    # Filtrar Clubes por serie
    clubs = db.query(Club).filter(Club.league_series == series).all()
    leaderboard = []
    
    for club in clubs:
        stats = {
            "club_id": club.id,
            "club_name": club.name,
            "logo_url": club.logo_url,
            "pts": 0, "gf": 0, "gc": 0, "dg": 0, "pj": 0, "pg": 0, "pe": 0, "pp": 0
        }
        
        # Obtener todos los equipos de este club que pertenecen a categorías de Adultos
        teams = db.query(Team).filter(Team.club_id == club.id, Team.category_id.in_(cat_ids)).all()
        
        for team in teams:
            cat = next(c for c in adult_categories if c.id == team.category_id)
            # TABLA EN VIVO: Considerar partidos finalizados O partidos con goles (en progreso)
            matches = db.query(Match).filter(
                or_(Match.is_played == True, Match.home_score > 0, Match.away_score > 0),
                or_(Match.home_team_id == team.id, Match.away_team_id == team.id)
            ).all()
            
            for m in matches:
                stats["pj"] += 1
                if m.home_team_id == team.id:
                    stats["gf"] += m.home_score
                    stats["gc"] += m.away_score
                    if m.home_score > m.away_score: 
                        stats["pts"] += cat.points_win
                        stats["pg"] += 1
                    elif m.home_score == m.away_score: 
                        stats["pts"] += cat.points_draw
                        stats["pe"] += 1
                    else:
                        stats["pp"] += 1
                else:
                    stats["gf"] += m.away_score
                    stats["gc"] += m.home_score
                    if m.away_score > m.home_score: 
                        stats["pts"] += cat.points_win
                        stats["pg"] += 1
                    elif m.away_score == m.home_score: 
                        stats["pts"] += cat.points_draw
                        stats["pe"] += 1
                    else:
                        stats["pp"] += 1
        
        stats["dg"] = stats["gf"] - stats["gc"]
        leaderboard.append(stats)
        
    return sorted(leaderboard, key=lambda x: (x["pts"], x["dg"]), reverse=True)

def get_club_full_details(db: Session, club_id: int):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club:
        return None
        
    categories_data = []
    
    # Obtener todos los equipos de este club
    teams = db.query(Team).options(joinedload(Team.category), joinedload(Team.players)).filter(Team.club_id == club_id).all()
    
    for team in teams:
        if not team.category: continue
        
        # 1. Estadísticas básicas (Tabla)
        stats = {"pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0, "pts": 0}
        played_matches = db.query(Match).filter(
            Match.is_played == True,
            or_(Match.home_team_id == team.id, Match.away_team_id == team.id)
        ).order_by(Match.match_date.desc()).all()
        
        past_matches_summary = []
        for m in played_matches:
            stats["pj"] += 1
            is_home = m.home_team_id == team.id
            goals_for = m.home_score if is_home else m.away_score
            goals_against = m.away_score if is_home else m.home_score
            
            stats["gf"] += goals_for
            stats["gc"] += goals_against
            
            if goals_for > goals_against:
                stats["pg"] += 1
                stats["pts"] += team.category.points_win
            elif goals_for == goals_against:
                stats["pe"] += 1
                stats["pts"] += team.category.points_draw
            else:
                stats["pp"] += 1
                stats["pts"] += team.category.points_loss
                
            # Datos del rival para el historial
            opponent_id = m.away_team_id if is_home else m.home_team_id
            opponent = db.query(Team).options(joinedload(Team.club)).filter(Team.id == opponent_id).first()
            
            past_matches_summary.append({
                "id": m.id,
                "opponent_name": opponent.club.name if opponent else "Desconocido",
                "opponent_logo": opponent.club.logo_url if opponent else None,
                "home_score": m.home_score,
                "away_score": m.away_score,
                "is_home": is_home,
                "match_date": m.match_date,
                "is_played": True
            })

        # 2. Próximos partidos
        upcoming_matches_db = db.query(Match).filter(
            Match.is_played == False,
            or_(Match.home_team_id == team.id, Match.away_team_id == team.id)
        ).order_by(Match.match_date).all()
        
        upcoming_matches_summary = []
        for m in upcoming_matches_db:
            is_home = m.home_team_id == team.id
            opponent_id = m.away_team_id if is_home else m.home_team_id
            opponent = db.query(Team).options(joinedload(Team.club)).filter(Team.id == opponent_id).first()
            
            upcoming_matches_summary.append({
                "id": m.id,
                "opponent_name": opponent.club.name if opponent else "Desconocido",
                "opponent_logo": opponent.club.logo_url if opponent else None,
                "home_score": 0,
                "away_score": 0,
                "is_home": is_home,
                "match_date": m.match_date,
                "is_played": False
            })

        # 3. Estadísticas de Jugadores (PLANTEL COMPLETO)
        players_stats = []
        for player in team.players:
            goals = db.query(MatchEvent).filter(MatchEvent.player_id == player.id, MatchEvent.event_type == "GOAL").count()
            yellows = db.query(MatchEvent).filter(MatchEvent.player_id == player.id, MatchEvent.event_type == "YELLOW_CARD").count()
            reds = db.query(MatchEvent).filter(MatchEvent.player_id == player.id, MatchEvent.event_type == "RED_CARD").count()
            
            # Ahora agregamos a TODOS, tengan stats o no
            players_stats.append({
                "id": player.id,
                "name": player.name,
                "dni": player.dni, 
                "number": player.number,
                "birth_date": player.birth_date, # Agregado aquí
                "goals": goals,
                "yellow_cards": yellows,
                "red_cards": reds
            })
        
        # Ordenar: Primero por Goles, luego Alfabético
        players_stats.sort(key=lambda x: (x["goals"], x["name"]), reverse=True)

        categories_data.append({
            "category_name": team.category.name,
            "stats": stats,
            "players": players_stats,
            "past_matches": past_matches_summary,
            "upcoming_matches": upcoming_matches_summary
        })
        
    return {
        "id": club.id,
        "name": club.name,
        "logo_url": club.logo_url,
        "league_series": club.league_series,
        "categories": categories_data
    }

def bulk_create_players_from_excel(db: Session, team_id: int, df):
    # Normalizar nombres de columnas a minúsculas para búsqueda flexible
    df.columns = [str(c).strip().lower() for c in df.columns]
    
    created_count = 0
    updated_count = 0
    errors = []
    
    # Mapeo de columnas posibles
    col_nombre = next((c for c in df.columns if c in ['nombre', 'nombre completo', 'jugador', 'jugadores']), None)
    col_rut = next((c for c in df.columns if c in ['rut', 'dni', 'identificación', 'cedula']), None)
    col_numero = next((c for c in df.columns if c in ['numero', 'n°', 'camiseta', 'num', 'n']), None)
    col_nacimiento = next((c for c in df.columns if c in ['nacimiento', 'fecha nacimiento', 'fec_nac', 'fecha', 'f. nac']), None)

    if not col_nombre or not col_rut:
        return 0, 0, ["El Excel debe tener columnas llamadas 'Nombre' y 'RUT'."]

    for index, row in df.iterrows():
        try:
            name = str(row.get(col_nombre, '')).strip()
            dni = str(row.get(col_rut, '')).strip()
            # Limpiar RUT de puntos y guion para evitar duplicados por formato
            dni_clean = dni.replace('.', '').replace('-', '').upper()
            
            number = row.get(col_numero, None) if col_numero else None
            birth_date = row.get(col_nacimiento, None) if col_nacimiento else None
            
            if not name or name.lower() == 'nan' or not dni:
                continue
                
            # Parsear Fecha de Nacimiento
            birth_dt = None
            if pd.notna(birth_date):
                try:
                    dt = pd.to_datetime(birth_date, errors='coerce')
                    if pd.notna(dt):
                        birth_dt = dt.to_pydatetime()
                except:
                    birth_dt = None

            # Verificar si el RUT existe EN CUALQUIER LUGAR de la base de datos
            existing = db.query(Player).filter(Player.dni == dni_clean).first()
            
            if existing:
                # Actualizar datos y mover al equipo seleccionado
                existing.team_id = team_id
                existing.name = name
                if pd.notna(number): 
                    try: existing.number = int(float(number))
                    except: pass
                if birth_dt: existing.birth_date = birth_dt
                updated_count += 1
            else:
                # Crear nuevo
                num_val = None
                if pd.notna(number):
                    try: num_val = int(float(number))
                    except: num_val = None
                    
                new_player = Player(
                    team_id=team_id,
                    name=name,
                    dni=dni_clean,
                    number=num_val,
                    birth_date=birth_dt
                )
                db.add(new_player)
                created_count += 1
            
            # Commit por fila para asegurar que los errores se atrapen aquí
            db.commit()
                
        except Exception as e:
            db.rollback()
            errors.append(f"Fila {index+2} ({row.get(col_nombre, 'S/N')}): {str(e)}")
            
    return created_count, updated_count, errors

def get_top_scorers(db: Session, category_id: any, series: str = "HONOR"):
    # Base query: Unir Tablas
    query = db.query(
        Player.id,
        Player.name.label("player_name"),
        Club.name.label("club_name"),
        Club.logo_url.label("club_logo"),
        func.count(MatchEvent.id).label("total_goals")
    ).join(MatchEvent, Player.id == MatchEvent.player_id)\
     .join(Team, Player.team_id == Team.id)\
     .join(Club, Team.club_id == Club.id)\
     .filter(MatchEvent.event_type == "GOAL")\
     .filter(Club.league_series == series) # Filtro clave: HONOR o ASCENSO

    # Filtro de Categoría
    if str(category_id) == "adultos":
        # Buscar todas las categorías que sean 'Adultos'
        adult_categories = db.query(Category).filter(Category.parent_category == "Adultos").all()
        if adult_categories:
            cat_ids = [c.id for c in adult_categories]
            query = query.filter(Team.category_id.in_(cat_ids))
    else:
        # Categoría específica
        query = query.filter(Team.category_id == int(category_id))

    # Agrupar y Ordenar
    results = query.group_by(Player.id, Player.name, Club.name, Club.logo_url)\
                   .order_by(desc("total_goals"))\
                   .limit(20).all()
    
    return [
        {
            "player_id": r.id,
            "player_name": r.player_name,
            "club_name": r.club_name,
            "club_logo": r.club_logo,
            "goals": r.total_goals
        } for r in results
    ]

def get_team_players(db: Session, team_id: int):
    return db.query(Player).filter(Player.team_id == team_id).order_by(Player.name).all()

def update_player(db: Session, player_id: int, player_data: schemas.PlayerUpdate):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if db_player:
        if player_data.name is not None: db_player.name = player_data.name
        if player_data.number is not None: db_player.number = player_data.number
        if player_data.dni is not None: 
            # Limpiar RUT si viene sucio
            db_player.dni = player_data.dni.replace('.', '').replace('-', '').upper()
        if player_data.birth_date is not None: db_player.birth_date = player_data.birth_date
        
        db.commit()
        db.refresh(db_player)
    return db_player
