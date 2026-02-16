from sqlalchemy.orm import Session
from database import SessionLocal
import models
import bcrypt

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_user():
    db = SessionLocal()
    try:
        # Borramos usuarios anteriores para limpiar el formato
        db.query(models.User).delete()
        
        users = [
            ("admin_renca", "renca2026"),
            ("aji_admin", "123456")
        ]
        
        for username, password in users:
            hashed_password = get_password_hash(password)
            db_user = models.User(username=username, hashed_password=hashed_password)
            db.add(db_user)
            print(f"Usuario '{username}' preparado.")
            
        db.commit()
        print("Usuarios creados exitosamente con nuevo formato bcrypt.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()
