package handler

import (
	"net/http"
	"strconv"
	"strings"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func (h *Handler) registration(c *gin.Context) {
	var input gameServer.RegisterUserInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Vaildate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	token, err := h.services.User.CreateUser(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"token": token,
	})
}

func (h *Handler) login(c *gin.Context) {
	var input gameServer.LoginInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	token, err := h.services.User.GenerateToken(input.Login, input.Password)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"token": token,
	})
}

func (h *Handler) updateScore(c *gin.Context) {
	var input gameServer.UpdateScoreInput

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Vaildate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	err := h.services.User.UpdateScore(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{
		Status: "ok",
	})
}

func (h *Handler) check(c *gin.Context) {
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

	token, err := h.services.User.RefreshToken(headerParts[1])
	if err != nil {
		newErrorResponse(c, http.StatusUnauthorized, "invalid authorization header")
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"token": token,
	})
}

type getOneUserResponse struct {
	Data gameServer.User `json:"data"`
}

func (h *Handler) getOneUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	user, err := h.services.User.GetOneUser(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getOneUserResponse{
		Data: user,
	})
}

type getUsersPageCountResponse struct {
	PageCount int `json:"pageCount"`
}

func (h *Handler) getUsersPageCount(c *gin.Context) {
	var input gameServer.GetUsersPageCountInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pageCount, err := h.services.User.GetUsersPageCount(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getUsersPageCountResponse{
		PageCount: pageCount,
	})
}

type getParSetResponse struct {
	Data gameServer.ParameterSet `json:"data"`
}

func (h *Handler) getParSet(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	parSet, err := h.services.User.GetParSet(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getParSetResponse{
		Data: parSet,
	})
}

type getScoreResponse struct {
	Score int `json:"data"`
}

func (h *Handler) getScore(c *gin.Context) {
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

	score, err := h.services.User.GetScore(userId, parSetId)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getScoreResponse{
		Score: score,
	})
}

type getAllUsersResponse struct {
	Data []gameServer.User `json:"data"`
}

func (h *Handler) getAllUsers(c *gin.Context) {
	var input gameServer.GetAllUsersInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := input.Validate(); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	users, err := h.services.User.GetAllUsers(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getAllUsersResponse{
		Data: users,
	})
}

func (h *Handler) deleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	err = h.services.User.DeleteUser(id)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{
		Status: "ok",
	})
}

func (h *Handler) updateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		newErrorResponse(c, http.StatusBadRequest, "invalid parameter id")
		return
	}

	var input gameServer.UpdateUserInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.services.User.UpdateUser(id, input); err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, statusResponse{
		Status: "ok",
	})
}

type getAllGroupsResponse struct {
	Data []gameServer.Group `json:"data"`
}

func (h *Handler) getAllGroups(c *gin.Context) {
	groups, err := h.services.User.GetAllGroups()
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, getAllGroupsResponse{
		Data: groups,
	})
}

func (h *Handler) createGroup(c *gin.Context) {
	var input gameServer.CreateGroupInput
	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.User.CreateGroup(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}
