# appointments_status/models/appointment.py
#campo para guardar el ID de GHL
external_id = models.CharField(max_length=100, blank=True, null=True, verbose_name="ID externo en GHL")
