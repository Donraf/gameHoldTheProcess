package handler

import (
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-contrib/cors"
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
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowHeaders = []string{"Authorization", "Content-Type", "Accept", "Access-Control-Allow-Origin"}
	router.Use(cors.New(config))

	api := router.Group("/api")
	{
		user := api.Group("/user")
		{
			user.POST("/registration", h.registration)
			user.POST("/login", h.login)
			user.GET("/groups", h.getAllGroups)
			userAuth := user.Group("", h.checkUserAuth)
			{
				userAuth.POST("/users", h.getAllUsers)
				userAuth.POST("/pageCount", h.getUsersPageCount)
				userAuth.POST("/score", h.updateScore)
				userAuth.POST("/group", h.createGroup)
				userAuth.GET("/auth", h.check)
				userAuth.GET("/parSet/:id", h.getParSet)
				userAuth.GET("/score/:userId/:parSetId", h.getScore)
				userAuth.GET("/:id", h.getOneUser)
				userAuth.DELETE("/:id", h.checkAdminRole, h.deleteUser)
				userAuth.PUT("/:id", h.checkAdminRole, h.updateUser)
				userAuth.POST("/playersStat", h.checkResearcherRole, h.getPlayersStat)
				userAuth.POST("/playersPageCount", h.checkResearcherRole, h.getPlayersPageCount)
			}
		}

		chart := api.Group("/chart", h.checkUserAuth)
		{
			chart.POST("/charts", h.getAllCharts)
			chart.POST("/pageCount", h.getChartsPageCount)
			chart.POST("/count", h.getChartsCount)
			chart.POST("/", h.createChart)
			chart.GET("/:id", h.getOneChart)
			chart.DELETE("/:id", h.checkAdminRole, h.deleteChart)
			chart.POST("/parSets", h.checkResearcherRole, h.getAllParSets)
			chart.GET("/parSetsPageCount", h.checkResearcherRole, h.getParSetsPageCount)
		}

		point := api.Group("/point", h.checkUserAuth)
		{
			point.POST("/", h.createPoint)
			point.GET("/csv", h.checkResearcherRole, h.getAllPointsInCsv)
			point.GET("/chart_id/:chart_id", h.getAllPointsById)
			point.GET("/:id", h.getOnePoint)
			point.DELETE("/:id", h.checkAdminRole, h.deletePoint)
		}
	}

	return router
}
