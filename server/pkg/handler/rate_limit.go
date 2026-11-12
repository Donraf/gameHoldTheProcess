package handler

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	// maxEntries bounds the limiter memory; when reached, expired
	// entries are swept before inserting a new one.
	maxEntries = 10000
)

// rateLimiter is a simple in-memory fixed-window rate limiter keyed by client IP.
type rateLimiter struct {
	mu      sync.Mutex
	entries map[string]*rateLimitEntry
	limit   int
	window  time.Duration
}

type rateLimitEntry struct {
	count       int
	windowStart time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		entries: make(map[string]*rateLimitEntry),
		limit:   limit,
		window:  window,
	}
}

func (rl *rateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	if len(rl.entries) >= maxEntries {
		for k, e := range rl.entries {
			if now.Sub(e.windowStart) >= rl.window {
				delete(rl.entries, k)
			}
		}
	}

	entry, ok := rl.entries[key]
	if !ok || now.Sub(entry.windowStart) >= rl.window {
		rl.entries[key] = &rateLimitEntry{count: 1, windowStart: now}
		return true
	}

	entry.count++
	return entry.count <= rl.limit
}

// rateLimitMiddleware rejects requests with 429 once the limiter is exhausted.
func rateLimitMiddleware(rl *rateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !rl.allow(c.ClientIP()) {
			newErrorResponse(c, http.StatusTooManyRequests, "too many attempts, try again later")
			return
		}
		c.Next()
	}
}
