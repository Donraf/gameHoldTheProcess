package handler

import (
	"bytes"
	"errors"
	"net/http/httptest"
	"testing"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestHandler_startSession(t *testing.T) {
	type mockBehavior func(r *service.MockUser)

	tests := []struct {
		name               string
		inputBody          string
		ctxUserId          int
		mockBehavior       mockBehavior
		expectedStatusCode int
		expectedContains   string
		isError            bool
	}{
		{
			name:      "start training session",
			inputBody: `{"par_set_id": 1}`,
			ctxUserId: 1,
			mockBehavior: func(r *service.MockUser) {
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true}, nil).Once()
				r.EXPECT().StartUserSession(1, 1, true, mock.Anything).Return(nil)
				start := gameServer.Now()
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true, TrainingStartTime: &start}, nil).Once()
			},
			expectedStatusCode: 200,
			expectedContains:   "training_start_time",
		},
		{
			name:      "start main session",
			inputBody: `{"par_set_id": 1}`,
			ctxUserId: 1,
			mockBehavior: func(r *service.MockUser) {
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: false}, nil).Once()
				r.EXPECT().StartUserSession(1, 1, false, mock.Anything).Return(nil)
				start := gameServer.Now()
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: false, GameStartTime: &start}, nil).Once()
			},
			expectedStatusCode: 200,
			expectedContains:   "game_start_time",
		},
		{
			name:      "idempotent when session already started",
			inputBody: `{"par_set_id": 1}`,
			ctxUserId: 1,
			mockBehavior: func(r *service.MockUser) {
				start := gameServer.Now().Add(-5 * time.Minute)
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: false, GameStartTime: &start}, nil)
			},
			expectedStatusCode: 200,
			expectedContains:   "rem_time_ms",
		},
		{
			name:               "incorrect parameter set id",
			inputBody:          `{"par_set_id": 0}`,
			ctxUserId:          1,
			mockBehavior:       func(r *service.MockUser) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "not authorized",
			inputBody:          `{"par_set_id": 1}`,
			ctxUserId:          0,
			mockBehavior:       func(r *service.MockUser) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:      "internal server error",
			inputBody: `{"par_set_id": 1}`,
			ctxUserId: 1,
			mockBehavior: func(r *service.MockUser) {
				r.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{}, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userMock := service.NewMockUser(t)
			tt.mockBehavior(userMock)

			services := &service.Service{User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/session/start", func(c *gin.Context) {
				if tt.ctxUserId != 0 {
					c.Set(userCtx, tt.ctxUserId)
					c.Set(userCtxRole, gameServer.RoleUser)
				}
				handler.startSession(c)
			})

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/session/start", bytes.NewBufferString(tt.inputBody))

			r.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatusCode, w.Code)
			if tt.isError {
				assert.Contains(t, w.Body.String(), "error")
			} else {
				assert.Contains(t, w.Body.String(), tt.expectedContains)
			}
		})
	}
}
