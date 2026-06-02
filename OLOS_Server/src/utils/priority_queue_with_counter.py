from queue import PriorityQueue


class PriorityQueueWithCounter:
    """
    A custom priority queue that maintains insertion order for items with the same priority.

    This class wraps around Python's built-in PriorityQueue and adds a counter to ensure
    FIFO behavior for items with identical priorities. It is designed to work well with 
    multiprocessing-safe managers (SyncManager) where shared data structures require 
    thread-safe communication between processes.

    Each item put into the queue includes:

    - priority (int): Lower values indicate higher priority.
    - counter (int): Incremental value to preserve insertion order among same-priority items.
    - type (str): A label or identifier for the item.
    - item (optional): The actual data or payload associated with the queue entry.

    Attributes:
        _priority_queue (PriorityQueue)
        _entry_counter (int)
    """

    def __init__(self):
        self._priority_queue = PriorityQueue()
        self._entry_counter = 0

    def put(self, type, priority, item=None):
        """
        Adds an item to the queue with a given priority.

        Args:
            type (str): Identifier or label for the item.
            priority (int): Lower values represent higher priority (e.g., 1 is higher than 2).
            item (str, optional): Actual data to enqueue. Defaults to None.
        """

        entry = [priority, self._entry_counter, type, item]
        self._priority_queue.put(entry)
        self._entry_counter += 1

    def get(self):
        """
        Removes and returns the next item in the queue based on priority and insertion order.

        Returns:
            tuple: (type, item) of the dequeued entry.
        """
        return self._priority_queue.get()[2:]  # Return both type and item

    def empty(self):
        """
        Checks whether the queue is empty.

        Returns:
            bool: True if queue is empty, False otherwise.
        """
        return self._priority_queue.empty()
