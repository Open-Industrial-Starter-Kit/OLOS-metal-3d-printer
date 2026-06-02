"""
This module defines the WebSocketConnector class which manages a WebSocket server for real-time
communication with connected clients using asyncio and multiprocessing.

Features:

- Starts a WebSocket server that handles multiple clients

- Sends and receives data using shared queues with the core module

- Manages reconnection on port conflicts

- Prevents race conditions using asyncio locks
"""

import asyncio
import json
import websockets
from multiprocessing import Process
from .constants import WebsocketConstants as constants
import os
from dotenv import load_dotenv

load_dotenv()


class WebSocketConnector(Process):
    """
    A multiprocessing-based WebSocket server that enables real-time bidirectional communication
    with one or more clients, using asyncio and queues shared with the core application.

    Attributes:
        websocket_server_data (object): Shared object containing queues and control flags.
        _websocket_connections (set): Set of active websocket connections.
        _is_connected (bool): Flag indicating the connection status.
        _recv_lock (asyncio.Lock): Async lock to prevent simultaneous receive calls.
        _send_lock (asyncio.Lock): Async lock to prevent simultaneous send calls.
    """

    def __init__(self, websocket_server_data):
        super(WebSocketConnector, self).__init__()
        self._websocket_connections = set()
        self._is_connected = False

        # shared objects with the core
        self.websocket_server_data = websocket_server_data

        # Lockers to make sure not to allow opening multiple connections during refresh
        self._recv_lock = asyncio.Lock()
        self._send_lock = asyncio.Lock()

    def run(self):
        """
        Run the websocket server within the process.
        Handles startup and graceful disconnection on exceptions.
        """

        try:
            asyncio.run(self._start_websocket_server())

        except websockets.WebSocketException as error:
            print("Websocket Connection Error:", error)

        finally:
            asyncio.run(self._disconnect_websocket())

    def add_to_websocket_read_queue(self, type, priority, data):
        """
        Adds a new message to the websocket read queue for downstream processing (send to core).

        Args:
            type (str): Type of the message.
            priority (int): Priority of the message.
            data (Any): The payload data.
        """
        self.websocket_server_data.websocket_read_queue.put(
            type, priority, data)

    def add_to_websocket_write_queue(self, type, priority, data):
        """
        Adds a new message to the websocket write queue to be sent to connected clients.

        Args:
            type (str): Type of the message.
            priority (int): Priority of the message.
            data (Any): The payload data.
        """
        self.websocket_server_data.websocket_write_queue.put(
            type, priority, data)

    async def _start_websocket_server(self):
        """
        Starts the asyncio-based WebSocket server using environment variables for host and port.
        Waits indefinitely for connections unless an error occurs.
        """

        try:
            server = await websockets.serve(
                self._handle_client,
                os.getenv("HOST"),
                os.getenv("WEBSOCKET_PORT"),
                max_size=constants.MAX_FRAME_SIZE,
                ping_interval=None
            )

            if os.getenv("ENV") == "development":
                print("Websocket settings:")
                print("-> HostName:", os.getenv('HOST'))
                print("-> Port:", os.getenv("WEBSOCKET_PORT"))
                print('Websocket connection started')

            self._is_connected = True
            # keep the event loop running
            await server.wait_closed()

        # error the port is busy
        except OSError as e:
            if e.errno == 10048:
                print(
                    f'Error: Port {os.getenv("WEBSOCKET_PORT")} is already in use. Choose a different port.')
                await self._reconnect_to_websocket()
            else:
                print(f"Error: {e}")

    async def _handle_client(self, websocket, path):
        """
        Handles a single connected client by sending and receiving data asynchronously.

        Args:
            websocket (WebSocketServerProtocol): The client connection object.
            path (str): URL path of the WebSocket connection.
        """

        self._websocket_connections.add(websocket)
        try:
            while True:
                send_task = asyncio.create_task(self._send_data_to_users())
                recv_task = asyncio.create_task(
                    self._receive_data_from_users())

                # Ensure that receiving is prioritized by awaiting recv_task first
                await recv_task
                await send_task

                # Delay to not consume the CPU
                if not self.websocket_server_data.is_job_execute_process:
                    await asyncio.sleep(constants.TIMEOUT)

        except websockets.exceptions.ConnectionClosedOK:
            print("WebSocket connection closed by the client")
            self._websocket_connections.discard(
                websocket)  # Remove closed connection
            if not self._websocket_connections:  # Check if there are no connections left
                self._is_connected = False

        except websockets.exceptions.ConnectionClosedError:
            print("WebSocket connection closed unexpectedly")
            self._websocket_connections = set()
            self._is_connected = False

    async def _send_data_to_users(self):
        """
        Sends messages from the write queue to all active WebSocket connections.
        Uses an asyncio lock to ensure only one send operation is active at a time.
        """
        async with self._send_lock:
            if (not self.websocket_server_data.websocket_write_queue.empty() and
                    self._websocket_connections):
                _, data = self.websocket_server_data.websocket_write_queue.get()

                await asyncio.gather(*(ws_connection.send(data) for ws_connection in self._websocket_connections))

    async def _receive_data_from_users(self):
        """
        Receives messages from all connected users concurrently and dispatches them for analysis.
        Uses an asyncio lock to prevent concurrent receive operations.
        """
        async with self._recv_lock:
            if len(self._websocket_connections):
                await asyncio.gather(*(self._analyze_user_message(ws_connection) for ws_connection in self._websocket_connections))

    async def _analyze_user_message(self, ws_connection):
        """
        Waits for and parses a message from a specific WebSocket connection.

        Args:
            ws_connection (WebSocketServerProtocol): A client WebSocket connection.
        """
        try:
            json_data = await asyncio.wait_for(ws_connection.recv(), timeout=constants.TIMEOUT)
            if json_data:
                data_dict = json.loads(json_data)
                type = data_dict.get('type')
                data = data_dict.get('data')

                if os.getenv("ENV") == 'development':
                    print(
                        f"[WebsocketConnector] Data received from user: {data_dict}")

                self.add_to_websocket_read_queue(type,
                                                 constants.HIGH_PRIORITY_COMMAND,
                                                 data)

        except asyncio.TimeoutError:
            pass  # Continue the loop if no data received within the timeout

        except websockets.exceptions.ConnectionClosed:
            pass  # ignore closing connection errors

        except Exception as error:
            print(f'An error occurred: {error}')

    async def _disconnect_websocket(self):
        """
        Closes all active WebSocket connections and marks the server as disconnected.
        """
        if self._websocket_connections:
            await asyncio.gather(*(ws.close() for ws in self._websocket_connections))
            self._websocket_connections.clear()
            self._is_connected = False
            print("Websocket connection closed")

        else:
            print("Websocket connection is already closed")

    async def _reconnect_to_websocket(self):
        """
        Continuously tries to reconnect to the WebSocket server every 5 seconds
        until a connection is successfully established.
        """
        while not self._is_connected:
            print('Wait 5 seconds. Trying to connect to Websocket server...')
            await asyncio.sleep(5)

            await self.start_websocket_server()
