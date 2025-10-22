package handler

import (
	"net/http"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

type computeStatisticsResponse struct {
	Data gameServer.Statistics `json:"data"`
}

func (h *Handler) computeStatistics(c *gin.Context) {
	var input gameServer.ComputeStatisticsInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	stats, err := h.services.Statistics.ComputeStatistics(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, computeStatisticsResponse{
		Data: stats,
	})
}

type getStatisticsResponse struct {
	Data gameServer.Statistics `json:"data"`
}

func (h *Handler) getStatistics(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("userId"))
	if err != nil || userId <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter userId")
		return
	}

	parSetId, err := strconv.Atoi(c.Param("parSetId"))
	if err != nil || parSetId <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter parSetId")
		return
	}

	stats, err := h.services.Statistics.GetStatistics(userId, parSetId)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getStatisticsResponse{
		Data: stats,
	})
}
