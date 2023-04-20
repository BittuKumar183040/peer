"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const nanoid_1 = require("nanoid");
const node_cache_1 = __importDefault(require("node-cache"));
const IO_OPTIONS = {
    cors: {
        origin: JSON.parse(process.env.ALLOW_ORIGIN || "\"*\""),
        credentials: !!process.env.ALLOW_ORIGIN,
    },
};
const httpServer = http_1.createServer();
const io = new socket_io_1.Server(httpServer, IO_OPTIONS);
const roomsCache = new node_cache_1.default({
    /*
     12 hours expiry.
     It is long enough to last for any meeting (too long) and shoudn't be needed normally, just for the case i fuck up somewhere
    */
    stdTTL: 43200,
});
io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('register', ({ sessionId, roomId }) => {
        roomsCache.set(socket.id, { sessionId });
        /**
         socket joins room with same session id
         This allows for extra layer above socket id so client just communicates with session id
        */
        socket.join(sessionId);
        // join rooms person is already in
        if (roomId) {
            socket.join(roomId);
            io.to(roomId).emit('person_reconnected', {
                sessionId,
            });
        }
    });
    socket.on('create_room', (room, cb) => {
        try {
            // TODO anonymous auth and/or rate limiting
            const roomId = nanoid_1.nanoid();
            room.id = roomId;
            socket.join(roomId);
            roomsCache.set(roomId, room);
            io.to(socket.id).emit('joined_room', room);
            cb({ isError: false });
        }
        catch (err) {
            console.error(err);
            cb({ isError: true });
        }
    });
    socket.on('join_room', async (opts, cb) => {
        try {
            const { name, link } = opts;
            const room = getRoomFromLink(link);
            if (!room) {
                cb({ error: 'Room not found or invalid input!' });
                return;
            }
            const maxPeople = parseInt(room.opts?.maxPeople || '');
            const sockets = await io.in(room.id).allSockets();
            const peopleCount = sockets.size;
            if (!isNaN(maxPeople) && peopleCount >= maxPeople) {
                cb({ error: 'Specified room participants limit reached, make a new one!' });
                return;
            }
            const { sessionId } = roomsCache.get(socket.id) || {};
            if (!sessionId)
                throw Error('No session id');
            socket.join(room.id);
            socket.to(room.id).emit('person_joined', {
                name,
                sessionId,
            });
            io.to(socket.id).emit('joined_room', room);
            cb({ error: undefined });
        }
        catch (err) {
            console.error('Error creating room', err);
            cb({ error: 'Something went wrong, try again later.' });
        }
    });
    socket.on('leave_room', () => {
        try {
            socket.rooms.forEach(room => {
                const { sessionId } = roomsCache.get(socket.id) || {};
                if (room === socket.id || room === sessionId)
                    return;
                socket.leave(room);
                if (sessionId) {
                    socket.to(room).emit('person_left', {
                        sessionId,
                    });
                }
                io.in(room)
                    .allSockets()
                    .then(sockets => {
                    if (sockets.size === 0) {
                        // room is now empty, clear the memory reference
                        roomsCache.del(room);
                    }
                });
            });
        }
        catch (err) {
            console.error('Error leaving room 😂', err);
        }
    });
    // Peer reports that the person left
    socket.on('person_left', ({ sessionId }) => {
        try {
            io.to(sessionId).emit('leave_room');
            socket.rooms.forEach(room => {
                if (room === socket.id)
                    return;
                const { sessionId: mySessionId } = roomsCache.get(socket.id) || {};
                if (room === mySessionId)
                    return;
                io.to(room).emit('person_left', {
                    sessionId,
                });
            });
        }
        catch (err) {
            console.error('Error leaving room 😂', err);
        }
    });
    /*
    messages ('message' events) are send as is to other socket specified by `to` key in data
    `to` key is removed and `from` is added in delivered message\
    both `to` and `from` are session ids
    */
    socket.on('message', message => {
        const { to, ...msg } = message;
        const { sessionId } = roomsCache.get(socket.id) || {};
        if (!sessionId)
            return;
        socket.to(to).send({
            from: sessionId,
            ...msg,
        });
    });
    socket.on('disconnecting', () => {
        const { sessionId } = roomsCache.get(socket.id) || {};
        roomsCache.del(socket.id);
        socket.rooms.forEach(room => {
            if (room !== socket.id || room !== sessionId) {
                if (sessionId) {
                    io.to(room).emit('person_disconnected', {
                        sessionId,
                    });
                }
            }
        });
    });
});
const PATH_REGEX = /^\/room\/(?<id>[A-Za-z0-9_-]+$)/;
const ID_REGEX = /^(?<id>[A-Za-z0-9_-]+$)/;
function getRoomFromLink(link) {
    let id;
    try {
        const url = new URL(link); // throws if url is invalid
        /* This does not care about url host so any host is valid as long as that follows below pathname pattern
           /room/<room_id>
           room_id regex = ([A-Za-z0-9_-])+ (same as nanoid character set)
        */
        id = url.pathname.match(PATH_REGEX)?.groups?.id;
    }
    catch (error) {
        // try link as id
        id = link.match(ID_REGEX)?.groups?.id;
    }
    // if (!id) throw Error('Cannot parse room id')
    // if (!roomsCache.has(id)) throw Error('Room not found')
    return id !== undefined ? roomsCache.get(id) : undefined;
}
httpServer.listen(process.env.PORT || 5001, () => {
    console.log('listening on port', process.env.PORT || 5001);
});
