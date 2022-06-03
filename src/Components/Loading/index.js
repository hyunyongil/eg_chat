import React from 'react';
import './loading.css'

function Loading(props) {
    return (
        <div className={`loading ${props.size}`}>
            <img src={require('../../Common/img/loading.gif')} alt="" />
        </div>
    );
}

export default Loading;