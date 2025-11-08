## How to connect

```shell
  wss://resq-backend-isp4g.ondigitalocean.app/ws/{type}
```

type - {tourist, rescuer}

## What data is sent

```json
{
  type_msg: str,
  latitude: float,
  longitude: float,
  altitude: float,
  accuracy: float,
  timestamp: int,
  user_id: str = None,
}
```

type_msg - {"tourist_location", "rescuer_location"}