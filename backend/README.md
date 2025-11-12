## How to connect

```shell
  wss://resq-backend-isp4g.ondigitalocean.app/ws/{type}
```

type - {tourist, rescuer}

## What data is sent

#### First we need to arrange rescue

```json
{
  "type_msg": "str"
}
```

type_msg - {"start_rescue", "stop_rescue"}

#### Then we send location updates in a loop

```json
{
  "type_msg": "str {types below}",
  "latitude": "float",
  "longitude": "float",
  "altitude": "float",
  "accuracy": "float",
  "timestamp": "int",
  "user_id": "str {default: None}"
}
```

type_msg - {"tourist_location", "rescuer_location"}