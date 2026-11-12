package gameServer

// Shared pagination limits. Used both by the service layer (page count
// computation) and the repository layer (SQL LIMIT/OFFSET clauses), so
// changing a limit here keeps the two sides in sync.
const (
	DefaultPageLimit      = 9
	PlayerEventsPageLimit = 20
)
