package handler

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

const (
	authorizationHeader = "Authorization"
	requestIDHeader     = "X-Request-ID"
	userCtx             = "userId"
	userCtxRole         = "role"
	requestIDCtx        = "requestId"
)

// requestIDMiddleware присваивает каждому запросу уникальный id и пробрасывает
// его в контекст и ответный заголовок — по нему связываются все логи запроса.
func requestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		buf := make([]byte, 16)
		if _, err := rand.Read(buf); err != nil {
			c.Next()
			return
		}
		requestID := hex.EncodeToString(buf)
		c.Set(requestIDCtx, requestID)
		c.Header(requestIDHeader, requestID)
		c.Next()
	}
}

// requestIDFrom извлекает request id из контекста для логирования.
func requestIDFrom(c *gin.Context) string {
	if id, exists := c.Get(requestIDCtx); exists {
		if s, ok := id.(string); ok {
			return s
		}
	}
	return ""
}

// loggerMiddleware пишет в лог одну строку на запрос: метод, путь, статус,
// время обработки и request id.
func loggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		logrus.WithFields(logrus.Fields{
			"request_id": requestIDFrom(c),
			"method":     c.Request.Method,
			"path":       c.Request.URL.Path,
			"status":     c.Writer.Status(),
			"latency_ms": time.Since(start).Milliseconds(),
			"client_ip":  c.ClientIP(),
		}).Info("request handled")
	}
}

func (h *Handler) checkUserAuth(c *gin.Context) {
	header := c.GetHeader(authorizationHeader)
	if header == "" {
		newErrorResponse(c, http.StatusUnauthorized, "empty authorization header")
		return
	}

	headerParts := strings.Split(header, " ")
	if len(headerParts) != 2 || headerParts[0] != "Bearer" || len(headerParts[1]) == 0 {
		newErrorResponse(c, http.StatusUnauthorized, "invalid authorization header")
		return
	}

	claims, err := h.services.User.ParseToken(headerParts[1])
	if err != nil {
		newErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	c.Set(userCtx, claims.UserId)
	c.Set(userCtxRole, claims.Role)
}

func (h *Handler) checkAdminRole(c *gin.Context) {
	role, exists := c.Get(userCtxRole)
	if !exists || role != gameServer.RoleAdmin {
		newErrorResponse(c, http.StatusForbidden, "not enough rights")
		return
	}
}

func (h *Handler) checkResearcherRole(c *gin.Context) {
	role, exists := c.Get(userCtxRole)
	if !exists || (role != gameServer.RoleAdmin && role != gameServer.RoleResearcher) {
		newErrorResponse(c, http.StatusForbidden, "not enough rights")
		return
	}
}
