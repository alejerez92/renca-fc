from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Club(Base):
    __tablename__ = "clubs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    league_series = Column(String, default="HONOR") # "HONOR" o "ASCENSO"
    teams = relationship("Team", back_populates="club")

class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    address = Column(String, nullable=True)
    matches = relationship("Match", back_populates="venue")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # Ej: Primera Infantil, Senior, Adulto 1ra
    parent_category = Column(String, nullable=True) # Ej: "Adultos" para agrupar
    points_win = Column(Integer, default=3)
    points_draw = Column(Integer, default=1)
    points_loss = Column(Integer, default=0)
    
    # Reglas de Edad
    min_age = Column(Integer, default=0) # Edad mínima requerida
    exception_min_age = Column(Integer, default=0) # Edad mínima para excepción
    max_exceptions = Column(Integer, default=0) # Cantidad máxima de excepciones permitidas
    
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
    number = Column(Integer, nullable=True)
    dni = Column(String, unique=True, nullable=True)
    birth_date = Column(DateTime, nullable=True)
    
    team = relationship("Team", back_populates="players")

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=True)
    
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    match_date = Column(DateTime, default=datetime.utcnow)
    is_played = Column(Boolean, default=False)
    
    events = relationship("MatchEvent", back_populates="match")
    venue = relationship("Venue", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])

class MatchEvent(Base):
    __tablename__ = "match_events"
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    event_type = Column(String) # "GOAL", "YELLOW_CARD", "RED_CARD"
    minute = Column(Integer, nullable=True)
    
    match = relationship("Match", back_populates="events")
    player = relationship("Player")

class MatchDay(Base):
    __tablename__ = "match_days"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # Ej: "Fecha 1"
    start_date = Column(DateTime)
    end_date = Column(DateTime)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey('matches.id'))
    action = Column(String) # "GOAL_ADDED", "GOAL_REMOVED", "MATCH_FINISHED", "MATCH_REOPENED"
    details = Column(String) # "Gol de Pepito (Min 25)"
    timestamp = Column(DateTime, default=datetime.utcnow)
