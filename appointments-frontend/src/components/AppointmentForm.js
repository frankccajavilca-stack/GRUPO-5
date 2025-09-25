import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaClock, FaStickyNote } from "react-icons/fa";

export default function AppointmentForm() {
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [pacienteEmail, setPacienteEmail] = useState("");
  const [pacienteTelefono, setPacienteTelefono] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [notas, setNotas] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [contactId, setContactId] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startTime) {
      setMensaje("Por favor ingresa la fecha y hora de inicio.");
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const payload = {
      paciente_nombre: pacienteNombre,
      paciente_email: pacienteEmail,
      paciente_telefono: pacienteTelefono,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      notas,
      calendarId,
      contactId,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/appointments/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      setMensaje("✅ Cita creada correctamente!");
      setPacienteNombre("");
      setPacienteEmail("");
      setPacienteTelefono("");
      setStartTime("");
      setDuration(60);
      setNotas("");
    } catch (error) {
      setMensaje(`❌ Error creando cita: ${error.message}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">📅 Crear Cita</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaUser className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Nombre del paciente"
            value={pacienteNombre}
            onChange={(e) => setPacienteNombre(e.target.value)}
            required
            className="w-full outline-none"
          />
        </div>

        <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaEnvelope className="text-gray-400 mr-2" />
          <input
            type="email"
            placeholder="Email del paciente"
            value={pacienteEmail}
            onChange={(e) => setPacienteEmail(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaPhone className="text-gray-400 mr-2" />
          <input
            type="tel"
            placeholder="Teléfono del paciente"
            value={pacienteTelefono}
            onChange={(e) => setPacienteTelefono(e.target.value)}
            className="w-full outline-none"
          />
        </div>

        <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaClock className="text-gray-400 mr-2" />
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full outline-none"
          />
        </div>

        <input
          type="number"
          placeholder="Duración en minutos"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          min="1"
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="flex items-start border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
          <FaStickyNote className="text-gray-400 mr-2 mt-1" />
          <textarea
            placeholder="Notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full outline-none resize-none"
          />
        </div>

        <input
          type="text"
          placeholder="Calendar ID"
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <input
          type="text"
          placeholder="Contact ID"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Crear Cita
        </button>
      </form>

      {mensaje && (
        <p className="mt-5 text-center text-red-500 font-medium">{mensaje}</p>
      )}
    </div>
  );
}
