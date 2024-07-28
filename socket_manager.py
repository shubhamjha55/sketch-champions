# socket_manager.py exists to remove cirular dependecy error 
from flask_socketio import SocketIO

socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app)
