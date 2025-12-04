package handler

import (
    "net/http"
    "node_operator_standalone/internal/service"

    "github.com/gin-gonic/gin"
)

type ConfigHandler struct {
	service *service.ConfigService
}

func NewConfigHandler() *ConfigHandler {
	return &ConfigHandler{
		service: service.NewConfigService(),
	}
}

func (h *ConfigHandler) SaveConfig(c *gin.Context) {
    var req service.SaveConfigReq
    if err := c.ShouldBindJSON(&req); err != nil {
        JSONError(c, http.StatusBadRequest, err.Error())
        return
    }

    if err := h.service.SaveConfig(c.Request.Context(), &req); err != nil {
        JSONError(c, http.StatusInternalServerError, "failed to save config")
        return
    }
    JSONSuccess(c, gin.H{})
}

func (h *ConfigHandler) QueryConfig(c *gin.Context) {
    projectKey := c.Query("project_key")
    if projectKey == "" {
        JSONError(c, http.StatusBadRequest, "project_key is required")
        return
    }

    resp, err := h.service.QueryConfig(c.Request.Context(), projectKey)
    if err != nil {
        JSONError(c, http.StatusInternalServerError, "failed to query config")
        return
    }
    JSONSuccess(c, resp)
}
