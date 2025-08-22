package handler

import (
	"errors"
	"fmt"
	"net/http/httptest"
	"testing"

	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHandler_checkUserAuth(t *testing.T) {
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
				r.EXPECT().ParseToken(accessToken).Return(&service.TokenClaims{
					UserId: 1,
					Login:  "l",
					Role:   "User",
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `1`,
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
				r.EXPECT().ParseToken(accessToken).Return(nil, errors.New(""))
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
			r.GET("/auth", handler.checkUserAuth, func(c *gin.Context) {
				userId, _ := c.Get(userCtx)
				c.String(200, fmt.Sprintf("%d", userId.(int)))
			})

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
