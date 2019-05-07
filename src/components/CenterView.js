import React, { Component } from 'react';
import './CenterView.css'

import Websocket from 'react-websocket';

class CenterView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemList: []
    }

    this.discardItemCard = this.discardItemCard.bind(this);
    this.triggerSnackbar = props.triggerSnackbar;
    this.clientSocket = props.clientSocket;

    this.maxListLength = 15;
  }

  sortedDiscardingInsert(item, itemList, noPricePos = 'DISCARD') {
    if (itemList.length === 0) return [item];
    const noPriceCondition = () => {
      if (noPricePos === 'FRONT') {
        return [item].concat(itemList)
      } else if ( noPricePos === 'DISCARD' ){
        return itemList.slice();
      } else {
        return itemList.concat([item])
      }
    }
    if (!item.note) {
      return noPriceCondition();
    } else {
      let itemNoteSplit = item.note.split(' ');
      if (itemNoteSplit[0] === '~price' || itemNoteSplit[0] === '~b/o') {
        if (itemNoteSplit[2] === 'chaos') {
          let realPriceItem = parseFloat(itemNoteSplit[1]);
          let realPriceListItem = parseFloat(itemList[0].note.split(' ')[1]);
          if (realPriceItem <= realPriceListItem) {
            return [item].concat(itemList);
          } else {
            return itemList.slice();
          }
        } else {
          return noPriceCondition();
        }
      } else {
        return noPriceCondition();
      }
    }

  }

  componentWillMount() {
    this.mountEventHandler();
  }

  mountEventHandler(newClientSocket = null) {
    if (newClientSocket) { this.clientSocket = newClientSocket; }
    this.clientSocket.onmessage = (e) => {
      if (typeof e.data === 'string') {
        this.dataReceived(e.data);
      }
    }
  }

  dataReceived (data) {
    let {stash, item} = JSON.parse(data);
    this.setState((state, props) => {
      let index = state.itemList.findIndex(stateItem => {return stateItem.id === item.id});
      if (index > -1 && state.itemList.length > 0) state.itemList.splice(index, 1);

      let returnList = []; let mode = false;
      if (mode) { returnList = this.sortedDiscardingInsert(item, state.itemList);
      } else { returnList = [item].concat(state.itemList); }

      if (returnList.length > this.maxListLength) returnList.splice(returnList.length - 1, 1);
      return { itemList: returnList }
    });
  }

  onSocketOpen() {
    console.log('Socket Opened')
  }

  onSocketClose() {
    console.log('Socket Closed')
  }

  discardItemCard(itemKey) {
    this.setState((state, props) => {
      let index = state.itemList.findIndex(stateItem => { return stateItem.id === itemKey });
      if (index > -1) state.itemList.splice(index, 1);
      return { itemList: state.itemList }
    });
  }

  render () {
    return(
      <div className="CenterView">
        <h1> Items </h1>
        <ItemList 
          itemObjList={this.state.itemList} 
          discardItemCard={this.discardItemCard}
          triggerSnackbar={this.triggerSnackbar}
        />
      </div>
    );
  }
}

class ItemList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      itemObjList: []
    }
    this.triggerSnackbar=props.triggerSnackbar;
    this.discardItemCard = props.discardItemCard;  // a function
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ itemObjList: nextProps.itemObjList.map((obj) => {
        return (
        <li key={obj.id}> 
          <ItemCard 
            itemObj={obj} 
            discardItemCard={this.discardItemCard }
            triggerSnackbar={this.triggerSnackbar }
          /> 
        </li>);
      })
    });
  }

  render() {
    return(
      <ul className="ItemList" id="mainItemList">
        {this.state.itemObjList}
      </ul>
    );
  }
}

class ItemCard extends Component {
  constructor(props) {
    super(props);
    this.itemObj = props.itemObj;


    this.triggerSnackbar = props.triggerSnackbar;
    this.discardItemCard = props.discardItemCard;
  }

  formatItemPriceAppMod = (poeItem) => {
    let noteSplit = poeItem.note.split(' ');
    if (noteSplit[0] === '~price' || noteSplit[0] === '~b/o') {
        return `${noteSplit[1]} ${noteSplit[2]}`
    } else {
        return ''
    }
  }

  formatItemName = (poeItem) => {
    return `${poeItem.name ?  poeItem.name + ' ': ''}${poeItem.typeLine}`
  }

  onClick(e) {
    console.log('Item clicked');
  }

  copyToClipboard(e) {
    navigator.clipboard.writeText('Test 255d7sdc').then(() => {
      this.triggerSnackbar('Copying to clipboard was successful!');
    }, (err) => {
      this.triggerSnackbar('Async: Could not copy text.');
    });
  }

  onDiscardCard(e) {
    this.discardItemCard(this.itemObj.id);
  }
  
  render() {
    return (
      <div className="ItemCard" onClick={this.onClick.bind(this)}>
        <img src={this.itemObj.icon}/>
        <div>{ this.formatItemName(this.itemObj) }</div>
        <div>{ this.itemObj.note ? this.formatItemPriceAppMod(this.itemObj) : 'no price' }</div>
        <button onClick={this.copyToClipboard.bind(this)}>Copy To clipboard</button>
        <button onClick={this.onDiscardCard.bind(this)}>Discard</button>
        <div>{this.itemObj.id.substring(0,8)}</div>
      </div>
    );
  }
}

export default CenterView;