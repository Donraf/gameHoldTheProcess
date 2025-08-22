package handler

import (
	"net/http"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func (h *Handler) createPoint(c *gin.Context) {
	var input gameServer.Point
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.Point.CreatePoint(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}

type getOnePointResponse struct {
	Data gameServer.Point `json:"data"`
}

func (h *Handler) getOnePoint(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	point, err := h.services.Point.GetOnePoint(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getOnePointResponse{
		Data: point,
	})
}

type getAllPointsByIdResponse struct {
	Data []gameServer.Point `json:"data"`
}

func (h *Handler) getAllPointsById(c *gin.Context) {
	chartId, err := strconv.Atoi(c.Param("chart_id"))
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter chart_id")
		return
	}

	points, err := h.services.Point.GetAllPointsById(chartId)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getAllPointsByIdResponse{
		Data: points,
	})
}

func (h *Handler) getAllPointsInCsv(c *gin.Context) {
	csv, err := h.services.Point.GetCsvOfPoints()
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Writer.Header().Set("Content-Type", "text/csv")
	c.Writer.Header().Set("Content-Disposition", "attachment; filename=\"points.csv\"")
	c.Writer.Write([]byte(csv))
}

func (h *Handler) deletePoint(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	err = h.services.Point.DeletePoint(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{
		Status: "ok",
	})
}
