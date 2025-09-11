from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.appointment import AppointmentViewSet
from .views.appointment_status import AppointmentStatusViewSet
from .views.ticket import TicketViewSet

# Configuración del router
router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'appointment-statuses', AppointmentStatusViewSet, basename='appointment-status')
router.register(r'tickets', TicketViewSet, basename='ticket')

app_name = 'appointments_status'

urlpatterns = [
    # URLs del router para los ViewSets
    path('', include(router.urls)),
]
