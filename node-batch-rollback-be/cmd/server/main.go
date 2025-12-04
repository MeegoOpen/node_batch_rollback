package main

import (
	"fmt"
	"log"

	"node_operator_standalone/internal/auth"
	"node_operator_standalone/internal/handler"
	"node_operator_standalone/internal/model"
	"node_operator_standalone/pkg/config"
	"node_operator_standalone/pkg/database"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig("configs/config.yaml")
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// Initialize Feishu auth
	feishuAuth := auth.NewFeishuAuth(cfg.Feishu.APIHost, cfg.Feishu.PluginID, cfg.Feishu.PluginSecret)

	// Initialize database
	dbConfig := database.Config{
		Driver:   cfg.Database.Driver,
		Host:     cfg.Database.Host,
		Port:     cfg.Database.Port,
		User:     cfg.Database.User,
		Password: cfg.Database.Password,
		DBName:   cfg.Database.DBName,
	}
	if err := database.InitDB(dbConfig); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	// Migrate the schema
	db := database.GetDB()
	if err := db.AutoMigrate(&model.NodeOperatorConfig{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	// Set up router
	router := handler.NewRouter(feishuAuth, cfg)

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("server listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
