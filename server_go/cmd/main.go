package main

import (
	"log"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/handler"
)

func main() {
	handlers := new(handler.Handler)
	srv := new(gameServer.Server)
	if err := srv.Run("5439", handlers.InitRoutes()); err != nil {
		log.Fatalf("error when trying to run the server: %s", err.Error())
	}
}
