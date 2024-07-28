const socket = io();
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let roomId = null;
let userId = null;
let canDraw = true;  // Variable to track if drawing is allowed

// Hide canvas initially
canvas.style.display = 'none';

// Set up event listeners for room creation and joining
document.getElementById('create-room').addEventListener('click', () => {
    roomId = prompt("Enter new room ID:");
    userId = prompt("Enter your name:");
    fetch('/create_room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room_id: roomId, user: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            joinRoom(roomId, userId);
        }
    });
});

document.getElementById('join-room').addEventListener('click', () => {
    roomId = prompt("Enter room ID:");
    userId = prompt("Enter your name:");
    fetch('/join_room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ room_id: roomId, user: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            joinRoom(roomId, data.userId);
        }
    });
});

function joinRoom(roomId, userId) {
    document.getElementById('controls').style.display = 'none';
    canvas.style.display = 'block';

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    socket.emit('join_room', { room: roomId, user: userId });

    // Handle drawing on the canvas
    canvas.addEventListener('mousedown', (event) => {
        if (!canDraw) return;
        drawing = true;
        const x = event.offsetX;
        const y = event.offsetY;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x, y);
        socket.emit('drawing', { room: roomId, user: userId, drawing_data: { x, y, pathStart: true } });
    });

    canvas.addEventListener('mouseup', () => {
        if (!canDraw) return;
        drawing = false;
        ctx.closePath(); // Close the path
        socket.emit('drawing', { room: roomId, user: userId, drawing_data: { pathEnd: true } });
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!drawing || !canDraw) return;
        const x = event.offsetX;
        const y = event.offsetY;
        ctx.lineTo(x, y);
        ctx.stroke();
        socket.emit('drawing', { room: roomId, user: userId, drawing_data: { x, y, pathStart: false } });
    });

    socket.on('drawing', (data) => {
        const { x, y, pathStart, pathEnd } = data.drawing_data;
        if (pathStart) {
            ctx.beginPath(); // Start a new path
            ctx.moveTo(x, y);
        } else if (pathEnd) {
            ctx.closePath(); // Close the path
        } else {
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    });

    socket.on('draw_history', (data) => {
        const history = data.history;
        history.forEach(draw => {
            const { x, y, pathStart, pathEnd } = draw;
            if (pathStart) {
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else if (pathEnd) {
                ctx.closePath();
            } else {
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        });
    });

    socket.on('join_room_announcement', (data) => {
        const userList = document.getElementById('user-list');
        userList.innerHTML += `<p>${data.user} joined the room</p>`;
    });

    socket.on('leave_room_announcement', (data) => {
        const userList = document.getElementById('user-list');
        userList.innerHTML += `<p>${data.user} left the room</p>`;
    });

    socket.emit('start_event', { room: roomId, duration: (60*60) });

    socket.on('start_event', (data) => {
        const roomInfo = document.getElementById('room-info');
        roomInfo.innerHTML = `<p>Event started! Duration: ${data.duration} seconds</p>`;
        canDraw = true;
    });

    socket.on('end_event', (data) => {
        drawing = false;
        canDraw = false;
        const roomInfo = document.getElementById('room-info');
        roomInfo.innerHTML = `<p>Event ended! Room: ${data.room}</p>`;
        alert("Time's up! Drawing has been disabled.");
    });

    socket.emit('request_draw_history', { room: roomId });

    // socket.on('disconnect', function(){
    //     socket.emit('leave_room', { room: roomId, user: userId });
    // });

    // socket.on('ic_leave', function(){
    //     socket.emit('leave_room', { room: roomId, user: userId });
    // });

    // window.addEventListener('beforeunload', (event) => {
    //     event.preventDefault();
    //     alert("Changes you made will be lost, are you sure?");
    //     socket.emit('leave_room', { room: roomId, user: userId });
    // });
}
