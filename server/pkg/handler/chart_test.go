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

func TestHandler_getOneChart(t *testing.T) {
	type mockBehavior func(r *service.MockChart, id string)

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
			mockBehavior: func(r *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOneChart(idInt).Return(gameServer.Chart{
					Id:             1,
					ParameterSetId: 1,
					UserId:         1,
					CreatedAt:      "2023-10-01T00:00:00Z",
				},
					nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":{"id":1,"parameter_set_id":1,"user_id":1,"created_at":"2023-10-01T00:00:00Z"}}`,
		},
		{
			name:               "incorrect parameter id - negative value",
			paramId:            "-1",
			mockBehavior:       func(r *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - zero value",
			paramId:            "0",
			mockBehavior:       func(r *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect parameter id - not a number",
			paramId:            "abc",
			mockBehavior:       func(r *service.MockChart, id string) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:    "internal server error",
			paramId: "1",
			mockBehavior: func(r *service.MockChart, id string) {
				idInt, _ := strconv.Atoi(id)
				r.EXPECT().GetOneChart(idInt).Return(gameServer.Chart{}, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(chartMock, tt.paramId)

			services := &service.Service{Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.GET("/:id", handler.getOneChart)

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

func TestHandler_getChartsPageCount(t *testing.T) {
	type mockBehavior func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput)

	tests := []struct {
		name                    string
		inputBody               string
		getChartsPageCountInput gameServer.GetChartsPageCountInput
		mockBehavior            mockBehavior
		expectedStatusCode      int
		expectedRequestBody     string
		isError                 bool
	}{
		{
			name:      "ok",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getChartsPageCountInput: gameServer.GetChartsPageCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {
				r.EXPECT().GetChartsPageCount(getChartsPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getChartsPageCountInput: gameServer.GetChartsPageCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {
				r.EXPECT().GetChartsPageCount(getChartsPageCountInput).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:      "empty filter tag",
			inputBody: `{"filter_tag": "", "filter_value": "f"}`,
			getChartsPageCountInput: gameServer.GetChartsPageCountInput{
				FilterTag:   "",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {
				r.EXPECT().GetChartsPageCount(getChartsPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "empty filter value",
			inputBody: `{"filter_tag": "f", "filter_value": ""}`,
			getChartsPageCountInput: gameServer.GetChartsPageCountInput{
				FilterTag:   "f",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {
				r.EXPECT().GetChartsPageCount(getChartsPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:      "empty filter tag and value",
			inputBody: `{"filter_tag": "", "filter_value": ""}`,
			getChartsPageCountInput: gameServer.GetChartsPageCountInput{
				FilterTag:   "",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {
				r.EXPECT().GetChartsPageCount(getChartsPageCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"pageCount":1}`,
		},
		{
			name:               "incorrect filter tag - wrong type",
			inputBody:          `{"filter_tag": 1, "filter_value": "f"}`,
			mockBehavior:       func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect filter value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": 1}`,
			mockBehavior:       func(r *service.MockChart, getChartsPageCountInput gameServer.GetChartsPageCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(chartMock, tt.getChartsPageCountInput)

			services := &service.Service{Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/pageCount", handler.getChartsPageCount)

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

func TestHandler_getChartsCount(t *testing.T) {
	type mockBehavior func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput)

	tests := []struct {
		name                string
		inputBody           string
		getChartsCountInput gameServer.GetChartsCountInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getChartsCountInput: gameServer.GetChartsCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {
				r.EXPECT().GetChartsCount(getChartsCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"count":1}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"filter_tag": "f", "filter_value": "f"}`,
			getChartsCountInput: gameServer.GetChartsCountInput{
				FilterTag:   "f",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {
				r.EXPECT().GetChartsCount(getChartsCountInput).Return(0, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:      "empty filter tag",
			inputBody: `{"filter_tag": "", "filter_value": "f"}`,
			getChartsCountInput: gameServer.GetChartsCountInput{
				FilterTag:   "",
				FilterValue: "f",
			},
			mockBehavior: func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {
				r.EXPECT().GetChartsCount(getChartsCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"count":1}`,
		},
		{
			name:      "empty filter value",
			inputBody: `{"filter_tag": "f", "filter_value": ""}`,
			getChartsCountInput: gameServer.GetChartsCountInput{
				FilterTag:   "f",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {
				r.EXPECT().GetChartsCount(getChartsCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"count":1}`,
		},
		{
			name:      "empty filter tag and value",
			inputBody: `{"filter_tag": "", "filter_value": ""}`,
			getChartsCountInput: gameServer.GetChartsCountInput{
				FilterTag:   "",
				FilterValue: "",
			},
			mockBehavior: func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {
				r.EXPECT().GetChartsCount(getChartsCountInput).Return(1, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"count":1}`,
		},
		{
			name:               "incorrect filter tag - wrong type",
			inputBody:          `{"filter_tag": 1, "filter_value": "f"}`,
			mockBehavior:       func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect filter value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": 1}`,
			mockBehavior:       func(r *service.MockChart, getChartsCountInput gameServer.GetChartsCountInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(chartMock, tt.getChartsCountInput)

			services := &service.Service{Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/count", handler.getChartsCount)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/count", bytes.NewBufferString(tt.inputBody))

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

func TestHandler_getAllCharts(t *testing.T) {
	type mockBehavior func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput)

	tests := []struct {
		name                string
		inputBody           string
		getAllChartsInput   gameServer.GetAllChartsInput
		mockBehavior        mockBehavior
		expectedStatusCode  int
		expectedRequestBody string
		isError             bool
	}{
		{
			name:      "ok",
			inputBody: `{"filter_tag": "f", "filter_value": "f", "current_page": 1}`,
			getAllChartsInput: gameServer.GetAllChartsInput{
				FilterTag:   "f",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {
				r.EXPECT().GetAllCharts(getAllChartsInput).Return([]gameServer.Chart{
					{
						Id:             1,
						ParameterSetId: 1,
						UserId:         1,
						CreatedAt:      "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"id":1,"parameter_set_id":1,"user_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "internal server error",
			inputBody: `{"filter_tag": "f", "filter_value": "f", "current_page": 1}`,
			getAllChartsInput: gameServer.GetAllChartsInput{
				FilterTag:   "f",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {
				r.EXPECT().GetAllCharts(getAllChartsInput).Return(nil, errors.New(""))
			},
			expectedStatusCode: 500,
			isError:            true,
		},
		{
			name:      "empty filter tag",
			inputBody: `{"filter_tag": "", "filter_value": "f", "current_page": 1}`,
			getAllChartsInput: gameServer.GetAllChartsInput{
				FilterTag:   "",
				FilterValue: "f",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {
				r.EXPECT().GetAllCharts(getAllChartsInput).Return([]gameServer.Chart{
					{
						Id:             1,
						ParameterSetId: 1,
						UserId:         1,
						CreatedAt:      "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"id":1,"parameter_set_id":1,"user_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "empty filter value",
			inputBody: `{"filter_tag": "f", "filter_value": "", "current_page": 1}`,
			getAllChartsInput: gameServer.GetAllChartsInput{
				FilterTag:   "f",
				FilterValue: "",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {
				r.EXPECT().GetAllCharts(getAllChartsInput).Return([]gameServer.Chart{
					{
						Id:             1,
						ParameterSetId: 1,
						UserId:         1,
						CreatedAt:      "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"id":1,"parameter_set_id":1,"user_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:      "empty filter tag and value",
			inputBody: `{"filter_tag": "", "filter_value": "", "current_page": 1}`,
			getAllChartsInput: gameServer.GetAllChartsInput{
				FilterTag:   "",
				FilterValue: "",
				CurrentPage: 1,
			},
			mockBehavior: func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {
				r.EXPECT().GetAllCharts(getAllChartsInput).Return([]gameServer.Chart{
					{
						Id:             1,
						ParameterSetId: 1,
						UserId:         1,
						CreatedAt:      "2023-10-01T00:00:00Z",
					},
				}, nil)
			},
			expectedStatusCode:  200,
			expectedRequestBody: `{"data":[{"id":1,"parameter_set_id":1,"user_id":1,"created_at":"2023-10-01T00:00:00Z"}]}`,
		},
		{
			name:               "incorrect filter tag - wrong type",
			inputBody:          `{"filter_tag": 1, "filter_value": "f", "current_page": 1}`,
			mockBehavior:       func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect filter value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": 1, "current_page": 1}`,
			mockBehavior:       func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - wrong type",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": "1"}`,
			mockBehavior:       func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - zero value",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": 0}`,
			mockBehavior:       func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
		{
			name:               "incorrect current page value - negative value",
			inputBody:          `{"filter_tag": "f", "filter_value": "f", "current_page": -1}`,
			mockBehavior:       func(r *service.MockChart, getAllChartsInput gameServer.GetAllChartsInput) {},
			expectedStatusCode: 400,
			isError:            true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chartMock := service.NewMockChart(t)
			tt.mockBehavior(chartMock, tt.getAllChartsInput)

			services := &service.Service{Chart: chartMock}
			handler := NewHandler(services)

			gin.SetMode(gin.TestMode)
			r := gin.New()
			r.POST("/charts", handler.getAllCharts)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/charts", bytes.NewBufferString(tt.inputBody))

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
