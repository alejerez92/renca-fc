from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional

# 1. Base / Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# 2. Usuarios
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config: from_attributes = True

# 3. Categorías
class CategoryBase(BaseModel):
    name: str
    parent_category: Optional[str] = None
    points_win: int = 3
    points_draw: int = 1
    points_loss: int = 0

class Category(CategoryBase):
    id: int
    class Config: from_attributes = True

# 4. Equipos
class TeamBase(BaseModel):
    club_id: int
    category_id: int

class Team(TeamBase):
    id: int
    category: Optional[Category] = None
    class Config: from_attributes = True

# 5. Clubes
class ClubBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    league_series: str = "HONOR"

class ClubCreate(ClubBase):
    pass

class Club(ClubBase):
    id: int
    teams: List[Team] = []
    class Config: from_attributes = True

# 6. Jugadores
class PlayerBase(BaseModel):
    name: str
    dni: str
    number: Optional[int] = None
    birth_date: Optional[date] = None
    team_id: int

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    dni: Optional[str] = None
    number: Optional[int] = None
    birth_date: Optional[date] = None

class Player(PlayerBase):
    id: int
    class Config: from_attributes = True

# 7. Recintos y Fechas
class Venue(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    class Config: from_attributes = True

class MatchDayBase(BaseModel):
    name: str
    start_date: date
    end_date: date

class MatchDayCreate(MatchDayBase):
    pass

class MatchDay(MatchDayBase):
    id: int
    class Config: from_attributes = True

# 8. Partidos
class MatchBase(BaseModel):
    category_id: int
    match_day_id: int
    home_team_id: int
    away_team_id: int
    venue_id: int
    match_date: datetime

class MatchCreate(MatchBase):
    pass

class MatchUpdateResult(BaseModel):
    home_score: int
    away_score: int
    is_played: bool

class Match(MatchBase):
    id: int
    home_score: int
    away_score: int
    is_played: bool
    home_team: Optional[Team] = None
    away_team: Optional[Team] = None
    venue: Optional[Venue] = None
    class Config: from_attributes = True

# 9. Eventos
class MatchEventBase(BaseModel):
    match_id: int
    player_id: int
    event_type: str
    minute: int

class MatchEventCreate(MatchEventBase):
    pass

class MatchEvent(MatchEventBase):
    id: int
    player: Player
    class Config: from_attributes = True

# 10. Auditoría (Simplificado)
class AuditLog(BaseModel):
    id: int
    action: str
    details: str
    timestamp: datetime
    user_id: Optional[int] = None
    user: Optional[User] = None
    class Config: from_attributes = True

# 11. Detalle Full Club
class ClubCategoryDetail(BaseModel):
    category_name: str
    stats: dict
    players: List[dict]
    past_matches: List[dict]
    upcoming_matches: List[dict]

class ClubFullDetail(BaseModel):
    id: int
    name: str
    logo_url: Optional[str] = None
    league_series: str
    categories: List[ClubCategoryDetail]
