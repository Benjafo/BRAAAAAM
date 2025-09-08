#### Start all containers
`docker compose --profile development up -d`

#### Start without detached mode (shows logs for all containers in terminal)
`docker compose --profile development up`

#### Stop all running containers
`docker compose --profile development down`

#### Stop and remove volumes (clears database data, etc.)
`docker compose --profile development down -v`

#### Stop and remove images
`docker compose --profile development down --rmi all`

#### View logs (can specify specific service(s))
```
docker compose --profile development logs -f
docker compose --profile development logs -f client
docker compose --profile development logs -f server
docker compose --profile development logs -f client server
```

#### List running containers
`docker compose ps`

#### List all containers
`docker compose ps -a`
