package main

import (
	"log"
	"os"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/handler"
	"example.com/gameHoldTheProcessServer/pkg/repository"
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/spf13/viper"
)

func main() {
	if err := initConfig(); err != nil {
		log.Fatalf("error when initializing config: %s", err.Error())
	}

	if err := godotenv.Load(); err != nil {
		log.Fatalf("error when loading env variables: %s", err.Error())
	}

	db, err := repository.NewPostgresDB(repository.Config{
		Host:     viper.GetString("db.host"),
		Port:     viper.GetString("db.port"),
		Username: viper.GetString("db.username"),
		Password: os.Getenv("DB_PASSWORD"),
		DBName:   viper.GetString("db.dbname"),
		SSLMode:  viper.GetString("db.sslmode"),
	})

	if err != nil {
		log.Fatalf("error when initializing database: %s", err.Error())
	}

	repo := repository.NewRepository(db)
	services := service.NewService(repo)
	handlers := handler.NewHandler(services)

	srv := new(gameServer.Server)
	if err := srv.Run(viper.GetString("port"), handlers.InitRoutes()); err != nil {
		log.Fatalf("error when trying to run the server: %s", err.Error())
	}
}

func initConfig() error {
	viper.AddConfigPath("configs")
	viper.SetConfigName("config")
	return viper.ReadInConfig()
}
