package handler

import (
	"net/http"
	"strconv"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func isStaffRole(c *gin.Context) bool {
	role, exists := c.Get(userCtxRole)
	if !exists {
		return false
	}
	return role == gameServer.RoleAdmin || role == gameServer.RoleResearcher
}

func (h *Handler) ownerGuard(c *gin.Context, ownerUserId int) bool {
	ctxUserId := c.GetInt(userCtx)
	if ctxUserId == 0 {
		newErrorResponse(c, http.StatusUnauthorized, "user not authorized")
		return false
	}

	if isStaffRole(c) || ctxUserId == ownerUserId {
		return true
	}

	newErrorResponse(c, http.StatusForbidden, "not enough rights")
	return false
}

func (h *Handler) forceSelfFilter(c *gin.Context, setSelf func(userId string)) bool {
	if isStaffRole(c) {
		return true
	}

	ctxUserId := c.GetInt(userCtx)
	if ctxUserId == 0 {
		newErrorResponse(c, http.StatusUnauthorized, "user not authorized")
		return false
	}

	setSelf(strconv.Itoa(ctxUserId))
	return true
}

func (h *Handler) sessionGuard(c *gin.Context, userId, parSetId int) (gameServer.UserParameterSet, bool) {
	var ups gameServer.UserParameterSet

	ctxUserId := c.GetInt(userCtx)
	if ctxUserId == 0 {
		newErrorResponse(c, http.StatusUnauthorized, "user not authorized")
		return ups, false
	}

	if !isStaffRole(c) && ctxUserId != userId {
		newErrorResponse(c, http.StatusForbidden, "not enough rights")
		return ups, false
	}

	fetched, err := h.services.User.GetUserParameterSet(userId, parSetId)
	if err != nil {
		internalErrorResponse(c, err)
		return ups, false
	}

	now := gameServer.NowDbClock()
	fetched.RemTimeMs = fetched.RemTime(now)

	if fetched.CurrentSessionStart() == nil {
		newErrorResponse(c, http.StatusForbidden, "session is not started")
		return ups, false
	}

	if fetched.SessionExpired(now) {
		newErrorResponse(c, http.StatusForbidden, "session time is up")
		return ups, false
	}

	return fetched, true
}

func (h *Handler) startSession(c *gin.Context) {
	var input gameServer.StartSessionInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userId := c.GetInt(userCtx)
	if userId == 0 {
		newErrorResponse(c, http.StatusUnauthorized, "user not authorized")
		return
	}

	ups, err := h.services.User.GetUserParameterSet(userId, input.ParSetId)
	if err != nil {
		internalErrorResponse(c, err)
		return
	}

	now := gameServer.NowDbClock()
	startTime := now

	if ups.IsTraining {
		if ups.TrainingStartTime == nil {
			if err := h.services.User.UpdateUserUserParSet(userId, gameServer.UpdateUserUserParSetInput{
				ParSetId:          input.ParSetId,
				TrainingStartTime: &startTime,
			}); err != nil {
				internalErrorResponse(c, err)
				return
			}
			ups.TrainingStartTime = &startTime
		}
	} else if ups.GameStartTime == nil {
		if err := h.services.User.UpdateUserUserParSet(userId, gameServer.UpdateUserUserParSetInput{
			ParSetId:      input.ParSetId,
			GameStartTime: &startTime,
		}); err != nil {
			internalErrorResponse(c, err)
			return
		}
		ups.GameStartTime = &startTime
	}

	ups.RemTimeMs = ups.RemTime(now)

	c.JSON(http.StatusOK, getUserParSetResponse{
		UserParameterSet: ups,
	})
}
