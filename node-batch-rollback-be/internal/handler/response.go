package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 定义统一的返回结构
type Response struct {
	ErrCode int         `json:"err_code"`
	Data    interface{} `json:"data"`
	ErrMsg  string      `json:"err_msg"`
}

// JSONSuccess 使用统一结构返回成功结果，HTTP 状态码默认 200
func JSONSuccess(c *gin.Context, data interface{}) {
	if data == nil {
		data = gin.H{}
	}
	c.JSON(http.StatusOK, Response{ErrCode: 0, Data: data, ErrMsg: ""})
}

// JSONError 使用统一结构返回错误结果，保持原有的 HTTP 状态码
func JSONError(c *gin.Context, httpCode int, msg string) {
	c.JSON(httpCode, Response{ErrCode: 1, Data: gin.H{}, ErrMsg: msg})
}
