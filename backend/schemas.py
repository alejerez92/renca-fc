from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import List, Optional

# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Usuarios ---
class UserBase(BaseModel):
    username: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Categorías ---
class CategoryBase(BaseModel):
    name: Optional[str] = None
    parent_category: Optional[str] = None
    points_win: Optional[int] = 3
    points_draw: Optional[int] = 1
    points_loss: Optional[int] = 0

class Category(CategoryBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Equipos ---
class TeamBase(BaseModel):
    club_id: Optional[int] = None
    category_id: Optional[int] = None

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: Optional[int] = None
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

# --- Clubes ---
class ClubBase(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    league_series: Optional[str] = "HONOR"

class ClubCreate(ClubBase):
    pass

class Club(ClubBase):
    id: Optional[int] = None
    teams: List[Team] = []
    model_config = ConfigDict(from_attributes=True)

# --- Jugadores ---
class PlayerBase(BaseModel):
    name: Optional[str] = None
    dni: Optional[str] = None
    number: Optional[int] = None
    birth_date: Optional[date] = None
    team_id: Optional[int] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    dni: Optional[str] = None
    number: Optional[int] = None
    birth_date: Optional[date] = None

class Player(PlayerBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Recintos y Fechas ---
class Venue(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    location: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MatchDayBase(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MatchDayCreate(MatchDayBase):
    pass

class MatchDay(MatchDayBase):
    id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- Partidos ---
class MatchBase(BaseModel):
    category_id: Optional[int] = None
    match_day_id: Optional[int] = None
    home_team_id: Optional[int] = None
    away_team_id: Optional[int] = None
    venue_id: Optional[int] = None
    match_date: Optional[datetime] = None

class MatchCreate(MatchBase):
    pass

class MatchUpdateResult(BaseModel):
    home_score: Optional[int] = 0
    away_score: Optional[int] = 0
    is_played: Optional[bool] = False

class Match(MatchBase):
    id: Optional[int] = None
    home_score: Optional[int] = 0
    away_score: Optional[int] = 0
    is_played: Optional[bool] = False
    home_team: Optional[Team] = None
    away_team: Optional[Team] = None
    venue: Optional[Venue] = None
    model_config = ConfigDict(from_attributes=True)

# --- Eventos ---
class MatchEventBase(BaseModel):
    match_id: Optional[int] = None
    player_id: Optional[int] = None
    event_type: Optional[str] = None
    minute: Optional[int] = 0

class MatchEventCreate(MatchEventBase):
    pass

class MatchEvent(MatchEventBase):
    id: Optional[int] = None
    player: Optional[Player] = None
    model_config = ConfigDict(from_attributes=True)

# --- Auditoría ---
class AuditLog(BaseModel):
    id: Optional[int] = None
    action: Optional[str] = None
    details: Optional[str] = None
    timestamp: Optional[datetime] = None
    user_id: Optional[int] = None
    user: Optional[User] = None
    model_config = ConfigDict(from_attributes=True)

# --- Detalle Full Club ---
class ClubCategoryDetail(BaseModel):
    category_name: Optional[str] = None
    stats: Optional[dict] = None
    players: List[dict] = []
    past_matches: List[dict] = []
    upcoming_matches: List[dict] = []

class ClubFullDetail(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    logo_url: Optional[str] = None
    league_series: Optional[str] = None
    categories: List[ClubCategoryDetail] = []
