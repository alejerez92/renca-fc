from database import SessionLocal
from models import Club

def update_club_logos():
    db = SessionLocal()
    print("--- Actualizando Logos con UI-Avatars (Indestructibles) ---")

    colors = ["6366f1", "ec4899", "8b5cf6", "10b981", "f59e0b", "ef4444", "06b6d4"]

    clubs = db.query(Club).all()
    for i, club in enumerate(clubs):
        # Tomar las iniciales (Ej: Defensor Renca -> DR)
        words = club.name.split()
        initials = "".join([w[0] for w in words[:2]]).upper()
        color = colors[i % len(colors)]
        
        # URL de UI Avatars: Fondo de color, letras blancas, redondeado
        club.logo_url = f"https://ui-avatars.com/api/?name={initials}&background={color}&color=fff&size=128&bold=true"
        print(f"   [+] Logo generado para: {club.name} ({initials})")

    db.commit()
    db.close()
    print("¡Logos actualizados con éxito!")

if __name__ == "__main__":
    update_club_logos()