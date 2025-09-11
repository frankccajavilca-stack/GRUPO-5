from django.db import models


class RoleHasPermission(models.Model):
    """
    Modelo para la relación muchos a muchos entre roles y permisos.
    Basado en la estructura de la tabla role_has_permissions de la BD.
    """
    
    permission = models.ForeignKey(
        'Permission',
        on_delete=models.CASCADE,
        verbose_name="Permiso"
    )
    role = models.ForeignKey(
        'Role',
        on_delete=models.CASCADE,
        verbose_name="Rol"
    )
    
    class Meta:
        db_table = 'role_has_permissions'
        verbose_name = "Rol tiene Permiso"
        verbose_name_plural = "Roles tienen Permisos"
        unique_together = ['permission', 'role']
    
    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"
