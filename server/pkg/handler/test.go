package handler

import (
	"net/http"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func emptyTestSessionStatus() gameServer.TestSessionStatus {
	return gameServer.TestSessionStatus{
		HasActiveTests: false,
		AllCompleted:   true,
		PendingTests:   []gameServer.TestWithStatus{},
		ActiveTests:    []gameServer.TestWithStatus{},
	}
}

func (h *Handler) isRegularUser(c *gin.Context) bool {
	role, exists := c.Get(userCtxRole)
	return exists && role == gameServer.RoleUser
}

func (h *Handler) getTestSessionStatus(c *gin.Context) {
	if !h.isRegularUser(c) {
		c.JSON(http.StatusOK, emptyTestSessionStatus())
		return
	}

	userId, _ := c.Get(userCtx)
	status, err := h.services.Test.GetSessionStatus(userId.(int))
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, status)
}

func (h *Handler) submitTestResult(c *gin.Context) {
	if !h.isRegularUser(c) {
		newErrorResponse(c, http.StatusForbidden, "tests are available only for users")
		return
	}

	var input gameServer.SubmitTestResultInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userId, _ := c.Get(userCtx)
	id, err := h.services.Test.SubmitResult(userId.(int), input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}

type getAllTestsResponse struct {
	Data []gameServer.Test `json:"data"`
}

func (h *Handler) getAllTests(c *gin.Context) {
	tests, err := h.services.Test.GetAllTests()
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if tests == nil {
		tests = []gameServer.Test{}
	}

	c.JSON(http.StatusOK, getAllTestsResponse{Data: tests})
}

func (h *Handler) createTest(c *gin.Context) {
	var input gameServer.CreateTestInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.Test.CreateTest(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{"id": id})
}

func (h *Handler) updateTest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	var input gameServer.UpdateTestInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.services.Test.UpdateTest(id, input); err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{Status: "ok"})
}

func (h *Handler) deleteTest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	if err := h.services.Test.DeleteTest(id); err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{Status: "ok"})
}

func (h *Handler) getUserTestResults(c *gin.Context) {
	if !h.isRegularUser(c) {
		c.JSON(http.StatusOK, map[string]any{"data": []gameServer.TestResult{}})
		return
	}

	userId, _ := c.Get(userCtx)
	results, err := h.services.Test.GetUserResults(userId.(int))
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if results == nil {
		results = []gameServer.TestResult{}
	}

	c.JSON(http.StatusOK, map[string]any{"data": results})
}

func (h *Handler) getPlayerTestResults(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("userId"))
	if err != nil || userId <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter userId")
		return
	}

	results, err := h.services.Test.GetUserResultsWithTests(userId)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if results == nil {
		results = []gameServer.TestResultWithTest{}
	}

	c.JSON(http.StatusOK, map[string]any{"data": results})
}
