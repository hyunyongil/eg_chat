import React, { useEffect, useState } from 'react';
import ReactTooltip from 'react-tooltip';
import {
    LI_LEVEL,
    LI_STATE,
    LI_STATE_HINT,
    LIP_ORDER
} from '../../Constants';
import { addComma } from '../../Common/js/helper';
import './info.css';
import axios from 'axios';

function Info(props) {
    const [listFolding, setListFolding] = useState({
        item_cancel: 'block',
        tracking: 'block',
        abnormal: 'block',
        stored: 'block',
        productDone: 'block',
        productWaiting: 'block',
        toSend: 'block',
        delivering: 'block',
        productApplied: 'block'
    });

    const HOME_PATH = 'https://eggdome.ggook.com/home';
    const BASE_URL_PATH = 'https://eggdome.ggook.com/expand/chat/consult';
    const VIEW_PATH = 'https://eggdome.ggook.com/views';

    useEffect(() => {
        //console.log(props.user);
    }, []);

    const openLeavingPage = (leavingId) => {
        window.open(HOME_PATH + '/leaving/view.php?id=' + leavingId, "_blank");
    }

    const openPopup = (url) => {
        window.open(url, 'popUpWindow', 'height=550,width=550,left=50,top=50,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
    }

    const openPopupLarge = (url) => {
        window.open(url, 'popUpWindow', 'height=900,width=740,left=50,top=50,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
    }

    const openPopupWide = (url) => {
        window.open(url, 'popUpWindow', 'height=900,width=1200,left=50,top=50,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
    }

    /**
     * 타이틀 오른쪽 접기 펼치기 기능
     * @param {*} e 
     * @param {*} rel 
     */
    const foldToggle = (e, rel) => {
        let _listFolding = { ...listFolding };

        if (_listFolding[rel] === 'block') {
            _listFolding[rel] = 'none';
            e.currentTarget.className = 'unfold';
            e.currentTarget.innerHTML = '펼치기';
        } else {
            _listFolding[rel] = 'block';
            e.currentTarget.className = 'fold';
            e.currentTarget.innerHTML = '접기';
        }
        setListFolding(_listFolding);
    }

    /**
     * 상품문의 데이터 구성
     * @param {*} leavingData 
     */
    const consultLeavingProduct = (leavingData) => {
        let _leavingData = { consultLeavingProduct: leavingData };

        let msgData = {
            message_type: 'MESG',
            message: '상품문의 드립니다',
            data: JSON.stringify(_leavingData),
            custom_type: 'consultLeavingProduct',
            user_id: props.userId
        };

        sendMessageHandle(msgData);
    }

    /**
     * 문의번호 문의 데이터 구성
     * @param {*} msgNum 
     * @param {*} leavingData 
     */
    const sendUserMessage = (msgText, leavingData) => {
        let _leavingData = { consultLeavingId: leavingData };

        let msgData = {
            message_type: 'MESG',
            message: msgText,
            data: JSON.stringify(_leavingData),
            custom_type: 'consultLeavingId',
            user_id: props.userId
        };

        sendMessageHandle(msgData);
    }

    /**
   * 发送消息
   * @param {*} messageData 
   * @returns 
   */
    const sendMessageHandle = async (messageData) => {
        await axios.post(
            `https://api-${process.env.REACT_APP_ID}.sendbird.com/v3/group_channels/${props.currentChannel.channel_url}/messages`,
            messageData,
            {
                headers: {
                    'Content-Type': 'application/json; charset=utf8',
                    'Api-Token': process.env.REACT_APP_TOKEN,
                },
            }
        );
    }

    const renderTitle = (data) => (
        <div className="info-title">
            <h3>{data.title}</h3>
            {data.btn
                ? <button className="fold" onClick={(e) => { foldToggle(e, data.rel) }}>접기</button>
                : ''
            }
        </div>
    );

    const renderInfo = (data) => (
        <div className="info-data">
            {data.map((item, key) => {
                let _btnGroup = item.btnGroup ? item.btnGroup.filter((btn) => {
                    return btn.view;
                }) : null;

                return (
                    _btnGroup
                        ? (
                            <div key={key} className="info-btn-group">
                                {_btnGroup.map((btn, index) => {
                                    return <button key={index} onClick={btn.click}>{btn.name}</button>
                                })}
                            </div>
                        )
                        : (
                            <section key={key}>
                                <strong>{item.title}</strong>

                                {item.link
                                    ? <a href={item.link} target="_blank" rel="noreferrer" style={item.style}>{item.value}</a>
                                    : <span style={item.style}>{item.value}</span>}

                                {item.hint ? <i data-tip={item.hint}></i> : ''}

                                <ReactTooltip place="top" effect="solid" />

                                {item.btn && item.btn.view ? <button className="info-data-btn" onClick={item.btn.click}>{item.btn.name}</button> : ''}
                            </section>
                        )
                );
            })}
        </div>
    );

    const renderItem = (item, data = { color: '#40bd1a', text: '', msgBtn: false }, linkBtn = {}) => {
        let itemHeader = item.lip_order && LIP_ORDER.hasOwnProperty(item.lip_order) ? LIP_ORDER[item.lip_order] : '기타';

        return (
            <div className="info-item" key={item.lip_id}>
                <a href={HOME_PATH + '/leaving/view.php?id=' + item.li_id} target="_blank" rel="noreferrer" className="info-item-data">
                    <img src={item.lip_image} alt="" />
                    <div className="info-item-content">
                        <section style={{ color: data.color }} title={itemHeader}>{data.text ? data.text + ' ' : ''}{itemHeader}</section>
                        <h4 title={item.lip_name}>{item.lip_name}</h4>
                        <div className="info-item-opt" title={item.lip_opt.replace('&gt;', '\n')}>{item.lip_opt.replace('&gt;', ' ; ')}</div>
                        <div className="info-item-num">x {item.lip_num}</div>
                    </div>
                </a>
                <div className="item-btn-group">
                    {linkBtn.view
                        ? <button className="item-btn" onClick={() => { linkBtn.click() }}>{linkBtn.text}</button>
                        : ''}
                    {data.msgBtn
                        ? <button className="item-btn" onClick={() => {
                            consultLeavingProduct({
                                fileType: 'product',
                                leavingId: item.li_id,
                                leavingLevel: data.li_level,
                                productImage: item['lip_image'],
                                productName: item['lip_name'],
                                productOption: item['lip_opt'],
                                productNum: item['lip_num'],
                                productLink: item['lip_link'],
                                productPriceKr: item['lip_price_kr'],
                                productPriceCn: item['lip_price']
                            })
                        }}>문의하기</button>
                        : ''}
                </div>
            </div>
        );
    };

    const renderBtn = (item) => {
        let msg = '문의번호 ' + item.leaving.li_id + '에 대해서 문의합니다';

        return (
            <div className="info-btn">
                <button onClick={() => { sendUserMessage(msg, { leavingId: item.leaving.li_id, leavingLevel: item.leaving.li_level }) }}>문의하기</button>
            </div>
        );
    };

    const renderLeavingY = () => {
        let chatInfo = props.user.chatinfo;
        let leavingDatas = props.user;
        let leavingItem = props.user.leaving;
        let leavingState = props.user.leaving.li_state;
        let leavingProduct = props.user.leavingProduct;


        //신청정보
        let mainInfo = [
            {
                title: '문의유형',
                value: LI_LEVEL[leavingItem.li_level],
                style: {
                    color: '#4dd823'
                }
            }
            , {
                title: '문의번호',
                value: leavingItem.li_id,
                link: HOME_PATH + '/leaving/view.php?id=' + leavingDatas.leaving.li_id,
                style: {
                    color: '#234dd8'
                }
            }
            , {
                title: '문의자ID',
                value: leavingItem.mb_name + '(' + leavingItem.mb_user + ')',
                style: {}
            }
            , {
                title: '상담원',
                value: chatInfo.ad_user,
                style: {}
            }
        ];


        //현재대행상태
        let itemPrice;
        let deliPrice;

        if (leavingItem.li_price_total_kr) {
            itemPrice = addComma(Math.ceil(leavingItem.li_price_total_kr / 10) * 10) + ' 원';
        } else if (leavingItem.li_price_total_kr === null && leavingItem.li_level !== 'delivery') {
            itemPrice = '미산정';
        } else {
            itemPrice = '-';
        }

        if (leavingItem.li_price_post > 0) {
            deliPrice = addComma(Math.ceil(leavingItem.li_price_post / 10) * 10) + ' 원';
        } else {
            deliPrice = '미산정';
        }

        let currentState = [
            {
                title: '의뢰상태',
                value: LI_STATE[leavingState],
                hint: LI_STATE_HINT[leavingState],
                style: {
                    color: leavingState === 'AB' ? '#e02222' : '#545454'
                }
            }
            , {
                title: '상품결제액',
                value: itemPrice,
                btn: {
                    view: leavingState === 'AC' ? true : false,
                    name: '결제하기',
                    click: () => {
                        openLeavingPage(leavingDatas.leaving.li_id);
                    }
                },
                style: {
                    fontSize: '18px',
                    fontWeight: 'bold'
                }
            }
            , {
                title: '배송비',
                value: deliPrice,
                btn: {
                    view: leavingState === 'BE' ? true : false,
                    name: '결제하기',
                    click: () => {
                        openLeavingPage(leavingDatas.leaving.li_id);
                    }
                },
                style: {
                    fontSize: '15px',
                    fontWeight: 'bold'
                }
            }
        ];



        //상품구매비견적청구내역
        let itemPrices = [
            {
                btnGroup: [
                    {
                        view: leavingItem.li_send_budget === 'Y' ? true : false,
                        name: '견적서확인',
                        click: () => {
                            openPopupWide(HOME_PATH + '/clear/budget.php?id=' + leavingDatas.leaving.li_id);
                        }
                    },
                    {
                        view: leavingItem.li_send_invoice === 'Y' ? true : false,
                        name: '인보이스확인',
                        click: () => {
                            openPopupLarge(HOME_PATH + '/clear/invoice.php?id=' + leavingDatas.leaving.li_id);
                        }
                    }
                ]
            }
            , {
                title: '청구내역합계',
                value: itemPrice,
                style: {
                    fontSize: '15px',
                    fontWeight: 'bold'
                }
            }
            , {
                title: '상품총금액',
                value: '¥ ' + (leavingItem.li_price && parseFloat(leavingItem.li_price).toFixed(2)),
                style: {}
            }
            , {
                title: '수수료',
                value: '¥ ' + (leavingItem.li_price_service && parseFloat(leavingItem.li_price_service).toFixed(2)),
                style: {}
            }
            , {
                title: '원산지작업비',
                value: '¥ ' + (leavingItem.li_price_work && parseFloat(leavingItem.li_price_work).toFixed(2)),
                style: {}
            }
            , {
                title: '검품비',
                value: '¥ ' + (leavingItem.li_price_qc && parseFloat(leavingItem.li_price_qc).toFixed(2)),
                style: {}
            }
            , {
                title: '별도포장비',
                value: '¥ ' + (leavingItem.li_price_pack && parseFloat(leavingItem.li_price_pack).toFixed(2)),
                style: {}
            }
            , {
                title: '총위엔화',
                value: '¥ ' + (leavingItem.li_price_total && parseFloat(leavingItem.li_price_total).toFixed(2)),
                style: {}
            }
        ];

        return (
            <div className="info">
                <div className="info-box">

                    <div className="info-card">
                        {renderTitle({ title: '신청정보' })}
                        {renderInfo(mainInfo)}
                    </div>

                    <div className="info-card">
                        {renderTitle({ title: '현재대행상태' })}
                        {renderInfo(currentState)}
                    </div>

                    {leavingState === 'AC'
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '상품구매비견적청구내역' })}
                                {renderInfo(itemPrices)}
                            </div>
                        )
                        : ''}

                    {(leavingState === 'AB' || leavingState === 'AC' || leavingState === 'AD') && leavingProduct.leavingProductCancelled.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '상품취소목록', rel: 'item_cancel', btn: true })}

                                <div style={{ display: listFolding['item_cancel'] }}>
                                    {leavingProduct.leavingProductCancelled.map((item) => {
                                        return renderItem(item, { color: '#e02222', text: '상품취소사유', msgBtn: true, li_level: leavingItem.li_level }, {})
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BA') && leavingProduct.leavingProductTracking.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '트래킹번호 확인 요청 상품', rel: 'tracking', btn: true })}

                                <div style={{ display: listFolding['tracking'] }}>
                                    {leavingProduct.leavingProductTracking.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {})
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BC') && leavingProduct.leavingProductAbnormal.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '검수시 문제되어 이상처리된 상품목록', rel: 'abnormal', btn: true })}

                                <div style={{ display: listFolding['abnormal'] }}>
                                    {leavingProduct.leavingProductAbnormal.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item.hasOwnProperty('lipCanissue') ? true : false,
                                            text: '오류확인',
                                            click: () => {
                                                window.open(item['lipCanissue'], "_blank");
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BC' || leavingState === 'BD' || leavingState === 'BE' || leavingState === 'BF' || leavingState === 'BG' || leavingState === 'BH' || leavingState === 'BI') && leavingProduct.leavingProductStored.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '입고된 상품', rel: 'stored', btn: true })}

                                <div style={{ display: listFolding['stored'] }}>
                                    {leavingProduct.leavingProductStored.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item.hasOwnProperty('lipIsenterstockImg') ? true : false,
                                            text: '실사확인',
                                            click: () => {
                                                openPopup(item['lipIsenterstockImg']);
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BJ' || leavingState === 'BK') && leavingProduct.leavingProductDone.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '출고완료 된 상품', rel: 'productDone', btn: true })}

                                <div style={{ display: listFolding['productDone'] }}>
                                    {leavingProduct.leavingProductDone.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item['lip_express_kr'] !== '' && item['lip_express_order_kr'] !== '' ? true : false,
                                            text: '송장확인',
                                            click: () => {
                                                openPopupLarge(BASE_URL_PATH + '/postpup.php?li_id=' + leavingDatas.leaving.li_id + '&mb_id=' + chatInfo.mb_id);
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BJ') && leavingProduct.leavingProductWaiting.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '출고대기중인 상품', rel: 'productWaiting', btn: true })}

                                <div style={{ display: listFolding['productWaiting'] }}>
                                    {leavingProduct.leavingProductWaiting.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item.hasOwnProperty('lipIsenterstockImg') ? true : false,
                                            text: '실사확인',
                                            click: () => {
                                                openPopup(item['lipIsenterstockImg']);
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BB' || leavingState === 'BC') && leavingProduct.leavingProductTosend.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '중국내발송대기중 상품', rel: 'toSend', btn: true })}

                                <div style={{ display: listFolding['toSend'] }}>
                                    {leavingProduct.leavingProductTosend.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item['lip_express'] !== '' && item['lip_express_order'] !== '' && item['lip_express_address2'] !== '' ? true : false,
                                            text: '배송조회',
                                            click: () => {
                                                openPopup(VIEW_PATH + '/kuaidi100.php?no=' + item.lip_id);
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'BB' || leavingState === 'BC') && leavingProduct.leavingProductDelivering.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '중국내배송중인 상품', rel: 'delivering', btn: true })}

                                <div style={{ display: listFolding['delivering'] }}>
                                    {leavingProduct.leavingProductDelivering.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {
                                            view: item['lip_express'] !== '' && item['lip_express_order'] !== '' && item['lip_express_address2'] !== '' ? true : false,
                                            text: '배송조회',
                                            click: () => {
                                                openPopup(VIEW_PATH + '/kuaidi100.php?no=' + item.lip_id);
                                            }
                                        })
                                    })}
                                </div>
                            </div>
                        )
                        : ''}

                    {(leavingState === 'AA' || leavingState === 'AB' || leavingState === 'AC' || leavingState === 'AD' || leavingState === 'AE' || leavingState === 'AF' || leavingState === 'AZ') && leavingProduct.leavingProductApplied.length > 0
                        ? (
                            <div className="info-card">
                                {renderTitle({ title: '신청상품목록', rel: 'productApplied', btn: true })}

                                <div style={{ display: listFolding['productApplied'] }}>
                                    {leavingProduct.leavingProductApplied.map((item) => {
                                        return renderItem(item, { msgBtn: true, li_level: leavingItem.li_level }, {});
                                    })}
                                </div>
                            </div>
                        )
                        : ''}
                </div>
            </div>
        );
    }

    const renderLeavingL = () => {
        let leavingState = props.user.leaving.li_state;
        let leavingItem = props.user.leaving;
        let leavingLatest = props.user.leavingLatest;

        return (
            <div className="info">
                <div className="info-box">

                    {renderTitle({ title: '진행중인 문의내역 ('+leavingLatest.length+'건)'})}

                    {leavingLatest.map((item, key) => {
                        let itemPrice;
                        let deliPrice;

                        if (item.leaving.li_price_total_kr) {
                            itemPrice = addComma(Math.ceil(item.leaving.li_price_total_kr / 10) * 10) + ' 원';
                        } else if (item.leaving.li_price_total_kr === null && item.leaving.li_level !== 'delivery') {
                            itemPrice = '미산정';
                        } else {
                            itemPrice = '-';
                        }

                        if (item.leaving.li_price_post > 0) {
                            deliPrice = addComma(Math.ceil(item.leaving.li_price_post / 10) * 10) + ' 원';
                        } else {
                            deliPrice = '미산정';
                        }

                        let leavingInfo = [
                            {
                                title: '문의유형',
                                value: LI_LEVEL[item.leaving.li_level],
                                style: {
                                    color: '#4dd823'
                                }
                            }
                            , {
                                title: '문의번호',
                                value: item.leaving.li_id,
                                link: HOME_PATH + '/leaving/view.php?id=' + item.leaving.li_id,
                                style: {
                                    color: '#234dd8'
                                }
                            }
                            , {
                                title: '문의자ID',
                                value: item.leaving.mb_name + '(' + item.leaving.mb_user + ')'
                            }
                            , {
                                title: '의뢰상태',
                                value: LI_STATE[item.leaving.li_state]
                            }
                            , {
                                title: '상품결제액',
                                value: itemPrice,
                                btn: {
                                    view: leavingState === 'AC' ? true : false,
                                    name: '결제하기',
                                    click: () => {
                                        openLeavingPage(item.leaving.li_id);
                                    }
                                },
                                style: {
                                    fontSize: '18px',
                                    fontWeight: 'bold'
                                }
                            }
                            , {
                                title: '배송비',
                                value: deliPrice,
                                btn: {
                                    view: leavingState === 'BE' ? true : false,
                                    name: '결제하기',
                                    click: () => {
                                        openLeavingPage(item.leaving.li_id);
                                    }
                                },
                                style: {
                                    fontSize: '15px',
                                    fontWeight: 'bold'
                                }
                            }
                        ];

                        return (
                            <div key={key} className="info-card">
                                {renderInfo(leavingInfo)}

                                {item.leavingProduct
                                    ? renderItem(item.leavingProduct, { msgBtn: false, li_level: leavingItem.li_level }, {})
                                    : ''}

                                {item.leavingProduct
                                    ? renderBtn(item)
                                    : ''}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const renderLeavingN = () => {
        let leavingFaq = props.user.leavingFaq.leavingFaq;
        let leavingFaqSort = props.user.leavingFaq.leavingFaqSort;

        return (
            <div className="info">
                <div className="info-box">
                    {leavingFaqSort.map((item, key) => {
                        return (
                            <div className="leaving-n" key={key}>
                                <h3 className="n-title">{item}</h3>
                                <div className="n-list">
                                    {leavingFaq[key].map((faq, index) => {
                                        return (
                                            <a href={faq.faqLink} target="_blank" rel="noreferrer" key={index}>
                                                <strong>{faq.faqContent}</strong>
                                                <span>{faq.faqTitle}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="app-download">
                        <div className="app-title">
                            <span>디지털 노마드를 위한</span>
                            <strong>안드로이드 앱 다운로드</strong>
                        </div>
                        <div className="app-qrcode">
                            <img src={require('../../Common/img/app.png')} alt="" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    switch (props.user.hasLeavingInfo) {
        case 'Y': return renderLeavingY();
        case 'L': return renderLeavingL();
        case 'N': return renderLeavingN();
        default: return <div></div>;
    }
}

export default Info;