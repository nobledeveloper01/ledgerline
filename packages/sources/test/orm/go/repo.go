package model

import "time"

// Woodpecker's real shape: a quoted column name, UNIQUE groups, an explicit
// varchar, and a TableName() in another file.
type Repo struct {
	ID       int64  `json:"id,omitempty" xorm:"pk autoincr 'id'"`
	UserID   int64  `json:"-"            xorm:"INDEX 'user_id'"`
	OrgID    int64  `json:"org_id"       xorm:"INDEX 'org_id'"`
	Owner    string `json:"owner"        xorm:"UNIQUE(name) 'owner'"`
	Avatar   string `json:"avatar_url"   xorm:"varchar(500) 'avatar'"`
	Trusted  string `json:"trusted"      xorm:"json 'trusted'"`
	Timeout  int64  `json:"timeout"      xorm:"timeout"`
	Created  time.Time
	Internal string `json:"-" xorm:"-"`
}

// A struct with no tags at all is not a model.
type SearchRequest struct {
	Query string
	Limit int
}
