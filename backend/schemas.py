from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# --- Club ---
class ClubBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    league_series: str = "HONOR"

class ClubCreate(ClubBase):
    pass

class Club(ClubBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Category ---
class CategoryBase(BaseModel):
    name: str
    parent_category: Optional[str] = None
    points_win: int = 3
    points_draw: int = 1
    points_loss: int = 0
    min_age: int = 0
    exception_min_age: int = 0
    max_exceptions: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Team ---
class TeamBase(BaseModel):
    club_id: int
    category_id: int

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    club: Club
    category: Optional[Category] = None
    model_config = ConfigDict(from_attributes=True)

# --- Venue ---
class VenueBase(BaseModel):
    name: str
    address: Optional[str] = None

class VenueCreate(VenueBase):
    pass

class Venue(VenueBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Player ---
class PlayerBase(BaseModel):
    team_id: int
    name: str
    number: Optional[int] = None
    dni: Optional[str] = None
    birth_date: Optional[datetime] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[int] = None
    dni: Optional[str] = None
    birth_date: Optional[datetime] = None

class Player(PlayerBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Match ---
class MatchBase(BaseModel):
    category_id: int
    home_team_id: int
    away_team_id: int
    venue_id: Optional[int] = None
    match_date: Optional[datetime] = None
    home_score: int = 0
    away_score: int = 0
    is_played: bool = False

class MatchCreate(MatchBase):
    pass

class MatchUpdate(BaseModel):
    home_team_id: int
    away_team_id: int
    venue_id: Optional[int] = None
    match_date: Optional[datetime] = None

class MatchUpdateResult(BaseModel):
    home_score: int
    away_score: int
    is_played: bool

class Match(MatchBase):
    id: int
    home_team: Team
    away_team: Team
    venue: Optional[Venue] = None
    model_config = ConfigDict(from_attributes=True)

# --- Match Events ---
class MatchEventBase(BaseModel):
    match_id: int
    player_id: int
    event_type: str # "GOAL", "YELLOW_CARD", "RED_CARD"
    minute: Optional[int] = None

class MatchEventCreate(MatchEventBase):
    pass

class MatchEvent(MatchEventBase):
    id: int
    player: Player
    model_config = ConfigDict(from_attributes=True)

# --- Match Day (Fecha) ---
class MatchDayBase(BaseModel):
    name: str
    start_date: datetime
    end_date: datetime

class MatchDayCreate(MatchDayBase):
    pass

class MatchDay(MatchDayBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Audit Log ---
class AuditLogBase(BaseModel):
    match_id: Optional[int] = None
    action: str
    details: str
    timestamp: datetime

class AuditLog(AuditLogBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- User & Auth ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Club Complex Details ---

class PlayerStats(BaseModel):
    id: int
    name: str
    goals: int
    yellow_cards: int
    red_cards: int

class MatchSummary(BaseModel):
    id: int
    opponent_name: str
    opponent_logo: Optional[str]
    home_score: int
    away_score: int
    is_home: bool # True si el club consultado jugó de local
    match_date: Optional[datetime]
    is_played: bool

class ClubCategoryStats(BaseModel):
    category_name: str
    stats: dict # {pj, pg, pe, pp, gf, gc, pts}
    players: List[PlayerStats]
    past_matches: List[MatchSummary]
    upcoming_matches: List[MatchSummary]

class ClubFullDetail(BaseModel):
    id: int
    name: str
    logo_url: Optional[str]
    categories: List[ClubCategoryStats]
