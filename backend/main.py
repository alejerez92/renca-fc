from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import models, schemas, crud
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import io
import os

# Configuración de Seguridad
SECRET_KEY = "renca-fc-secret-key-super-secure" # En producción usar variable de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 semana

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Utilidades de Auth ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# --- Rutas de Auth ---

@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint temporal para crear el primer usuario (borrar o proteger después)
@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    return crud.create_user(db=db, user=user, hashed_password=get_password_hash(user.password))

# --- Rutas Públicas ---

@app.get("/clubs", response_model=List[schemas.Club])
def read_clubs(db: Session = Depends(get_db)):
    return crud.get_clubs(db)

@app.get("/clubs/{club_id}/details", response_model=schemas.ClubFullDetail)
def read_club_details(club_id: int, db: Session = Depends(get_db)):
    details = crud.get_club_full_details(db, club_id)
    if not details:
        raise HTTPException(status_code=404, detail="Club no encontrado")
    return details

@app.get("/categories", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/teams/{category_id}", response_model=List[schemas.Team])
def read_teams(category_id: int, db: Session = Depends(get_db)):
    return crud.get_teams_by_category(db, category_id)

@app.get("/teams/{team_id}/players", response_model=List[schemas.Player])
def read_team_players(team_id: int, db: Session = Depends(get_db)):
    return crud.get_team_players(db, team_id)

@app.get("/matches/{category_id}", response_model=List[schemas.Match])
def read_matches(category_id: int, series: str = None, db: Session = Depends(get_db)):
    return crud.get_matches_by_category(db, category_id, series)

@app.get("/matches/{match_id}/players", response_model=List[schemas.Player])
def read_match_players(match_id: int, db: Session = Depends(get_db)):
    return crud.get_match_players(db, match_id)

@app.get("/matches/{match_id}/events", response_model=List[schemas.MatchEvent])
def read_match_events(match_id: int, db: Session = Depends(get_db)):
    return crud.get_match_events(db, match_id)

@app.get("/matches/{match_id}/audit")
def read_match_audit(match_id: int, db: Session = Depends(get_db)):
    return crud.get_match_audit_logs(db, match_id)

@app.get("/top-scorers/{category_id}")
def read_top_scorers(category_id: str, series: str = "HONOR", db: Session = Depends(get_db)):
    return crud.get_top_scorers(db, category_id, series)

@app.get("/leaderboard/{category_id}")
def get_leaderboard(category_id: int, series: str = "HONOR", db: Session = Depends(get_db)):
    return crud.get_leaderboard(db, category_id, series)

@app.get("/leaderboard/aggregated/adultos")
def get_adultos_leaderboard(series: str = "HONOR", db: Session = Depends(get_db)):
    return crud.get_aggregated_adultos_leaderboard(db, series)

@app.get("/venues", response_model=List[schemas.Venue])
def read_venues(db: Session = Depends(get_db)):
    return crud.get_venues(db)

@app.get("/match-days")
def read_match_days(db: Session = Depends(get_db)):
    return crud.get_match_days(db)

# --- Rutas Protegidas (Requieren Login) ---

@app.post("/clubs", response_model=schemas.Club)
def create_club(club: schemas.ClubCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_club(db, club)

@app.put("/clubs/{club_id}", response_model=schemas.Club)
def update_club(club_id: int, club: schemas.ClubCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_club(db, club_id, club)

@app.post("/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_team(db, team)

@app.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.delete_team(db, team_id):
        return {"message": "Equipo eliminado correctamente"}
    raise HTTPException(status_code=404, detail="Equipo no encontrado")

@app.put("/players/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player: schemas.PlayerUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_player = crud.update_player(db, player_id, player)
    if not db_player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return db_player

@app.delete("/players/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    db.delete(player)
    db.commit()
    return {"message": "Jugador eliminado"}

@app.post("/matches", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_match = crud.create_match(db, match)
    if db_match is None:
        raise HTTPException(status_code=400, detail="Este partido ya está programado para esta fecha y categoría.")
    return db_match

@app.put("/matches/{match_id}", response_model=schemas.Match)
def update_match(match_id: int, match: schemas.MatchUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_match_details(db, match_id, match)

@app.delete("/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.delete_match(db, match_id):
        return {"message": "Partido eliminado"}
    raise HTTPException(status_code=404, detail="Partido no encontrado")

@app.put("/matches/{match_id}/result", response_model=schemas.Match)
def update_match_result(match_id: int, result: schemas.MatchUpdateResult, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_match_result(db, match_id, result)

@app.post("/match-events", response_model=schemas.MatchEvent)
def create_match_event(event: schemas.MatchEventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_match_event(db, event)

@app.delete("/match-events/{event_id}")
def delete_match_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.delete_match_event(db, event_id):
        return {"message": "Evento eliminado"}
    raise HTTPException(status_code=404, detail="Evento no encontrado")

@app.post("/match-days")
def create_match_day(match_day: schemas.MatchDayCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_match_day(db, match_day)

@app.delete("/match-days/{match_day_id}")
def delete_match_day(match_day_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.delete_match_day(db, match_day_id):
        return {"message": "Fecha eliminada"}
    raise HTTPException(status_code=404, detail="Fecha no encontrada")

@app.get("/audit-logs")
def read_audit_logs(limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = crud.get_audit_logs(db, limit)
    result = []
    for log in logs:
        match_info = "N/A"
        if log.match:
            m = db.query(models.Match).options(
                joinedload(models.Match.home_team).joinedload(models.Team.club),
                joinedload(models.Match.away_team).joinedload(models.Team.club)
            ).filter(models.Match.id == log.match_id).first()
            if m:
                match_info = f"{m.home_team.club.name} vs {m.away_team.club.name}"
        
        result.append({
            "id": log.id,
            "match_info": match_info,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        })
    return result

@app.post("/players/upload")
async def upload_players(
    team_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx, .xls)")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas mínimas (flexible con mayúsculas/minúsculas)
        df.columns = [c.strip() for c in df.columns] # Limpiar espacios
        
        if 'Nombre' not in df.columns or 'RUT' not in df.columns:
             pass
             
        created, updated, errors = crud.bulk_create_players_from_excel(db, team_id, df)
        
        return {
            "message": "Proceso completado",
            "created_count": created,
            "updated_count": updated,
            "errors": errors
        }
        
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
