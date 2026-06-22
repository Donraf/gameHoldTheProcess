package service

import (
	"encoding/json"
	"errors"

	gameServer "example.com/gameHoldTheProcessServer"
	"example.com/gameHoldTheProcessServer/pkg/repository"
)

type TestService struct {
	repo repository.Test
}

func NewTestService(repo repository.Test) *TestService {
	return &TestService{repo: repo}
}

func (t *TestService) GetAllTests() ([]gameServer.Test, error) {
	return t.repo.GetAllTests()
}

func (t *TestService) GetSessionStatus(userId int) (gameServer.TestSessionStatus, error) {
	activeTests, err := t.repo.GetActiveTests()
	if err != nil {
		return gameServer.TestSessionStatus{}, err
	}

	completed, err := t.repo.GetCompletedTestIds(userId)
	if err != nil {
		return gameServer.TestSessionStatus{}, err
	}

	activeWithStatus := make([]gameServer.TestWithStatus, 0, len(activeTests))
	pending := make([]gameServer.TestWithStatus, 0)

	for _, test := range activeTests {
		item := gameServer.TestWithStatus{
			Test:      test,
			Completed: completed[test.Id],
		}
		activeWithStatus = append(activeWithStatus, item)
		if !item.Completed {
			pending = append(pending, item)
		}
	}

	return gameServer.TestSessionStatus{
		HasActiveTests: len(activeTests) > 0,
		AllCompleted:   len(activeTests) == 0 || len(pending) == 0,
		PendingTests:   pending,
		ActiveTests:    activeWithStatus,
	}, nil
}

func (t *TestService) SubmitResult(userId int, input gameServer.SubmitTestResultInput) (int, error) {
	test, err := t.repo.GetOneTest(input.TestId)
	if err != nil {
		return 0, err
	}
	if !test.IsActive {
		return 0, errors.New("test is not active")
	}

	score, err := calculateTestScore(test.Slug, test.Config, input.Answers)
	if err != nil {
		return 0, err
	}

	return t.repo.CreateTestResult(userId, input, score)
}

func (t *TestService) CreateTest(input gameServer.CreateTestInput) (int, error) {
	return t.repo.CreateTest(input)
}

func (t *TestService) UpdateTest(id int, input gameServer.UpdateTestInput) error {
	return t.repo.UpdateTest(id, input)
}

func (t *TestService) DeleteTest(id int) error {
	return t.repo.DeleteTest(id)
}

func (t *TestService) GetUserResults(userId int) ([]gameServer.TestResult, error) {
	return t.repo.GetUserResults(userId)
}

func (t *TestService) GetUserResultsWithTests(userId int) ([]gameServer.TestResultWithTest, error) {
	return t.repo.GetUserResultsWithTests(userId)
}

func calculateTestScore(slug string, config json.RawMessage, answers json.RawMessage) (*float64, error) {
	switch slug {
	case gameServer.TestTypeLikert:
		return calculateLikertScore(config, answers)
	default:
		return nil, nil
	}
}

func calculateLikertScore(config json.RawMessage, answers json.RawMessage) (*float64, error) {
	var configData struct {
		Questions []struct {
			Id string `json:"id"`
		} `json:"questions"`
	}
	if err := json.Unmarshal(config, &configData); err != nil {
		return nil, err
	}

	var answerData map[string]float64
	if err := json.Unmarshal(answers, &answerData); err != nil {
		return nil, err
	}

	if len(configData.Questions) == 0 {
		return nil, nil
	}

	var sum float64
	var count float64
	for _, question := range configData.Questions {
		value, ok := answerData[question.Id]
		if !ok {
			continue
		}
		sum += value
		count++
	}
	if count == 0 {
		return nil, nil
	}

	score := sum / count
	return &score, nil
}
