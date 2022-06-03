const API_DOMAIN = 'https://eggdome.ggook.com/expand/chat/consult';
const APP_APIKEY = '7de9390628f96d6eca647f716c0729532e905982';

// API请求正常，数据正常
export const API_CODE = {
    // API请求正常
    OK: 200,
    // API请求正常，数据异常
    ERR_DATA: 403,
    // API请求正常，空数据
    ERR_NO_DATA: 301,
    // API请求正常，登录异常
    ERR_LOGOUT: 401,
}
// API请求异常报错内容
export const API_FAILED = '인터넷접속 오류';

// API请求汇总
export const apiReqs = {
    // 获取 chat info
    getChatinfo: (config) => {
        if (config.module === 'admin') {
            config.url = API_DOMAIN + '/write_admin.php';
        } else {
            config.url = API_DOMAIN + '/write.php';
        }
        config.method = 'post';
        apiRequest(config);
    },

    //更新用户信息
    updateChatinfo: (config) => {
        config.url = API_DOMAIN + '/update.php';
        config.method = 'post';
        apiRequest(config);
    },

    // 上传文件
    uploadFile: (config) => {
        config.url = API_DOMAIN + '/write_files.php';
        config.method = 'post';
        apiRequest(config);
    },

    //更新用户信息
    updateChannelUrl: (config) => {
        config.url = API_DOMAIN + '/update_channel.php';
        config.method = 'post';
        apiRequest(config);
    },

    //更新firebase token
    updateUserToken: (config) => {
        config.url = API_DOMAIN + '/update_token.php';
        config.method = 'post';
        apiRequest(config);
    }
}

/*
 * API请求封装（带验证信息）
 * config.method: [必须]请求method
 * config.url: [必须]请求url
 * config.data: 请求数据
 * config.formData: 是否以formData格式提交（用于上传文件）
 * config.success(res): 请求成功回调
 * config.fail(err): 请求失败回调
 * config.done(): 请求结束回调
 */
const apiRequest = (config) => {
    // 如果没有设置config.data，则默认为{}
    if (config.data === undefined) {
        config.data = {}
    }

    // 如果没有设置config.method，则默认为post
    config.method = config.method || 'post'

    // 请求头设置
    let headers = {};
    headers['apikey'] = APP_APIKEY;

    // 准备好请求的全部数据
    let axiosConfig;

    if (config.method === 'get') {
        axiosConfig = {
            method: config.method,
            headers,
        }
    } else {
        axiosConfig = {
            method: config.method,
            headers,
            body: JSON.stringify(config.data),
        }
    }

    // 发起请求
    fetch(config.url, axiosConfig)
        .then((res) => res.json())
        .then((result) => {
            // 请求结束的回调
            config.done && config.done()
            // 请求成功的回调
            config.success && config.success(result)
        })
        .catch((err) => {
            console.log(err);
            // 请求结束的回调
            config.done && config.done()
            // 请求失败的回调
            config.fail && config.fail(API_FAILED)
        })
}