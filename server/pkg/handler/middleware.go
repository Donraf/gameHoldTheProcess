package handler

import (
	"net/http"
	"strings"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

const (
	authorizationHeader = "Authorization"
	userCtx             = "userId"
	userCtxRole         = "role"
)

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
