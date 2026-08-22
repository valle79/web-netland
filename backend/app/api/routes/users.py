from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles, get_current_user
from app.core.security import hash_password
from app.domain.models import RoleModel, User
from app.schemas.auth import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.from_user(user)


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def list_users(db: Session = Depends(get_db)):
    return [UserOut.from_user(u) for u in db.query(User).all()]


@router.post("", response_model=UserOut, status_code=201, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    role = db.query(RoleModel).filter(RoleModel.name == payload.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Rol inválido.")
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.put("/{user_id}", response_model=UserOut, dependencies=[Depends(require_roles("SUPER_ADMIN"))])
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        user.password_hash = hash_password(data.pop("password"))
    if "role" in data:
        role = db.query(RoleModel).filter(RoleModel.name == data["role"]).first()
        if not role:
            raise HTTPException(status_code=400, detail="Rol inválido.")
        user.role_id = role.id
        data.pop("role")
    for key, value in data.items():
        if value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles("SUPER_ADMIN")),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario.")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    db.delete(user)
    db.commit()