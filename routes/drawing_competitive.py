from flask import Blueprint, request
from flask_socketio import join_room, leave_room, emit, disconnect
from socket_manager import socketio
from utils.timer import start_timer, cancel_timer
from routes.rooms_competitive import rooms

bp = Blueprint('drawing_competitive', __name__)
rooms_draw_history = {}
user_room_map, user_name_map = {}, {}

@socketio.on('join_room_competitive')
def handle_join_room_event(data):
    room = data['room']
    user = data['user']

    # Map session ID to room and user
    user_room_map[request.sid] = room
    user_name_map[request.sid] = user
    
    join_room(room)
    if room not in rooms_draw_history:
        rooms_draw_history[room] = {}
    
    if user not in rooms_draw_history[room]:
        rooms_draw_history[room][user] = []
    
    emit('join_room_announcement_competitive', {'user': user}, room=room)
    # Send drawing history to the newly joined user
    emit('draw_history_competitive', {'roomHistory': rooms_draw_history[room]}, room=request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    room = get_user_room(request.sid)
    user = get_user_name(request.sid)
    if room and user:
        leave_room(room)
        # Update rooms data in rooms.py
        emit('leave_room_announcement_competitive', {'user': user}, room=room)
        # Implement logic to handle user removal in rooms.py
    if room in rooms and user in rooms[room]:
        rooms[room].remove(user)
    if room in rooms_draw_history and user in rooms_draw_history[room]:
        del rooms_draw_history[room][user]

def get_user_room(sid):
    return user_room_map.get(sid, None)

def get_user_name(sid):
    return user_name_map.get(sid, None)

@socketio.on('drawing_competitive')
def handle_drawing_event(data):
    room = data['room']
    user = data['user']
    drawing_data = data['drawing_data']
    if room not in rooms_draw_history:
        rooms_draw_history[room] = {}
    if user not in rooms_draw_history[room]:
        rooms_draw_history[room][user] = []
    rooms_draw_history[room][user].append(drawing_data)
    emit('drawing_competitive', {'user': user, 'drawing_data': drawing_data}, room=room)

@socketio.on('request_draw_history_competitive')
def handle_request_draw_history(data):
    room = data['room']
    sid = request.sid
    if room in rooms_draw_history:
        emit('draw_history_competitive', {'history': rooms_draw_history[room]}, room=sid)

@socketio.on('start_event_competitive')
def handle_start_event(data):
    room = data['room']
    duration = data['duration']  # duration in seconds
    start_timer(room, duration, end_event)
    emit('start_event_competitive', {'room': room, 'duration': duration}, room=room)

def end_event(room):
    emit('end_event_competitive', {'room': room}, room=room)
    # Logic to save drawings and determine the winner goes here
    # Clear the drawing history for the room
    if room in rooms_draw_history:
        del rooms_draw_history[room]

