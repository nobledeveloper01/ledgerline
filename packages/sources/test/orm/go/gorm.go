package model

type Invoice struct {
	ID        uint   `gorm:"primaryKey"`
	Reference string `gorm:"size:64;unique;not null"`
	Body      string `gorm:"type:text"`
	CompanyID uint   `gorm:"column:company_ref"`
	Secret    string `gorm:"-"`
}
