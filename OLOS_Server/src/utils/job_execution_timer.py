import time


class JobExecutionTimer:
    """Tracks the execution time of a job with support for start, pause, resume, stop, and reset.

    This timer allows measurement of active execution time by managing paused durations.
    Useful for tracking how long a file/job has been executing, excluding paused intervals.

    Attributes:
        _start_time (float): The time when the job start getting executed.
        _pause_time (float): The time when the job execution get paused.
        _paused_duration (float): How much time the job got paused (Duration of pausing the job)
        _is_running (bool): flag for the job execution process.
    """

    def __init__(self):
        self._start_time = 0
        self._pause_time = 0
        self._paused_duration = 0
        self._is_running = False

    def start(self):
        """Starts the timer.

        If the timer was previously paused, it resumes from where it left off.
        """

        if not self._is_running:
            self._start_time = time.time() - self._paused_duration
            self._is_running = True

    def pause(self):
        """Pauses the timer.

        Records the time when the pause started.
        """

        if self._is_running:
            self._pause_time = time.time()
            self._is_running = False

    def resume(self):
        """Resumes the timer from where it was paused.

        Adjusts the paused duration so it's not counted in elapsed time.
        """

        if not self._is_running and self._start_time > 0:
            self._paused_duration += time.time() - self._pause_time
            self._is_running = True

    def stop(self):
        """Stops the timer without resetting its values.

        Useful when you want to finalize tracking but keep time info available.
        """
        if self._is_running:
            self._is_running = False

    def reset(self):
        """Resets the timer to its initial state.

        Clears all timing values and stops the timer.
        """

        self._start_time = 0
        self._pause_time = 0
        self._paused_duration = 0
        self._is_running = False

    def get_elapsed_time(self):
        """Gets the total elapsed time in seconds, excluding paused durations.

        Returns:
            float: The elapsed execution time in seconds.
        """

        if self._is_running:
            current_time = time.time()
            return current_time - self._start_time - self._paused_duration
        elif self._start_time:
            return self._pause_time - self._start_time - self._paused_duration
        else:
            return 0
