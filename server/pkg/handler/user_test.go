package handler

import (
	"bytes"
	"errors"
	"net/http/httptest"
	"testing"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHandler_registration(t *testing.T) {
	type mockBehavior func(r *service.MockUser, userInput gameServer.RegisterUserInput)

	tests := []struct {
		name                string
		inputBody           string
		userInput           gameServer.RegisterUserInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"login": "l", "password": "p", "role": "User", "name":"n"}`,
			userInput: gameServer.RegisterUserInput{
				Login:    "l",
				Password: "p",
				Role:     "User",
				Name:     "n",
			},
			mockBehavior: func(r *service.MockUser, userInput gameServer.RegisterUserInput) {
				r.EXPECT().CreateUser(userInput).Return("token", nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"token":"token"}`,
		},
		{
			name:      "redundant fields",
			inputBody: `{"login": "l", "password": "p", "role": "User", "name":"n", "abc123": "abc123"}`,
			userInput: gameServer.RegisterUserInput{
				Login:    "l",
				Password: "p",
				Role:     "User",
				Name:     "n",
			},
			mockBehavior: func(r *service.MockUser, userInput gameServer.RegisterUserInput) {
				r.EXPECT().CreateUser(userInput).Return("token", nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"token":"token"}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"login": "l", "password": "p", "role": "User", "name":"n"}`,
			userInput: gameServer.RegisterUserInput{
				Login:    "l",
				Password: "p",
				Role:     "User",
				Name:     "n",
			},
			mockBehavior: func(r *service.MockUser, userInput gameServer.RegisterUserInput) {
				r.EXPECT().CreateUser(userInput).Return("", errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:               "no login",
			inputBody:          `{"password": "p", "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty login",
			inputBody:          `{"login": "", "password": "p", "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect login",
			inputBody:          `{"login": 1, "password": "p", "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "no password",
			inputBody:          `{"login": "l", "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty password",
			inputBody:          `{"login": "l", "password": "", "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect password",
			inputBody:          `{"login": "l", "password": 1, "role": "User", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "no role",
			inputBody:          `{"login": "l", "password": "p", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty role",
			inputBody:          `{"login": "login", "password": "p", "role": "", "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect role",
			inputBody:          `{"login": "login", "password": "p", "role": 1, "name":"n"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "no name",
			inputBody:          `{"login": "l", "password": "p", "role": "User"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty name",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":""}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect name",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":1}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current parameter set id - wrong type",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "cur_par_set_id": "hello"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current parameter set id - negative value",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "cur_par_set_id": -1}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current parameter set id - zero value",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "cur_par_set_id": 0}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect group id - wrong type",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "group_id": "hello"}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect group id - negative value",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "group_id": -1}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect group id - zero value",
			inputBody:          `{"login": "login", "password": "p", "role": "User", "name":"n", "group_id": 0}`,
			mockBehavior:       func(r *service.MockUser, userInput gameServer.RegisterUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.userInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/registration", handler.registration)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/registration", bytes.NewBufferString(tt.inputBody))

			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatusCode, w.Code)
			if tt.isError {
				assert.Contains(t, w.Body.String(), "error")
			} else {
				assert.Equal(t, tt.expectedRequestBody, w.Body.String())
			}
		})
	}
}

func TestHandler_login(t *testing.T) {
	type mockBehavior func(r *service.MockUser, loginInput gameServer.LoginInput)

	tests := []struct {
		name                string
		inputBody           string
		loginInput          gameServer.LoginInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"login": "l", "password": "p"}`,
			loginInput: gameServer.LoginInput{
				Login:    "l",
				Password: "p",
			},
			mockBehavior: func(r *service.MockUser, loginInput gameServer.LoginInput) {
				r.EXPECT().GenerateToken(loginInput.Login, loginInput.Password).Return("token", nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"token":"token"}`,
		},
		{
			name:               "broken json input syntax",
			inputBody:          `{"login": "l", "password": "p"`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:      "redundant fields",
			inputBody: `{"login": "l", "password": "p", "abc123": "abc123"}`,
			loginInput: gameServer.LoginInput{
				Login:    "l",
				Password: "p",
			},
			mockBehavior: func(r *service.MockUser, loginInput gameServer.LoginInput) {
				r.EXPECT().GenerateToken(loginInput.Login, loginInput.Password).Return("token", nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"token":"token"}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"login": "l", "password": "p"}`,
			loginInput: gameServer.LoginInput{
				Login:    "l",
				Password: "p",
			},
			mockBehavior: func(r *service.MockUser, loginInput gameServer.LoginInput) {
				r.EXPECT().GenerateToken(loginInput.Login, loginInput.Password).Return("", errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:               "no login",
			inputBody:          `{"password": "p"}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty login",
			inputBody:          `{"login": "", "password": "p"}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect login",
			inputBody:          `{"login": 1, "password": "p"}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "no password",
			inputBody:          `{"login": "l"}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "empty password",
			inputBody:          `{"login": "l", "password": ""}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect password",
			inputBody:          `{"login": "l", "password": 1}`,
			mockBehavior:       func(r *service.MockUser, loginInput gameServer.LoginInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.loginInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/login", handler.login)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/login", bytes.NewBufferString(tt.inputBody))

			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatusCode, w.Code)
			if tt.isError {
				assert.Contains(t, w.Body.String(), "error")
			} else {
				assert.Equal(t, tt.expectedRequestBody, w.Body.String())
			}
		})
	}
}
