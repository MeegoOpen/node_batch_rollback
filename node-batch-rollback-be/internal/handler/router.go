package handler

import (
	"node_operator_standalone/internal/auth"
	"node_operator_standalone/pkg/config"

	"github.com/gin-gonic/gin"
)

func NewRouter(feishuAuth *auth.FeishuAuth, cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// 配置CORS中间件，允许所有域名访问
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, x-user-key,locale")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	configHandler := NewConfigHandler()
	proxyHandler := NewProxyHandler(cfg.Feishu.APIHost, feishuAuth)

	api := router.Group("/api")
	{
		v1 := api.Group("/v1")
		{
			nodeOperator := v1.Group("/node-operator")
			{
				nodeOperator.GET("/settings", configHandler.QueryConfig)
				nodeOperator.POST("/settings", configHandler.SaveConfig)
			}
		}
	}

	router.Any("/proxy/*path", proxyHandler.ProxyRequest)

	return router
}
