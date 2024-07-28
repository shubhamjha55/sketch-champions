const socket = io();
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let roomId = null;
let userId = null;
let canDraw = true;  // Variable to track if drawing is allowed
const userCanvases = {}; // Object to store contexts of user canvases

// Hide canvas initially
canvas.style.display = 'none';

// Set up event listeners for room creation and joining
document.getElementById('create-room').addEventListener('click', () => {
    roomId = prompt("Enter new room ID:");
    userId = prompt("Enter your name:");
    fetch('/create_room_competitive', {
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
    fetch('/join_room_competitive', {
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

    socket.emit('join_room_competitive', { room: roomId, user: userId });

    // Handle drawing on the canvas
    canvas.addEventListener('mousedown', (event) => {
        if (!canDraw) return;
        drawing = true;
        const x = event.offsetX;
        const y = event.offsetY;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x, y);
        socket.emit('drawing_competitive', { room: roomId, user: userId, drawing_data: { x, y, pathStart: true } });
    });

    canvas.addEventListener('mouseup', () => {
        if (!canDraw) return;
        drawing = false;
        ctx.closePath(); // Close the path
        socket.emit('drawing_competitive', { room: roomId, user: userId, drawing_data: { pathEnd: true } });
    });

    canvas.addEventListener('mousemove', (event) => {
        if (!drawing || !canDraw) return;
        const x = event.offsetX;
        const y = event.offsetY;
        ctx.lineTo(x, y);
        ctx.stroke();
        socket.emit('drawing_competitive', { room: roomId, user: userId, drawing_data: { x, y, pathStart: false } });
    });

    socket.on('drawing_competitive', (data) => {
        const { user, drawing_data } = data;
        const { x, y, pathStart, pathEnd } = drawing_data;
        const userCtx = userCanvases[user];
        const scaleX = userCtx.canvas.width / canvas.width;
        const scaleY = userCtx.canvas.height / canvas.height;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;

        if (pathStart) {
            userCtx.beginPath(); // Start a new path
            userCtx.moveTo(scaledX, scaledY);
        } else if (pathEnd) {
            userCtx.closePath(); // Close the path
        } else {
            userCtx.lineTo(scaledX, scaledY);
            userCtx.stroke();
        }
    });

    socket.on('draw_history_competitive', (data) => {
        const { roomHistory } = data;
        if(!roomHistory) {
            return;
        }
        Object.keys(roomHistory).forEach(user => {
            if (!userCanvases[user]) {
                createUserCanvas(user);
            }
            const userCtx = userCanvases[user];
            const userHistory = roomHistory[user];
            const scaleX = userCtx.canvas.width / canvas.width;
            const scaleY = userCtx.canvas.height / canvas.height;

            userHistory.forEach(draw => {
                const { x, y, pathStart, pathEnd } = draw;
                const scaledX = x * scaleX;
                const scaledY = y * scaleY;

                if (pathStart) {
                    userCtx.beginPath();
                    userCtx.moveTo(scaledX, scaledY);
                } else if (pathEnd) {
                    userCtx.closePath();
                } else {
                    userCtx.lineTo(scaledX, scaledY);
                    userCtx.stroke();
                }
            });
        });
    });

    socket.on('join_room_announcement_competitive', (data) => {
        const userList = document.getElementById('user-list');
        userList.innerHTML += `<p>${data.user} joined the room</p>`;
        
        if (!userCanvases[data.user]) {
            createUserCanvas(data.user);
        }
    });

    socket.on('leave_room_announcement_competitive', (data) => {
        const userList = document.getElementById('user-list');
        userList.innerHTML += `<p>${data.user} left the room</p>`;
        
        const userCanvasContainer = document.querySelector(`.user-canvas-container[data-user="${data.user}"]`);
        if (userCanvasContainer) {
            userCanvasContainer.remove();
        }
        delete userCanvases[data.user];
    });

    socket.emit('start_event_competitive', { room: roomId, duration: (60 * 60) });

    socket.on('start_event_competitive', (data) => {
        const roomInfo = document.getElementById('room-info');
        roomInfo.innerHTML = `<p>Event started! Duration: ${data.duration} seconds</p>`;
        canDraw = true;
    });

    socket.on('end_event_competitive', (data) => {
        drawing = false;
        canDraw = false;
        const roomInfo = document.getElementById('room-info');
        roomInfo.innerHTML = `<p>Event ended! Room: ${data.room}</p>`;
        alert("Time's up! Drawing has been disabled.");
    });

    socket.emit('request_draw_history_competitive', { room: roomId });
}

function createUserCanvas(user) {
    const userCanvasContainer = document.createElement('div');
    userCanvasContainer.classList.add('user-canvas-container');
    userCanvasContainer.dataset.user = user;
    userCanvasContainer.innerHTML = `<span>${user}</span>`;
    
    const userCanvas = document.createElement('canvas');
    userCanvas.width = 200;
    userCanvas.height = 150;
    userCanvas.classList.add('user-canvas');
    userCanvasContainer.appendChild(userCanvas);
    
    document.getElementById('user-canvases').appendChild(userCanvasContainer);
    userCanvases[user] = userCanvas.getContext('2d');
}
