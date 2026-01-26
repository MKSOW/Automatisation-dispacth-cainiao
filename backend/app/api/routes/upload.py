"""Upload endpoints for parcel files."""
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.api.deps import get_db_session
from app.models.orm import User
from app.services.upload_service import upload_parcels, get_upload_stats

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/parcels")
async def upload_parcel_file(
    file: UploadFile = File(...),
    file_type: Literal['gofo', 'cainiao'] = Query(..., description="Type de fichier: 'gofo' ou 'cainiao'"),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin"))
):
    """
    Upload un fichier Excel contenant des colis.
    
    - **file**: Fichier Excel (.xlsx)
    - **file_type**: Type de fichier ('gofo' ou 'cainiao')
    
    Seuls les administrateurs peuvent uploader des fichiers.
    Les colis avec un tracking déjà existant sont ignorés (pas de doublons).
    """
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Format de fichier invalide. Utilisez un fichier Excel (.xlsx ou .xls)"
        )
    
    # Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur de lecture du fichier: {str(e)}")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide")
    
    # Process upload
    result = upload_parcels(db, content, file_type)
    
    if result.errors and result.inserted == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Échec de l'upload",
                "errors": result.errors
            }
        )
    
    return {
        "message": "Upload terminé",
        "file_type": file_type,
        "filename": file.filename,
        "total_rows": result.total_rows,
        "inserted": result.inserted,
        "duplicates": result.duplicates,
        "errors": result.errors if result.errors else None
    }


@router.get("/stats")
def get_parcel_stats(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin"))
):
    """
    Obtenir les statistiques des colis uploadés.
    
    Retourne le nombre total de colis, par source (GOFO/CAINIAO) et par statut.
    """
    stats = get_upload_stats(db)
    return stats


@router.delete("/parcels")
def clear_all_parcels(
    confirm: bool = Query(False, description="Confirmer la suppression"),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role("admin"))
):
    """
    Supprimer tous les colis de la base de données.
    
    **ATTENTION**: Cette action est irréversible.
    Passez `confirm=true` pour confirmer la suppression.
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Passez confirm=true pour confirmer la suppression de tous les colis"
        )
    
    from app.models.orm import Parcel
    deleted = db.query(Parcel).delete()
    db.commit()
    
    return {
        "message": "Tous les colis ont été supprimés",
        "deleted_count": deleted
    }
