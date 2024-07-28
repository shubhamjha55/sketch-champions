from threading import Timer

timers = {}

def start_timer(room, duration, end_event_callback):
    if room in timers:
        timers[room].cancel()
    timers[room] = Timer(duration, end_event_callback, args=[room])
    timers[room].start()

def cancel_timer(room):
    if room in timers:
        timers[room].cancel()
        del timers[room]
