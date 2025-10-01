#!/usr/bin/env python3
"""
simulate_rate_limits.py

Simula crear N citas seguidas y registra X-RateLimit-Remaining en consola.
Evita 429 con sleep simple (y backoff cuando se alcanza 0).
"""

import time
import random
from datetime import datetime, timedelta

# ---------- CONFIG ----------
TOTAL_REQUESTS = 10        # número de citas a "crear"
RATE_LIMIT = 7             # límite de la ventana (requests permitidos)
WINDOW_SECONDS = 30        # duración de la ventana en segundos (simulada)
BASE_SLEEP = 1.0           # sleep base entre requests (segundos)
JITTER_MAX = 0.25          # jitter añadido al sleep (segundos)
LOW_THRESHOLD = 2          # si remaining <= LOW_THRESHOLD, esperar extra
# ----------------------------

def now_ts():
    return int(time.time())

def human_time(ts=None):
    return datetime.fromtimestamp(ts or now_ts()).strftime("%H:%M:%S")

def jitter_sleep(seconds):
    j = random.random() * JITTER_MAX
    s = max(0, seconds + j)
    print(f"  ⏱  [sleep] esperando {s:.2f}s\n")
    time.sleep(s)

class FakeResponse:
    def __init__(self, status_code, headers, body=None):
        self.status_code = status_code
        self.headers = headers
        self._body = body or {}

    def json(self):
        return self._body

def fake_create_appointment(payload, counter, rate_limit_state):
    """
    Simula una llamada a la API que crea una cita.
    Devuelve (FakeResponse).
    rate_limit_state: dict con keys 'remaining' y 'window_reset_ts'
    """
    # Simular latencia de red
    time.sleep(random.uniform(0.05, 0.25))

    rem = rate_limit_state["remaining"]
    reset_ts = rate_limit_state["window_reset_ts"]

    headers = {
        "X-RateLimit-Limit": str(RATE_LIMIT),
        "X-RateLimit-Remaining": str(max(0, rem)),
        "X-RateLimit-Reset": str(reset_ts),
    }

    if rem <= 0:
        # Simular 429 con Retry-After (tiempo hasta reset)
        retry_after = max(1, reset_ts - now_ts())
        headers["Retry-After"] = str(retry_after)
        return FakeResponse(429, headers, {"error": "rate limit exceeded"})
    else:
        # Consumir 1 request
        rate_limit_state["remaining"] -= 1
        # Simular body con id
        body = {"appointment_id": f"fake-{int(time.time())}-{counter}"}
        return FakeResponse(201, headers, body)

def simulate(total_requests=TOTAL_REQUESTS):
    print("="*80)
    print("🏥 SIMULACIÓN DE RATE LIMIT - CREACIÓN MASIVA DE CITAS")
    print("="*80)
    print(f"  Fecha inicio: {human_time()}")
    print(f"  Requests a simular: {total_requests}")
    print(f"  Rate limit (ventana): {RATE_LIMIT} requests / {WINDOW_SECONDS}s")
    print("="*80 + "\n")

    # Estado de la ventana de rate limit
    rate_limit_state = {
        "remaining": RATE_LIMIT,
        "window_reset_ts": now_ts() + WINDOW_SECONDS
    }

    created = []
    stats = {"success": 0, "rate_limited": 0, "failed": 0}
    start_test = time.time()

    for i in range(1, total_requests + 1):
        print(f"--- Request simulada #{i}  ({human_time()}) ---")

        # Resetear ventana si corresponde
        if now_ts() >= rate_limit_state["window_reset_ts"]:
            rate_limit_state["remaining"] = RATE_LIMIT
            rate_limit_state["window_reset_ts"] = now_ts() + WINDOW_SECONDS
            print(f"\n🔄 Ventana reseteada -> Remaining={rate_limit_state['remaining']}/{RATE_LIMIT}\n")

        # Construir payload simulado (no se usa realmente)
        payload = {
            "paciente_nombre": f"Paciente Sim {i}",
            "start_time": (datetime.utcnow() + timedelta(hours=i)).isoformat() + "Z"
        }

        resp = fake_create_appointment(payload, i, rate_limit_state)

        # Imprimir info de rate limit
        limit = resp.headers.get("X-RateLimit-Limit", "N/A")
        remaining = resp.headers.get("X-RateLimit-Remaining", "N/A")
        reset = resp.headers.get("X-RateLimit-Reset", "N/A")

        status_icon = "✅" if resp.status_code == 201 else "⚠️"
        print(f"Status simulated: {status_icon} {resp.status_code}")
        print(f"  X-RateLimit-Limit:     {limit}")
        print(f"  X-RateLimit-Remaining: {remaining}")
        print(f"  X-RateLimit-Reset(ts): {reset}")

        if resp.status_code == 201:
            stats["success"] += 1
            created.append(resp.json().get("appointment_id"))
            # comportamiento defensivo: sleep dinámico según remaining
            try:
                rem_int = int(remaining)
            except Exception:
                rem_int = None

            if rem_int is not None and rem_int <= 0:
                # Aunque improbable aquí (porque 201 reduce rem afterwards), manejar seguridad
                wait = max(1, int(int(reset) - now_ts()))
                print(f"  ⚠️ remaining == 0 -> esperar {wait}s hasta reset")
                jitter_sleep(wait)
            elif rem_int is not None and rem_int <= LOW_THRESHOLD:
                print(f"  ⚠️ remaining bajo ({rem_int}) -> sleep extra 3s")
                jitter_sleep(3.0)
            else:
                jitter_sleep(BASE_SLEEP)
        elif resp.status_code == 429:
            stats["rate_limited"] += 1
            retry_after = resp.headers.get("Retry-After", "1")
            try:
                wait = float(retry_after)
            except Exception:
                wait = WINDOW_SECONDS
            print(f"  🔴 Simulado 429. Retry-After = {wait}s. Esperando al reset...")
            # esperar hasta reset (o el Retry-After), luego continuar (no contamos reintentos)
            time.sleep(wait + random.random()*0.2)
            # tras esperar, ventana se reiniciará en la próxima iteración por la comprobación al inicio
        else:
            stats["failed"] += 1
            print("  ❌ Simulación: fallo inesperado")

        print("")  # espacio visual entre requests

    total_time = time.time() - start_test
    print("\n" + "="*80)
    print("📈 RESUMEN DE SIMULACIÓN")
    print("="*80)
    print(f"  Tiempo total: {total_time:.2f}s")
    print(f"  Requests solicitados: {total_requests}")
    print(f"  Requests exitosos (201): {stats['success']}")
    print(f"  Rate-limited (429): {stats['rate_limited']}")
    print(f"  Otros fallos: {stats['failed']}")
    print(f"  IDs creados (simulados): {created}")
    print("="*80 + "\n")
    print("✅ Fin de la simulación. Practicas: respetar límites y usar throttling simple.")
    print()

if __name__ == "__main__":
    simulate()

 
