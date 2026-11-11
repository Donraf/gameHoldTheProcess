package gameServer

import "testing"

func TestGetAllUsersInputOrderByClause(t *testing.T) {
	tests := []struct {
		name     string
		input    GetAllUsersInput
		alias    string
		expected string
	}{
		{
			name:     "default login asc",
			input:    GetAllUsersInput{},
			alias:    "",
			expected: "login ASC, user_id ASC",
		},
		{
			name:     "age desc with alias",
			input:    GetAllUsersInput{SortBy: "age", SortDir: "desc"},
			alias:    "ut",
			expected: "COALESCE(ut.age, 0) DESC, ut.user_id ASC",
		},
		{
			name:     "experience as total months",
			input:    GetAllUsersInput{SortBy: "experience", SortDir: "asc"},
			alias:    "ut",
			expected: "(COALESCE(ut.experience_years, 0) * 12 + COALESCE(ut.experience_months, 0)) ASC, ut.user_id ASC",
		},
		{
			name:     "unknown column falls back to login",
			input:    GetAllUsersInput{SortBy: "password; DROP TABLE users", SortDir: "DROP"},
			alias:    "",
			expected: "login ASC, user_id ASC",
		},
		{
			name:     "only asc or desc directions",
			input:    GetAllUsersInput{SortBy: "name", SortDir: "1); DELETE FROM users--"},
			alias:    "",
			expected: "name ASC, user_id ASC",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.input.OrderByClause(tt.alias)
			if got != tt.expected {
				t.Errorf("OrderByClause() = %q, want %q", got, tt.expected)
			}
		})
	}
}
