import CryptoJS from 'crypto-js';

/**
 * 加密
 * @param string work 待加密报文
 * @return string
 */
export function encrypt (word) {
    let encrypt = CryptoJS.AES.encrypt(word,CryptoJS.enc.Utf8.parse(process.env.REACT_APP_KEY),{
        iv:CryptoJS.enc.Utf8.parse(process.env.REACT_APP_IV),
        model:CryptoJS.mode.CBC,
        padding:CryptoJS.pad.Pkcs7
    })

    return encrypt.toString();
}

/**
 * 解密
 * @param string work 待解密报文
 * @return string 
 */
export function decrypt (word) {
    let decrypted = CryptoJS.AES.decrypt(word,CryptoJS.enc.Utf8.parse(process.env.REACT_APP_KEY),{
        iv:CryptoJS.enc.Utf8.parse(process.env.REACT_APP_IV),
        mode:CryptoJS.mode.CBC,
        padding:CryptoJS.pad.Pkcs7
    })

    return decrypted.toString(CryptoJS.enc.Utf8)
}