"""FOMO Trade Tracker — monitor de solo lectura.

Uso:  python3 run.py
Abre http://127.0.0.1:8787 en el navegador.

No ejecuta operaciones, no conecta wallets y no pide claves privadas:
solo lee datos públicos de las blockchains.
"""
from __future__ import annotations

import logging
import signal
import sys
import threading

from tracker.config import DB_PATH, HOST, PORT
from tracker.db import Database
from tracker.monitor import EventBus, Monitor
from tracker.server import serve


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    db = Database(DB_PATH)
    bus = EventBus()
    monitor = Monitor(db, bus)
    monitor.start()
    httpd = serve(HOST, PORT, db, bus, monitor)

    def shutdown(*_):
        # httpd.shutdown() bloquea si se llama desde el hilo de serve_forever():
        # se ejecuta en otro hilo para que el servidor se detenga limpiamente.
        monitor.stop()
        threading.Thread(target=httpd.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, shutdown)
    print(f"\n  FOMO Trade Tracker en marcha → http://{HOST}:{PORT}\n  Base de datos: {DB_PATH}\n  Ctrl+C para detener.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        monitor.stop()
        httpd.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
