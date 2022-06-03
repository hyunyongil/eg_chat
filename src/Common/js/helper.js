/**
* 小于10数字前补0
* @param {*} num 
* @returns 
*/
export const fillZero = (num) => {
    return num < 10 ? '0' + num : num + '';
}

/**
 * 数字添加千位分隔符
 * @param {*} num 
 * @returns 
 */
export const addComma = (num) => {
    var symbol = num >= 0 ? 1 : -1;
    num = Math.abs(num);

    var initNum = (num || 0).toString(), result = '', formatNum = '';
    if (initNum.indexOf('.') > -1) formatNum = (num || 0).toString().split('.')
    var _num = formatNum ? formatNum[0] : initNum;
    while (_num.length > 3) {
        result = ',' + _num.slice(-3) + result;
        _num = _num.slice(0, _num.length - 3);
    }
    if (_num) { result = formatNum ? _num + result + '.' + formatNum[1] : _num + result; }

    return symbol === -1 ? '-' + result : result;
}

  /**
   * 根据天数获取具体日期
   * @param {*} num 天数
   * @returns 
   */
  export const getStandTimer = (num) => {
    let standTime = null;
    let thisData = new Date();
    let msec = thisData.getTime() + 86400000 * num;
    let data = new Date(msec)
    let year = data.getFullYear();
    let month = data.getMonth() + 1;
    let day = data.getDate();
    standTime = year + '-' + fillZero(month) + '-' + fillZero(day);
    return standTime;
  }

  /**
   * 时间戳转日期
   * @param {*} timestamp 
   * @returns 
   */
  export const timestampToDate = (timestamp) => {
    let date = new Date(timestamp);
    let Y = date.getFullYear() + '';
    let M = (date.getMonth() + 1);
    let D = date.getDate();
    let h = date.getHours();
    let i = date.getMinutes();

    return Y.slice(-2) + '/' + fillZero(M) + '/' + fillZero(D) + ' ' + fillZero(h) + ':' + fillZero(i);
  }

  /**
   * 生成channel handler 句柄的唯一id
   * @returns 
   */
  export const generateUUID = () => {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
    });
    return uuid;
  }