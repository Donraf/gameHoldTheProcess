package handler

import (
	"bytes"
	"errors"
	"fmt"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/service"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHandler_createPoint(t *testing.T) {
	type mockBehavior func(pointMock *service.MockPoint, chartMock *service.MockChart, userMock *service.MockUser, point gameServer.Point)

	tests := []struct {
		name                string
		inputBody           string
		ctxUserId           int
		point               gameServer.Point
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
			ctxUserId: 1,
			point: gameServer.Point{
				X:                   1,
				Y:                   1,
				Score:               1,
				IsCrash:             false,
				IsUsefulAiSignal:    false,
				IsDeceptiveAiSignal: false,
				IsStop:              false,
				IsPause:             false,
				IsCheck:             false,
				ChartId:             1,
			},
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				start := gameServer.Now()
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true, TrainingStartTime: &start}, nil)
				pm.EXPECT().CreatePoint(point).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"id":1}`,
		},
		{
			name:               "incorrect chart id - negative value",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": -1}`,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - zero value",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 0}`,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - wrong type",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": "1"}`,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - negative value",
			inputBody:          `{"x": -1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": -1}`,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:      "session time is up",
			inputBody: `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
			ctxUserId: 1,
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				expired := gameServer.Now().Add(-50 * time.Minute)
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: false, GameStartTime: &expired}, nil)
			},
			expectedStatusCode: 403,
			isError:            true,
		},
		{
			name:               "not authorized",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
			ctxUserId:          0,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:      "internal server error",
			inputBody: `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
			ctxUserId: 1,
			point: gameServer.Point{
				X:                   1,
				Y:                   1,
				Score:               1,
				IsCrash:             false,
				IsUsefulAiSignal:    false,
				IsDeceptiveAiSignal: false,
				IsStop:              false,
				IsPause:             false,
				IsCheck:             false,
				ChartId:             1,
			},
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, point gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				start := gameServer.Now()
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true, TrainingStartTime: &start}, nil)
				pm.EXPECT().CreatePoint(point).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			chartMock := service.NewMockChart(t)
			userMock := service.NewMockUser(t)
			tt.mockBehavior(pointMock, chartMock, userMock, tt.point)

			services := &service.Service{Point: pointMock, Chart: chartMock, User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/", func(c *gin.Context) {
				if tt.ctxUserId != 0 {
					c.Set(userCtx, tt.ctxUserId)
					c.Set(userCtxRole, gameServer.RoleUser)
				}
				handler.createPoint(c)
			})

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/", bytes.NewBufferString(tt.inputBody))

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

func TestHandler_getOnePoint(t *testing.T) {
	type mockBehavior func(r *service.MockPoint, cm *service.MockChart, id string)

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
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOnePoint(idInt).Return(gameServer.Point{
					Id:                  1,
					X:                   1,
					Y:                   1,
					Score:               1,
					IsCrash:             false,
					IsUsefulAiSignal:    false,
					IsDeceptiveAiSignal: false,
					IsStop:              false,
					IsPause:             false,
					IsCheck:             false,
					ChartId:             1,
					CreatedAt:           "2023-10-01T00:00:00Z",
				},
					nil)
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":{"id":1,"x":1,"y":1,"score":1,"is_crash":false,"is_useful_ai_signal":false,"is_deceptive_ai_signal":false,"is_stop":false,"is_pause":false,"is_check":false,"chart_id":1,"created_at":"2023-10-01T00:00:00Z","check_info":null}}`,
		},
		{
			name:    "another user's point is forbidden",
			paramId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOnePoint(idInt).Return(gameServer.Point{Id: 1, ChartId: 1}, nil)
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 5}, nil)
			},
			expectedStatusCode: 403,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOnePoint(idInt).Return(gameServer.Point{}, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(pointMock, chartMock, tt.paramId)

			services := &service.Service{Point: pointMock, Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/:id", func(c *gin.Context) {
				c.Set(userCtx, 1)
				c.Set(userCtxRole, gameServer.RoleUser)
				handler.getOnePoint(c)
			})

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

func TestHandler_getAllPointsById(t *testing.T) {
	type mockBehavior func(r *service.MockPoint, cm *service.MockChart, id string)

	tests := []struct {
		name                string
		paramChartId        string
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:         "ok",
			paramChartId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1}, nil)
				r.EXPECT().GetAllPointsById(idInt).Return([]gameServer.Point{
					{
						Id:                  1,
						X:                   1,
						Y:                   1,
						Score:               1,
						IsCrash:             false,
						IsUsefulAiSignal:    false,
						IsDeceptiveAiSignal: false,
						IsStop:              false,
						IsPause:             false,
						IsCheck:             false,
						ChartId:             1,
						CreatedAt:           "2023-10-01T00:00:00Z",
					},
				},
					nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"id":1,"x":1,"y":1,"score":1,"is_crash":false,"is_useful_ai_signal":false,"is_deceptive_ai_signal":false,"is_stop":false,"is_pause":false,"is_check":false,"chart_id":1,"created_at":"2023-10-01T00:00:00Z","check_info":null}]}`,
		},
		{
			name:               "incorrect parameter chart id - negative value",
			paramChartId:       "-1",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter chart id - zero value",
			paramChartId:       "0",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter chart id - not a number",
			paramChartId:       "abc",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:         "another user's chart points are forbidden",
			paramChartId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 5}, nil)
			},
			expectedStatusCode: 403,
			isError:            true,
		},
		{
			name:         "internal server error",
			paramChartId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1}, nil)
				r.EXPECT().GetAllPointsById(idInt).Return(nil, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(pointMock, chartMock, tt.paramChartId)

			services := &service.Service{Point: pointMock, Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/chart_id/:chart_id", func(c *gin.Context) {
				c.Set(userCtx, 1)
				c.Set(userCtxRole, gameServer.RoleUser)
				handler.getAllPointsById(c)
			})

			w := httptest.NewRecorder()
			req := httptest.NewRequest("GET", fmt.Sprintf("/chart_id/%s", tt.paramChartId), nil)

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

func TestHandler_deletePoint(t *testing.T) {
	type mockBehavior func(r *service.MockPoint, cm *service.MockChart, id string)

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
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().DeletePoint(idInt).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockPoint, cm *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockPoint, cm *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().DeletePoint(idInt).Return(errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(pointMock, chartMock, tt.paramId)

			services := &service.Service{Point: pointMock, Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.DELETE("/:id", handler.deletePoint)

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

func TestHandler_createPoints(t *testing.T) {
	type mockBehavior func(pointMock *service.MockPoint, chartMock *service.MockChart, userMock *service.MockUser, points []gameServer.Point)

	twoPoints := []gameServer.Point{
		{X: 1, Y: 1, Score: 1, ChartId: 1},
		{X: 2, Y: 2, Score: 2, ChartId: 1},
	}

	tests := []struct {
		name                string
		inputBody           string
		ctxUserId           int
		points              []gameServer.Point
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `[{"x": 1, "y": 1, "score": 1, "chart_id": 1}, {"x": 2, "y": 2, "score": 2, "chart_id": 1}]`,
			ctxUserId: 1,
			points:    twoPoints,
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				start := gameServer.Now()
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true, TrainingStartTime: &start}, nil)
				pm.EXPECT().CreatePoints(points).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:               "empty array",
			inputBody:          `[]`,
			ctxUserId:          1,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "different chart ids",
			inputBody:          `[{"x": 1, "y": 1, "score": 1, "chart_id": 1}, {"x": 2, "y": 2, "score": 2, "chart_id": 2}]`,
			ctxUserId:          1,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "invalid point",
			inputBody:          `[{"x": -1, "y": 1, "score": 1, "chart_id": 1}]`,
			ctxUserId:          1,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "not authorized",
			inputBody:          `[{"x": 1, "y": 1, "score": 1, "chart_id": 1}]`,
			ctxUserId:          0,
			mockBehavior:       func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {},
			expectedStatusCode: 401,
			isError:            true,
		},
		{
			name:      "session time is up",
			inputBody: `[{"x": 1, "y": 1, "score": 1, "chart_id": 1}]`,
			ctxUserId: 1,
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				expired := gameServer.Now().Add(-50 * time.Minute)
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: false, GameStartTime: &expired}, nil)
			},
			expectedStatusCode: 403,
			isError:            true,
		},
		{
			name:      "internal server error",
			inputBody: `[{"x": 1, "y": 1, "score": 1, "chart_id": 1}]`,
			ctxUserId: 1,
			points:    []gameServer.Point{{X: 1, Y: 1, Score: 1, ChartId: 1}},
			mockBehavior: func(pm *service.MockPoint, cm *service.MockChart, um *service.MockUser, points []gameServer.Point) {
				cm.EXPECT().GetOneChart(1).Return(gameServer.Chart{Id: 1, UserId: 1, ParameterSetId: 1}, nil)
				start := gameServer.Now()
				um.EXPECT().GetUserParameterSet(1, 1).Return(gameServer.UserParameterSet{IsTraining: true, TrainingStartTime: &start}, nil)
				pm.EXPECT().CreatePoints(points).Return(errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			chartMock := service.NewMockChart(t)
			userMock := service.NewMockUser(t)
			tt.mockBehavior(pointMock, chartMock, userMock, tt.points)

			services := &service.Service{Point: pointMock, Chart: chartMock, User: userMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/", func(c *gin.Context) {
				if tt.ctxUserId != 0 {
					c.Set(userCtx, tt.ctxUserId)
					c.Set(userCtxRole, gameServer.RoleUser)
				}
				handler.createPoints(c)
			})

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/", bytes.NewBufferString(tt.inputBody))

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
