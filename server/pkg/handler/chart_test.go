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

func TestHandler_createChart(t *testing.T) {
	type mockBehavior func(r *service.MockChart, createChartInput gameServer.CreateChartInput)

	tests := []struct {
		name                string
		inputBody           string
		createChartInput    gameServer.CreateChartInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"par_set_id": 1, "user_id": 1}`,
			createChartInput: gameServer.CreateChartInput{
				ParameterSetId: 1,
				UserId:         1,
			},
			mockBehavior: func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {
				r.EXPECT().CreateChart(createChartInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"id":1}`,
		},
		{
			name:               "incorrect user id - negative value",
			inputBody:          `{"par_set_id": 1, "user_id": -1}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect user id - zero value",
			inputBody:          `{"par_set_id": 1, "user_id": 0}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect user id - wrong type",
			inputBody:          `{"par_set_id": 1, "user_id": "1"}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter set id - negative value",
			inputBody:          `{"par_set_id": -1, "user_id": 1}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter set id - zero value",
			inputBody:          `{"par_set_id": 0, "user_id": 1}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect usparameter seter id - wrong type",
			inputBody:          `{"par_set_id": "1", "user_id": 1}`,
			mockBehavior:       func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:      "internal server error",
			inputBody: `{"par_set_id": 1, "user_id": 1}`,
			createChartInput: gameServer.CreateChartInput{
				ParameterSetId: 1,
				UserId:         1,
			},
			mockBehavior: func(r *service.MockChart, createChartInput gameServer.CreateChartInput) {
				r.EXPECT().CreateChart(createChartInput).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(chartMock, tt.createChartInput)

			services := &service.Service{Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/", handler.createChart)

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
