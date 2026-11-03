package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type errorResponse struct {
	Message string `json:"error"`
}

type statusResponse struct {
	Status string `json:"status"`
}

func newErrorResponse(c *gin.Context, statusCode int, message string) {
	logrus.Error(message)
	c.AbortWithStatusJSON(statusCode, errorResponse{message})
}

func internalErrorResponse(c *gin.Context, err error) {
	logrus.Errorf("internal error on %s %s: %s", c.Request.Method, c.Request.URL.Path, err.Error())
	c.AbortWithStatusJSON(http.StatusInternalServerError, errorResponse{"internal server error"})
}
