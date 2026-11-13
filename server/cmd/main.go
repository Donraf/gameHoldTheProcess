package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/handler"
	"example.com/gameHoldTheProcessServer/pkg/repository"
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func main() {
	logrus.SetFormatter(new(logrus.JSONFormatter))

	if err := initConfig(); err != nil {
		logrus.Fatalf("error when initializing config: %s", err.Error())
	}

	gameServer.SetTimeLimits(
		time.Duration(viper.GetInt("session.training_time_limit_min"))*time.Minute,
		time.Duration(viper.GetInt("session.game_time_limit_min"))*time.Minute,
	)

	if err := godotenv.Load(); err != nil {
		logrus.Warn("no .env file found, falling back to environment variables")
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
		logrus.Fatalf("error when initializing database: %s", err.Error())
	}

	repo := repository.NewRepository(db)
	services := service.NewService(repo)
	handlers := handler.NewHandler(services)

	schedulerCtx, stopScheduler := context.WithCancel(context.Background())
	var schedulerWg sync.WaitGroup
	schedulerWg.Add(1)
	go func() {
		defer schedulerWg.Done()
		services.StatisticsScheduler.Run(schedulerCtx)
	}()

	srv := new(gameServer.Server)
	go func() {
		if err := srv.Run(viper.GetString("port"), handlers.InitRoutes()); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logrus.Fatalf("error when trying to run the server: %s", err.Error())
		}
	}()
	logrus.Infof("server started on port %s", viper.GetString("port"))

	quit, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	<-quit.Done()
	logrus.Info("shutting down the server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logrus.Errorf("error when shutting down the server: %s", err.Error())
	}
	stopScheduler()
	schedulerWg.Wait()
	if err := db.Close(); err != nil {
		logrus.Errorf("error when closing the database connection: %s", err.Error())
	}
	logrus.Info("server stopped")
}

func initConfig() error {
	viper.AddConfigPath("configs")
	viper.SetConfigName("config")
	// Allow overriding any config value via environment variables,
	// e.g. db.host -> DB_HOST (useful for containers).
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()
	return viper.ReadInConfig()
}
