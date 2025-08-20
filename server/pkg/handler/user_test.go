package handler

import (
	"bytes"
	"errors"
	"fmt"
	"net/http/httptest"
	"strconv"
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

func TestHandler_updateScore(t *testing.T) {
	type mockBehavior func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput)

	tests := []struct {
		name                string
		inputBody           string
		updateScoreInput    gameServer.UpdateScoreInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"userId": 1, "parSetId": 1, "score": 100}`,
			updateScoreInput: gameServer.UpdateScoreInput{
				UserId:   1,
				ParSetId: 1,
				Score:    100,
			},
			mockBehavior: func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {
				r.EXPECT().UpdateScore(updateScoreInput).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:               "broken json input syntax",
			inputBody:          `{"login": "l", "password": "p"`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:      "redundant fields",
			inputBody: `{"userId": 1, "parSetId": 1, "score": 100, "abc123": "abc123"}`,
			updateScoreInput: gameServer.UpdateScoreInput{
				UserId:   1,
				ParSetId: 1,
				Score:    100,
			},
			mockBehavior: func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {
				r.EXPECT().UpdateScore(updateScoreInput).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"userId": 1, "parSetId": 1, "score": 100}`,
			updateScoreInput: gameServer.UpdateScoreInput{
				UserId:   1,
				ParSetId: 1,
				Score:    100,
			},
			mockBehavior: func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {
				r.EXPECT().UpdateScore(updateScoreInput).Return(errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:               "incorrect user id - wrong type",
			inputBody:          `{"userId": "1", "parSetId": 1, "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect user id - negative value",
			inputBody:          `{"userId": -1, "parSetId": 1, "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect user id - zero value",
			inputBody:          `{"userId": 0, "parSetId": 1, "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter set id - wrong type",
			inputBody:          `{"userId": 1, "parSetId": "1", "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter set id - negative value",
			inputBody:          `{"userId": 1, "parSetId": -1, "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter set id - zero value",
			inputBody:          `{"userId": 1, "parSetId": 0, "score": 100}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect score - wrong type",
			inputBody:          `{"userId": 1, "parSetId": 1, "score": "100"}`,
			mockBehavior:       func(r *service.MockUser, updateScoreInput gameServer.UpdateScoreInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.updateScoreInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/score", handler.updateScore)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/score", bytes.NewBufferString(tt.inputBody))

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

func TestHandler_check(t *testing.T) {
	type mockBehavior func(r *service.MockUser, accessToken string)

	tests := []struct {
		name                string
		headerName          string
		headerValue         string
		token               string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:        "ok",
			headerName:  "Authorization",
			headerValue: "Bearer token",
			token:       "token",
			mockBehavior: func(r *service.MockUser, accessToken string) {
				r.EXPECT().RefreshToken(accessToken).Return("token", nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"token":"token"}`,
		},
		{
			name:               "empty header name",
			headerName:         "",
			headerValue:        "Bearer token",
			token:              "token",
			mockBehavior:       func(r *service.MockUser, accessToken string) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:               "incorrect header value",
			headerName:         "Authorization",
			headerValue:        "Bearere token",
			token:              "token",
			mockBehavior:       func(r *service.MockUser, accessToken string) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:               "empty token",
			headerName:         "Authorization",
			headerValue:        "Bearer ",
			token:              "token",
			mockBehavior:       func(r *service.MockUser, accessToken string) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:        "internal error",
			headerName:  "Authorization",
			headerValue: "Bearer token",
			token:       "token",
			mockBehavior: func(r *service.MockUser, accessToken string) {
				r.EXPECT().RefreshToken(accessToken).Return("", errors.New(""))
			},
			expectedStatusCode: 401,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.token)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/auth", handler.check)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", "/auth", nil)
			req.Header.Set(tt.headerName, tt.headerValue)

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

func TestHandler_getOneUser(t *testing.T) {
	type mockBehavior func(r *service.MockUser, id string)

	tests := []struct {
		name                string
		paramId             string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:    "ok",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOneUser(idInt).Return(gameServer.User{
					Id:          1,
					Login:       "l",
					Password:    "p",
					Name:        "n",
					Role:        "User",
					CurParSetId: 1,
					CreatedAt:   "2023-10-01T00:00:00Z",
				},
					nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":{"user_id":1,"login":"l","password":"p","name":"n","role":"User","cur_par_set_id":1,"created_at":"2023-10-01T00:00:00Z"}}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOneUser(idInt).Return(gameServer.User{}, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.paramId)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/:id", handler.getOneUser)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", fmt.Sprintf("/%s", tt.paramId), nil)

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

func TestHandler_getUsersPageCount(t *testing.T) {
	type mockBehavior func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput)

	tests := []struct {
		name                   string
		inputBody              string
		getUsersPageCountInput gameServer.GetUsersPageCountInput
		mockBehavior           mockBehavior
		expectedStatusCode     int
		expectedRequestBody    string
		isError                bool
	}{
		{
			name:      "ok",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getUsersPageCountInput: gameServer.GetUsersPageCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {
				r.EXPECT().GetUsersPageCount(getUsersPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getUsersPageCountInput: gameServer.GetUsersPageCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {
				r.EXPECT().GetUsersPageCount(getUsersPageCountInput).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:      "empty filter tag",
			inputBody: `{"filter_tag": "", "filter_value": "f"}`,
			getUsersPageCountInput: gameServer.GetUsersPageCountInput{
				FilterTag:   "",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {
				r.EXPECT().GetUsersPageCount(getUsersPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "empty filter value",
			inputBody: `{"filter_tag": "f", "filter_value": ""}`,
			getUsersPageCountInput: gameServer.GetUsersPageCountInput{
				FilterTag:   "f",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {
				r.EXPECT().GetUsersPageCount(getUsersPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "empty filter tag and value",
			inputBody: `{"filter_tag": "", "filter_value": ""}`,
			getUsersPageCountInput: gameServer.GetUsersPageCountInput{
				FilterTag:   "",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {
				r.EXPECT().GetUsersPageCount(getUsersPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:               "incorrect filter tag - wrong type",
			inputBody:          `{"filter_tag": 1, "filter_value": "f"}`,
			mockBehavior:       func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect filter value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": 1}`,
			mockBehavior:       func(r *service.MockUser, getUsersPageCountInput gameServer.GetUsersPageCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.getUsersPageCountInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/pageCount", handler.getUsersPageCount)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/pageCount", bytes.NewBufferString(tt.inputBody))

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

func TestHandler_getParSet(t *testing.T) {
	type mockBehavior func(r *service.MockUser, id string)

	tests := []struct {
		name                string
		paramId             string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:    "ok",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetParSet(idInt).Return(gameServer.ParameterSet{
					Id:        1,
					GainCoef:  1.1,
					TimeConst: 1.1,
					NoiseCoef: 1.1,
					CreatedAt: "2023-10-01T00:00:00Z",
				},
					nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":{"id":1,"gain_coef":1.1,"time_const":1.1,"noise_coef":1.1,"created_at":"2023-10-01T00:00:00Z"}}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetParSet(idInt).Return(gameServer.ParameterSet{}, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.paramId)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/parSet/:id", handler.getParSet)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", fmt.Sprintf("/parSet/%s", tt.paramId), nil)

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

func TestHandler_getScore(t *testing.T) {
	type mockBehavior func(r *service.MockUser, userId, parSetId string)

	tests := []struct {
		name                string
		paramUserId         string
		paramParSetId       string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:          "ok",
			paramUserId:   "1",
			paramParSetId: "1",
			mockBehavior: func(r *service.MockUser, userId, parSetId string) {
				userIdInt, _ := strconv.Atoi(userId)
				parSetIdInt, _ := strconv.Atoi(parSetId)
				r.EXPECT().GetScore(userIdInt, parSetIdInt).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":1}`,
		},
		{
			name:               "incorrect parameter user id - negative value",
			paramUserId:        "-1",
			paramParSetId:      "1",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter user id - zero value",
			paramUserId:        "0",
			paramParSetId:      "1",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter user id - not a number",
			paramUserId:        "abc",
			paramParSetId:      "1",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter parameter set id - negative value",
			paramUserId:        "1",
			paramParSetId:      "-1",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter parameter set id - zero value",
			paramUserId:        "1",
			paramParSetId:      "0",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter parameter set id - not a number",
			paramUserId:        "1",
			paramParSetId:      "abc",
			mockBehavior:       func(r *service.MockUser, userId, parSetId string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:          "internal server error",
			paramUserId:   "1",
			paramParSetId: "1",
			mockBehavior: func(r *service.MockUser, userId, parSetId string) {
				userIdInt, _ := strconv.Atoi(userId)
				parSetIdInt, _ := strconv.Atoi(parSetId)
				r.EXPECT().GetScore(userIdInt, parSetIdInt).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.paramUserId, tt.paramParSetId)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/score/:userId/:parSetId", handler.getScore)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", fmt.Sprintf("/score/%s/%s", tt.paramUserId, tt.paramParSetId), nil)

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

func TestHandler_getAllUsers(t *testing.T) {
	type mockBehavior func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput)

	tests := []struct {
		name                string
		inputBody           string
		getAllUsersInput    gameServer.GetAllUsersInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"filter_tag": "f", "filter_value": "f", "current_page": 1}`,
			getAllUsersInput: gameServer.GetAllUsersInput{
				FilterTag:   "f",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {
				r.EXPECT().GetAllUsers(getAllUsersInput).Return([]gameServer.User{
					{
						Id:          1,
						Login:       "l",
						Password:    "p",
						Name:        "n",
						Role:        "User",
						CurParSetId: 1,
						CreatedAt:   "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"user_id":1,"login":"l","password":"p","name":"n","role":"User","cur_par_set_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"filter_tag": "f", "filter_value": "f", "current_page": 1}`,
			getAllUsersInput: gameServer.GetAllUsersInput{
				FilterTag:   "f",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {
				r.EXPECT().GetAllUsers(getAllUsersInput).Return(nil, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:      "empty filter tag",
			inputBody: `{"filter_tag": "", "filter_value": "f", "current_page": 1}`,
			getAllUsersInput: gameServer.GetAllUsersInput{
				FilterTag:   "",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {
				r.EXPECT().GetAllUsers(getAllUsersInput).Return([]gameServer.User{
					{
						Id:          1,
						Login:       "l",
						Password:    "p",
						Name:        "n",
						Role:        "User",
						CurParSetId: 1,
						CreatedAt:   "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"user_id":1,"login":"l","password":"p","name":"n","role":"User","cur_par_set_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "empty filter value",
			inputBody: `{"filter_tag": "f", "filter_value": "", "current_page": 1}`,
			getAllUsersInput: gameServer.GetAllUsersInput{
				FilterTag:   "f",
				FilterValue: "",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {
				r.EXPECT().GetAllUsers(getAllUsersInput).Return([]gameServer.User{
					{
						Id:          1,
						Login:       "l",
						Password:    "p",
						Name:        "n",
						Role:        "User",
						CurParSetId: 1,
						CreatedAt:   "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"user_id":1,"login":"l","password":"p","name":"n","role":"User","cur_par_set_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "empty filter tag and value",
			inputBody: `{"filter_tag": "", "filter_value": "", "current_page": 1}`,
			getAllUsersInput: gameServer.GetAllUsersInput{
				FilterTag:   "",
				FilterValue: "",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {
				r.EXPECT().GetAllUsers(getAllUsersInput).Return([]gameServer.User{
					{
						Id:          1,
						Login:       "l",
						Password:    "p",
						Name:        "n",
						Role:        "User",
						CurParSetId: 1,
						CreatedAt:   "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"user_id":1,"login":"l","password":"p","name":"n","role":"User","cur_par_set_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:               "incorrect filter tag - wrong type",
			inputBody:          `{"filter_tag": 1, "filter_value": "f", "current_page": 1}`,
			mockBehavior:       func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect filter value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": 1, "current_page": 1}`,
			mockBehavior:       func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": "1"}`,
			mockBehavior:       func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - zero value",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": 0}`,
			mockBehavior:       func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - negative value",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": -1}`,
			mockBehavior:       func(r *service.MockUser, getAllUsersInput gameServer.GetAllUsersInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.getAllUsersInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/users", handler.getAllUsers)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/users", bytes.NewBufferString(tt.inputBody))

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

func TestHandler_deleteUser(t *testing.T) {
	type mockBehavior func(r *service.MockUser, id string)

	tests := []struct {
		name                string
		paramId             string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:    "ok",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().DeleteUser(idInt).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockUser, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockUser, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().DeleteUser(idInt).Return(errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.paramId)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.DELETE("/:id", handler.deleteUser)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("DELETE", fmt.Sprintf("/%s", tt.paramId), nil)

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

func TestHandler_updateUser(t *testing.T) {
	type mockBehavior func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput)
	ptrString := func(s string) *string { return &s }
	ptrInt := func(i int) *int { return &i }

	tests := []struct {
		name                string
		paramId             string
		inputBody           string
		updateUserInput     gameServer.UpdateUserInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			paramId:   "1",
			inputBody: `{"password": "p", "role": "User", "cur_par_set_id": 1}`,
			updateUserInput: gameServer.UpdateUserInput{
				Password:    ptrString("p"),
				Role:        ptrString("User"),
				CurParSetId: ptrInt(1),
			},
			mockBehavior: func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().UpdateUser(idInt, updateUserInput).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:      "internal server error",
			paramId:   "1",
			inputBody: `{"password": "p", "role": "User", "cur_par_set_id": 1}`,
			updateUserInput: gameServer.UpdateUserInput{
				Password:    ptrString("p"),
				Role:        ptrString("User"),
				CurParSetId: ptrInt(1),
			},
			mockBehavior: func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().UpdateUser(idInt, updateUserInput).Return(errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:               "all empty fields",
			paramId:            "1",
			inputBody:          `{}`,
			updateUserInput:    gameServer.UpdateUserInput{},
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": 1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": 1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": 1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect field password - wrong type",
			paramId:            "1",
			inputBody:          `{"password": 1, "role": "User", "cur_par_set_id": 1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect field role - wrong type",
			paramId:            "1",
			inputBody:          `{"password": "p", "role": 1, "cur_par_set_id": 1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect field current parameter set id - wrong type",
			paramId:            "1",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": "1"}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect field current parameter set id - zero value",
			paramId:            "1",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": 0}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect field current parameter set id - negative value",
			paramId:            "1",
			inputBody:          `{"password": "p", "role": "User", "cur_par_set_id": -1}`,
			mockBehavior:       func(r *service.MockUser, id string, updateUserInput gameServer.UpdateUserInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock, tt.paramId, tt.updateUserInput)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.PUT("/:id", handler.updateUser)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("PUT", fmt.Sprintf("/%s", tt.paramId), bytes.NewBufferString(tt.inputBody))

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
