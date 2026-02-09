from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
import models, schemas, crud
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import io

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Rutas ---

@app.get("/clubs", response_model=List[schemas.Club])
def read_clubs(db: Session = Depends(get_db)):
    return crud.get_clubs(db)

@app.post("/clubs", response_model=schemas.Club)
def create_club(club: schemas.ClubCreate, db: Session = Depends(get_db)):
    return crud.create_club(db, club)

@app.put("/clubs/{club_id}", response_model=schemas.Club)
def update_club(club_id: int, club: schemas.ClubCreate, db: Session = Depends(get_db)):
    return crud.update_club(db, club_id, club)

@app.get("/clubs/{club_id}/details", response_model=schemas.ClubFullDetail)
def read_club_details(club_id: int, db: Session = Depends(get_db)):
    details = crud.get_club_full_details(db, club_id)
    if not details:
        raise HTTPException(status_code=404, detail="Club no encontrado")
    return details

@app.get("/categories", response_model=List[schemas.Category])
def read_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.post("/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    return crud.create_team(db, team)

@app.get("/teams/{category_id}", response_model=List[schemas.Team])
def read_teams(category_id: int, db: Session = Depends(get_db)):
    return crud.get_teams_by_category(db, category_id)

@app.get("/teams/{team_id}/players", response_model=List[schemas.Player])
def read_team_players(team_id: int, db: Session = Depends(get_db)):
    return crud.get_team_players(db, team_id)

@app.put("/players/{player_id}", response_model=schemas.Player)
def update_player(player_id: int, player: schemas.PlayerUpdate, db: Session = Depends(get_db)):
    db_player = crud.update_player(db, player_id, player)
    if not db_player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return db_player

@app.delete("/players/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    db.delete(player)
    db.commit()
    return {"message": "Jugador eliminado"}

@app.post("/matches", response_model=schemas.Match)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    db_match = crud.create_match(db, match)
    if db_match is None:
        raise HTTPException(status_code=400, detail="Este partido ya está programado para esta fecha y categoría.")
    return db_match

@app.get("/matches/{category_id}", response_model=List[schemas.Match])
def read_matches(category_id: int, series: str = None, db: Session = Depends(get_db)):
    return crud.get_matches_by_category(db, category_id, series)

@app.put("/matches/{match_id}", response_model=schemas.Match)
def update_match(match_id: int, match: schemas.MatchUpdate, db: Session = Depends(get_db)):
    return crud.update_match_details(db, match_id, match)

@app.delete("/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    if crud.delete_match(db, match_id):
        return {"message": "Partido eliminado"}
    raise HTTPException(status_code=404, detail="Partido no encontrado")

@app.put("/matches/{match_id}/result", response_model=schemas.Match)
def update_match_result(match_id: int, result: schemas.MatchUpdateResult, db: Session = Depends(get_db)):
    return crud.update_match_result(db, match_id, result)

@app.get("/matches/{match_id}/players", response_model=List[schemas.Player])
def read_match_players(match_id: int, db: Session = Depends(get_db)):
    return crud.get_match_players(db, match_id)

@app.get("/matches/{match_id}/events", response_model=List[schemas.MatchEvent])
def read_match_events(match_id: int, db: Session = Depends(get_db)):
    return crud.get_match_events(db, match_id)

@app.get("/top-scorers/{category_id}")
def read_top_scorers(category_id: str, series: str = "HONOR", db: Session = Depends(get_db)):
    return crud.get_top_scorers(db, category_id, series)

@app.post("/match-events", response_model=schemas.MatchEvent)
def create_match_event(event: schemas.MatchEventCreate, db: Session = Depends(get_db)):
    return crud.create_match_event(db, event)

@app.delete("/match-events/{event_id}")
def delete_match_event(event_id: int, db: Session = Depends(get_db)):
    if crud.delete_match_event(db, event_id):
        return {"message": "Evento eliminado"}
    raise HTTPException(status_code=404, detail="Evento no encontrado")

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

@app.post("/match-days")
def create_match_day(match_day: schemas.MatchDayCreate, db: Session = Depends(get_db)):
    return crud.create_match_day(db, match_day)

@app.delete("/match-days/{match_day_id}")
def delete_match_day(match_day_id: int, db: Session = Depends(get_db)):
    if crud.delete_match_day(db, match_day_id):
        return {"message": "Fecha eliminada"}
    raise HTTPException(status_code=404, detail="Fecha no encontrada")

@app.get("/audit-logs")
def read_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx, .xls)")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas mínimas (flexible con mayúsculas/minúsculas)
        df.columns = [c.strip() for c in df.columns] # Limpiar espacios
        
        if 'Nombre' not in df.columns or 'RUT' not in df.columns:
             # Si no están exactas, intentaremos normalizarlas en el CRUD, 
             # pero por ahora validamos que existan tras una limpieza básica
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
