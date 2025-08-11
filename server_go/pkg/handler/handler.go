package handler

import (
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	services *service.Service
}

func NewHandler(services *service.Service) *Handler {
	return &Handler{services: services}
}

func (h *Handler) InitRoutes() *gin.Engine {
	router := gin.New()

	api := router.Group("/api")
	{
		user := api.Group("/user")
		{
			user.POST("/users", h.getAllUsers)
			user.POST("/pageCount", h.getUsersPageCount)
			user.POST("/registration", h.registration)
			user.POST("/login", h.login)
			user.POST("/score", h.updateScore)
			user.GET("/auth", h.check)
			user.GET("/parSet/:id", h.getParSet)
			user.GET("/score/:userId/:parSetId", h.getScore)
			user.GET("/:id", h.getOneUser)
			user.DELETE("/:id", h.deleteUser)
			user.PUT("/:id", h.updateUser)
		}

		chart := api.Group("/chart")
		{
			chart.POST("/charts", h.getAllCharts)
			chart.POST("/pageCount", h.getChartsPageCount)
			chart.POST("/count", h.getChartsCount)
			chart.POST("/", h.createChart)
			chart.GET("/:id", h.getOneChart)
			chart.DELETE("/:id", h.deleteChart)
			chart.PUT("/:id", h.updateChart)
		}

		point := api.Group("/point")
		{
			point.POST("/", h.createPoint)
			point.GET("/", h.getAllPoints)
			point.GET("/csv", h.getAllPointsInCsv)
			point.GET("/chart_id/:chart_id", h.getAllPointsById)
			point.GET("/:id", h.getOnePoint)
			point.DELETE("/:id", h.deletePoint)
			point.PUT("/:id", h.updatePoint)
		}
	}

	return router
}
