from flask import Blueprint, request, jsonify
import random


bp = Blueprint('rooms_collaborative', __name__)

rooms = {}

@bp.route('/create_room_collaborative', methods=['POST'])
def create_room():
    room_id = request.json.get('room_id')
    user = request.json.get('user')
    if room_id in rooms:
        # Update it later to a code that user automatically joins and a room code is generated
        return jsonify({'error': 'Room already exists, Please join the room'}), 400
    rooms[room_id] = [user]
    return jsonify({'message': f'Room {room_id} created successfully'})

@bp.route('/join_room_collaborative', methods=['POST'])
def join_room():
    room_id = request.json.get('room_id')
    user = request.json.get('user')
    if room_id in rooms:
        user_names = [u for u in rooms[room_id]]
        while user in user_names:
            user = user + str(random.randint(0,255))
        rooms[room_id].append(user)
        return jsonify({'message': f'User {user} joined room {room_id}', 'userId': user})
    return jsonify({'error': 'Room not found, Enter a valid Room Id'}), 404

# @bp.route('/leave_room_collaborative', methods=['POST'])
# def leave_room():
#     room_id = request.json.get('room_id')
#     user = request.json.get('user')
#     if room_id in rooms and user in rooms[room_id]:
#         rooms[room_id].remove(user)
#         return jsonify({'message': f'User {user} left room {room_id}'})
#     return jsonify({'error': 'Room not found or user not in room'}), 404
