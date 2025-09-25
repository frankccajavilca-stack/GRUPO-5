from django.urls import path
from .views import AppointmentCreateView

urlpatterns = [
    path('api/appointments/', AppointmentCreateView.as_view(), name='create-appointment'),
]
