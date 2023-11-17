const express = require( "express" );
const http = require( "http" );
const socketIO = require( "socket.io" );

const app = express();
const server = http.createServer( app );
const port = process.env.PORT || 5000;

app.get( "/", ( req, res ) => {
  res.send( "Server is running." );
} );

const io = socketIO( server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
} );

io.use( ( socket, next ) => {
  if ( socket.handshake.query ) {
    const callerId = socket.handshake.query.callerId;
    socket.user = callerId;
    next();
  }
} );

io.on( "connection", ( socket ) => {
  console.log( socket.user, "Connected" );
  socket.join( socket.user );

  socket.on( "makeCall", ( data ) => {
    const calleeId = data.calleeId;
    const sdpOffer = data.sdpOffer;

    socket.to( calleeId ).emit( "newCall", {
      callerId: socket.user,
      sdpOffer: sdpOffer,
    } );
  } );

  socket.on( "answerCall", ( data ) => {
    const callerId = data.callerId;
    const sdpAnswer = data.sdpAnswer;

    socket.to( callerId ).emit( "callAnswered", {
      callee: socket.user,
      sdpAnswer: sdpAnswer,
    } );
  } );

  socket.on( "IceCandidate", ( data ) => {
    const calleeId = data.calleeId;
    const iceCandidate = data.iceCandidate;

    socket.to( calleeId ).emit( "IceCandidate", {
      sender: socket.user,
      iceCandidate: iceCandidate,
    } );
  } );
} );

server.listen( port, () => {
  console.log( `Server is running on port ${port}` );
} );
