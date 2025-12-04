import axios from 'axios';

function getErrorMsg(response) {
  return (
    response?.data?.message ||
    response?.data?.msg ||
    response?.data?.error?.display_msg?.content ||
    response?.data?.error?.display_msg?.title
  );
}

// 返回的统一拦截暂时不处理，等待拦截方案的确定
axios.interceptors.response.use(
  function (response) {
    const statusCode =
      response.data?.status_code ||
      response.data?.statusCode ||
      response.data?.error?.code ||
      0;

    const errMsg = getErrorMsg(response);
    if (statusCode !== 0 && errMsg) {
      response.data = Object.assign(response.data, { errMsg });
      return Promise.reject(new Error(errMsg));
    }
    return response;
  },
  // 作为一个插件，如果报错，就捕获并上报，不要影响宿主业务
  // TODO: 错误上报
  function (error) {
    // TODO: 401，403
    return Promise.reject(error);
  },
);
