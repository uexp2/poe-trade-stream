import React, { Component } from 'react';
import './ModalFilter.css';

class ModalFilter extends Component {
  constructor(props) {
    super(props)

    this.childFilterForm = null; // exposed FilterForm object

    this.clientSocket=props.clientSocket;

    this.modalBody = null;

    this.outsideModalClick = this.outsideModalClick.bind(this);
  }

  // for parent use
  updateClientSocket(clientSocket) { this.childFilterForm.updateClientSocket(clientSocket) } 

  componentDidMount() {
    document.addEventListener('mousedown', this.outsideModalClick);
    this.modalBody = document.getElementById('modal-filter');
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  closeModal() {
    this.modalBody.style.display = 'none';
  }

  outsideModalClick(event) {
    if (event.target === this.modalBody) this.closeModal();
  }

  render() {
    return (
    <div id="modal-filter" className="modal">
      {/* <!-- Modal content --> */}
      <div className="modal-content">
        <span onClick={this.closeModal.bind(this)} className="close">&times;</span>
        <p>Filter</p>
        <FilterForm 
          ref={instance => { this.childFilterForm = instance }} 
          clientSocket={this.clientSocket} 
        />
      </div>
    </div>
    );
  }
}

class FilterForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      compoundName:"",
      league: "Betrayal",
      price:{
        num:["", ""], 
        currencyType: "Any Currency"},
      _priceInputType:"hidden",
    }
    this.clientSocket = props.clientSocket;

    // Method bindings
    this.leagueSelectOnChange = this.leagueSelectOnChange.bind(this);
    this.currencySelectOnChange = this.currencySelectOnChange.bind(this);
    this.currencyLowerOnChange = this.currencyLowerOnChange.bind(this);
    this.currencyUpperOnChange = this.currencyUpperOnChange.bind(this);
  }

  // for parent use
  updateClientSocket(clientSocket) {
    this.clientSocket = clientSocket 
    this.sendFilterObj();
  }

  sendFilterObj() {
    let filterObj = {};
    let itemFilterObj = this.getItemFilterObj();
    if (Object.keys(itemFilterObj).length !== 0 || itemFilterObj.constructor !== Object) 
      filterObj.itemFilterObj = itemFilterObj;
    let stashFilterObj = this.getStashFilterObj();
    if (Object.keys(stashFilterObj).length !== 0 || stashFilterObj.constructor !== Object) 
      filterObj.stashFilterObj = stashFilterObj;

    // if no filters found prevent sending empty objects
    if (Object.keys(itemFilterObj).length === 0 && itemFilterObj.constructor === Object &&
        Object.keys(stashFilterObj).length === 0 && stashFilterObj.constructor === Object) 
      return;

    let command = "newFilters";
    this.clientSocket.send(JSON.stringify([command, filterObj]));
  }

  getItemFilterObj() {  // Ret: JSON obj
    let ret = {};
    if (this.state.compoundName) ret.compoundName = this.state.compoundName;
    if (this.state.league) ret.league = this.state.league;
    if (this.state.price.currencyType !== 'Any Currency') {
      ret.price = this.state.price;
      if (!ret.price.num[0]) ret.price.num[0] = null;
      if (!ret.price.num[1]) ret.price.num[1] = null;
    }
    return ret;
  }

  getStashFilterObj() {
    let ret = {}

    return ret;
  }

  leagueSelectOnChange(e) {
    this.setState({league: e.target.value});
  }

  currencySelectOnChange(e) {
    let hold = e.target.value;
    this.setState((state) => {
      state.price.currencyType = hold;
      let inputType = null;
      if (hold === 'Any Currency') {
        inputType = 'hidden';
      } else {
        inputType = 'number';
      }
      return {price: state.price, _priceInputType: inputType}
    })
  }

  currencyLowerOnChange(e) {
    let hold = e.target.value;
    this.setState(state => {
      state.price.num = [hold, state.price.num[1]]
      return {price: state.price}
    })
  }

  currencyUpperOnChange(e) {
    let hold = e.target.value;
    this.setState(state => {
      state.price.num = [state.price.num[0], hold]
      return {price: state.price}
    })
  }

  render() {
    return (
      <div className="FilterForm">
        <div id="form_group_1">
          Item Name: 
          <input type="text" value={this.state.compoundName} 
            onChange={e => {this.setState({compoundName:e.target.value})}}
          />
        </div>
        <div id="form_group_2">
          League: 
          <select value={this.state.league} onChange={this.leagueSelectOnChange}>
            <option value="">All Leagues</option>
            <option value="Betrayal">Betrayal</option>
            <option value="Standard">Standard</option>
            <option value="Hardcore Betrayal">Hardcore Betrayal</option>
          </select>
        </div>
        <div id="form_group_3">
          Price: 
          <input type={this.state._priceInputType} value={this.state.price.num[0]} placeholder="Lower" onChange={this.currencyLowerOnChange}/>
          <input type={this.state._priceInputType} value={this.state.price.num[1]} placeholder="Upper" onChange={this.currencyUpperOnChange}/>
          <select value={this.state.price.currencyType} onChange={this.currencySelectOnChange}>
            <option value="Any Currency">Any Currency</option>
            <option value="chaos">Chaos</option>
          </select>
        </div>
        <div id="form_group_n">
          <button id="filterSubmit_btn" onClick={this.sendFilterObj.bind(this)}>Submit</button>
        </div>
      </div>
    );
  }
}

export default ModalFilter;