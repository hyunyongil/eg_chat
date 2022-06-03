import React, { useState } from 'react';
import { fillZero } from '../../Common/js/helper';
import Loading from '../Loading';
import './channel.css';

function Channel(props) {
  const channels = props.channels;
  const currentChannel = props.currentChannel;
  const [channelFilter, setChannelFilter] = useState('');//channel筛选词

  /**
   * 时间戳转各种时间格式（用于channel列表中最后一条消息的事件）
   * @param {*} timestamp 
   * @returns 
   */
  const timestampToTime = (timestamp) => {
    let date = new Date(timestamp);
    let Y = date.getFullYear() + '';
    let M = (date.getMonth() + 1);
    let D = date.getDate();
    let h = date.getHours();
    let i = date.getMinutes();

    let time = Date.now();
    if (timestamp > time - 5 * 60 * 1000) {//5分钟内
      return '방금';

    } else if (timestamp <= time - 5 * 60 * 1000 && timestamp > time - 60 * 60 * 1000) {//1小时内
      return Math.ceil((time - timestamp) / 1000 / 60) + '분전';

    } else if (timestamp <= time - 60 * 60 * 1000 && timestamp > new Date(new Date().toLocaleDateString()).getTime()) {//今天
      return fillZero(h) + ':' + fillZero(i);

    } else if (timestamp <= new Date(new Date().toLocaleDateString()).getTime() && timestamp > new Date(new Date().toLocaleDateString()).getTime() - 86400 * 1000) {//昨天
      return '어제';

    } else if (timestamp <= new Date(new Date().toLocaleDateString()).getTime() - 86400 * 1000 && timestamp > new Date(new Date().toLocaleDateString()).getTime() - (new Date().getDay() - 1) * 24 * 60 * 60 * 1000) {//本周
      return getWeek(new Date(Y + '-' + M + '-' + D));

    } else if (timestamp <= new Date(new Date().toLocaleDateString()).getTime() - (new Date().getDay() - 1) * 24 * 60 * 60 * 1000 && timestamp > new Date(new Date().getFullYear(), 0).getTime()) {//今年
      return M + '/' + D;

    } else {
      return Y.slice(-2) + '/' + M + '/' + D;
    }
  }

  /**
   * 根据时间戳获取星期
   * @param {*} date 
   * @returns 
   */
  const getWeek = (date) => {
    let week;
    if (date.getDay() === 0) week = "일요일"
    if (date.getDay() === 1) week = "월요일"
    if (date.getDay() === 2) week = "화요일"
    if (date.getDay() === 3) week = "수요일"
    if (date.getDay() === 4) week = "목요일"
    if (date.getDay() === 5) week = "금요일"
    if (date.getDay() === 6) week = "토요일"
    return week;
  }

  let component;

  if (channels.length === 0) {
    component = (
      <div className="channels">
        <Loading size="middle" />
      </div>
    );
  } else {
    let renderChannels;
    if (channelFilter === '') {
      renderChannels = [...channels];
    } else {
      renderChannels = channels.filter((item) => {
        return item.channel.name.indexOf(channelFilter) !== -1;
      });
    }

    component =
      <div className="channels">
        <div className="top">
          <input type="text" placeholder="Search" onChange={(e) => { setChannelFilter(e.target.value) }} />
        </div>
        <ul className="people">

          {renderChannels.map((item) => {
            let msg;
            switch (item.last_message.custom_type) {
              case 'attachmentFilename':
                let filePath = item.last_message.file.url.split('.');
                msg = '파일 ' + filePath[filePath.length - 1];
                break;

              case 'clipboardImages':
                let jsonData = JSON.parse(item.last_message.data);
                let imagePath = jsonData.clipboardImages[0].split('.');
                msg = '이미지 ' + imagePath[imagePath.length - 1];
                break;

              default:
                msg = item.last_message.message;
                break;
            }

            return (
              <li key={item.channel_url} className={`person ${item.channel.channel_url === currentChannel.channel_url ? 'active' : ''}`} onClick={() => { props.setChannel(item.channel) }}>
                <img src={require('../../Common/img/avatar.jpg')} alt="" />
                <div className="person-info">
                  <h3 className="name">
                    <strong title={item.channel.name}>{item.channel.name}</strong>
                    {item.unread_message_count > 0 ? <em>{item.unread_message_count}</em> : ''}
                  </h3>
                  <div className="person-history">
                    <span className="preview">{msg}</span>
                    <span className="time">{timestampToTime(item.last_message.created_at)}</span>
                  </div>
                </div>
              </li>
            );
          })}

        </ul>
      </div>
  }

  return component;
}

export default Channel;