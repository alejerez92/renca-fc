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
        if db_user.username == "admin_renca": return False
        db.delete(db_user)
        db.commit()
        return True
    return False

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit(); db.refresh(db_user)
    return db_user

# --- Players ---
def create_player(db: Session, player: schemas.PlayerCreate):
    try:
        dni_clean = player.dni.replace('.', '').replace('-', '').upper()
        existing = db.query(Player).filter(Player.dni == dni_clean).first()
        if existing: return None
        db_player = Player(team_id=player.team_id, name=player.name, dni=dni_clean, number=player.number, birth_date=player.birth_date)
        db.add(db_player)
        db.commit(); db.refresh(db_player)
        return db_player
    except: return None

# --- Creación ---
def create_match_day(db: Session, match_day: schemas.MatchDayCreate):
    db_match_day = MatchDay(**match_day.model_dump())
    db.add(db_match_day)
    db.commit(); db.refresh(db_match_day)
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
    db.commit(); db.refresh(db_club)
    return db_club

def update_club(db: Session, club_id: int, club_data: schemas.ClubCreate):
    db_club = db.query(Club).filter(Club.id == club_id).first()
    if db_club:
        db_club.name = club_data.name
        db_club.logo_url = club_data.logo_url
        db_club.league_series = club_data.league_series
        db.commit(); db.refresh(db_club)
    return db_club

def create_team(db: Session, team: schemas.TeamCreate):
    existing_team = db.query(Team).filter(Team.club_id == team.club_id, Team.category_id == team.category_id).first()
    if existing_team: return existing_team
    db_team = Team(**team.model_dump())
    db.add(db_team)
    db.commit(); db.refresh(db_team)
    return db_team

def create_match(db: Session, match: schemas.MatchCreate):
    db_match = Match(**match.model_dump())
    db.add(db_match)
    db.commit(); db.refresh(db_match)
    return db_match

def update_match_result(db: Session, match_id: int, result: schemas.MatchUpdateResult, user_id: int = None):
    db_match = db.query(Match).filter(Match.id == match_id).first()
    if db_match:
        db_match.home_score = result.home_score
        db_match.away_score = result.away_score
        db_match.is_played = result.is_played
        status_msg = "FINALIZADO" if result.is_played else "REABIERTO"
        db.add(AuditLog(match_id=match_id, user_id=user_id, action="STATUS", details=f"{status_msg} ({result.home_score}-{result.away_score})"))
        db.commit(); db.refresh(db_match)
    return db_match

# --- Auditoría ---
def get_audit_logs(db: Session, limit: int = 100):
    return db.query(AuditLog).options(joinedload(AuditLog.user)).order_by(AuditLog.timestamp.desc()).limit(limit).all()

def get_match_audit_logs(db: Session, match_id: int):
    return db.query(AuditLog).options(joinedload(AuditLog.user)).filter(AuditLog.match_id == match_id).order_by(AuditLog.timestamp.desc()).all()

# --- Eventos ---
def get_match_events(db: Session, match_id: int):
    return db.query(MatchEvent).options(joinedload(MatchEvent.player)).filter(MatchEvent.match_id == match_id).all()

def create_match_event(db: Session, event: schemas.MatchEventCreate, user_id: int = None):
    db_event = MatchEvent(**event.model_dump())
    db.add(db_event)
    if event.event_type == "GOAL":
        match = db.query(Match).filter(Match.id == event.match_id).first()
        player = db.query(Player).filter(Player.id == event.player_id).first()
        if match and player:
            if player.team_id == match.home_team_id: match.home_score += 1
            else: match.away_score += 1
    player_name = db.query(Player.name).filter(Player.id == event.player_id).scalar() or "Jugador"
    db.add(AuditLog(match_id=event.match_id, user_id=user_id, action="EVENT", details=f"{event.event_type} - {player_name} (Min {event.minute})"))
    db.commit(); db.refresh(db_event)
    return db_event

def delete_match_event(db: Session, event_id: int, user_id: int = None):
    db_event = db.query(MatchEvent).filter(MatchEvent.id == event_id).first()
    if not db_event: return False
    if db_event.event_type == "GOAL":
        match = db.query(Match).filter(Match.id == db_event.match_id).first()
        player = db.query(Player).filter(Player.id == db_event.player_id).first()
        if match and player:
            if player.team_id == match.home_team_id: match.home_score = max(0, match.home_score - 1)
            else: match.away_score = max(0, match.away_score - 1)
    db.add(AuditLog(match_id=db_event.match_id, user_id=user_id, action="DELETE_EVENT", details=f"ELIMINADO: {db_event.event_type}"))
    db.delete(db_event)
    db.commit()
    return True

# --- Consultas ---
def get_match_days(db: Session):
    return db.query(MatchDay).order_by(MatchDay.start_date).all()

def get_clubs(db: Session):
    return db.query(Club).options(joinedload(Club.teams).joinedload(Team.category)).all()

def get_venues(db: Session):
    return db.query(Venue).all()

def get_teams_by_category(db: Session, category_id: int):
    return db.query(Team).options(joinedload(Team.club)).filter(Team.category_id == category_id).all()

def get_matches_by_category(db: Session, category_id: int, series: str = None):
    cat = db.query(Category).filter(Category.id == category_id).first()
    query = db.query(Match).options(
        joinedload(Match.home_team).joinedload(Team.club), 
        joinedload(Match.away_team).joinedload(Team.club), 
        joinedload(Match.venue)
    ).filter(Match.category_id == category_id)
    if series and cat and cat.parent_category == "Adultos":
        query = query.join(Team, Match.home_team_id == Team.id).join(Club).filter(Club.league_series == series)
    return query.order_by(Match.match_date).all()

def get_match_players(db: Session, match_id: int):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match: return []
    return db.query(Player).filter(or_(Player.team_id == match.home_team_id, Player.team_id == match.away_team_id)).all()

def get_leaderboard(db: Session, category_id: int, series: str = "HONOR"):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat: return []
    query = db.query(Team).join(Club).filter(Team.category_id == category_id)
    if cat.parent_category == "Adultos":
        query = query.filter(Club.league_series == series)
    teams = query.all()
    leaderboard = []
    for team in teams:
        stats = {"club_id": team.club.id, "club_name": team.club.name, "logo_url": team.club.logo_url, "pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0, "dg": 0, "pts": 0}
        matches = db.query(Match).filter(or_(Match.is_played == True, Match.home_score > 0, Match.away_score > 0), or_(Match.home_team_id == team.id, Match.away_team_id == team.id)).all()
        for m in matches:
            stats["pj"] += 1
            is_home = m.home_team_id == team.id
            gf = m.home_score if is_home else m.away_score
            gc = m.away_score if is_home else m.home_score
            stats["gf"] += gf; stats["gc"] += gc
            if gf > gc: stats["pg"] += 1; stats["pts"] += cat.points_win
            elif gf == gc: stats["pe"] += 1; stats["pts"] += cat.points_draw
            else: stats["pp"] += 1
        stats["dg"] = stats["gf"] - stats["gc"]
        leaderboard.append(stats)
    return sorted(leaderboard, key=lambda x: (x["pts"], x["dg"]), reverse=True)

def get_aggregated_adultos_leaderboard(db: Session, series: str = "HONOR"):
    adult_cats = db.query(Category).filter(Category.parent_category == "Adultos").all()
    cat_ids = [c.id for c in adult_cats]
    clubs = db.query(Club).filter(Club.league_series == series).all()
    leaderboard = []
    for club in clubs:
        stats = {"club_id": club.id, "club_name": club.name, "logo_url": club.logo_url, "pts": 0, "dg": 0, "pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0}
        teams = db.query(Team).filter(Team.club_id == club.id, Team.category_id.in_(cat_ids)).all()
        for team in teams:
            try:
                cat = next(c for c in adult_cats if c.id == team.category_id)
                matches = db.query(Match).filter(or_(Match.is_played == True, Match.home_score > 0, Match.away_score > 0), or_(Match.home_team_id == team.id, Match.away_team_id == team.id)).all()
                for m in matches:
                    stats["pj"] += 1
                    is_home = m.home_team_id == team.id
                    gf = m.home_score if is_home else m.away_score
                    gc = m.away_score if is_home else m.home_score
                    stats["gf"] += gf; stats["gc"] += gc
                    if gf > gc: stats["pg"] += 1; stats["pts"] += cat.points_win
                    elif gf == gc: stats["pe"] += 1; stats["pts"] += cat.points_draw
                    else: stats["pp"] += 1
            except: continue
        stats["dg"] = stats["gf"] - stats["gc"]
        leaderboard.append(stats)
    return sorted(leaderboard, key=lambda x: (x["pts"], x["dg"]), reverse=True)

def get_club_full_details(db: Session, club_id: int):
    club = db.query(Club).filter(Club.id == club_id).first()
    if not club: return None
    categories_data = []
    teams = db.query(Team).options(joinedload(Team.category), joinedload(Team.players)).filter(Team.club_id == club_id).all()
    for team in teams:
        if not team.category: continue
        stats = {"pj": 0, "pg": 0, "pe": 0, "pp": 0, "gf": 0, "gc": 0, "pts": 0}
        all_matches = db.query(Match).filter(or_(Match.home_team_id == team.id, Match.away_team_id == team.id)).order_by(Match.match_date.desc()).all()
        past = []; upcoming = []
        for m in all_matches:
            try:
                is_home = m.home_team_id == team.id
                opponent = db.query(Team).options(joinedload(Team.club)).filter(Team.id == (m.away_team_id if is_home else m.home_team_id)).first()
                match_data = {"id": m.id, "opponent_name": opponent.club.name if opponent else "Rival", "home_score": m.home_score, "away_score": m.away_score, "match_date": m.match_date}
                if m.is_played or m.home_score > 0 or m.away_score > 0:
                    stats["pj"] += 1
                    gf = m.home_score if is_home else m.away_score
                    gc = m.away_score if is_home else m.home_score
                    stats["gf"] += gf; stats["gc"] += gc
                    if gf > gc: stats["pg"] += 1; stats["pts"] += team.category.points_win
                    elif gf == gc: stats["pe"] += 1; stats["pts"] += team.category.points_draw
                    else: stats["pp"] += 1
                    past.append(match_data)
                else: upcoming.append(match_data)
            except: continue
        players = [{"id": p.id, "name": p.name, "number": p.number, "goals": db.query(MatchEvent).filter(MatchEvent.player_id == p.id, MatchEvent.event_type == "GOAL").count(), "yellow_cards": db.query(MatchEvent).filter(MatchEvent.player_id == p.id, MatchEvent.event_type == "YELLOW_CARD").count(), "red_cards": db.query(MatchEvent).filter(MatchEvent.player_id == p.id, MatchEvent.event_type == "RED_CARD").count()} for p in team.players]
        categories_data.append({"category_name": team.category.name, "stats": stats, "players": players, "past_matches": past, "upcoming_matches": upcoming})
    return {"id": club.id, "name": club.name, "logo_url": club.logo_url, "league_series": club.league_series, "categories": categories_data}

def bulk_create_players_from_excel(db: Session, team_id: int, df):
    df.columns = [str(c).strip().lower() for c in df.columns]
    created = 0; updated = 0; errors = []
    col_nombre = next((c for c in df.columns if c in ['nombre', 'jugador']), None)
    col_rut = next((c for c in df.columns if c in ['rut', 'dni']), None)
    if not col_nombre or not col_rut: return 0, 0, ["Excel inválido."]
    for index, row in df.iterrows():
        try:
            name = str(row.get(col_nombre, '')).strip(); dni = str(row.get(col_rut, '')).strip()
            if not name or not dni: continue
            dni_clean = dni.replace('.', '').replace('-', '').upper()
            existing = db.query(Player).filter(Player.dni == dni_clean).first()
            if existing: existing.name = name; existing.team_id = team_id; updated += 1
            else: db.add(Player(team_id=team_id, name=name, dni=dni_clean)); created += 1
            db.commit()
        except: db.rollback(); continue
    return created, updated, errors

def get_top_scorers(db: Session, category_id: any, series: str = "HONOR"):
    query = db.query(Player.id, Player.name.label("player_name"), Club.name.label("club_name"), Club.logo_url.label("club_logo"), func.count(MatchEvent.id).label("total_goals")).join(MatchEvent, Player.id == MatchEvent.player_id).join(Team, Player.team_id == Team.id).join(Club, Team.club_id == Club.id).filter(MatchEvent.event_type == "GOAL")
    if str(category_id) == "adultos":
        cat_ids = [c.id for c in db.query(Category).filter(Category.parent_category == "Adultos").all()]
        query = query.filter(Team.category_id.in_(cat_ids)).filter(Club.league_series == series)
    else:
        try:
            cat = db.query(Category).filter(Category.id == int(category_id)).first()
            query = query.filter(Team.category_id == int(category_id))
            if cat and cat.parent_category == "Adultos": query = query.filter(Club.league_series == series)
        except: return []
    results = query.group_by(Player.id, Player.name, Club.name, Club.logo_url).order_by(desc("total_goals")).limit(20).all()
    return [{"player_id": r.id, "player_name": r.player_name, "club_name": r.club_name, "club_logo": r.club_logo, "goals": r.total_goals} for r in results]

def get_team_players(db: Session, team_id: int):
    return db.query(Player).filter(Player.team_id == team_id).order_by(Player.name).all()

def update_player(db: Session, player_id: int, player_data: schemas.PlayerUpdate):
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if db_player:
        if player_data.name: db_player.name = player_data.name
        if player_data.dni: db_player.dni = player_data.dni.replace('.', '').replace('-', '').upper()
        if player_data.number is not None: db_player.number = player_data.number
        db.commit(); db.refresh(db_player)
    return db_player
