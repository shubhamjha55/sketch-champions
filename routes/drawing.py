from flask import Blueprint, request
from flask_socketio import join_room, leave_room, emit, disconnect
from socket_manager import socketio
from utils.timer import start_timer, cancel_timer
from routes.rooms import rooms

bp = Blueprint('drawing_collaborative', __name__)
rooms_draw_history = {}
user_room_map, user_name_map = {}, {}

@socketio.on('join_room_collaborative')
def handle_join_room_event(data):
    room = data['room']
    user = data['user']

    # Map session ID to room and user
    user_room_map[request.sid] = room
    user_name_map[request.sid] = user
    
    join_room(room)
    if room not in rooms_draw_history:
        rooms_draw_history[room] = []
    
    emit('join_room_announcement_collaborative', {'user': user}, room=room)
    # Send drawing history to the newly joined user
    emit('draw_history_collaborative', {'history': rooms_draw_history[room]}, room=request.sid)

# Could not find a way in cliend side side code to emit this before disconnecting
# @socketio.on('leave_room_collaborative')
# def handle_leave_room_event(data):
#     room = data['room']
#     user = data['user']

#     leave_room(room)
#     emit('leave_room_announcement_collaborative', {'user': user}, room=room)
#     # Update rooms data in rooms.py
#     leave_room_request(room, user)

@socketio.on('disconnect')
def handle_disconnect():
    room = get_user_room(request.sid)
    user = get_user_name(request.sid)
    if room and user:
        leave_room(room)
        emit('leave_room_announcement_collaborative', {'user': user}, room=room)
        # Update rooms data in rooms.py
        #leave_room_request(room, user)

def get_user_room(sid):
    return user_room_map.get(sid, None)

def get_user_name(sid):
    return user_name_map.get(sid, None)

@socketio.on('drawing_collaborative')
def handle_drawing_event(data):
    room = data['room']
    drawing_data = data['drawing_data']
    if room not in rooms_draw_history:
        rooms_draw_history[room] = []
    rooms_draw_history[room].append(drawing_data)
    emit('drawing_collaborative', {'user': data['user'], 'drawing_data': drawing_data}, room=room)

@socketio.on('request_draw_history_collaborative')
def handle_request_draw_history(data):
    room = data['room']
    sid = request.sid
    if room in rooms_draw_history:
        emit('draw_history_collaborative', {'history': rooms_draw_history[room]}, room=sid)

@socketio.on('start_event_collaborative')
def handle_start_event(data):
    room = data['room']
    duration = data['duration']  # duration in seconds
    start_timer(room, duration, end_event)
    emit('start_event_collaborative', {'room': room, 'duration': duration}, room=room)

def end_event(room):
    emit('end_event_collaborative', {'room': room}, room=room)
    # Logic to save drawings and determine the winner goes here
    # Clear the drawing history for the room
    if room in rooms_draw_history:
        del rooms_draw_history[room]

def leave_room_request(room, user):
    # Implement logic to handle user removal in rooms.py
    if room in rooms and user in rooms[room]:
        rooms[room].remove(user)