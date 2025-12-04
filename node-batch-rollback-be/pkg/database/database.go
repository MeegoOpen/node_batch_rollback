package database

import (
	"fmt"
	"sync"

	"gorm.io/driver/mysql"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var (
	db   *gorm.DB
	once sync.Once
)

type Config struct {
	Driver   string
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

func InitDB(cfg Config) (err error) {
	once.Do(func() {
		switch cfg.Driver {
		case "mysql":
			dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
				cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName)
			db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		case "sqlite":
			db, err = gorm.Open(sqlite.Open(cfg.DBName), &gorm.Config{})
		}
	})
	return
}

func GetDB() *gorm.DB {
	return db
}