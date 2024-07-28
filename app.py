# app.py
from flask import Flask, render_template
from socket_manager import init_socketio
from routes import drawing_collaborative, rooms_collaborative, drawing_competitive, rooms_competitive

app = Flask(__name__)
# app.config.from_object('config.Config')

# Initialize SocketIO
init_socketio(app)

# Register Blueprints
app.register_blueprint(drawing_collaborative.bp)
app.register_blueprint(rooms_collaborative.bp)

app.register_blueprint(drawing_competitive.bp)
app.register_blueprint(rooms_competitive.bp)

# Route to serve the homepage
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    from socket_manager import socketio
    socketio.run(app, debug=True)
