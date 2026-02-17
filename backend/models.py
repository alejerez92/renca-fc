from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Date, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    audit_logs = relationship("AuditLog", back_populates="user")

class Club(Base):
    __tablename__ = "clubs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    league_series = Column(String, default="HONOR")
    teams = relationship("Team", back_populates="club")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    parent_category = Column(String, nullable=True)
    points_win = Column(Integer, default=3)
    points_draw = Column(Integer, default=1)
    points_loss = Column(Integer, default=0)
    teams = relationship("Team", back_populates="category")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(Integer, ForeignKey("clubs.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    club = relationship("Club", back_populates="teams")
    category = relationship("Category", back_populates="teams")
    players = relationship("Player", back_populates="team")

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    name = Column(String)
    dni = Column(String, unique=True, index=True)
    number = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    team = relationship("Team", back_populates="players")

class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    location = Column(String, nullable=True)

class MatchDay(Base):
    __tablename__ = "match_days"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    match_day_id = Column(Integer, ForeignKey("match_days.id"))
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    venue_id = Column(Integer, ForeignKey("venues.id"))
    match_date = Column(DateTime)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    is_played = Column(Boolean, default=False)
    
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    venue = relationship("Venue")
    audit_logs = relationship("AuditLog", back_populates="match")
    match_events = relationship("MatchEvent", back_populates="match")

class MatchEvent(Base):
    __tablename__ = "match_events"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    event_type = Column(String)
    minute = Column(Integer, default=0)
    match = relationship("Match", back_populates="match_events")
    player = relationship("Player")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="audit_logs")
    match = relationship("Match", back_populates="audit_logs")
