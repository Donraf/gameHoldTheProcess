package handler

import (
	"net/http"

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

}

func (h *Handler) getOneUser(c *gin.Context) {

}

func (h *Handler) getUsersPageCount(c *gin.Context) {

}

func (h *Handler) getParSet(c *gin.Context) {

}

func (h *Handler) getScore(c *gin.Context) {

}

func (h *Handler) getAllUsers(c *gin.Context) {

}

func (h *Handler) deleteUser(c *gin.Context) {

}

func (h *Handler) updateUser(c *gin.Context) {

}
