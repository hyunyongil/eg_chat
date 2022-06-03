import React from 'react';
import './consult.css';

function Consult(props) {
    const BASE_URL_PATH = 'https://eggdome.ggook.com/expand/chat/consult';

    return (
        <div className="consult-frame">
            <iframe src={BASE_URL_PATH+'/sendmemo.php?id='+props.chatId} title="consult" width="100%" height="100%" scrolling='yes' style={{border: 0}}></iframe>
        </div>
    );
}

export default Consult;