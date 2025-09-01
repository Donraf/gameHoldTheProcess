package handler

import (
	"net/http"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func (h *Handler) createChart(c *gin.Context) {
	var input gameServer.CreateChartInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.Chart.CreateChart(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}

type getOneChartResponse struct {
	Data gameServer.Chart `json:"data"`
}

func (h *Handler) getOneChart(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	chart, err := h.services.Chart.GetOneChart(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getOneChartResponse{
		Data: chart,
	})
}

type getChartsPageCountResponse struct {
	PageCount int `json:"pageCount"`
}

func (h *Handler) getChartsPageCount(c *gin.Context) {
	var input gameServer.GetChartsPageCountInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pageCount, err := h.services.Chart.GetChartsPageCount(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
	}

	c.JSON(http.StatusOK, getChartsPageCountResponse{
		PageCount: pageCount,
	})
}

type getChartsCountResponse struct {
	Count int `json:"count"`
}

func (h *Handler) getChartsCount(c *gin.Context) {
	var input gameServer.GetChartsCountInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	chartsCount, err := h.services.Chart.GetChartsCount(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getChartsCountResponse{
		Count: chartsCount,
	})
}

type getAllChartsResponse struct {
	Data []gameServer.Chart `json:"data"`
}

func (h *Handler) getAllCharts(c *gin.Context) {
	var input gameServer.GetAllChartsInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	charts, err := h.services.Chart.GetAllCharts(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getAllChartsResponse{
		Data: charts,
	})
}

func (h *Handler) deleteChart(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	err = h.services.Chart.DeleteChart(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{
		Status: "ok",
	})
}

type getAllParSetsResponse struct {
	Data []gameServer.ParameterSet `json:"data"`
}

func (h *Handler) getAllParSets(c *gin.Context) {
	var input gameServer.GetAllParSetsInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	parSets, err := h.services.Chart.GetAllParSets(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getAllParSetsResponse{
		Data: parSets,
	})
}

type getParSetsPageCountResponse struct {
	PageCount int `json:"pageCount"`
}

func (h *Handler) getParSetsPageCount(c *gin.Context) {
	pageCount, err := h.services.Chart.GetParSetsPageCount()
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getParSetsPageCountResponse{
		PageCount: pageCount,
	})
}

func (h *Handler) createParSet(c *gin.Context) {
	var input gameServer.CreateParSetInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.Chart.CreateParSet(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}
