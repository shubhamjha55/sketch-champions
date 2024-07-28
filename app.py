# app.py
from flask import Flask, render_template
from socket_manager import init_socketio
from routes import drawing, rooms

app = Flask(__name__)
# app.config.from_object('config.Config')

# Initialize SocketIO
init_socketio(app)

# Register Blueprints
app.register_blueprint(drawing.bp)
app.register_blueprint(rooms.bp)

# Route to serve the homepage
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    from socket_manager import socketio
    socketio.run(app, debug=True)
