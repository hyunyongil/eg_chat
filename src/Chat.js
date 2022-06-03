import { useEffect, useRef, useState } from 'react';
import { apiReqs } from './Api/eggdome';
import {
  PATHNAME,
  FIREBASE_CONFIG } from './Constants';
import { decrypt, encrypt } from './Common/js/encryption';
import './Common/css/reset.min.css';
import './Common/css/style.css';
import SendBird from 'sendbird';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import ReactTooltip from 'react-tooltip';
import Channel from './Components/Channel';
import Loading from './Components/Loading';
import {
  addComma,
  getStandTimer,
  timestampToDate,
  generateUUID } from './Common/js/helper';
import Error from './Components/Error';
import Info from './Components/Info';
import Consult from './Components/Consult';

function Chat() {
  const [auth, setAuth] = useState(0);//认证状态：0：未认证，1：已认证，2：认证失败
  const [chatId, setChatId] = useState('');//url path 中的chatid
  const [userInfo, setUserInfo] = useState({});//eggdome api的用户信息
  const [userId, setUserId] = useState('');//当前登录用户的用户名
  const [channels, setChannels] = useState([]);//channel列表
  const [updatedChannel, setUpdatedChannel] = useState({});//channel更新标记，用于接收新消息后，更新channel列表中的最近消息内容
  const [currentChannel, setCurrentChannel] = useState({});//当前channel
  const [channelUUID, setChannelUUID] = useState('');//当前channel
  const [firstMessageId, setFirstMessageId] = useState('');//第一条消息id，用于消息框顶部加载更多后，控制滚动条到这个位置
  const [messages, setMessages] = useState(null);//消息列表
  const [messageTime, setMessageTime] = useState(Date.now());//消息列表中第一条消息的时间，用于消息加载更多api的参数
  const [newMessage, setNewMessage] = useState({});//新消息标记，用于更新消息列表以及滚动条下拉到底部
  const [messageLoading, setMessageLoading] = useState(false);//消息加载更多转动图标显示状态
  const [infoView, setInfoView] = useState(true);//用户端右侧消息信息显示状态
  const [consultView, setConsultView] = useState(true);//管理员端右侧搜索框显示状态
  const pathname = PATHNAME.replace('/', '');//url参数中删除左边的“/”

  const messagesEndRef = useRef(null);//消息框底部标记，初始化或接受新消息时滚动到这个位置

  //url参数，判断是否为管理员（module=admin）
  const queryParams = new URLSearchParams(window.location.search);
  const module = queryParams.get('module');

  const BOT_ID = 'eggchat_bot_1';
  const ADMIN_PATH = 'https://eggdome.ggook.com/admin';
  const HOME_PATH = 'https://eggdome.ggook.com/home';

  //允许上传的文件（用于获取文件图标）
  const allowedFiles = {
    'plain': require('./Common/img/txt.png'),
    'doc': require('./Common/img/word.png'),
    'docx': require('./Common/img/word.png'),
    'xls': require('./Common/img/excel.png'),
    'xlsx': require('./Common/img/excel.png'),
    'ppt': require('./Common/img/ppt.png'),
    'pptx': require('./Common/img/ppt.png'),
    'pdf': require('./Common/img/pdf.png'),
  };

  //允许上传的mime类型
  const allowedMIME = [
    'text/plain',
    'image/jpeg',
    'image/gif',
    'image/png',
    'image/bmp',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
  ];

  //初始化sendbird
  const sb = new SendBird({ appId: process.env.REACT_APP_ID });

  /** 用户认证、连接socket */
  useEffect(() => {
    //拆分、组合并加密url中path值

    let splitChatToken = pathname.slice(-32);
    let splitChatId = pathname.slice(0, -32);
    setChatId(splitChatId);

    let chatData = {
      chatId: splitChatId,
      chatToken: splitChatToken
    };
    let chatIdEncrypted = encrypt(JSON.stringify(chatData));

    apiReqs.getChatinfo({//获取数据库中的用户信息
      module: module,
      data: {
        chatid: chatIdEncrypted
      },
      success: async (res) => {
        setAuth(1);//用户已认证
        const userinfoJson = JSON.parse(decrypt(res.userinfo));
        //console.log(userinfoJson);
        setUserInfo(userinfoJson);

        //更新用户，假如更新失败，则在sendbird平台中新创建用户
        let nickname = userinfoJson.chatinfo.mb_user + '(' + userinfoJson.chatinfo.mb_user + '.' + userinfoJson.chatinfo.mb_level + ')';
        await userUpdate(userinfoJson.chatinfo.mb_id, nickname);

        getChannels(userinfoJson.chatinfo.ad_user, async (channels) => {//获取channel列表
          let curChannel;
          let [_curChannel] = channels.filter((item) => {
            return item.channel_url === userinfoJson.chatinfo.c_channel_url;
          });
          curChannel = _curChannel;

          if (!curChannel) {//假如数据库中没有channel_url信息，或者有信息但无法匹配channel list中的数据
            let userId = userinfoJson.chatinfo.mb_id;
            let channelName = userinfoJson.chatinfo.mb_name + '(' + userinfoJson.chatinfo.mb_user + '.' + userinfoJson.chatinfo.mb_level + ')';
            let adminId = userinfoJson.chatinfo.ad_user;
            let adminComCode = userinfoJson.chatinfo.ad_com_code;

            //创建新的channel（假如channel成员和之前相同，则返回已存在的channel）
            let createRes = await createChannel(userId, channelName, adminId, adminComCode);
            curChannel = createRes.data;

            setCurrentChannel(curChannel);//设置当前channel

            let channelToSend = {
              chatId: splitChatId,
              channelUrl: curChannel.channel_url
            };

            let channelEncrypted = encrypt(JSON.stringify(channelToSend));

            apiReqs.updateChannelUrl({
              data: {
                chatid: channelEncrypted
              },
              success: (res) => {
                //console.log(res);
              },
              fail: (res) => {
                console.log(res);
              }
            });
          } else {
            setCurrentChannel(curChannel);//设置当前channel
          }

          getMessages({//获取初始化消息
            init: true,
            prev_limit: 30,
            next_limit: 0,
            channel: curChannel
          });
        });

        setUserId(module === 'admin' ? userinfoJson.chatinfo.ad_user : userinfoJson.chatinfo.mb_id);

        /** connect sendbird web socket */
        sb.connect(
          (module === 'admin' ? userinfoJson.chatinfo.ad_user : userinfoJson.chatinfo.mb_id),
          (module === 'admin' ? userinfoJson.chatinfo.admin_token : ''),
          (user, error) => {
            if (error) {
              console.log('connect failed');
              console.log(error);
              return false;
            }
            console.log('socket connect success');
          }
        );

        module === 'admin' && updateFirebaseToken(splitChatId)
      },
      fail: (res) => {
        setAuth(2);//用户认证失败
        console.log('fail ' + res);
      }
    });
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 用户更新、更新失败则在sendbird中新创建
   * @param {*} username 
   * @param {*} nickname 
   */
  const userUpdate = async (username, nickname) => {
    await axios.put(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/users/${username}`,
      {
        user_id: username,
        nickname: nickname
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    ).catch((err) => {
      console.log(err);
      userCreate(username, nickname);
    });
  }

  /**
   * sendbird中新创建用户
   * @param {*} username 
   * @param {*} nickname 
   */
  const userCreate = (username, nickname) => {
    axios.post(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/users`,
      {
        user_id: username,
        nickname: nickname,
        profile_url: ''
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    ).catch((err) => {
      console.log(err);
    });
  }

  /**
   * 获取channel列表
   * @param {*} user_id 
   * @param {*} callback 
   */
  const getChannels = async (user_id, callback) => {
    const response = await axios.get(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/users/${user_id}/my_group_channels`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );
    //console.log(response.data.channels);
    setChannels(response.data.channels);
    callback && callback(response.data.channels);
  }

  /**
   * 新注册用户需要创建channel
   * @param {*} username 
   * @param {*} channelName 
   * @param {*} adminid 
   * @param {*} adminComCode 
   * @returns 
   */
  const createChannel = async (username, channelName, adminid, adminComCode) => {
    const createRes = await axios.post(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/group_channels`,
      {
        user_ids: [username, adminComCode, adminid],
        name: channelName,
        is_distinct: true
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );

    //加入到自动回复消息channel
    joinChannel(createRes.data.channel_url);

    return createRes;
  }

  /**
   * 加入到自动回复消息的channel
   * @param {*} currentChannelUrl 
   */
  const joinChannel = (currentChannelUrl) => {
    axios.post(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/bots/${BOT_ID}/channels`,
      {
        channel_urls: [currentChannelUrl]
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );
  }

  /**
   * 点击菜单列表事件，设置当前channel，并设置未读消息数量为0
   * @param {*} channel 
   */
  const setChannel = async (channel) => {
    sb.removeChannelHandler(channelUUID);

    setCurrentChannel(channel);
    setUnreadMsg(channel, 0);

    await getMessages({
      init: true,
      prev_limit: 30,
      next_limit: 0,
      channel: channel
    });

    scrollToBottom();
  }

  /**
   * 设置channel列表中的未读消息数量，传入num参数则所有消息设置为已读，否则未读消息+1
   * @param {*} channel 
   * @param {*} num 
   */
  const setUnreadMsg = (channel, num) => {
    for (let i = 0; i < channels.length; i++) {
      if (channels[i].channel_url !== channel.channel_url) continue;

      if (num === undefined) {
        channels[i].unread_message_count <= 99 && channels[i].unread_message_count++;
      } else {
        channels[i].unread_message_count = 0;

        axios.put(
          `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/users/${userId}/mark_as_read_all`,
          {
            channel_urls: [channel.channel_url]
          },
          {
            headers: {
              'Content-Type': 'application/json; charset=utf8',
              'Api-Token': process.env.REACT_APP_TOKEN,
            },
          }
        );
      }

      break;
    }

    setChannels(channels);
  }

  /**
   * 获取消息列表（初始化/加载更多）
   * @param {*} data 
   * @returns 
   */
  const getMessages = async (data) => {
    //初始化则使用当前时间戳，加载更多时使用上一次获取的消息列表中第一条消息时间
    let message_ts = data.init ? Date.now() : messageTime;

    const response = await axios.get(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/group_channels/${data.channel.channel_url}/messages?prev_limit=${data.prev_limit}&next_limit=${data.next_limit}&include=true&reverse=false&message_ts=${message_ts}&custom_types=*&with_sorted_meta_array=false&include_reactions=true&include_thread_info=false&include_reply_type=none&include_parent_message_info=false&include_poll_details=false`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );

    let _messages = response.data.messages;
    //console.log(_messages);

    if (_messages.length === 0) {//没有获取到数据则不再往下执行
      messages === null && setMessages([]);//原先 messages 的值为 null, 则初始化设置为 []
      return false;
    }

    //重新组合message数据
    let msgData = _messages.map((item, key) => {
      //标记第一条消息的id；加载更多后，滚动到这个位置
      if (key === 0) setFirstMessageId('msg-' + item.message_id);

      return {
        channel_type: item.channel_type,
        channel_url: item.channel_url,
        created_at: item.created_at,
        custom_type: item.custom_type,
        data: item.data,
        file: item.file,
        message: item.message,
        message_id: item.message_id,
        type: item.type,
        updated_at: item.updated_at,
        user: {
          is_active: item.user.is_active,
          nickname: item.user.nickname,
          profile_url: item.user.profile_url,
          user_id: item.user.user_id,
        }
      }
    });

    let msgGroup;
    if (data.init) {//初始化
      msgGroup = [...msgData];
    } else {//加载更多
      msgGroup = [...msgData, ...messages];
    }
    setMessages(msgGroup);
    setMessageTime(msgData[0].created_at - 1);//设置第一条消息时间

    data.init && scrollToBottom();//初始化消息时，滚动到最底部
  }

  /**
   * 滚动条滚到顶部时加载更多消息
   * @param {*} scrollTop 
   */
  const getMoreMessage = async (scrollTop) => {
    if (scrollTop === 0) {
      setMessageLoading(true);
      await getMessages({
        prev_limit: 30,
        next_limit: 0,
        channel: currentChannel
      });

      setTimeout(() => {
        setMessageLoading(false);

        //数据加载完成后，滚动条滚到上一次消息列表中的第一项（不这么做滚动条会留在顶部，看不出刚刚加载的消息）
        let _firstMessage = document.getElementById(firstMessageId);

        if (_firstMessage) {
          _firstMessage.scrollIntoView();
          loadImage(() => {//图片加载完成后再次调整滚动条
            _firstMessage.scrollIntoView();
          });
        }
      }, 100);
    }
  }

  /**
   * 更新 firebase token
   * @param {*} splitChatId 
   */
  const updateFirebaseToken = (splitChatId) => {
    initializeApp(FIREBASE_CONFIG);

    const messaging = getMessaging();

    getToken(messaging, { vapidKey: process.env.REACT_APP_VAPID })
      .then((currentToken) => {
        if (currentToken) {
          // Send the token to your server and update the UI if necessary
          // ...
          // console.log('firebase: '+currentToken);

          let tokenToSend = {
            chatId: splitChatId,
            userToken: currentToken
          }
          let tokenEncrypted = encrypt(JSON.stringify(tokenToSend));

          apiReqs.updateUserToken({
            data: {
              chatid: tokenEncrypted
            },
            success: (res) => {
              let resEncrypted = res.userinfo;
              let resDecrypted = decrypt(resEncrypted);
              let resArr = JSON.parse(resDecrypted);

              if (resArr.succeed) {
                console.log('token updated.');
              }
            },
            fail: (err) => {
              console.log(err);
            }
          });
        } else {
          // Show permission request UI
          console.log('No registration token available. Request permission to generate one.');
          // ...
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
        // ...
      });
  }

  /**
   * 图片加载完成后的事件，初始化消息列表时滚动条滚动到底部，加载更多消息时滚动到指定位置
   * @param {*} callback 
   */
  const loadImage = (callback) => {
    let images = document.getElementById('chat').querySelectorAll('img');

    images.forEach((item) => {
      item.onload = () => {
        callback && callback();
      }
    });
  }

  /**
   * 滚动条滚动到底部
   */
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      loadImage(() => {//图片加载完成后继续滚动一次
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      });
    }, 100);
  }

  /** 接收新消息后，修改消息列表，并滚动条滚动到底部 */
  useEffect(() => {
    if (JSON.stringify(newMessage) !== '{}') {//不判断则以下代码执行两次
      const msgs = [...messages, newMessage];

      setMessages(msgs);
      setNewMessage({});

      scrollToBottom();
    }
  }, [newMessage]);// eslint-disable-line react-hooks/exhaustive-deps

  /** 接受消息后，channel的last_message更新 */
  useEffect(() => {
    if (JSON.stringify(updatedChannel) !== '{}') {//不判断则以下代码执行两次
      for (let i = 0; i < channels.length; i++) {
        if (channels[i].channel_url === updatedChannel.channel_url) {
          channels[i].last_message.created_at = updatedChannel.created_at;
          channels[i].last_message.type = updatedChannel.custom_type;
          channels[i].last_message.custom_type = updatedChannel.custom_type;
          channels[i].last_message.data = updatedChannel.data;
          channels[i].last_message.message = updatedChannel.message;
          channels[i].last_message.file.url = updatedChannel.url;

          setChannels(channels);
          setUpdatedChannel({});

          break;
        }
      }
    }
  }, [updatedChannel]);// eslint-disable-line react-hooks/exhaustive-deps

  /** 监听 sendbird 消息发送 */
  useEffect(() => {
    if (JSON.stringify(currentChannel) !== '{}') {//不判断则以下代码执行两次
      const channelHandler = new sb.ChannelHandler();
      let msgDeliveredTime = 0;//用于防止重复自动回复消息
      let msgExpire = 8000;//8秒内不再发送自动回复消息

      channelHandler.onMessageReceived = (channel, message) => {
        //console.log(channel);
        //console.log(message);
        let [_channel] = channels.filter((item) => (
          item.channel_url === channel.url
        ));

        if (channel.url === currentChannel.channel_url) {
          //组合message数据
          let msgData = {
            channel_type: message.channelType,
            channel_url: message.channelUrl,
            created_at: message.createdAt,
            custom_type: message.customType,
            data: message.data,
            file: {
              name: message.name,
              url: message.plainUrl
            },
            message: message.message,
            message_id: message.messageId,
            type: message.type,
            updated_at: message.updatedAt,
            user: {
              is_active: true,
              nickname: message._sender.nickname,
              profile_url: message._sender.plainProfileUrl,
              user_id: message._sender.userId
            }
          }

          setNewMessage(msgData);
          setUnreadMsg(_channel, 0);//未读消息设置为0
        } else {
          setUnreadMsg(_channel);//未读消息+1
        }

        let channelUpdateData = {
          channel_type: channel.lastMessage.channelType,
          channel_url: channel.lastMessage.channelUrl,
          created_at: channel.lastMessage.createdAt,
          custom_type: channel.lastMessage.customType,
          data: channel.lastMessage.data,
          message: channel.lastMessage.message,
          url: channel.lastMessage.plainUrl,
        }

        setUpdatedChannel(channelUpdateData);//更新channel 列表中的last_message
      }

      channelHandler.onDeliveryReceiptUpdated = (channel) => {
        let timeNow = Date.now();
        if (msgDeliveredTime + msgExpire > timeNow) return false;

        msgDeliveredTime = timeNow;

        let senderId = channel.lastMessage._sender.userId;

        if (senderId !== userId) return false;

        let numberGroup = ['주문번호', '문의번호', '구매번호', '신청번호'];
        let contentGroup = ['주문내역', '문의내역', '구매내역', '신청내역'];

        if (numberGroup.includes(channel.lastMessage.message)) {
          if (userInfo.hasLeavingInfo === 'Y') {
            let dataToSend = {
              consultLeavingId: {
                leavingId: userInfo.leaving.li_id,
                leavingLevel: userInfo.leaving.li_level
              }
            };
            sendBotMessage({
              message: '해당문의에 관한 "문의번호" 입니다.',
              channel_url: channel.lastMessage.channelUrl,
              custom_type: 'consultLeavingId',
              data: JSON.stringify(dataToSend)
            });
          } else {
            sendBotMessage({
              message: '"문의번호"가 존재하지 않습니다.',
              channel_url: channel.lastMessage.channelUrl,
              custom_type: 'auto_answer_introduction',
              data: ''
            });
          }
        }

        if (contentGroup.includes(channel.lastMessage.message)) {
          let dataToSend = {
            consultLeavingOverview: {
              leavingOverview: userInfo.leavingOverview
            }
          };
          sendBotMessage({
            message: '최근 3개월에 문의내역입니다.',
            channel_url: channel.lastMessage.channelUrl,
            custom_type: 'consultLeavingOverview',
            data: JSON.stringify(dataToSend)
          });
        }

        let chatInfoData = {
          chatId: chatId,
          isChatAdmin: false
        };
        chatInfoData = encrypt(JSON.stringify(chatInfoData));
        apiReqs.updateChatinfo({
          data: {
            chatid: chatInfoData
          },
          success: (res) => {
            //console.log(res)
          },
          fail: (res) => { console.log(res) }
        });
      }

      channelHandler.onMessageUpdated = (channel, message) => {
        //console.log('message updated');
        //console.log(channel);
        //console.log(message);
      }

      channelHandler.onMessageDeleted = (channel, messageId) => {
        //console.log('message deleted');
        //console.log(channel);
        //console.log(messageId);
      }

      let _channelUUID = generateUUID();
      setChannelUUID(_channelUUID);
      sb.addChannelHandler(_channelUUID, channelHandler);
    }
  }, [currentChannel]);// eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 发送基本消息（包含clip image）
   * @returns 
   */
  const sendMessage = () => {
    let msgData = {};

    let clipInput = document.querySelector('#clipInput');
    let msg = clipInput.innerHTML.trim();

    if (msg === '') return false;

    msg = '<div>' + msg + '</div>';//前后不加 div ，则删除html标签时无法保留字符串中的<br>
    msg = msg.replace(/<(?!\/?br\/?.+?>)[^<>]*>/g, '');//删除<br>以外的html标签
    msg = msg.replace(/<(?=\/?br\/?.+?>)[^<>]*>/g, '\n');
    msg = msg.replace(/&nbsp;/g, ' ');

    let clipImages = document.querySelectorAll('#clipInput img');

    let imageCount = clipImages.length;
    let cdnArr = [];

    if (imageCount > 0) {//发送clip image
      clipImages.forEach((img, key) => {
        let imgSrc = img.src;

        let imgDataToSend = {
          image: imgSrc,
          userid: userId
        };

        let fileInfoEncrypted = encrypt(JSON.stringify(imgDataToSend));

        apiReqs.uploadFile({
          data: {
            fileinfo: fileInfoEncrypted
          },
          success: (res) => {
            if (!res.hasOwnProperty('fileinfo')) return false;

            let imgCdn = decrypt(res.fileinfo);

            cdnArr.push(imgCdn);

            if ((key === imageCount - 1) && (msg !== '' || cdnArr.length > 0)) {
              msgData.message = msg;
              msgData.message_type = 'MESG';
              msgData.user_id = userId;
              msgData.custom_type = 'clipboardImages';
              msgData.data = JSON.stringify({ clipboardImages: cdnArr });

              sendMessageHandle(msgData);
            }
          },
          fail: (err) => {
            console.log(err);
          }
        });
      });
    } else {//发送文本消息
      msgData.message = msg;
      msgData.message_type = 'MESG';
      msgData.user_id = userId;
      msgData.custom_type = 'msg';

      sendMessageHandle(msgData);
    }

    document.getElementById('clipInput').innerHTML = "";
  }

  /**
   * 发送本地图片
   */
  const sendLocalFile = () => {
    let msgData = {};
    let fileupload = document.getElementById("fileupload");
    let file = fileupload.files[0];

    if (!file) return false;

    if (!allowedMIME.includes(file.type)) {
      alert('파일격식 오류');
      fileupload.value = '';
      return false;
    }

    if (file.size === 0) {
      alert('error: file size 0');
      fileupload.value = '';
      return false;
    }

    let resBase64 = '';
    let reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
      resBase64 = reader.result;

      let fileName = file.name;
      let fileType = file.type;

      let imgDataToSend = {
        image: resBase64,
        userid: userId
      };

      let fileInfoEncrypted = encrypt(JSON.stringify(imgDataToSend));

      apiReqs.uploadFile({
        data: {
          fileinfo: fileInfoEncrypted
        },
        success: (res) => {
          if (!res.hasOwnProperty('fileinfo')) return false;

          let imgCdn = decrypt(res.fileinfo);

          msgData.message = imgCdn;
          msgData.message_type = 'FILE';
          msgData.user_id = userId;
          msgData.custom_type = 'attachmentFilename';
          msgData.url = imgCdn;
          msgData.file_name = fileName;
          msgData.file_type = fileType;

          sendMessageHandle(msgData);
        },
        fail: (err) => {
          console.log(err);
        },
        done: () => {
          fileupload.value = '';
        }
      });
    };
    reader.onerror = (error) => {
      console.log(error);
    };
  }

  /**
   * 发送消息
   * @param {*} messageData 
   * @returns 
   */
  const sendMessageHandle = async (messageData) => {
    if (!messageData) {
      document.getElementById('clipInput').innerHTML = '';//清空消息输入框
      return false;
    }

    await axios.post(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/group_channels/${currentChannel.channel_url}/messages`,
      messageData,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );

    document.getElementById('clipInput').innerHTML = '';//清空消息输入框
  }

  /**
   * 键盘事件，设置 shift+enter为换行，enter为发送消息
   * @param {*} e 
   */
  const _handleKeyDown = (e) => {
    if (!e.shiftKey && e.key === 'Enter') {
      sendMessage();
    }
  }

  /**
   * 请求自动回复消息
   * @param {*} messageData 
   */
  const sendBotMessage = (messageData) => {
    axios.post(
      `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/bots/${BOT_ID}/send`,
      messageData,
      {
        headers: {
          'Api-Token': process.env.REACT_APP_TOKEN,
        },
      }
    );
  }

  

  /**
   * 获取管理链接地址
   * @param {*} leavingLevel 
   * @param {*} leavingId 
   * @returns 
   */
  const getAdminUrl = (leavingLevel, leavingId) => {
    var nowDate = getStandTimer(0);
    var lastThreeMonthDate = getStandTimer(-90);

    var adminLink = '';
    if (leavingLevel === 'import') {
      adminLink = ADMIN_PATH + '/leaving/list.php?sk=li_id&sv=' + leavingId + '&st1=' + lastThreeMonthDate + '&st2=' + nowDate;
    } else if (leavingLevel === 'deliurl') {
      adminLink = ADMIN_PATH + '/leaving/list_deliurl.php?sk=li_id&sv=' + leavingId + '&st1=' + lastThreeMonthDate + '&st2=' + nowDate;
    } else {
      adminLink = ADMIN_PATH + '/leaving/list_delivery.php?sk=li_id&sv=' + leavingId + '&st1=' + lastThreeMonthDate + '&st2=' + nowDate;
    }

    return adminLink;
  }


  /**
   * 消息类型组件中文件类型组件
   * @param {*} item 
   * @returns 
   */
  const fileMessageComponent = (item, msgBelongTo) => {
    let fileUrl = item.file.url;
    let fileData = fileUrl.split('/');
    let fileName = fileData[fileData.length - 1];
    let files = fileName.split('.');
    let fileExtension = files[files.length - 1].toLowerCase();

    if (allowedFiles.hasOwnProperty(fileExtension)) {
      return (
        <div className={`bubble-file ${msgBelongTo}`}>
          <a href={fileUrl} target="_blank" rel="noreferrer">
            <img src={allowedFiles[fileExtension]} alt="" />
            <em>{item.file.name}</em>
          </a>
        </div>
      );
    } else {
      return (
        <div className={`bubble-img ${msgBelongTo}`}>
          <a href={fileUrl} target="_blank" rel="noreferrer">
            <img src={fileUrl} alt="" />
          </a>
        </div>
      );
    }
  }


  /**
   * 消息类型组件
   * @param {*} item 
   * @returns 
   */
  const messageTypeComponent = (item) => {
    let _data;
    let msgPosition;
    let msgBelongTo;

    if (!userInfo.chatinfo) return '';

    if (userInfo.chatinfo.admin_token) {
      if (item.user.user_id === userId || item.user.user_id === userInfo.chatinfo.ad_com_code) {
        msgPosition = 'end';
        msgBelongTo = 'me';
      } else {
        msgPosition = 'start';
        msgBelongTo = 'you';
      }
    } else {
      if (item.user.user_id === userId) {
        msgPosition = 'end';
        msgBelongTo = 'me';
      } else {
        msgPosition = 'start';
        msgBelongTo = 'you';
      }
    }

    switch (item.custom_type) {
      case 'attachmentFilename':
        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              {fileMessageComponent(item, msgBelongTo)}
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );


      case 'clipboardImages':
        let imageData = JSON.parse(item.data);
        let images = imageData.hasOwnProperty('clipboardImages') ? imageData.clipboardImages : imageData;
        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              <div className={`bubble-img ${msgBelongTo}`}>
                {images.map((item, key_img) => {
                  return (
                    <a key={key_img} href={item} target="_blank" rel="noreferrer">
                      <img src={item} alt="" />
                    </a>
                  );
                })}
              </div>
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );


      case 'consultLeavingId':
        _data = JSON.parse(item.data);

        if (_data === '') return <div key={item.message_id} id={'msg-' + item.message_id}></div>;

        let adminUrl = getAdminUrl(_data['consultLeavingId']['leavingLevel'], _data['consultLeavingId']['leavingId']);
        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              <div className={`bubble ${msgBelongTo}`}>
                {
                  module === 'admin'
                    ? <a href={adminUrl} target="_blank" rel="noreferrer" className="consult">{item.message}</a>
                    : <strong className="consult">{item.message}</strong>
                }
              </div>
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );


      case 'consultLeavingOverview':
        _data = JSON.parse(item.data);
        let overviewData = _data.hasOwnProperty('consultLeavingOverview') && _data['consultLeavingOverview'].hasOwnProperty('leavingOverview') ? _data['consultLeavingOverview']['leavingOverview'] : {};

        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              <div className={`bubble ${msgBelongTo}`}>
                {
                  module === 'admin'
                    ? <strong className="consult">문의내역</strong>
                    : (
                      <div className="overview">
                        <h3>{item.message}</h3>
                        <div className="overview-list">
                          <a href={HOME_PATH + '/leaving/list.php?s=41'} target="_blank" rel="noreferrer">
                            <span>견적대기</span>
                            <strong>{overviewData['AA']}</strong>
                          </a>
                          <a href={HOME_PATH + '/leaving/list.php?s=43'} target="_blank" rel="noreferrer">
                            <span>상품결제대기</span>
                            <strong>{overviewData['AC']}</strong>
                          </a>
                          <a href={HOME_PATH + '/leaving/list.php?s=32'} target="_blank" rel="noreferrer">
                            <span>입고대기</span>
                            <strong>{overviewData['BB']}</strong>
                          </a>
                          <a href={HOME_PATH + '/leaving/list.php?s=34'} target="_blank" rel="noreferrer">
                            <span>물류결제대기</span>
                            <strong>{overviewData['BE']}</strong>
                          </a>
                          <a href={HOME_PATH + '/leaving/list.php?s=37'} target="_blank" rel="noreferrer">
                            <span>출고완료</span>
                            <strong>{overviewData['BK']}</strong>
                          </a>
                          <a href={HOME_PATH + '/leaving/list.php?s=31'} target="_blank" rel="noreferrer">
                            <span>미완료신청건</span>
                            <strong>{overviewData['BA']}</strong>
                          </a>
                        </div>
                      </div>
                    )}
              </div>
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );


      case 'consultLeavingProduct':
        _data = JSON.parse(item.data);
        let productData = _data.hasOwnProperty('consultLeavingProduct') ? _data['consultLeavingProduct'] : {};
        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              <div className={`bubble ${msgBelongTo}`}>
                <a href={productData.productLink} target="_blank" rel="noreferrer" className="msg-product">
                  <img src={productData.productImage} alt="" />
                  <div className="msg-product-info">
                    <h4 title={productData.productName}>{productData.productName}</h4>
                    <div className="msg-product-opt" title={productData.productOption.replace('&gt;', '\n')}>{productData.productOption}</div>
                    <section>
                      <div className="msg-product-price">
                        <strong>{addComma(productData.productPriceKr)}</strong>
                        <em>원</em>
                      </div>
                      <span>x {productData.productNum}</span>
                    </section>
                  </div>
                </a>
              </div>
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );
        

      default:
        let msg = item.message || '';
        return (
          <div key={item.message_id} id={'msg-' + item.message_id} className={`chat-msg ${msgPosition}`}>
            {messageAvatar(msgPosition)}
            <div className="msg-align">
              <div className={`bubble ${msgBelongTo}`}>
                <strong className="basic-msg" dangerouslySetInnerHTML={{ __html: msg.replace(/\n/g, '<br/>') }}></strong>
              </div>
              <span>{timestampToDate(item.created_at)}</span>
            </div>
          </div>
        );
    }
  }

  /**
   * 聊天用户的头像
   * @param {*} pos 
   * @returns 
   */
  const messageAvatar = (pos) => {
    let component;

    if ((module === 'admin' && pos === 'end') || (module !== 'admin' && pos === 'start')) {
      component = <img src={require('./Common/img/service.png')} alt="" className="chat-avatar" />;
    } else {
      component = <img src={require('./Common/img/customer.png')} alt="" className="chat-avatar" />;
    }

    return component;
  }


  /**
   * render message 列表
   * @returns 
   */
  const renderMessageList = () => {
    let component;
    if (messages === null) {
      component = (
        <div className="board">
          <Loading size="middle" />
        </div>
      );
    } else {
      component =
        <div className="board">
          <div className="top">
            <img src={require('./Common/img/avatar.jpg')} alt="" />
            <span>{currentChannel.name}</span>
          </div>

          <div className="chat" id="chat">
            <div className="chat-board" id="chat-board" onScroll={(e) => { getMoreMessage(e.target.scrollTop) }}>
              {messageLoading ? <div className="board-loading"><Loading size="small" /></div> : ''}

              {messages.map((item) => {
                return messageTypeComponent(item);
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="write">
            <input type="file" id="fileupload" name="fileupload" onChange={() => sendLocalFile()} hidden />
            <div className="chat-tool">
              <div className="chat-tool-l">
                <i className="tool-icon icon-crop" data-tip="Windows+Shift+s"></i>
                <i className="tool-icon icon-file" onClick={() => { document.getElementById("fileupload").click(); }}></i>
                <ReactTooltip place="top" effect="solid" />
              </div>
              <div className="chat-tool-r">
                {module === 'admin'
                ? <i className="tool-icon icon-consult" onClick={() => {setConsultView(!consultView)}}></i>
                : <i className="tool-icon icon-info" onClick={() => { setInfoView(!infoView); }}></i>}
                {/* <i className="tool-icon icon-history"></i> */}
              </div>
            </div>
            <div className="write-box" id="clipInput" contentEditable="true" onKeyDown={_handleKeyDown}></div>
            <span className="write-link send" onClick={() => { sendMessage() }}></span>
          </div>
        </div>
    }
    return component;
  }


  return (
    <div className="container">

      {auth === 0 ? <Loading size="large" /> : ''}

      {module === 'admin' && auth === 1
        ? <Channel channels={channels} currentChannel={currentChannel} setChannel={(channel) => { setChannel(channel) }} />
        : ''}

      {auth === 1 ? renderMessageList() : ''}

      {module === 'admin' && auth === 1 && consultView
        ? <Consult chatId={chatId} />
        : ''}

      {module !== 'admin' && auth === 1 && infoView
        ? <Info user={userInfo} currentChannel={currentChannel} userId={userId} />
        : ''}

      {auth === 2 ? <Error /> : ''}
    </div>
  );
}

export default Chat;
