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
	// Клиентские ошибки (4xx) — штатная ситуация, логируем на уровне Warn,
	// чтобы не тонули настоящие серверные ошибки.
	logrus.WithFields(logrus.Fields{
		"request_id": requestIDFrom(c),
		"status":     statusCode,
	}).Warn(message)
	c.AbortWithStatusJSON(statusCode, errorResponse{message})
}

func internalErrorResponse(c *gin.Context, err error) {
	logrus.WithFields(logrus.Fields{
		"request_id": requestIDFrom(c),
		"method":     c.Request.Method,
		"path":       c.Request.URL.Path,
	}).Errorf("internal error: %s", err.Error())
	c.AbortWithStatusJSON(http.StatusInternalServerError, errorResponse{"internal server error"})
}
