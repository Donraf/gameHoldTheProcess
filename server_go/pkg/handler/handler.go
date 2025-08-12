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
			user.POST("/registration", h.registration)
			user.POST("/login", h.login)
			userAuth := user.Group("", h.checkUserAuth)
			{
				userAuth.POST("/users", h.getAllUsers)
				userAuth.POST("/pageCount", h.getUsersPageCount)
				userAuth.POST("/score", h.updateScore)
				userAuth.GET("/auth", h.check)
				userAuth.GET("/parSet/:id", h.getParSet)
				userAuth.GET("/score/:userId/:parSetId", h.getScore)
				userAuth.GET("/:id", h.getOneUser)
				userAuth.DELETE("/:id", h.deleteUser)
				userAuth.PUT("/:id", h.updateUser)
			}
		}

		chart := api.Group("/chart", h.checkUserAuth)
		{
			chart.POST("/charts", h.getAllCharts)
			chart.POST("/pageCount", h.getChartsPageCount)
			chart.POST("/count", h.getChartsCount)
			chart.POST("/", h.createChart)
			chart.GET("/:id", h.getOneChart)
			chart.DELETE("/:id", h.deleteChart)
		}

		point := api.Group("/point", h.checkUserAuth)
		{
			point.POST("/", h.createPoint)
			point.GET("/", h.getAllPoints)
			point.GET("/csv", h.getAllPointsInCsv)
			point.GET("/chart_id/:chart_id", h.getAllPointsById)
			point.GET("/:id", h.getOnePoint)
			point.DELETE("/:id", h.deletePoint)
		}
	}

	return router
}
