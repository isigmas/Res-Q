class Message:
    type_msg = None
    user_id = None
    latitude = None
    longitude = None
    altitude = None
    accuracy = None
    timestamp = None

    def __init__(self,
                 type_msg: str,
                 latitude: float,
                 longitude: float,
                 altitude: float,
                 accuracy: int,
                 timestamp: int,
                 user_id: str = None,
    ):
        self.type_msg = type_msg
        self.user_id = user_id
        self.latitude = latitude
        self.longitude = longitude
        self.altitude = altitude
        self.accuracy = accuracy
        self.timestamp = timestamp

    def to_dict(self):
        return {
            k: v for k, v in self.__dict__.items() if v is not None
        }