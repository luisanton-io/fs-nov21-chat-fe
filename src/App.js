import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Container, Row, Col, Form, ListGroup } from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import io from "socket.io-client"


const ADDRESS = process.env.REACT_APP_BE_ADDRESS || 'http://localhost:3030'
const socket = io(ADDRESS, { transports: ['websocket'], auth: { token: "myjwttoken" } })

function App() {

  // const socket = useMemo(() => io(ADDRESS, { transports: ['websocket'] }), [])
  const [username, setUsername] = useState('')
  const [text, setText] = useState('')

  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])


  const [loggedIn, setLoggedIn] = useState(false)

  const fetchOnlineUsers = async () => {
    const response = await fetch(ADDRESS + "/online-users")
    const users = await response.json()

    return users
  }

  useEffect(() => {

    socket.on('connect', () => {
      console.log('connected with id', socket.id)
    })

    socket.on("userJoined", () => {
      fetchOnlineUsers().then(setUsers)
    })

    socket.on("didLogin", () => {
      setLoggedIn(true)
    })

    console.log(messages) // []

    socket.on("incomingMessage", ({ message }) => {
      // We need to grab the latest messages values, not the messages on first render
      // Bad:
      // setMessages([...messages, message])
      // Good:
      console.table({ message })
      setMessages(messages => [...messages, message])
    })
  }, [])

  useEffect(() => {
    fetchOnlineUsers().then(setUsers)
  }, [])

  const handleSubmit = e => {
    e.preventDefault();
    console.log("handleSubmit")
    socket.emit('setUsername', { username })
  }

  const handleMessage = e => {
    e.preventDefault();
    console.log("handleMessage", text)
    const message = {
      text,
      timestamp: Date.now(),
      sender: {
        id: socket.id,
        username
      }
    }

    socket.emit('outgoingMessage', { message })
    setMessages(m => [...m, message])

  }

  return (
    <Container className="h-100 my-auto">
      <Row style={{ height: '90vh' }}>
        <Col xs={8} className="d-flex flex-column">
          {/* Here we will set our username and display the chat */}
          <Form onSubmit={handleSubmit}>
            <Form.Control disabled={loggedIn} type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </Form>
          {/* here we want the messages! */}
          <div className="d-flex flex-column flex-grow-1 py-5 px-2">
            {messages.map((message, i) => (
              <div key={`msg-${i}`} className="d-flex flex-row my-1">
                <strong className="me-2">{message.sender.username}</strong>
                <span>{message.text}</span>
                <span className="ms-auto">{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
          {/* here we want a message input! */}
          <Form onSubmit={handleMessage}>
            <Form.Control disabled={!loggedIn} type="text" value={text} onChange={e => setText(e.target.value)} />
          </Form>
        </Col>
        <Col xs={4}>
          {/* Here we will display the online users */}
          <ListGroup>
            {users.filter(user => user.socketId !== socket.id).map(user => (
              <ListGroup.Item key={user.socketId}>{user.username}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
