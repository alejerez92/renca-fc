from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
import traceback
import models, schemas, crud
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
import io
import os

SECRET_KEY = os.getenv("SECRET_KEY", "renca-fc-secret-key-super-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

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

@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        print(f"ERROR DETECTADO EN {request.url.path}:")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain, hashed):
    try: return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except: return False

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username: raise HTTPException(status_code=401)
        user = crud.get_user_by_username(db, username=username)
        if not user: raise HTTPException(status_code=401)
        return user
    except: raise HTTPException(status_code=401)

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"access_token": jwt.encode({"sub": user.username, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)}, SECRET_KEY, algorithm=ALGORITHM), "token_type": "bearer"}

# --- Públicas ---
@app.get("/clubs", response_model=List[schemas.Club])
def read_clubs(db: Session = Depends(get_db)):
    return crud.get_clubs(db)

@app.get("/clubs/{club_id}/details", response_model=schemas.ClubFullDetail)
def read_club_details(club_id: int, db: Session = Depends(get_db)):
    return crud.get_club_full_details(db, club_id)

@app.get("/categories", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/teams/{category_id}", response_model=List[schemas.Team])
def read_teams(category_id: int, db: Session = Depends(get_db)):
    return crud.get_teams_by_category(db, category_id)

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
    logs = crud.get_match_audit_logs(db, match_id)
    return [{"id": l.id, "timestamp": l.timestamp, "user": {"username": l.user.username if l.user else "Sistema"}, "action": l.action, "details": l.details} for l in logs]

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

@app.get("/match-days", response_model=List[schemas.MatchDay])
def read_match_days(db: Session = Depends(get_db)):
    return crud.get_match_days(db)

# --- Privadas ---
@app.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_users(db)

@app.get("/teams/{team_id}/players", response_model=List[schemas.Player])
def read_team_players(team_id: int, db: Session = Depends(get_db)):
    return crud.get_team_players(db, team_id)

@app.post("/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != "admin_renca": raise HTTPException(status_code=403)
    return crud.create_user(db, user, get_password_hash(user.password))

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.username != "admin_renca": raise HTTPException(status_code=403)
    if crud.delete_user(db, user_id): return {"ok": True}
    raise HTTPException(status_code=400)

@app.post("/clubs", response_model=schemas.Club)
def create_club(club: schemas.ClubCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_club(db, club)

@app.put("/clubs/{club_id}", response_model=schemas.Club)
def update_club(club_id: int, club: schemas.ClubCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.update_club(db, club_id, club)

@app.post("/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_team(db, team)

@app.post("/players", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    p = crud.create_player(db, player)
    if not p: raise HTTPException(status_code=400, detail="Error al crear jugador")
    return p

@app.post("/matches", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_match(db, match)

@app.put("/matches/{match_id}/result", response_model=schemas.Match)
def update_result(match_id: int, result: schemas.MatchUpdateResult, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    m = db.query(models.Match).filter(models.Match.id == match_id).first()
    if m and m.is_played and current_user.username != "admin_renca": raise HTTPException(status_code=403)
    return crud.update_match_result(db, match_id, result, user_id=current_user.id)

@app.post("/match-events", response_model=schemas.MatchEvent)
def create_event(event: schemas.MatchEventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    m = db.query(models.Match).filter(models.Match.id == event.match_id).first()
    if m and m.is_played and current_user.username != "admin_renca": raise HTTPException(status_code=403)
    return crud.create_match_event(db, event, user_id=current_user.id)

@app.delete("/match-events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    e = db.query(models.MatchEvent).filter(models.MatchEvent.id == event_id).first()
    if e:
        m = db.query(models.Match).filter(models.Match.id == e.match_id).first()
        if m and m.is_played and current_user.username != "admin_renca": raise HTTPException(status_code=403)
    if crud.delete_match_event(db, event_id, user_id=current_user.id): return {"ok": True}
    raise HTTPException(status_code=404)

@app.post("/match-days", response_model=schemas.MatchDay)
def create_day(day: schemas.MatchDayCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_match_day(db, day)

@app.delete("/match-days/{id}")
def delete_day(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if crud.delete_match_day(db, id): return {"ok": True}
    raise HTTPException(status_code=404)

@app.get("/audit-logs")
def read_audit_logs(limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    logs = crud.get_audit_logs(db, limit)
    res = []
    for l in logs:
        info = "N/A"
        try:
            if l.match: info = f"{l.match.home_team.club.name} vs {l.match.away_team.club.name}"
        except: pass
        res.append({"id": l.id, "action": l.action, "details": l.details, "timestamp": l.timestamp, "user_name": l.user.username if l.user else "Sistema", "match_info": info})
    return res

@app.post("/players/upload")
async def upload_players(team_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    df = pd.read_excel(io.BytesIO(await file.read()))
    created, updated, errors = crud.bulk_create_players_from_excel(db, team_id, df)
    return {"created": created, "updated": updated, "errors": errors}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
