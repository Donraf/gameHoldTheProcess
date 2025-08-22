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

func TestHandler_createPoint(t *testing.T) {
	type mockBehavior func(r *service.MockPoint, point gameServer.Point)

	tests := []struct {
		name                string
		inputBody           string
		point               gameServer.Point
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
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
			mockBehavior: func(r *service.MockPoint, point gameServer.Point) {
				r.EXPECT().CreatePoint(point).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"id":1}`,
		},
		{
			name:               "incorrect chart id - negative value",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": -1}`,
			mockBehavior:       func(r *service.MockPoint, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - zero value",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 0}`,
			mockBehavior:       func(r *service.MockPoint, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - wrong type",
			inputBody:          `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": "1"}`,
			mockBehavior:       func(r *service.MockPoint, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect chart id - negative value",
			inputBody:          `{"x": -1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": -1}`,
			mockBehavior:       func(r *service.MockPoint, point gameServer.Point) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:      "internal server error",
			inputBody: `{"x": 1, "y": 1, "score": 1, "is_crash": false, "is_useful_ai_signal": false, "is_deceptive_ai_signal": false, "is_stop": false, "is_pause": false, "is_check": false, "chart_id": 1}`,
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
			mockBehavior: func(r *service.MockPoint, point gameServer.Point) {
				r.EXPECT().CreatePoint(point).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			tt.mockBehavior(pointMock, tt.point)

			services := &service.Service{Point: pointMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/", handler.createPoint)

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
	type mockBehavior func(r *service.MockPoint, id string)

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
			mockBehavior: func(r *service.MockPoint, id string) {
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
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":{"id":1,"x":1,"y":1,"score":1,"is_crash":false,"is_useful_ai_signal":false,"is_deceptive_ai_signal":false,"is_stop":false,"is_pause":false,"is_check":false,"chart_id":1,"created_at":"2023-10-01T00:00:00Z"}}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockPoint, id string) {
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
			tt.mockBehavior(pointMock, tt.paramId)

			services := &service.Service{Point: pointMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/:id", handler.getOnePoint)

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
	type mockBehavior func(r *service.MockPoint, id string)

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
			mockBehavior: func(r *service.MockPoint, id string) {
				idInt, _ := strconv.Atoi(id)
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
			expectedRequestBody: `{"data":[{"id":1,"x":1,"y":1,"score":1,"is_crash":false,"is_useful_ai_signal":false,"is_deceptive_ai_signal":false,"is_stop":false,"is_pause":false,"is_check":false,"chart_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:               "incorrect parameter chart id - negative value",
			paramChartId:       "-1",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter chart id - zero value",
			paramChartId:       "0",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter chart id - not a number",
			paramChartId:       "abc",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:         "internal server error",
			paramChartId: "1",
			mockBehavior: func(r *service.MockPoint, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetAllPointsById(idInt).Return(nil, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pointMock := service.NewMockPoint(t)
			tt.mockBehavior(pointMock, tt.paramChartId)

			services := &service.Service{Point: pointMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/chart_id/:chart_id", handler.getAllPointsById)

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
	type mockBehavior func(r *service.MockPoint, id string)

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
			mockBehavior: func(r *service.MockPoint, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().DeletePoint(idInt).Return(nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"status":"ok"}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockPoint, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockPoint, id string) {
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
			tt.mockBehavior(pointMock, tt.paramId)

			services := &service.Service{Point: pointMock}
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
