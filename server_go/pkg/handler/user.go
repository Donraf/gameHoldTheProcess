package handler

import (
	"net/http"
	"strconv"
	"strings"

	gameServer "example.com/gameHoldTheProcessServer"
	"github.com/gin-gonic/gin"
)

func (h *Handler) registration(c *gin.Context) {
	var input gameServer.User

	if err := c.BindJSON(&input); err != nil {
		newErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	id, err := h.services.User.CreateUser(input)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, map[string]any{
		"id": id,
	})
}

type loginInput struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *Handler) login(c *gin.Context) {
	var input loginInput

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

}

func (h *Handler) check(c *gin.Context) {
	header := c.GetHeader(authorizationHeader)
	if header == "" {
		newErrorResponse(c, http.StatusUnauthorized, "empty authorization header")
		return
	}

	headerParts := strings.Split(header, " ")
	if len(headerParts) != 2 {
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

func (h *Handler) getOneUser(c *gin.Context) {

}

func (h *Handler) getUsersPageCount(c *gin.Context) {

}

func (h *Handler) getParSet(c *gin.Context) {

}

func (h *Handler) getScore(c *gin.Context) {

}

type getAllUsersResponse struct {
	Data []gameServer.User `json:"data"`
}

func (h *Handler) getAllUsers(c *gin.Context) {
	users, err := h.services.User.GetAllUsers()
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
